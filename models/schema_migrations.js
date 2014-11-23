/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('schema_migrations', { 
    version: {
      type: DataTypes.STRING,
      allowNull: false,
    }
  });
};
