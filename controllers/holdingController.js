const Holding = require('../models/holding');

exports.readAll = async (req, res) => {
	res.send(await Holding.find({}));
};

exports.create = async (req, res) => {
	let newHolding = new Holding({
		name : req.body.name,
		ticker : req.body.ticker
	});
	try{
		res.send(await newHolding.save());
	}
	catch(err){
		res.status(400).send(err.message);
	}
};