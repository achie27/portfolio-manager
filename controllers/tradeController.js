const mongoose = require('mongoose');

const Trade = require('../models/trade');
const Portfolio = require('../models/portfolio');
const Holding = require('../models/holding');

// Utility function
const calcAvgBuyPrice = (origAvgBuyPrice, origShares, trade) => {
	let x = origShares*origAvgBuyPrice + trade.price*trade.shares;
	return x / (origShares + trade.shares);
};


exports.readOne = async (req, res) => {
	if(req.params.tradeId){
		const trade = await Trade.findById(req.params.tradeId).populate('holding');
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

	// Validate
	if(!req.session.userId)
		return res.status(400).send('Need to be logged in to add a trade');

	if(req.body.type === 'BUY' && req.body.price == null)
		return res.status(400).send('Need to specify the price for bought shares');

	let holding = await Holding.findOne({ticker : req.body.holding});
	if(holding === null){
		return res.status(400).send('Holding/Stock/Security does not exist');
	}
	
	let trade = new Trade({
		type : req.body.type,
		price : req.body.price,
		shares : req.body.shares,
		holding : holding._id,
		portfolioId : req.body.portfolioId,
		userId : req.session.userId
	});


	let foundPortfolio = await Portfolio.findById(trade.portfolioId);
	if(!foundPortfolio)
		return res.status(400).send("Portfolio doesn't exist");

	let alias = foundPortfolio.securities;
	
	// Find if the holding has been introduced in the portfolio	
	let hIndex = 0;
	for(; hIndex < alias.length; hIndex++){
		if(alias[hIndex].holding.toString() === trade.holding.toString()){
			break;
		}
	}

	if(trade.type === 'SELL' && trade.shares > alias[hIndex].shares)
		return res.status(400).send('Not enough shares to sell');

	// If the holding is present, just update
	if(hIndex < alias.length){
		if(trade.type === 'BUY'){
			alias[hIndex].avgBuyPrice = calcAvgBuyPrice(
				alias[hIndex].avgBuyPrice, alias[hIndex].shares, trade
			);
			alias[hIndex].shares += trade.shares;
		} else if (trade.type === 'SELL') {
			alias[hIndex].shares -= trade.shares;
		}
	} 
	// Otherwise add new or err
	else {
		if(trade.type === 'BUY'){
			alias.push({
				holding : trade.holding,
				avgBuyPrice : trade.price,
				shares : trade.shares
			});
		} else {
			return res.status(400).send("Holding not present in the portfolio");
		}
	}
	
	// 2 collections here too
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		let savedTrade = await trade.save();
		foundPortfolio.trades.push(savedTrade._id);
		let updPortfolio = await foundPortfolio.save();
		
		await session.commitTransaction();
		session.endSession();

		res.send(updPortfolio);			

	} catch(err) {
		await session.abortTransaction();
		session.endSession();
		res.status(500).send(err.message);
	}

};

