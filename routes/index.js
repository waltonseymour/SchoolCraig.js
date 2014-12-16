var express = require('express');
var router = express.Router();
var request = require('superagent').agent();
var aws = require('aws-sdk');
aws.config.reigon = 'us-west-2';
var S3_BUCKET = process.env.S3_BUCKET;

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

router.get('/sign_s3', function(req, res){
  var s3 = new aws.S3({params: {Bucket: S3_BUCKET}});
  var s3_params = {
    Key: 'walton',
    Expires: 60,
    ContentType: 'text/plain',
    ACL: 'private'
  };

  s3.getSignedUrl('putObject', s3_params, function(err, data){
    if(err){
      console.log(err);
    }
    else{
      res.send(data);
    }
  });
});

module.exports = router;
