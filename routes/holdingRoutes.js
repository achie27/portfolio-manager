const express = require('express');
const holdingController = require('../controllers/holdingController');

let router = express.Router();

router.get('/', holdingController.readAll);

router.post('/', holdingController.create);

module.exports = router;
