const mongoose = require('mongoose');


let holdingsSchema = new mongoose.Schema({
	holding : {
		type : mongoose.Schema.Types.ObjectId, 
		ref : 'Holding'
	},

	avgBuyPrice : {
		type : Number,
		default : 0,
		min : 0,
		max : Number.MAX_SAFE_INTEGER
	},

	shares : {
		type : Number,
		required : true
	}
});


let portfolioSchema = new mongoose.Schema({
	trades : [{
		type : mongoose.Schema.ObjectId, 
		ref : 'Trade'
	}],

	holdings : [holdingsSchema],

	user : {
		type : mongoose.Schema.ObjectId, 
		ref : 'User'
	}
});


module.exports = mongoose.model('Portfolio', portfolioSchema);