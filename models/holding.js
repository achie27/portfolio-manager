const mongoose = require('mongoose');

let holdingSchema = new mongoose.Schema({
	name : String,

	ticker : {
		type : String,
		required : true
	}
});

module.exports = mongoose.model('Holding', holdingSchema);