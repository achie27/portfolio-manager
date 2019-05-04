const express = require('express');
const userController = require('../controllers/userController');

let router = express.Router();

router.get('/portfolios', userController.readPortfolios);

router.post('/login', userController.login);

router.post('/logout', userController.logout);

router.post('/signup', userController.signup);

module.exports = router;