var models = require('../models');
var _ = require('underscore');
var util = require('../utilities');
var Sequelize = require('sequelize');

models.Category.hasMany(models.Post, {as: 'posts', foreignKey: {name: 'category_id', allowNull: false}, onDelete: 'cascade'});

module.exports = {
  listAll: function (req, res, callback) {
    models.Category.findAll({order: [["updatedAt", "DESC"]]}).then(function (categories) {
      if (callback) {
        callback(categories);
      }
      else {
        res.send(categories);
      }
    });
  },

  getByID: function (req, res) {
    if (!util.isUUID(req.params.id)) { return res.send(401); }
    var options = {where: {id: req.params.id}};
    models.Category.find(options).then(function(category){
      if (category) {
        res.send(category);
      }
      else{
        res.status(404).end();
      }
    });
  },

  create: function (req, res) {
    if (!req.session.admin) { return res.status(403).end(); }
    var category = req.body;

    var options = {where: Sequelize.or({id: category.id}, {name: category.name})};

    models.Category.find(options).then(function (ret) {
      // returns true if category with id exists
      return !!ret;
    }).then(function (category_exists) {
      if (category_exists){
        // sends 401 if category id exists
        return res.send(401);
      }
      else {
       // creates category otherwise
        createCategory(req, res, category);
      }
    });
  }

};

// Creates user with sepecified fields
function createCategory (req, res, category) {
  if (category.name) {
    models.Category.create(category).then(function(){
      res.status(204).end();
    });
  }
  else {
    res.status(401).end();
  }
}
