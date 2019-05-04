const express = require('express');
const portfolioController = require('../controllers/portfolioController');

let router = express.Router();

router.get('/:portfolioId/returns', portfolioController.getReturns);

router.get('/:portfolioId/holdings', portfolioController.getHoldings);

router.get('/:portfolioId', portfolioController.readOne);

router.get('/', portfolioController.readAll);

router.post('/', portfolioController.create);

module.exports = router;
