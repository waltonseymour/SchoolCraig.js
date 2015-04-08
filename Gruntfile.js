module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        compress: true
      },
      build: {
        files: {
          'public/javascripts/main.min.js': 'public/javascripts/main.min.js',
          'public/javascripts/index.min.js': 'public/javascripts/index.js'
        }
      }
    },
    browserify: {
      main: {
        src: 'public/javascripts/main.js',
        dest: 'public/javascripts/main.min.js'
      }
    },
    cssmin: {
      target: {
        files: {
          'public/stylesheets/style.min.css' : 'public/stylesheets/style.css'
        }
      }
    }

  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-cssmin');

  grunt.loadNpmTasks('grunt-browserify');

  // Default task(s).
  grunt.registerTask('default', ['browserify', 'uglify', 'cssmin']);

};
