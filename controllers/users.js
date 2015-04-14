var models = require('../models');
var crypto = require('crypto');
var uuid = require('node-uuid');
var _ = require('underscore');
var sendgrid = require('sendgrid')(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD);
var utils = require('../utilities');

var publicOptions = {attributes: ['id', 'email']};

models.User.hasMany(models.Post, {as: 'posts', foreignKey: {name: 'user_id', allowNull: false}, onDelete: 'cascade', hooks: true});
module.exports = {
  listAll: function (req, res) {
    if (req.session.userID === undefined) { return res.send(403); }

    models.User.findAll(publicOptions).success(function (users) {
      res.send(users);
    });
  },

  getByID: function (req, res) {
    if (req.session.userID === undefined) { return res.status(403).end(); }
    if (!utils.isUUID(req.params.id)) { return res.status(401).end(); }

    var options = _.extend({where: {id: req.params.id}}, publicOptions);
    models.User.find(options).success(function(user){
      if(user){
        res.send(user);
      }
      else{
        res.status(404).end();
      }
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
      password = utils.SHA256(salt + password);

      // returns 401 if password is incorrect
      if (password !== DBPassword) { return res.send(401); }
      req.session.userID = user.id;
      req.session.admin = user.admin;
      res.send(_.pick(user, publicOptions.attributes));
    });
  },

  logout: function (req, res) {
    req.session = null;
    res.send(204);
  },

  // changes password
  putByID: function (req, res) {
    var authenticated = req.session.userID === req.params.id ||
      req.session.forgotPassword === req.params.id;
    if (!authenticated) {
      return res.send(403);
    }
    var newUser = req.body;
    models.User.find({where: {id: req.params.id}}).then(function (user) {
      if (!user) { return res.status(401).end(); }
      var salt = user.salt;
      var DBPassword = user.password;
      var password;
      if (newUser.password) {
        password = utils.SHA256(salt + newUser.password);
      }
      if (password === DBPassword || req.session.forgotPassword) {
        user.password = utils.SHA256(salt + newUser.new_password);
        user.save().then(function() {
          if (req.session.forgotPassword){
            req.session = null;
          }
          res.status(200).end();
        });
      }
      else{
        res.status(401).end();
      }
    });
  },

  deleteByID: function (req, res) {
    if (req.session.userID !== req.params.id) { return res.send(403); }

    var options = _.extend({where: {id: req.params.id}}, publicOptions);
    models.User.findOne({where: {id: req.params.id}}).then(function(user){
      user.destroy().then(function (user) {
        req.session = null;
        res.send(204);
      });
    });
  },

  create: function (req, res) {
    var user = req.body;
    if (!/.edu$/.test(user.email)){
      return res.status(401).end();
    }

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
      if (user && utils.SHA256(user.salt) === req.query.key) {
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
    var password = utils.SHA256(salt + user.password);
    user.id = user.id || uuid.v4();
    user.salt = salt;
    user.password = password;
    user.email = user.email.toLowerCase();
    user.activated = process.env.NODE_ENV !== 'production';
    user.admin = false;
    models.User.create(user).then(function (){
      if(!user.activated){
        var url = "https://trybazaar.com/users/activate/" + user.id + '?key=' + utils.SHA256(salt);
        sendgrid.send({
          to: user.email,
          from: 'noreply@trybazaar.com',
          subject: 'Account Activation',
          html: 'Please click <a href="'+ url +'">here</a> to confirm your email.'
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
