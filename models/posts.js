/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Post', { 
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4
    },
    user_id: {
      type: 'UUID',
      allowNull: true,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: '2014-11-04 22:03:08.837431'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    category_id: {
      type: 'UUID',
      allowNull: true,
    },
    cost: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true,
    }
  });
};
