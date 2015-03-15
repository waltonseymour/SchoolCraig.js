var expect = require('expect.js');
var request = require('superagent').agent();
var uuid = require('node-uuid');
var models = require('..//models');
var sequelize = require('sequelize');

var host = 'http://localhost:3000';
var userID = uuid.v4();
var categoryID = uuid.v4();
var postID = uuid.v4();

describe("Test Suite", function(){
  // runs server before testing
  before(function (done) {
    var app = require('../app');
    app.set('port', process.env.PORT || 3000);
    var server = app.listen(app.get('port'));
    var user = {"id": userID, "email": "test@test.com", "password": "password"};
    // deletes any test users
    var chainer = new sequelize.Utils.QueryChainer();

    chainer.add(models.Category.destroy({where: {name: 'test'}}));
    chainer.add(models.User.destroy({where: {email: "test@test.com"}}));
    chainer.runSerially().done(function(ret){
     // creates a new user
      request.post(host + '/users').send(user).end(function(e, res){
        expect(e).to.equal(null);
        expect(res.statusCode).to.equal(204);
        request.post(host + '/users/auth').send({"email": "test@test.com", "password": "password"}).end(function(e, res){
          expect(e).to.equal(null);
          expect(res.statusCode).to.equal(200);
          request.saveCookies(res);
          // creates new category
          request.post(host + '/categories').send({id: categoryID, name: 'test'}).end(function(e,res) {
            expect(e).to.equal(null);
            expect(res.statusCode).to.equal(204);
            done();
          });
        });
      });
    });
  });

  // cleans up test data
  after(function (done) {
    var chainer = new sequelize.Utils.QueryChainer();
    chainer.add(models.User.destroy({where: {email: "test@test.com"}}));
    chainer.add(models.Category.destroy({where: {name: 'test'}}));
    chainer.runSerially().done(function(data) {
      done();
    });
  });

  // tests getting user by id
  it("new user should be accessable by route", function(done){
    request.get(host + '/users/' + userID).end(function (e, res){
      expect(e).to.equal(null);
      expect(res.statusCode).to.equal(200);
      expect(res.body.id).to.equal(userID);
      expect(res.body.email).to.equal('test@test.com');
      done();
    });
  });

  // tests getting all users
  it("should list users", function(done){
    request.get(host + '/users').end(function (e, res){
      expect(e).to.equal(null);
      expect(res.statusCode).to.equal(200);
      done();
    });
  });

  // tests resetting password
  it("should allow users to reset passwords", function(done){
    var newUser = {"id": userID, "email": "test@test.com", "password": "password",
    "new_password": "new_password"};
    request.put(host + '/users/' + userID).send(newUser).end(function (e, res){
      expect(e).to.equal(null);
      expect(res.statusCode).to.equal(200);
      done();
    });
  });

  // tests posts
  it("should allow user to create, modify and delete post", function(done){
    var post = {id: postID, title: 'my test post', description: 'test description', price: 20, category_id: categoryID, latitude: 36.1667, longitude: -86.767};
    // creates post
    request.post(host + '/posts').send(post).end(function (e, res){
      expect(e).to.equal(null);
      expect(res.statusCode).to.equal(204);
      // retrieves post after creation
      request.get(host + '/posts/' + postID).end(function (e, res){
        expect(e).to.equal(null);
        expect(res.statusCode).to.equal(200);
        expect(res.body.title).to.equal(post.title);
        expect(res.body.description).to.equal(post.description);
        expect(res.body.price).to.equal(post.price);

        var newPost = {id: postID, title: 'my new post', description: 'new description', price: 50, category_id: categoryID, latitude: 36.1667, longitude: -86.767};
        request.put(host + '/posts/' + postID).send(newPost).end(function (e, res){
          expect(e).to.equal(null);
          expect(res.statusCode).to.equal(200);
          expect(res.body.title).to.equal(newPost.title);
          expect(res.body.description).to.equal(newPost.description);
          expect(res.body.price).to.equal(newPost.price);
          request.del(host + '/posts/' + postID).end(function (e, res){
            expect(e).to.equal(null);
            expect(res.statusCode).to.equal(204);
            done();
          });
        });
      });
    });
  });


});
