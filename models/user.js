const mongoose = require('mongoose');

let userSchema = new mongoose.Schema({
	username : {
		type : String,
		required : true
	},

	password : {
		type : String,
		required : true
	},

	portfolios : [{
		type : mongoose.Schema.ObjectId,
		ref : 'Portfolio'
	}]
});

module.exports = mongoose.model('User', userSchema);