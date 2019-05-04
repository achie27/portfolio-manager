const Trade = require('../models/trade');
const Portfolio = require('../models/portfolio');
const Holding = require('../models/holding');

exports.readOne = async (req, res) => {
	if(req.params.tradeId){
		const trade = await Trade.findById(req.params.tradeId).populate('holdingId');
		if(trade === null)
			return res.status(400).send('Trade not found');

		res.send(trade);
	} else {
		res.status(400).send('No trade ID provided.');
	}
};

exports.readAll = async (req, res) => {
	const trades = await Trade.find();
	res.send(trades);
};

exports.create = async (req, res) => {
	
	let trade = new Trade({
		type : req.body.type,
		price : req.body.price,
		shares : req.body.shares,
		holdingId : req.body.holdingId,
		portfolioId : req.body.portfolioId,
		userId : req.session.userId
	});

	if((await Holding.findById(trade.holdingId)) === null){
		return res.status(400).send('Holding/Stock/Security does not exist');
	}

	let foundPortfolio = await Portfolio.findById(trade.portfolioId);

	if(foundPortfolio){
		let alias = foundPortfolio.securities;
		
		let hIndex = 0;
		for(; hIndex < alias.length; hIndex++){
			if(alias[hIndex].holdingId.toString() === trade.holdingId.toString()){
				break;
			}
		}

		if(trade.type === 'SELL' && trade.shares > alias[hIndex].shares)
			return res.status(400).send('Not enough shares to sell');

		if(hIndex < alias.length){
			
			if(trade.type === 'BUY'){
				alias[hIndex].avgBuyPrice = 
					(alias[hIndex].shares * alias[hIndex].avgBuyPrice + trade.shares * trade.price)/(alias[hIndex].shares + trade.shares);

				alias[hIndex].shares += trade.shares;
			} else if (trade.type === 'SELL') {
				alias[hIndex].shares -= trade.shares;
			}

		} else {
			if(trade.type === 'BUY'){
				alias.push({
					holdingId : trade.holdingId,
					avgBuyPrice : trade.price,
					shares : trade.shares
				});
			}
		}

		try {
			let savedTrade = await trade.save();
			foundPortfolio.trades.push(savedTrade._id);
			res.send(await foundPortfolio.save());			
		} catch(err) {
			res.status(400).send(err.message);
		}
	} else {
		res.status(400).send("Portfolio doesn't exist");
	}

};

exports.updateOne = async (req, res) => {

	let origTrade = await Trade.findById(req.params.tradeId);
	let origPortfolio = await Portfolio.findById(origTrade.portfolioId);

	if(origTrade && origPortfolio){

		let hIndex = 0;
		for(; hIndex < origPortfolio.securities.length; hIndex++){
			if(origPortfolio.securities[hIndex].holdingId.toString() === origTrade.holdingId.toString()){
				break;
			}
		}
		let alias = origPortfolio.securities[hIndex];
		let preTradeAvgBuyPrice = alias.avgBuyPrice;
		let preTradeShares = alias.shares + origTrade.shares;
		if(origTrade.type === 'BUY'){
			preTradeShares = alias.shares - origTrade.shares;
			preTradeAvgBuyPrice = (alias.avgBuyPrice * alias.shares - origTrade.price * origTrade.shares) / preTradeShares;
		}

		let tradeObj = {...origTrade}, holdingObj = {...alias};

		if(req.body.type){
			tradeObj.type = req.body.type;
			if(tradeObj.type === 'BUY'){
				holdingObj.shares = preTradeShares + origTrade.shares;
				holdingObj.avgBuyPrice = (preTradeAvgBuyPrice * preTradeShares + origTrade.price * origTrade.shares)/(preTradeShares + origTrade.shares);
			} else if (tradeObj.type === 'SELL') {
				holdingObj.shares = preTradeShares - origTrade.shares;
				if(holdingObj.shares < 0)
					res.status(400).send('Not enough shares to sell');

				holdingObj.avgBuyPrice = preTradeAvgBuyPrice;				
			}
		}

		if(req.body.price){
			tradeObj.price = req.body.price;
			if(tradeObj.type === 'BUY')
				holdingObj.avgBuyPrice = (preTradeAvgBuyPrice * preTradeShares + tradeObj.price * origTrade.shares)/(preTradeShares + origTrade.shares);
		}

		if(req.body.shares){
			tradeObj.shares = req.body.shares;
			if(tradeObj.type === 'BUY'){
				holdingObj.shares = preTradeShares + tradeObj.shares;
				holdingObj.avgBuyPrice = (preTradeAvgBuyPrice * preTradeShares + tradeObj.price * tradeObj.shares)/(preTradeShares + tradeObj.shares);
			} else if(tradeObj.type === 'SELL'){
				holdingObj.shares = preTradeShares - tradeObj.shares;
				holdingObj.avgBuyPrice = preTradeAvgBuyPrice;
			}
		}

		origPortfolio.securities[hIndex].avgBuyPrice = holdingObj.avgBuyPrice;
		origPortfolio.securities[hIndex].shares = holdingObj.shares;

		origTrade.type = tradeObj.type;
		origTrade.price = tradeObj.price;
		origTrade.shares = tradeObj.shares;

		res.send({'trade' : await origTrade.save(), 'portfolio' : await origPortfolio.save()});
	} else {
		res.status(400).send("Portfolio/Trade doesn't exist");
	}
};

exports.deleteOne = async (req, res) => {
	let origTrade = await Trade.findById(req.params.tradeId);
	let origPortfolio = await Portfolio.findById(origTrade.portfolioId);

	if(origTrade && origPortfolio){
		let hIndex = 0;
		for(; hIndex < origPortfolio.securities.length; hIndex++){
			if(origPortfolio.securities[hIndex].holdingId.toString() === origTrade.holdingId.toString()){
				break;
			}
		}
		let alias = origPortfolio.securities[hIndex];
		let preTradeAvgBuyPrice = alias.avgBuyPrice;
		let preTradeShares = alias.shares + origTrade.shares;
		if(origTrade.type === 'BUY'){
			preTradeShares = alias.shares - origTrade.shares;
			preTradeAvgBuyPrice = (alias.avgBuyPrice * alias.shares - origTrade.price * origTrade.shares) / preTradeShares;
		}

		origPortfolio.securities[hIndex].avgBuyPrice = preTradeAvgBuyPrice;
		origPortfolio.securities[hIndex].shares = preTradeShares;
		origPortfolio.trades.pull(origTrade._id);
	
		try{
			await Trade.findByIdAndDelete(req.params.tradeId);
			res.send(await origPortfolio.save());			
		} catch(e) {
			res.status(400).send(e.message);
		}
	} else {
		res.status(400).send("Trade or portfolio doesn't exist");
	}
};