var browserify = require('browserify')
var babelify = require('babelify')
var fs = require('fs')


module.exports = function(){
    return new Promise(function( resolve, reject ){

        var stream = browserify({ debug: true })
          .transform(babelify)
          .require( './app.js', { entry: true })
          .bundle()
          .on('error', reject )
          .on('end', resolve )
          .pipe(fs.createWriteStream( './build/app.js' ));
    })
}
