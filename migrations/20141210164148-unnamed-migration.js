"use strict";

module.exports = {
  up: function(migration, DataTypes, done) {
    migration.renameColumn('posts', 'cost', 'price').success(done);
  },

  down: function(migration, DataTypes, done) {
    // add reverting commands here, calling 'done' when finished
    done();
  }
};
