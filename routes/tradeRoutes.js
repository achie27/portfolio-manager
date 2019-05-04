const express = require('express');
const tradeController = require('../controllers/tradeController');

let router = express.Router();

router.get('/:tradeId', tradeController.readOne);

router.get('/', tradeController.readAll);

router.post('/', tradeController.create);

router.put('/:tradeId', tradeController.updateOne);

router.delete('/:tradeId', tradeController.deleteOne);


module.exports = router;