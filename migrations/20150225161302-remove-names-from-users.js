"use strict";

module.exports = {
  up: function(migration, DataTypes, done) {
    migration.removeColumn("users", "fname"); 
    migration.removeColumn("users", "lname"); 
    done();
  },

  down: function(migration, DataTypes, done) {
    migration.addColumn("users", "fname", DataTypes.STRING); 
    migration.addColumn("users", "lname", DataTypes.STRING); 
    done();
  }
};
