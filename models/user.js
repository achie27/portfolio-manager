const mongoose = require('mongoose');

let userSchema = new mongoose.Schema({
	username : {
		type : String,
		required : true
	},
});

module.exports = mongoose.model('User', userSchema);