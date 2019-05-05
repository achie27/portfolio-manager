const mongoose = require('mongoose');

/*
	Typical User model
*/

let userSchema = new mongoose.Schema({
	username : {
		type : String,
		required : true,
		trim : true,
		lowercase : true
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