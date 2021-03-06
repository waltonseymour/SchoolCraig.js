var express = require('express');
var router = express.Router();
var controller = require('../controllers/users');
var postController = require('../controllers/posts');

// Retrieves all users
router.get('/', controller.listAll);

// Retreives user by id
router.get('/:id', controller.getByID);

// Retreives posts by user
router.get('/:id/posts', postController.getByUser);

// Authenticates user
router.post('/auth', controller.authenticate);

// Destroys current session
router.post('/deauth', controller.logout);

// Modifies User by id
router.put('/:id', controller.putByID);

// Deletes User by id
router.delete('/:id', controller.deleteByID);

// Route for creating a new user
router.post('/', controller.create);

// activates user
router.get('/activate/:id', controller.activate);


module.exports = router;
