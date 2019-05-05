const mongoose = require('mongoose');

/*
	.trades - 
		Holds ids of all the trades placed on this portfolio.
		Being a reference makes its representation and 
		calculation easier

	.securities -
		Holds all Holdings introduced 

		.holding - 
			Contains the DB generated ID of holding

		.avgBuyPrice -
			The average buy price

		.shares -
			Number of shares for this holding
	
	.user -
		The DB generated userId of this portfolio's creator  

*/

let securitySchema = new mongoose.Schema({
	holding : {
		type : mongoose.Schema.ObjectId, 
		ref : 'Holding',
		required : true
	},

	avgBuyPrice : {
		type : Number,
		min : 0,
		max : Number.MAX_SAFE_INTEGER,
		required : true
	},

	shares : {
		type : Number,
		min : 0,
		max : Number.MAX_SAFE_INTEGER,
		required : true
	}
});


let portfolioSchema = new mongoose.Schema({
	trades : [{
		type : mongoose.Schema.ObjectId, 
		ref : 'Trade'
	}],

	securities : [securitySchema],

	user : {
		type : mongoose.Schema.ObjectId, 
		ref : 'User',
		required : true
	}
});


module.exports = mongoose.model('Portfolio', portfolioSchema);