/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('categories', { 
    id: {
      type: 'UUID',
      allowNull: false,
      defaultValue: 'uuid_generate_v4()'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    }
  });
};
