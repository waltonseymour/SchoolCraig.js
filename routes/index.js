var express = require('express');
var router = express.Router();
var _ = require('underscore');
var aws = require('aws-sdk');
aws.config.reigon = 'us-west-2';
var S3_BUCKET = process.env.S3_BUCKET;

/* GET home page. */
router.get('/', function(req, res) {
  if(req.session.userID){
    res.render('main');
  }
  else {
    res.render('index', { title: 'Express' });
  }
});

router.get('/sign_s3', function(req, res){
  var s3 = new aws.S3({params: {Bucket: S3_BUCKET}});
  if (!_.contains(['get', 'put'], req.query.method)){ return res.send(401); }

  var s3_params = {
    Key: req.query.key,
    Expires: 60,
  };
  if (req.query.method === 'put'){
    s3_params.ContentType = req.query.contentType;
    s3_params.ACL = 'private';
  }
  s3.getSignedUrl(req.query.method + 'Object', s3_params, function(err, data){
    if(err){
      console.log(err);
    }
    else{
      res.send(data);
    }
  });
});

module.exports = router;
