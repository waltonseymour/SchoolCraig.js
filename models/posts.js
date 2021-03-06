/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Post', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    user_id: {
      type: 'UUID',
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    category_id: {
      type: 'UUID',
      allowNull: false
    },
    price: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: false
    }
  },
  {
    tableName: 'posts',
    classMethods:{
      search: function(query){
        var Post = this;
        query = sequelize.getQueryInterface().escape(query);
        return sequelize.query("SELECT * FROM " + Post.tableName + " WHERE tsv @@ plainto_tsquery('english', " + query + ")", Post);
      }
    }
  });
};
