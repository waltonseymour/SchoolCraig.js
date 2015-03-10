"use strict";

module.exports = {
  up: function(migration, DataTypes, done) {
    migration.addColumn("posts", "latitude", DataTypes.FLOAT);
    migration.addColumn("posts", "longitude", DataTypes.FLOAT);
    done();
  },

  down: function(migration, DataTypes, done) {
    migration.removeColumn("posts", "latitude");
    migration.removeColumn("posts", "longitude");
    done();
  }
};
