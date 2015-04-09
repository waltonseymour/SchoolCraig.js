/* jshint indent: 2 */

var utils = require('../utilities');

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Photo', {
    id: {
      type: 'UUID',
      primaryKey: true,
      allowNull: false
    },
    post_id: {
      type: 'UUID',
      allowNull: false,
    }
  },
  {
    hooks:{
      afterDestroy: function(photo, options) {
        console.log(photo);
        utils.deletePhotos([photo.id]);
      }
    },
    tableName: 'photos'
  });
};
