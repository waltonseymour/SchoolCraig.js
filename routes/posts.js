var express = require('express');
var router = express.Router();
var controller = require('../controllers/posts');

// Retrieves all posts
router.get('/', function (req, res) { controller.listAll(req, res); });

// Retreives post by id
router.get('/:id', controller.getByID);

// Modifies post by id
router.put('/:id', controller.putByID);

// Deletes Post by id
router.delete('/:id', controller.deleteByID);

// Route for creating a new post
router.post('/', controller.create);

module.exports = router;
