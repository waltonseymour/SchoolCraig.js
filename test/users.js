var expect = require('expect.js');
var request = require('superagent').agent();
var uuid = require('node-uuid');
var models = require('..//models');

var host = 'http://localhost:3000';
var userID;

describe("User Suite", function(){
  // runs server before testing
  before(function (done) {
    var app = require('../app');
    app.set('port', process.env.PORT || 3000);
    var server = app.listen(app.get('port'));
    userID = uuid.v4();
    var user = {"id": userID, "email": "test@test.com", "password": "password", "fname": "adam", "lname": "smith"};
    models.User.destroy({where: {email: "test@test.com"}}).success(function(ret){
      request.post(host + '/users').send(user).end(function(e, res){
        expect(e).to.equal(null);
        expect(res.statusCode).to.equal(204);
        request.post(host + '/users/auth').send({"email": "test@test.com", "password": "password"}).end(function(e, res){
          expect(e).to.equal(null);
          expect(res.statusCode).to.equal(200);
          done();
        });
      });
    });
  });

  after(function (done) {
    models.User.destroy({where: {email: "test@test.com"}}).success(function(ret){
      done();
    });
  });

  // tests new user
  it("new user should be accessable by route", function(done){
    request.get(host + '/users/' + userID).end(function (e, res){
        expect(e).to.equal(null);
        expect(res.statusCode).to.equal(200);
        expect(res.body.id).to.equal(userID);
        expect(res.body.fname).to.equal('adam');
        expect(res.body.lname).to.equal('smith');
        expect(res.body.email).to.equal('test@test.com');
        done();
      });
   });

  // tests /users
  it("should list users", function(done){
    request.get(host + '/users').end(function (e, res){
        expect(e).to.equal(null);
        expect(res.statusCode).to.equal(200);
        done();
      });
   });
});
