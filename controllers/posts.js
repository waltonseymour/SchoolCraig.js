var models = require('../models');
var _ = require('underscore');
var async = require('async');
var util = require('../utilities');
var uuid = require('node-uuid');

var publicOptions = {attributes: ['id', 'title', 'description', 'createdAt', 'price']};
var userOptions = {attributes: ['id', 'fname', 'lname', 'email']};
var categoryOptions = {attributes: ['id', 'name']};

models.Post.belongsTo(models.User, {as: 'user', foreignKey: 'user_id'});
models.Post.belongsTo(models.Category, {as: 'category', foreignKey: 'category_id'});
models.Post.hasMany(models.Photo, {as: 'photos', foreignKey: 'post_id'});
models.Photo.belongsTo(models.Post, {as: 'post', foreignKey: 'post_id'});

module.exports = {

  // lists all posts
  listAll: function(req, res, callback) {
    if (req.session.userID === undefined) { return res.send(403); }

    // defaults ordering by date
    var order = _.contains(['createdAt', 'price'], req.param('order')) ? req.param('order') : 'createdAt';
    var category = req.param('category');

    var options = _.extend({}, publicOptions, {order: [[order, 'DESC']], include: [
      {model: models.User, as: 'user', attributes: userOptions.attributes},
      {model: models.Photo, as: 'photos'},
      {model: models.Category, as: 'category', attributes: categoryOptions.attributes}]});

    if (util.isUUID(category)){
      options = _.extend(options, {where: {category_id: category}});
    }

    models.Post.findAll(options).success(function (posts) {
      if (callback) {
        callback(posts);
      }
      else {
        res.send(posts);
      }
    });
  },

  // get post by id
  getByID: function(req, res){
    if (req.session.userID === undefined) { return res.send(403); }
    if (!util.isUUID(req.params.id)) { return res.send(401); }

    var options = _.extend({}, publicOptions, {where: {id: req.params.id}, include: [
      {model: models.User, as: 'user', attributes: userOptions.attributes},
      {model: models.Photo, as: 'photos'},
      {model: models.Category, as: 'category', attributes: categoryOptions.attributes}]});
    models.Post.find(options).success(function(post){
      post ? res.send(post) : res.send(404);
    });
  },
  
  // modifies by id
  putByID: function(req, res) {
    models.Post.find(options).then(function (post) {
      if (req.session.userID !== post.user_id) { return res.send(403); }
      var new_post = _.pick(req.body, ['title', 'description', 'price']);
      models.Post.update(new_post, options).then(function(ret){
        ret[0] ? res.send(204) : res.send(404);
      });
    });
  },

  // deletes by id 
  deleteByID: function(req, res) {
    if (!util.isUUID(req.params.id)) { return res.send(401); }
    var options = {where: {id: req.params.id}};
    // verifies user owns post
    models.Post.find(options).then(function (ret) {
      return ret.user_id === req.session.userID;
    }).then(function (valid){
      if (!valid) { return res.send(403); }
      models.Post.destroy(options).success(function (ret) {
        ret ? res.send(200) : res.send(404);
      });
    });
  },

  create: function(req, res) {
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
  },

  // inserts row into database and returns presigned url for uploading
  upload: function(req, res) {
    if (req.session.userID === undefined) { return res.send(403); }
    if (!util.isUUID(req.params.id) || !req.body.contentType) { return res.send(401); }
    var photoID = req.body.id || uuid.v4();
    var postID = req.params.id;
    var photo = { id: photoID, post_id: postID }; 
    models.Photo.create(photo).then(function (ret) {
      var contentType = req.body.contentType;
      var options = {key: 'bazaar/' + photoID, method: 'put', contentType: contentType};
      util.sign_s3(options, function (data) {
        res.send(data);
      });
    });
  },

  // returns a list of presigned urls associated with a post
  getPhotos: function(req, res) {
    if (req.session.userID === undefined) { return res.send(403); }
    var postID = req.params.id;
    models.Photo.findAll({where: {post_id: postID}}).then(function (photos) {
      async.map(photos, function(photo, callback) {
        var options = {key: 'bazaar/' + photo.id, method: 'get'};
        util.sign_s3(options, function(signed_url) {
          callback(null, signed_url);
        });
      }, function(err, result){
        res.send(result);
      }); 

    }); 
  },

  // returns a list of presigned urls associated with a post
  getPhotoByID: function(req, res) {
    if (req.session.userID === undefined) { return res.send(403); }
    var postID = req.params.id;
    var photoID = req.params.photoID;
    models.Photo.find({where: {id: photoID}}).then(function (photo) {
      util.sign_s3({method: 'get', key: 'bazaar/' + photo.id}, function(url){
        res.redirect(301, url);
      });
    });
  }

};


// Creates user with sepecified fields
function CreatePost (req, res, post) {
  if (post.title && post.description && post.category_id && post.price) {
    post.user_id = req.session.userID;
    models.Post.create(post).then(function () {
      res.send(204);
    });
  }
  else {
    res.send(401);
  }
}
