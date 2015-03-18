var postController = require('../controllers/posts');
var categoryController = require('../controllers/categories');

module.exports = {
  main: function (req, res) {
    if(req.session.userID){
      postController.listAll(req, res, function (posts) {
        categoryController.listAll(req, res, function (categories) {
          res.render('main', {userID: req.session.userID, posts: posts, categories: categories});
        });
      });
    }
    else {
      res.render('index');
    }
  },
  settings: function (req, res) {
    if(req.session.userID){
      res.render('settings', {userID: req.session.userID});
    }
    else {
      res.redirect('/');
    }
  }
};
