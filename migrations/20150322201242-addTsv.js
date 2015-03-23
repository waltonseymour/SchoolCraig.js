"use strict";

module.exports = {
  up: function(migration, DataTypes, done) {
    migration.sequelize.query("alter table posts add column tsv TSVECTOR").then(function(){
      return migration.sequelize.query("UPDATE posts SET tsv = " +
      "setweight(to_tsvector('pg_catalog.english', coalesce(title,'')), 'A') ||" +
      "setweight(to_tsvector('pg_catalog.english', coalesce(description,'')), 'B')");
    }).then(function(){
      return migration.sequelize.query("CREATE INDEX post_search_idx ON posts USING gin(tsv)");
    }).then(function(){
      return migration.sequelize.query("CREATE TRIGGER post_vector_update BEFORE INSERT OR UPDATE ON posts FOR EACH ROW " +
      "EXECUTE PROCEDURE tsvector_update_trigger(tsv, 'pg_catalog.english', title, description)");
    }).then(function(){
      done();
    });

  },

  down: function(migration, DataTypes, done) {
    // add reverting commands here, calling 'done' when finished
    done();
  }
};
