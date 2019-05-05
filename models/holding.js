const mongoose = require('mongoose');

/*
	.name -
		As in `Tata Consultancy Services`

	.ticker -
		As in `TCS`

	* Rather than this model, a 3rd party API can (should) be used 

*/

let holdingSchema = new mongoose.Schema({
	name : String,

	ticker : {
		type : String,
		required : true,
		uppercase : true,
		trim : true,
	}
});

module.exports = mongoose.model('Holding', holdingSchema);