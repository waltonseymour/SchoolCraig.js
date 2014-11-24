var express = require('express');
var router = express.Router();
var models = require('../models');
var crypto = require('crypto');

/* GET users listing. */
router.get('/all', function(req, res) {
  models.User.findAll({attributes: ['id', 'fname', 'lname', 'email']}).success(function(users){
    res.send(users);
  });
});

router.post('/', function(req, res) {
  var user = req.body;
  if (user.fname && user.lname && user.email && user.password){
    var salt = crypto.randomBytes(16).toString('hex'); 
    var password = crypto.createHash('sha256').update(salt + user.password).digest('hex');
    user.salt = salt;
    user.password = password;
    models.User.create(user);
    res.send(200);
  }
  else{
    res.send(401);
  }

});
module.exports = router;
