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
	.populate('securities.holding');

	res.send(portfolio.securities);
};

exports.readOne = async (req, res) => {

	// Get the portfolio and expand the holdings
	let portfolio = await Portfolio.findById(
		req.params.portfolioId
	)
	.populate('securities.holding');

	res.send(portfolio);
};

exports.readAll = async (req, res) => {
	let portfolios = await Portfolio.find(
		{}
	)
	.populate('securities.holding');

	res.send(portfolios);
};

exports.create = async (req, res) => {
	
	// Check if Holdings are correct and get their id
	for(let obj of req.body.securities){
		let holding = await Holding.findOne({ticker : obj.holding});
		if(!holding){
			return res.status(400).send('Holding/Stock/Security does not exist');
		}
		obj.holding = holding._id;
	}

	if(!req.session.userId)
		return res.status(400).send('Log in to create a portfolio');

	// Need to create a transaction because 2 collections are being updated
	// Can't have one changed and the other not
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
