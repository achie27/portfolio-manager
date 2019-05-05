const express = require('express');
const mongoose = require('mongoose');

const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const bp = require('body-parser');
const httpErr = require('http-errors');
const sessions = require('express-session');

const portfolioRouter = require('./routes/portfolioRoutes');
const tradeRouter = require('./routes/tradeRoutes');
const userRouter = require('./routes/userRoutes');
const holdingRouter = require('./routes/holdingRoutes');

const secret = require('./config/secret.json');
const PORT = 5000;

let app = express();
mongoose.Promise = global.Promise;

app.use(sessions({
	name : secret.SESSIONS_NAME,
	secret : secret.SESSIONS_SECRET,
	resave : true,
	saveUninitialized : true
}));
app.use(helmet());
app.use(morgan('dev'));
app.use(cors());
app.use(bp.urlencoded({extended:false}));
app.use(bp.json());

app.use('/api/user', userRouter);
app.use('/api/holding', holdingRouter);
app.use('/api/portfolio', portfolioRouter);
app.use('/api/trade', tradeRouter);

app.use((req, res) => {
	res.status(404).send("Endpoint doesn't exist");
});

let server = app.listen(PORT, () => {
	console.log("Server started.");

	mongoose.connect(secret.URI, {useNewUrlParser: true}, (err) => {
		if(err){
			server.close();
			return console.log("Closing");
		}
		console.log("Database link established.");
	});
});
