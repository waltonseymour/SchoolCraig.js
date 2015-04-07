var models = require('../models');
var _ = require('underscore');
var async = require('async');
var util = require('../utilities');
var uuid = require('node-uuid');
var geoip = require('geoip-lite');

var publicOptions = {attributes: ['id', 'title', 'description', 'createdAt', 'updatedAt', 'price', 'latitude', 'longitude']};
var userOptions = {attributes: ['id', 'email']};
var categoryOptions = {attributes: ['id', 'name']};

models.Post.belongsTo(models.User, {as: 'user', foreignKey: {name: 'user_id', allowNull: false}, onDelete: 'cascade'});
models.Post.belongsTo(models.Category, {as: 'category', foreignKey: {name: 'category_id', allowNull: false}, onDelete: 'cascade'});
models.Post.hasMany(models.Photo, {as: 'photos', foreignKey: 'post_id', onDelete: 'cascade'});

module.exports = {

  // lists all posts
  listAll: function(req, res, callback) {
    if (req.session.userID === undefined) { return res.send(403); }

    // defaults ordering by date
    var order = _.contains(['createdAt', 'price'], req.param('order')) ? req.param('order') : 'createdAt';
    var category = req.param('category');
    var page = req.param('page');
    var postsPerPage = req.param('postsPerPage') || 5;
    var latitude = req.param('latitude');
    var longitude = req.param('longitude');
    var user = req.param('user');
    // radius of search in miles
    var radius = req.param('radius') || 100;
    if (!util.isValidCoordinate(latitude, longitude)) {
      var ip = req.connection.remoteAddress;
      var geo = geoip.lookup(ip);
      latitude = geo ? geo.ll[0] : 36.1667;
      longitude = geo ? geo.ll[1] : -86.7833;
    }

    var options = {limit: postsPerPage, order: [[order, 'DESC']],
    where: ["(point(longitude, latitude) <@> point(?, ?)) < ?", longitude, latitude, radius],
    include: [
      {model: models.User, as: 'user', attributes: userOptions.attributes},
      {model: models.Photo, as: 'photos'},
      {model: models.Category, as: 'category', attributes: categoryOptions.attributes}]};

    if (util.isUUID(category)){
      options.where[0] += " and category_id = ?";
      options.where.push(category);
    }

    if (util.isUUID(user)){
      options.where = ["user_id = ?", user];
    }

    // page number starts at 1
    if (page && !isNaN(page) && page > 1){
      options = _.extend(options, {offset: (page - 1) * postsPerPage});
    }

    models.Post.findAll(options).success(function (posts) {
      if (callback) {
        callback(posts);
      }
      else {
        res.send(posts);
      }
      var activity = {user: req.session.userID, activity: "Get Posts",
      value: JSON.stringify(req.query)};
      models.Activity.create(activity);
    });
  },

  // get post by id
  getByID: function(req, res){
    if (req.session.userID === undefined) { return res.status(403).end(); }
    if (!util.isUUID(req.params.id)) { return res.status(401).end(); }

    var options = _.extend({}, publicOptions, {where: {id: req.params.id}, include: [
      {model: models.User, as: 'user', attributes: userOptions.attributes},
      {model: models.Photo, as: 'photos'},
      {model: models.Category, as: 'category', attributes: categoryOptions.attributes}]});
    models.Post.find(options).success(function(post){
      if(post){
        res.send(post);
        var activity = {user: req.session.userID, activity: "Open Post",
        value: req.params.id};
        models.Activity.create(activity);
      }
      else{
        res.status(404).end();
      }
    });
  },

  getByUser: function(req, res){
    req.params.user = req.params.id;
    module.exports.listAll(req, res);
  },

  // searches by full text
  search: function(req, res){
    if (req.session.userID === undefined) { return res.status(403).end(); }
    var query = req.params.query;
    var options = {where: ["tsv @@ plainto_tsquery('english', ?)", query],
    include: [
      {model: models.User, as: 'user', attributes: userOptions.attributes},
      {model: models.Photo, as: 'photos'},
      {model: models.Category, as: 'category', attributes: categoryOptions.attributes}]};
    models.Post.findAll(options).then(function(posts){
      res.send(posts);
    });
  },

  // modifies by id
  putByID: function(req, res) {
    models.Post.find({where: {id: req.params.id}}).then(function (post) {
      if (!post) { return res.status(404).end(); }
      if (req.session.userID !== post.user_id) { return res.status(403).end(); }
      var newPost = _.pick(req.body, ['title', 'description', 'price', 'category_id']);
      // ensures all fields are set
      if (newPost.title && newPost.description && newPost.price &&
      util.isUUID(newPost.category_id)){
        post.updateAttributes(newPost).then(function(){
          res.send(post);
          var activity = {user: req.session.userID, activity: "Modify Post",
          value: req.params.id};
          models.Activity.create(activity);
        }).catch(function(error){
          console.log(error);
          res.status(401).end();
        });
      }
      else{
        res.status(401).end();
      }
    });
  },

  // deletes by id
  deleteByID: function(req, res) {
    if (!util.isUUID(req.params.id)) { return res.send(401); }
    models.Post.find({where: {id: req.params.id}}).then(function (post) {
      if (post.user_id !== req.session.userID) { return res.send(403); }
      // will delete all photos in database with ondelete cascade
      models.Photo.findAll({where: {post_id: req.params.id}})
      .then(function (photos) {
        var photoIDs = _.map(photos, function(photo){ return photo.id; });
        if (photoIDs) { util.deletePhotos(photoIDs); }
      })
      .then(function () { models.Post.destroy({where: {id: req.params.id}}); })
      .then(function () {
        res.status(204).end();
        var activity = {user: req.session.userID, activity: "Delete Post",
        value: req.params.id};
        models.Activity.create(activity);
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
    if (!util.isUUID(req.params.id)) { return res.send(401); }
    if (_.isArray(req.body)){
      var payload = [];
      async.each(req.body, function(item, callback){
        var photo = {
          id: item.id || uuid.v4(),
          post_id: req.params.id,
          contentType: item.contentType
        };
        createPhoto(req, res, photo, function(url, error){
          if(error){
            callback("createPhoto failed");
          }
          else{
            payload.push(url);
            callback();
          }
        });
      }, function(err){
        if(err){
          console.log(err);
          res.status(401).end();
        }
        else{
          res.send(payload);
        }
      });
    }
    else{
      var photo = {
        id: req.body.id || uuid.v4(),
        post_id: req.params.id,
        contentType: req.body.contentType
      };
      createPhoto(req, res, photo, function(url){
        res.send(url);
      });
    }
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
        res.redirect(307, url);
      });
    });
  }

};

