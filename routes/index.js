var express = require('express');
var router = express.Router();
var controller = require('../controllers/index');

/* GET home page. */
router.get('/', controller.main);
router.get('/settings', controller.settings);
router.get('/forgot_password', controller.forgotPassword);
router.post('/forgot_password', controller.forgotPassword);
router.get('/new_password', controller.newPassword);


module.exports = router;
