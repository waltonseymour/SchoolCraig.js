var express = require('express');
var router = express.Router();
var models = require('../models');
var _ = require('underscore');
var util = require('../utilities');

var publicOptions = {attributes: ['id', 'title', 'description', 'cost', 'user_id', 'category_id']};

// Retrieves all posts
router.get('/all', function(req, res) {
  if (req.session.userID === undefined) { return res.send(403); }

  models.Post.findAll(publicOptions).success(function (posts) {
    res.send(posts);
  });
});

// Retreives post by id
router.get('/:id', function(req, res) {
  if (req.session.userID === undefined) { return res.send(403); }
  if (!util.isUUID(req.params.id)) { return res.send(401); }

  var options = _.extend({where: {id: req.params.id}}, publicOptions);
  models.Post.find(options).success(function(post){
    post ? res.send(post) : res.send(404);
  });
});

// Modifies post by id
router.put('/:id', function(req, res) {
  if (req.session.userID !== req.params.id) { return res.send(403); }

  var post = _.pick(req.body, ['title', 'description', 'cost']);
  var options = {where: {id: req.params.id}};
  models.Post.update(post, options).success(function(ret){
    ret[0] ? res.send(204) : res.send(404);
  });
});

// Deletes Post by id
router.delete('/:id', function(req, res) {
  if (!util.isUUID(req.params.id)) { return res.send(401); }
  var options = {where: {id: req.params.id}};
  // verifies user owns post
  models.Post.find(options).success(function (ret) {
    return ret.user_id === req.session.userID;
  }).then(function (valid){
    if (!valid) { return res.send(403); }
    models.Post.destroy(options).success(function (ret) {
      ret ? res.send(200) : res.send(404);
    });
  });
});

// Route for creating a new user
router.post('/', function (req, res) {
  if (req.session.userID === undefined) { return res.send(403); }
  var post = req.body;
  models.Post.find({where: {id: post.id}}).then(function (ret) {
    // returns true if post with id exists
    return !!ret;
  }).then(function (post_exists) {
    if (post_exists){
      // sends 401 if user exists
      return res.send(401);
    }
    else {
     // creates user otherwise
      CreatePost(req, res, post);
    }
  });
});

// Creates user with sepecified fields
function CreatePost (req, res, post) {
  if (post.title && post.description && post.category_id && post.cost) {
    post.user_id = req.session.userID;
    models.Post.create(post);
    res.send(204);
  }
  else {
    res.send(401);
  }
}

module.exports = router;