exports.updateOne = async (req, res) => {

	//Check stuff
	let origTrade = await Trade.findById(req.params.tradeId);
	if(!origTrade)
		return res.status(400).send("Trade doesn't exist");

	let origPortfolio = await Portfolio.findById(origTrade.portfolioId);
	
	if(!req.session.userId || req.session.userId !== origPortfolio.user.toString())
		return res.status(400).send("Not authorized to update this trade");		

	let alias = origPortfolio.securities;

	// Find the holding's status in portfolio	
	let hIndex = 0;
	for(; hIndex < alias.length; hIndex++){
		if(alias[hIndex].holding.toString() === origTrade.holding.toString()){
			break;
		}
	}

	// Get the state of holding before the trade-to-be-changed was made
	// Then apply the necessary changes according to the new trade data 

	alias = origPortfolio.securities[hIndex];
	let preTradeAvgBuyPrice = alias.avgBuyPrice;
	let preTradeShares = alias.shares + origTrade.shares;
	if(origTrade.type === 'BUY'){
		preTradeShares = alias.shares - origTrade.shares;
		preTradeAvgBuyPrice = calcAvgBuyPrice(
			alias.avgBuyPrice, alias.shares, origTrade
		);
	}

	let tradeObj = {...origTrade._doc}, holdingObj = {};

	// If trade's type need to be changed (too)
	if(req.body.type){
		tradeObj.type = req.body.type;
		if(tradeObj.type === 'BUY'){
			holdingObj.shares = preTradeShares + origTrade.shares;
			holdingObj.avgBuyPrice = calcAvgBuyPrice(
				preTradeAvgBuyPrice, preTradeShares, origTrade
			);
		} else if (tradeObj.type === 'SELL') {
			holdingObj.shares = preTradeShares - origTrade.shares;
			if(holdingObj.shares < 0)
				return res.status(400).send('Not enough shares to sell');

			holdingObj.avgBuyPrice = preTradeAvgBuyPrice;				
		}
	}

	// If the price needs to be changed (too)
	if(req.body.price){
		tradeObj.price = req.body.price;
		if(tradeObj.type === 'BUY')
			holdingObj.avgBuyPrice = calcAvgBuyPrice(
				preTradeAvgBuyPrice, preTradeShares, tradeObj
			);
	}

	// If the shares need to be changed (too)
	if(req.body.shares){
		tradeObj.shares = req.body.shares;
		if(tradeObj.type === 'BUY'){
			holdingObj.shares = preTradeShares + tradeObj.shares;
			holdingObj.avgBuyPrice = calcAvgBuyPrice(
				preTradeAvgBuyPrice, preTradeShares, tradeObj
			);
		} else if(tradeObj.type === 'SELL'){
			holdingObj.shares = preTradeShares - tradeObj.shares;
			if(holdingObj.shares < 0)
				return res.status(400).send('Not enough shares to sell');
			holdingObj.avgBuyPrice = preTradeAvgBuyPrice;
		}
	}

	origPortfolio.securities[hIndex].avgBuyPrice = holdingObj.avgBuyPrice;
	origPortfolio.securities[hIndex].shares = holdingObj.shares;

	origTrade.type = tradeObj.type;
	origTrade.price = tradeObj.price;
	origTrade.shares = tradeObj.shares;

	// 2 collections
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		let obj = {'trade' : await origTrade.save(), 'portfolio' : await origPortfolio.save()};
		await session.commitTransaction();
		session.endSession();
		res.send(obj);
	} 
	catch(err) {
		await session.abortTransaction();
		session.endSession();
		res.status(500).send(err.message);
	}
};

exports.deleteOne = async (req, res) => {
	
	// Validation
	let origTrade = await Trade.findById(req.params.tradeId);
	if(!origTrade)
		return res.status(400).send("Trade doesn't exist");

	let origPortfolio = await Portfolio.findById(origTrade.portfolioId);
		
	if(!req.session.userId || req.session.userId !== origPortfolio.user.toString())
		return res.status(400).send("Not authorized to update this trade");		

	let alias = origPortfolio.securities;

	// Get the trade's holding
	let hIndex = 0;
	for(; hIndex < alias.length; hIndex++){
		if(alias[hIndex].holding.toString() === origTrade.holding.toString()){
			break;
		}
	}

	// Rollback to pre trade values
	alias = origPortfolio.securities[hIndex];
	let preTradeAvgBuyPrice = alias.avgBuyPrice;
	let preTradeShares = alias.shares + origTrade.shares;
	if(origTrade.type === 'BUY'){
		preTradeShares = alias.shares - origTrade.shares;
		preTradeAvgBuyPrice = (alias.avgBuyPrice * alias.shares - origTrade.price * origTrade.shares);
		preTradeAvgBuyPrice = preTradeAvgBuyPrice / preTradeShares;
	}

	// This trade introduced new holding, so that needs to be removed
	if(preTradeShares === 0 && origTrade.type === 'BUY'){
		origPortfolio.securities.pull(alias._id);
	} else {
		origPortfolio.securities[hIndex].avgBuyPrice = preTradeAvgBuyPrice;
		origPortfolio.securities[hIndex].shares = preTradeShares;
	}
	
	origPortfolio.trades.pull(origTrade._id);

	// 2 collections affected
	const session = await mongoose.startSession();
	session.startTransaction();

	try{
		await Trade.findByIdAndDelete(req.params.tradeId);
		let obj = await origPortfolio.save();

		await session.commitTransaction();
		session.endSession();
		res.send(obj);

	} catch(e) {
		await session.abortTransaction();
		session.endSession();
		res.status(500).send(e.message);
	}

};