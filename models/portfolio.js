const mongoose = require('mongoose');

let securitySchema = new mongoose.Schema({
	holdingId : {
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