/**
 * User: puti.
 * Time: 2020-03-30 17:02.
 */
var typedoc = require("gulp-typedoc");
gulp.task("typedoc", function() {
  return gulp
      .src(["src/**/*.ts"])
      .pipe(typedoc({
        module: "commonjs",
        target: "es5",
        out: "docs/",
        name: "Title"
      }))
      ;
});
