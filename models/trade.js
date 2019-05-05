const mongoose = require('mongoose');

/*
	.type -
		Whether the trade SELLs or BUYs shares

	.price -
		The price at which each share was bought
		It is required only if the trade was of BUY type

	.shares -
		The shares associated with this trade

	.holding -
		The DB generated ID of associated holding

	.portfolioId -
		The DB generated ID of associated portfolio

	.userId
		The DB generated ID of associated user	

*/


let tradeSchema = mongoose.Schema({
	type : {
		type : String,
		uppercase : true,
		trim : true,
		enum : ['SELL', 'BUY'], 
		required : true	
	},

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
	
	holding : {
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