// should use bulkCreate in the future
function createPhoto (req, res, photo, callback){
  models.Post.find({where: {id: photo.post_id}})
  .then(function (post) {
    return post && post.user_id === req.session.userID;
  })
  .then(function (valid){
    if (valid) {
      models.Photo.create(photo)
      .then(function (ret) {
        var options = {
          key: 'bazaar/' + photo.id,
          method: 'put',
          contentType: photo.contentType};
        util.sign_s3(options, function (data) {
          callback(data);
        });
      }).catch(function(error){
        console.log(error);
        callback(null, error);
      });
    }
    else {
      callback(null, "unauthorized");
    }
  });
}

// Creates post with sepecified fields
function CreatePost (req, res, post) {
  post.price = parseInt(post.price);
  var required = [post.title, post.description, post.price, post.category_id];
  var valid = !_.any(required, _.isUndefined) &&
    post.price >= 0 &&
    util.isValidCoordinate(post.latitude, post.longitude);
  if (valid) {
    post.user_id = req.session.userID;
    models.Post.create(post).then(function () {
      res.status(204).end();
      var activity = {user: req.session.userID, activity: "Create Post",
      value: post.id};
      models.Activity.create(activity);
    }).catch(function(err){
      console.log(err);
      res.status(401).end();
    });
  }
  else {
    res.status(401).end();
  }
}
