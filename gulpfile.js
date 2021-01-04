/* eslint-disable no-undef */
'use strict';

const SASS_OUTPUT_STYLE = 'compressed';  // 'expanded' or 'compressed'

const gulp = require('gulp');
const $ = require('gulp-load-plugins')({ pattern: ['gulp-*'] });

const plumberOptions = {
	errorHandler: function (err) {
		console.log(err.messageFormatted);
		this.emit('end');
	}
};


gulp.task('js', () => gulp.src('src/js/**/[^_]*.js')
	.pipe($.plumber(plumberOptions))
	.pipe($.sourcemaps.init())
	.pipe($.include())
	.pipe($.babel())
	.pipe($.terser())
	.pipe($.rename({ extname: '.min.js' }))
	.pipe($.sourcemaps.write('.'))
	.pipe(gulp.dest('./dist'))
	.pipe(gulp.dest('./docs'))
);

gulp.task('sass', () => gulp.src(['src/sass/**/[^_]*.scss'])
	.pipe($.plumber(plumberOptions))
	.pipe($.sourcemaps.init())
	.pipe($.dartSass({ outputStyle: SASS_OUTPUT_STYLE }))
	.pipe($.autoprefixer({ remove: false }))
	.pipe($.rename({ extname: '.min.css' }))
	.pipe($.sourcemaps.write('.'))
	.pipe(gulp.dest('./dist'))
	.pipe(gulp.dest('./docs'))
);

gulp.task('watch', () => {
	gulp.watch('src/js/**/*.js', gulp.series('js'));
	gulp.watch('src/sass/**/*.scss', gulp.series('sass'));
});

gulp.task('build', gulp.parallel('js', 'sass'));

gulp.task('default', gulp.series('build', 'watch'));
