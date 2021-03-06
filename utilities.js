var _ = require('underscore');
var crypto = require('crypto');
var aws = require('aws-sdk');
aws.config.reigon = 'us-west-2';
var s3 = new aws.S3({params: {Bucket: process.env.S3_BUCKET}});

module.exports = {
  isUUID: function (id) {
    var regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return id ? !!id.match(regex) : false;
  },

  SHA256: function(text){
    return crypto.createHash('sha256').update(text).digest('hex');
  },

  isValidCoordinate: function(lat, lon){
    return Math.abs(lat) < 90 && Math.abs(lon) < 180;
  },

  // Generates presigned urls for image uploads or retrievals
  sign_s3: function(options, callback) {
    if (!_.contains(['get', 'put'], options.method)){ return new Error('method must be get or put'); }
    var s3_params = {
      Key: options.key,
      Expires: 180,
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
  },

  // Deletes all photos in s3, receieves a list of photos ids as a param
  deletePhotos: function(photos, callback) {
    if (_.isUndefined(photos) || photos.length === 0){
      if (callback && typeof(callback) === "function") {
        callback(null, "no photos passed");
      }
      return;
    }
    var params = {Bucket: process.env.S3_BUCKET, Delete: {Objects: []}};
    params.Delete.Objects = _.map(photos, function(photoID){
      return {Key: "bazaar/" + photoID};
    });
    s3.deleteObjects(params, function(err, data){
      if (err) {
        console.log(err);
        if (callback && typeof(callback) === "function") {
          callback(null, err);
        }
      }
      else if (callback && typeof(callback) === "function") {
        callback(data);
      }
    });
  }
};
