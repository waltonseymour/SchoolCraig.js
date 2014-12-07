var expect = require('expect.js');
var request = require('superagent').agent();

var host = 'http://localhost:3000';

describe("User Suite", function(){
  before(function (done) {
    request.post(host + '/users/auth').send({"email": "bigw369@gmail.com", "password": "password"}).end(function(e, res){
      done();
    });
  });
  it("should list users", function(done){
    request.get(host + '/users').end(function (e, res){
        expect(e).to.equal(null);
        expect(res.statusCode).to.equal(200);
        done();
      });
   });
});
