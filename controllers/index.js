var postController = require('../controllers/posts');
var categoryController = require('../controllers/categories');

module.exports = {
  main: function (req, res) {
    if(req.session.userID){
      categoryController.listAll(req, res, function (categories) {
        res.render('main', {userID: req.session.userID, categories: categories});
      });
    }
    else {
      res.render('index');
    }
  }
};
