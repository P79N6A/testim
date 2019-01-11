const gulp = require('gulp');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const zip = require('gulp-zip');
const version = "1.7";
//压缩 webim 和 webim_no_emotion
gulp.task('default', function() {


  gulp.src(['sdk/webim.js', 'sdk/webim_no_emotion.js'])
    .pipe(uglify())
    .pipe(rename(function(path) {
      path.dirname += "./sdk/";
      path.basename += ".min";
      path.extname = ".js"
    }))
    .pipe(gulp.dest('sdk'));

  gulp.src(['sdk/webim.js'])
    .pipe(gulp.dest("biggroup/mobile/sdk/"));


  gulp.src(['sdk*/*'])
    .pipe(gulp.dest("docs/IMSDK_V" + version));

  gulp.src(['css*/*', 'img*/*', 'fonts*/*', 'js*/*', 'sdk*/*', 'index.html'])
    .pipe(gulp.dest("docs/通用WebDemo_V" + version + "/WebDemo_v" + version + "/"));

  // gulp.src(['css','img','fonts','js'])
  //   .pipe(gulp.dest("biggroup/mobile/"));

  gulp.src(['biggroup/mobile/css*/*', 'biggroup/mobile/img*/*', 'biggroup/mobile/js*/*', 'biggroup/mobile/sdk*/*', 'biggroup/mobile/index.html'])
    .pipe(gulp.dest("docs/直播聊天室WebDemo_V" + version + "/"));

  gulp.src('docs/**')
    .pipe(zip('WEB_IMSDK.zip'))
    .pipe(gulp.dest('zip'));

});