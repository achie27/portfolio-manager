const User = require('../models/user');


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
	if(user && req.body.password === user.password){
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
			let newUser = new User({
				username : req.body.username,
				password : req.body.password
			});

			//Log out previously logged in user
			await req.session.destroy();
			
			//Sign up and in the new user
			req.session.userId = (await newUser.save())._id;
			res.status(200).send('Signed up and logged in ' + req.body.username);
		}
		catch(err){
			res.status(500).send(err.message);			
		}
	}
};