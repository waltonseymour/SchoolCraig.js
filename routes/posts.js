var express = require('express');
var router = express.Router();
var models = require('../models');
var crypto = require('crypto');
var _ = require('underscore');
var util = require('../utilities');

var publicOptions = {attributes: ['id', 'fname', 'lname', 'email']};

// Retrieves all users
router.get('/all', function(req, res) {
  if (req.session.userID === undefined) { return res.send(403); }

  models.Post.findAll(publicOptions).success(function (users) {
    res.send(users);
  });
});

// Retreives user by id
router.get('/id/:id', function(req, res) {
  if (req.session.userID === undefined) { return res.send(403); }
  if (!util.isUUID(req.params.id)) { return res.send(401); }

  var options = _.extend({where: {id: req.params.id}}, publicOptions);
  models.Post.find(options).success(function(post){
    post ? res.send(post) : res.send(404);
  });
});

// Modifies User by id
router.put('/id/:id', function(req, res) {
  if (req.session.userID !== req.params.id) { return res.send(403); }

  var post = _.pick(req.body, publicOptions.attributes);
  var options = _.extend({where: {id: req.params.id}}, publicOptions);
  models.Post.update(post, options).success(function(ret){
    ret[0] ? res.send(200) : res.send(404);
  });
});

// Deletes User by id
router.delete('/id/:id', function(req, res) {
  if (req.session.userID !== req.params.id) { return res.send(403); }

  var options = _.extend({where: {id: req.params.id}}, publicOptions);
  models.Post.destroy(options).success(function (ret) {
    ret ? res.send(200) : res.send(404);
  });
});

// Route for creating a new user
router.post('/', function (req, res) {
  var post = req.body;
  if (user.id && Exists(user, "id")) {
    return res.send(401);
  }
  else {
    CreateUser(req, res, user);
  }
});

// Retrns true if user exists with a given field
// false otherwise.
function Exists (user, field) {
  if (field === "id" && !util.isUUID(user.id)) { return true; }
  models.User.find({where: {id: user.id}}).success(function (temp) {
    return !!temp;
  });
}

// Creates user
function CreateUser (req, res, user) {
  if (user.fname && user.lname && user.email && user.password) {
    var salt = crypto.randomBytes(16).toString('hex'); 
    var password = crypto.createHash('sha256').update(salt + user.password).digest('hex');
    user.salt = salt;
    user.password = password;
    models.User.create(user);
    res.send(200);
  }
  else {
    res.send(401);
  }
}


module.exports = router;
