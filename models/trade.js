const mongoose = require('mongoose');

let tradeSchema = mongoose.Schema({
	type : String,

	// Gets filled with either the buying price or the average buy price (which is actually the selling price) 
	price : {
		type : Number,
		default : 0,
		min : 0,
		max : Number.MAX_SAFE_INTEGER
	}
	
	shares : {
		type : Number,
		default : 0,
		min : 1,
		max : Number.MAX_SAFE_INTEGER
	},
	
	holdingId : {
		type : mongoose.Schema.ObjectId,
		ref : 'Holding'
	},

	portfolioId : {
		type : mongoose.Schema.ObjectId,
		ref : 'Portfolio'
	},

	userId : {
		type : mongoose.Schema.ObjectId,
		ref : 'User'		
	}

});

module.exports = mongoose.model('Trade', tradeSchema);