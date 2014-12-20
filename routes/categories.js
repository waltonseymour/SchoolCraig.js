var express = require('express');
var router = express.Router();
var controller = require('../controllers/categories');

// Retrieves all categories
router.get('/', function(req, res) { controller.listAll(req, res); });

// Retreives category by id
router.get('/:id', controller.getByID);

// Route for creating a new category
router.post('/', controller.create);

module.exports = router;
