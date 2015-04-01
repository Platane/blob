
module.exports = function(){

    var app = require('express')()


    // static routing
    var ROOT_DIR = __dirname.replace(/\\/g, '/').split('/').slice(0,-1).join('/')

    app.get('/', function(req, res){
        res.status(200).sendFile( '/index.html', { root: ROOT_DIR } )
    })
    app.get('/build/app.js', function(req, res){
        res.status(200).sendFile( '/build/app.js', { root: ROOT_DIR } )
    })
    app.get('/sample.mp3', function(req, res){
        res.status(200).sendFile( '/sample.mp3', { root: ROOT_DIR } )
    })



    app.listen( process.env.PORT || 8080 )

}
