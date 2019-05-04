const mongoose = require('mongoose');

let tradeSchema = mongoose.Schema({
	type : {
		type : String,
		enum : ['SELL', 'BUY'], 
		required : true
	},

	// Gets filled with either the buying price or the average buy price (which is actually the selling price) 
	price : {
		type : Number,
		required : () => this.type === 'BUY',
		validate : (val) => {
			if(this.type === 'BUY'){
				if(!isNaN(val) && val <= Number.MAX_SAFE_INTEGER && val >= 0){
					return true;
				}
				return false;
			}
			return true;
		}
	},
	
	shares : {
		type : Number,
		min : 1,
		max : Number.MAX_SAFE_INTEGER,
		required : true
	},
	
	holdingId : {
		type : mongoose.Schema.ObjectId,
		ref : 'Holding',
		required : true
	},

	portfolioId : {
		type : mongoose.Schema.ObjectId,
		ref : 'Portfolio',
		required : true
	},

	userId : {
		type : mongoose.Schema.ObjectId,
		ref : 'User',
		required : true		
	}

});

module.exports = mongoose.model('Trade', tradeSchema);