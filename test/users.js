var expect = require('expect.js');
var request = require('superagent').agent();

var host = 'http://localhost:3000';

describe("User Suite", function(){
  // runs server before testing
  before(function (done) {
    var app = require('../app');
    app.set('port', process.env.PORT || 3000);
    var server = app.listen(app.get('port'));
    request.post(host + '/users/auth').send({"email": "bigw369@gmail.com", "password": "password"}).end(function(e, res){
      done();
    });
  });

  // tests creating user
  it("should list users", function(done){
    request.get(host + '/users').end(function (e, res){
        expect(e).to.equal(null);
        expect(res.statusCode).to.equal(200);
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
