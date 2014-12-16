/* jshint indent: 2 */

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
    tableName: 'photos'
  });
};
