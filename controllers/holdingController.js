const Holding = require('../models/holding');


exports.readAll = async (req, res) => {
	res.send(await Holding.find({}));
};

exports.create = async (req, res) => {

	// Validate stuff
	if(!req.body.ticker)
		return res.status(400).send('Ticker required');

	if(await Holding.findOne({ticker : req.body.ticker}))
		return res.status(400).send('Holding exists');

	let newHolding = new Holding({
		name : req.body.name,
		ticker : req.body.ticker
	});
	
	try{
		res.send(await newHolding.save());
	}
	catch(err){
		res.status(500).send(err.message);
	}
};
