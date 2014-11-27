var express = require('express');
var router = express.Router();
var models = require('../models');
var crypto = require('crypto');
var _ = require('underscore');

var publicOptions = {attributes: ['id', 'fname', 'lname', 'email']};

// Retrieves all users
router.get('/all', function(req, res) {
  models.User.findAll(publicOptions).success(function(users){
    res.send(users);
  });
});

// Retreives user by id
router.get('/id/:id', function(req, res) {
  var options = _.extend({where: {id: req.params.id}}, publicOptions);
  models.User.find(options).success(function(user){
    res.send(user);
  });
});

// Modifies User by id
router.put('/id/:id', function(req, res) {
  var user = _.pick(req.body, publicOptions.attributes);
  var options = _.extend({where: {id: req.params.id}}, publicOptions);
  models.User.update(user, options).success(function(user){
    res.send(200);
  });
});

// Deletes User by id
router.delete('/id/:id', function(req, res) {
  var options = _.extend({where: {id: req.params.id}}, publicOptions);
  models.User.destroy(options).success(function(user){
    res.send(200);
  });
});

// Creates new user
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
