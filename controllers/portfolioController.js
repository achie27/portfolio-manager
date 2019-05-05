const mongoose = require('mongoose');

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
	
	for(let obj of req.body.securities){
		if((await Holding.findById(obj.holdingId)) === null){
			return res.status(400).send('Holding/Stock/Security does not exist');
		}
	}

	if(!req.session.userId)
		return res.status(400).send('Log in to create a portfolio');


	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		let newPortfolio = new Portfolio({
			securities : req.body.securities,
			user : req.session.userId
		});

		let savedPortfolio = await newPortfolio.save();
		let user = await User.findById(req.session.userId);

		user.portfolios.push(savedPortfolio._id);
		await user.save();
		
		await session.commitTransaction();
		session.endSession();

		res.send(savedPortfolio);

	} catch (err) {
		await session.abortTransaction();
		session.endSession();
		res.status(500).send(err.message);
	}
};
