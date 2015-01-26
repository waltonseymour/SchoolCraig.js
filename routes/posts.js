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

// uploads a new image
router.post('/:id/photos', controller.upload);

// Retrieves urls for photos
router.get('/:id/photos', controller.getPhotos);

// Retrieves url for a photo
router.get('/:id/photos/:photoID', controller.getPhotoByID);

module.exports = router;
