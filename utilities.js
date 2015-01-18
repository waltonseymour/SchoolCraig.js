var _ = require('underscore');
var aws = require('aws-sdk');
aws.config.reigon = 'us-west-2';
var S3_BUCKET = process.env.S3_BUCKET;

module.exports = {
  isUUID: function (id) {
    var regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return id ? !!id.match(regex) : false;
  },

  sign_s3: function(options, callback) {
    var s3 = new aws.S3({params: {Bucket: S3_BUCKET}});
    if (!_.contains(['get', 'put'], options.method)){ return new Error('method must be get or put'); }
    var s3_params = {
      Key: options.key,
      Expires: 60,
    };
    if (options.method === 'put'){
      s3_params.ContentType = options.contentType;
      s3_params.ACL = 'private';
    }
    s3.getSignedUrl(options.method + 'Object', s3_params, function(err, data){
      if (err) {
        console.log(err);
      }
      else {
        callback(data);
      }
    });
  }
};
