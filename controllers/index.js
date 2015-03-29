var postController = require('../controllers/posts');
var categoryController = require('../controllers/categories');
var models = require('../models');
var crypto = require('crypto');
var sendgrid = require('sendgrid')(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD);
var utils = require('../utilities');

module.exports = {
  main: function (req, res) {
    if(req.session.userID){
      categoryController.listAll(req, res, function (categories) {
        res.render('main', {userID: req.session.userID, categories: categories});
      });
    }
    else {
      res.render('index');
    }
  },
  settings: function (req, res) {
    if(req.session.userID){
      res.render('settings', {userID: req.session.userID});
    }
    else {
      res.redirect('/');
    }
  },
  forgotPassword: function (req, res) {
    if(req.method === "GET"){
      if(!req.session.userID){
        res.render('forgot_password');
      }
      else {
        res.redirect('/');
      }
    }
    else if (req.method === "POST"){
      var email = req.body.email;
      models.User.find({where: {email: email}}).then(function(user){
        if(user){
          var url = "https://trybazaar.com/new_password?user=key=" +
          crypto.createHash('sha256').update(user.password).digest('hex');
          req.session.resetPassword = true;
          /*sendgrid.send({
            to: email,
            from: 'noreply@trybazaar.com',
            subject: 'Account Recovery',
            html: 'Please click <a href="'+ url +
            '">here</a> to reset your password.'
          }, function(err, json){
            if (err) { console.log(err); }
            console.log(json);
          });
          */
          res.status(204).end();
        }
        else{
          res.status(401).end();
        }
      });
    }
  },
  newPassword: function(req, res){
    if(!req.session.userID){
      res.render('new_password');
    }
    else {
      res.redirect('/');
    }
  }
};
