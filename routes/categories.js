var express = require('express');
var router = express.Router();
var controller = require('../controllers/categories');

// Retrieves all categories
router.get('/', controller.listAll);

// Retreives category by id
router.get('/:id', controller.getByID);

// Route for creating a new category
router.post('/', controller.create);

module.exports = router;
