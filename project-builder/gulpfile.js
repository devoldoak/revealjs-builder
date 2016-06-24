// Required
const gulp  = require('gulp'),
  connect   = require('gulp-connect'),
  zip       = require('gulp-zip'),
  filter    = require('gulp-filter'),
  wrap      = require('gulp-wrap'),
  concat    = require('gulp-concat'),
  clone     = require('gulp-clone'),
  rename    = require('gulp-rename'),
  fs        = require('fs'),
  es        = require('event-stream'),
  template  = require('gulp-template'),
  gutil     = require('gulp-util');

// Paths
const source = './resources'; // work folder
const target = './assets'; // target folder

// Read RevealJS script Templates
var masterScriptRJS, clientScriptRJS, workScriptRJS = '';
const socketIOToken = JSON.parse(fs.readFileSync(source + '/token/socketio.token'));
const dockerHost =  process.env.DOCKER_HOST_IP;
const dockerHostPortSocketIO = process.env.DOCKER_HOST_PORT_SOCKETIO;

// ----- Tasks
// -- Start WebServer
gulp.task('connect', function() {
    // For Slide preview
    connect.server({
        root: target + '/site',
        host: '0.0.0.0',
        port: 8080,
        livereload: true
    });
    // For Package download
    connect.server({
        root: 'target',
        host: '0.0.0.0',
        port: 8081
    });
});

// -- Copy RevealJS Src
gulp.task('copy-revealjs', function () {
    var revealjsDirectory = 'build/resources/revealjs/';

    return gulp.src([revealjsDirectory + 'js/**', revealjsDirectory + 'lib/**', revealjsDirectory + 'plugin/**', revealjsDirectory + 'css/**'], {base: revealjsDirectory})
        .pipe(gulp.dest(target + '/site'));
});

// -- Watch for sources to update
gulp.task('watch', function () {
    gulp.watch([source + '/slides/*', source + '/templates/*'], ['build']);
});

// -- Package site for Container use
gulp.task('package', ['compile'], function () {
    return gulp.src([target + '/**', '!' + target + '/site/index.html', 'build/conf/docker-files/**'])
        .pipe(zip('package.zip'))
        .pipe(gulp.dest('target'));
});

// -- Compile source to a single revealjs file
gulp.task('compile', ['copy-revealjs', 'load-templates'], function () {
    // Filters
    const htmlFilter = filter('**/*.html', {restore: true});
    const mdFilter = filter('**/*.md', {restore: true});
    
    var defaultPipeline = gulp.src([source + '/slides/*.html', source + '/slides/*.md'])
                        // Process template for HMTL files
                        .pipe(htmlFilter) 
                        .pipe(wrap({src: source + '/templates/slide.html.tpl'}))
                        .pipe(htmlFilter.restore)  
                        // Process template for MD files
                        .pipe(mdFilter) 
                        .pipe(wrap({src: source + '/templates/slide.md.tpl'}))
                        .pipe(mdFilter.restore)
                        // Concat processing reslts
                        .pipe(concat('index.html'));

    // Master templating process
    var masterPipeline = defaultPipeline
                        .pipe(clone())
                        .pipe(wrap({src: source + '/templates/index.html.tpl'}, {revealjs: masterScriptRJS}))
                        .pipe(rename("master.html"));
    // Slave templating process
    var clientPipeline = defaultPipeline
                        .pipe(clone())
                        .pipe(wrap({src: source + '/templates/index.html.tpl'}, {revealjs: clientScriptRJS}))
                        .pipe(rename("client.html"));
    // Work templating process
    var workPipeline = defaultPipeline
                        .pipe(wrap({src: source + '/templates/index.html.tpl'}, {revealjs: workScriptRJS}));

    return es.merge(masterPipeline, clientPipeline, workPipeline)
                        .pipe(gulp.dest(target + '/site'))
                        // Notify reload
                        .pipe(connect.reload());
});

// -- Write Templates
gulp.task('write-templates', function () {

    var pipeline = gulp.src(source + '/templates/*.js.tpl')
                    .pipe(template({socketIOToken: socketIOToken, dockerHost: dockerHost, dockerHostPortSocketIO: dockerHostPortSocketIO}))
                    .pipe(gulp.dest(source + '/templates/compiled'));

    return pipeline;
});

// -- Load Templates
gulp.task('load-templates', ['write-templates'], function () {

    masterScriptRJS = fs.readFileSync(source + '/templates/compiled/master.js.tpl').toString();
    clientScriptRJS = fs.readFileSync(source + '/templates/compiled/client.js.tpl').toString();
    workScriptRJS = fs.readFileSync(source + '/templates/compiled/work.js.tpl').toString();
});

gulp.task('build', ['copy-revealjs', 'compile', 'package']);
gulp.task('serve', ['watch', 'connect']);
gulp.task('generate-templates', ['write-templates', 'load-templates'])
gulp.task('default', ['serve', 'generate-templates', 'build']);
