var express = require('express');
var router = express.Router();
var controller = require('../controllers/index');

/* GET home page. */
router.get('/', controller.main);

router.get('/sign_s3', controller.sign);

module.exports = router;
