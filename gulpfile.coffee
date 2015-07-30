gulp   = require 'gulp'
coffee = require 'gulp-coffee'
gutil  = require 'gulp-util'

gulp.task 'coffee', ->
	gulp.src('./lib/*.coffee')
	.pipe(coffee bare: true).on 'error', gutil.log
	.pipe(gulp.dest './jslib/')

gulp.task 'watch-coffee', ->
	gulp.watch ['./lib/*.coffee'], ['coffee']

gulp.task 'default', ['coffee', 'watch-coffee']