/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Category', { 
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    }
  });
};
