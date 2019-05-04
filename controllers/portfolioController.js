const Portfolio = require('../models/portfolio');
const User = require('../models/user');
const Holding = require('../models/holding');

const CURRENT_TICKER_PRICE = 100;

exports.getReturns = async (req, res) => {
	let portfolio = await Portfolio.findById(req.params.portfolioId, 'securities');
	res.send({returns : portfolio.securities.reduce(
		(acc, obj) => acc + (CURRENT_TICKER_PRICE - obj.avgBuyPrice) * obj.shares, 0
	)});
};

exports.getHoldings = async (req, res) => {
	let portfolio = await Portfolio.findById(
		req.params.portfolioId, 'securities'
	)
	.populate('securities.holdingId');

	res.send(portfolio.securities);
};

exports.readOne = async (req, res) => {
	let portfolio = await Portfolio.findById(
		req.params.portfolioId
	)
	.populate('securities.holdingId');

	res.send(portfolio);
};

exports.readAll = async (req, res) => {
	let portfolios = await Portfolio.find(
		{}
	)
	.populate('securities.holdingId');

	res.send(portfolios);
};

exports.create = async (req, res) => {
	
	try {

		for(let obj of req.body.securities){
			if((await Holding.findById(obj.holdingId)) === null){
				return res.status(400).send('Holding/Stock/Security does not exist');
			}
		}

		let newPortfolio = new Portfolio({
			securities : req.body.securities,
			user : req.session.userId
		});

		let savedPortfolio = await newPortfolio.save();
		let user = await User.findById(req.session.userId);

		user.portfolios.push(savedPortfolio._id);
		await user.save();
		res.send(savedPortfolio);

	} catch (err) {
		res.status(400).send(err.message);
	}
};
