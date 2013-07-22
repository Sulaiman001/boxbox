module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-connect');

  grunt.initConfig({
    meta: {
      banner: '/* Copyright 2013 Christophe Rosset. Licensed under the MIT License. http://topheman.github.com/boxbox/ */\n/* Copyright 2012 Greg Smith. Licensed under the MIT License. http://incompl.github.com/boxbox/ */'
    },
    min: {
      'boxbox.min.js': ['<banner>', 'boxbox.js']
    },
    lint: {
      files: ['grunt.js', 'boxbox.js']
    },
    watch: {
      files: ['boxbox.js'],
      tasks: 'min'
    },
    qunit: {
      all: ['test/index.html']
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: false,
        newcap: false, // for box2dweb code
        noarg: true,
        sub: true,
        undef: true,
        eqnull: true,
        browser: true
      },
      globals: {
        Box2D: true,
        Vector: true,
        module: true,
        console: true
      }
    },
    uglify: {},
    connect: {
        server: {
            options: {
                port: 9001,
                base: ''
            }
        }
    }
  });

  grunt.registerTask('default', 'lint min');
  grunt.registerTask('server', 'connect:server');

};