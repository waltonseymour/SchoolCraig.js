var express = require('express');
var router = express.Router();
var models = require('../models');
var _ = require('underscore');
var util = require('../utilities');

// Retrieves all categories
router.get('/all', function(req, res) {
  models.Category.findAll().success(function (users) {
    res.send(users);
  });
});

// Retreives category by id
router.get('/:id', function(req, res) {
  if (req.session.userID === undefined) { return res.send(403); }
  if (!util.isUUID(req.params.id)) { return res.send(401); }

  var options = {where: {id: req.params.id}};
  models.Post.find(options).success(function(category){
    category ? res.send(category) : res.send(404);
  });
});


// Route for creating a new category
router.post('/', function (req, res) {
  var category = req.body;
  if (!category.id) { return CreateCategory(req, res, category); }

  models.Category.find({where: {id: category.id}}).then(function (ret) {
    // returns true if category with id exists
    return !!ret;
  }).then(function (category_exists) {
    if (category_exists){
      // sends 401 if category id exists
      return res.send(401);
    }
    else {
     // creates category otherwise
      CreateCategory(req, res, post);
    }
  });
});

// Creates user with sepecified fields
function CreateCategory (req, res, category) {
  if (category.name) {
    models.Category.create(category);
    res.send(204);
  }
  else {
    res.send(401);
  }
}

module.exports = router;
