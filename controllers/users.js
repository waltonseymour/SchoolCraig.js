var models = require('../models');
var crypto = require('crypto');
var uuid = require('node-uuid');
var _ = require('underscore');
var sendgrid = require('sendgrid')(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD);
var utils = require('../utilities');

var publicOptions = {attributes: ['id', 'fname', 'lname', 'email']};

module.exports = {
  listAll: function (req, res) {
    if (req.session.userID === undefined) { return res.send(403); }

    models.User.findAll(publicOptions).success(function (users) {
      res.send(users);
    });
  },

  getByID: function (req, res) {
    if (req.session.userID === undefined) { return res.send(403); }
    if (!utils.isUUID(req.params.id)) { return res.send(401); }

    var options = _.extend({where: {id: req.params.id}}, publicOptions);
    models.User.find(options).success(function(user){
      user ? res.send(user) : res.send(404);
    });
  },

  authenticate: function (req, res) {
    var email = req.body.email.toLowerCase();
    var password = req.body.password;

    models.User.find({where: {email: email}}).success(function (user) {
      // returns 401 if user does not exist
      if (!user || !user.activated) { return res.send(401); }
      var salt = user.salt;
      var DBPassword = user.password;
      password = crypto.createHash('sha256').update(salt + password).digest('hex');

      // returns 401 if password is incorrect
      if (password !== DBPassword) { return res.send(401); }
      req.session.userID = user.id;
      res.send(_.pick(user, publicOptions.attributes));
    });
  },

  logout: function (req, res) {
    req.session = null;
    res.send(200);
  },

  putByID: function (req, res) {
    if (req.session.userID !== req.params.id) { return res.send(403); }

    var user = _.pick(req.body, publicOptions.attributes);
    var options = _.extend({where: {id: req.params.id}}, publicOptions);
    models.User.update(user, options).success(function(user){
      user[0] ? res.send(200) : res.send(404);
    });
  },

  deleteByID: function (req, res) {
    if (req.session.userID !== req.params.id) { return res.send(403); }

    var options = _.extend({where: {id: req.params.id}}, publicOptions);
    models.Post.destroy({where: {user_id: req.params.id}})
    .then(models.User.destroy(options))
    .then(function (user) {
      req.session = null;
      res.send(204);
    });
  },

  create: function (req, res) {
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
        models.User.find({where: {id: user.id}}).success(function (user_by_id) {
          return !!user_by_id;
        });
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
        createUser(req, res, user);
      }
    });
  },

  activate: function (req, res) {
    if (!utils.isUUID(req.params.id)) { return res.send(401); }
  
    models.User.find({where: {id: req.params.id}}).then(function (user) {
      if (user && crypto.createHash('sha256').update(user.salt).digest('hex') === req.query.key) {
        user.activated = true;
        user.save().then(function (){ 
          req.session.userID = user.id;
          res.redirect('/');
        });
      }
      else{
        return res.send(401);
      }
    });
  }
};

// Creates user with sepecified fields
function createUser (req, res, user) {
  if (user.email && user.password) {
    var salt = crypto.randomBytes(16).toString('hex'); 
    var password = crypto.createHash('sha256').update(salt + user.password).digest('hex');
    user.id = user.id || uuid.v4();
    user.salt = salt;
    user.password = password;
    user.email = user.email.toLowerCase();
    user.activated = process.env.NODE_ENV !== 'production';
    models.User.create(user).then(function (){
      if(!user.activated){
        var url = "https://schoolcraigslist.herokuapp.com/users/activate/" + user.id + '?key=' + crypto.createHash('sha256').update(salt).digest('hex');
        sendgrid.send({
          to: user.email,
          from: 'noreply@heroku.com',
          subject: 'Account Activation',
          html: 'Please click <a href="' + url+ '">here</a> to confirm your email.'
        }, function(err, json){
          if (err) { console.log(err); }
          console.log(json);
        });
      }
      res.send(204);
    });
  }
  else {
    res.send(401);
  }
}
