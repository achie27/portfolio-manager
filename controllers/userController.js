const crypto = require('crypto');

const secret = require('../config/secret.json');
const User = require('../models/user');


const KEY = crypto.scryptSync(
	secret.CRYPTO_PASS || process.env.CRYPTO_PASS, 'salt', 24
);

const IV = Buffer.alloc(16, 0);

const utf2hex = (str) => {
	const CIPHER = crypto.createCipheriv(
		'aes-192-cbc', KEY, IV
	);
	let hex = CIPHER.update(str, 'utf8', 'hex');
	hex += CIPHER.final('hex');

	return hex;
};


exports.readPortfolios = async (req, res) => {	
	if(!req.session.userId)
		return res.status(400).send('Log in first');

	let user = await User.findById(
		req.session.userId, 'portfolios'
	).populate('portfolios');

	res.send(user.portfolios);
};

exports.login = async (req, res) => {
	let user = await User.findOne({username : req.body.username});
	
	//Too naive but, well, it works
	if(user && utf2hex(req.body.password) === user.password){
		req.session.userId = user._id;
		res.status(200).send('Logged in ' + user.username);
	} else {
		res.status(400).send('Wrong username or password');
	}
};

exports.logout = async (req, res) => {
	if(req.session.userId){
		await req.session.destroy();
		res.status(200).send('Logged out');
	} else {
		res.status(400).send('No one to log out');		
	}
};

exports.signup = async (req, res) => {
	let user = await User.findOne({username : req.body.username});
	if(user){
		res.status(400).send('Username taken');
	} else {
		try{

			//Log out previously logged in user
			if(req.session.userId)
				await req.session.destroy();
	
			let newUser = new User({
				username : req.body.username,
				password : utf2hex(req.body.password)
			});

			//Sign up the new user
			await newUser.save()._id;
			res.status(200).send('Signed up ' + req.body.username);
		}
		catch(err){
			res.status(500).send(err.message);			
		}
	}
};