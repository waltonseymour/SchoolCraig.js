"use strict";

module.exports = {
  up: function(migration, DataTypes, done) {
    migration.addColumn('users', 'admin', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }).then(function(){
      done();
    });

  },

  down: function(migration, DataTypes, done) {
    // add reverting commands here, calling 'done' when finished
    done();
  }
};
