var express = require('express');
var router = express.Router();
var models = require('../models');
var crypto = require('crypto');
var _ = require('underscore');
var utils = require('../utilities');

var publicOptions = {attributes: ['id', 'fname', 'lname', 'email']};

// Retrieves all users
router.get('/all', function(req, res) {
  if (req.session.userID === undefined) { return res.send(403); }

  models.User.findAll(publicOptions).success(function (users) {
    res.send(users);
  });
});

// Retreives user by id
router.get('/:id', function(req, res) {
  if (req.session.userID === undefined) { return res.send(403); }
  if (!utils.isUUID(req.params.id)) { return res.send(401); }

  var options = _.extend({where: {id: req.params.id}}, publicOptions);
  models.User.find(options).success(function(user){
    user ? res.send(user) : res.send(404);
  });
});

// Authenticates user
router.post('/auth', function(req, res) {
  var email = req.body.email;
  var password = req.body.password;

  models.User.find({where: {email: email}}).success(function (user) {
    // returns 401 if user does not exist
    if (!user) { return res.send(401); }
    var salt = user.salt;
    var DBPassword = user.password;
    password = crypto.createHash('sha256').update(salt + password).digest('hex');

    // returns 401 if password is incorrect
    if (password !== DBPassword) { return res.send(401); }
    req.session.userID = user.id;
    res.send(200);
  });
});

// Destroys current session
router.post('/deauth', function (req, res) {
  req.session.destroy();
  res.send(200);
});

// Modifies User by id
router.put('/:id', function(req, res) {
  if (req.session.userID !== req.params.id) { return res.send(403); }

  var user = _.pick(req.body, publicOptions.attributes);
  var options = _.extend({where: {id: req.params.id}}, publicOptions);
  models.User.update(user, options).success(function(user){
    user[0] ? res.send(200) : res.send(404);
  });
});

// Deletes User by id
router.delete('/:id', function (req, res) {
  if (req.session.userID !== req.params.id) { return res.send(403); }

  var options = _.extend({where: {id: req.params.id}}, publicOptions);
  models.User.destroy(options).success(function (user) {
    user ? res.send(200) : res.send(404);
  });
});

// Route for creating a new user
router.post('/', function (req, res) {
  var user = req.body;
  models.User.find({where: {email: user.email}}).then(function (ret) {
    // returns true if user with email exists
    return !!ret;
  }).then(function(user_email_exists) {
    // short circuits if emails exists
    if (user_email_exists) { return true; }
    // otherwise check if id is passed in
    if (user.id){
      if (!utils.isUUID(user.id)) { return true; }
        return !!models.User.find({where: {id: user.id}});
    }
    else{
      return false;
    }
  }).then(function (user_exists) {
    if (user_exists){
      // sends 401 if user exists
      return res.send(401);
    }
    else {
     // creates user otherwise
      CreateUser(req, res, user);
    }
  });
});

// Creates user with sepecified fields
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
