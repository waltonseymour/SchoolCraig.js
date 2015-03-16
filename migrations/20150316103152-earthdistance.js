"use strict";

module.exports = {
  up: function(migration, DataTypes, done) {
    // add altering commands here, calling 'done' when finished
    migration.migrator.sequelize.query("create extension if not exists cube").then(function(){
      migration.migrator.sequelize.query("create extension if not exists earthdistance").then(function(){
        done();
      });
    });

  },

  down: function(migration, DataTypes, done) {
    // add reverting commands here, calling 'done' when finished
    done();
  }
};
