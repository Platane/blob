var build = require("./build")
var fs = require('fs')

// launch the task
var run = function( task, label ){

    var s = Date.now()

    console.log('running '+label)

    return task()
    .then(function(){
        console.log('end '+label+' in '+(Date.now()-s)+'ms')
    })
    .then(null, function( err ){
        console.log(err.stack)
    })
}

// prevent the task for behind launched twice while it is not over yet
// state value is 0 if the task is not runing, the timestamp of the begin of the task if it has started, -1 if it started and must be relaunched right after
var state = {}
var preRun = function( task, label ){

    // will relaunch already
    if( state[ label ] == -1 )
        return

    // is running, check if it s a actual relaunch order or some kind of glitch ( watch called twice )
    if( state[ label ] > 0 ){
        if( Date.now() - state[ label ] > 300 )
            // will relaunch
            state[ label ] = -1
        return
    }

    // start running
    state[ label ] = Date.now()
    run( task, label )

    // at the end relaunch if needed, else set the state to idle
    .then( function(){
        if( state[ label ] == -1 ){

            state[ label ] = 0
            preRun( task, label )

        } else
            state[ label ] = 0
    })
}

// watch a dir rec is not working on windows, explore and watch every dir
var watchRec = function( dir, callback ){
    var open = [ dir ]
    var close = []

    while( open.length ){

        var p = open.shift()


        if( !fs.statSync(p).isFile() ){

            if( p == './node_modules' || p == './.git' || p == './build' )
                continue

            close.push( p )
            open = open.concat(
                fs.readdirSync( p )
                .map(function( x ){ return p+'/'+x } )
            )
        }
    }

    close.forEach(function( p ){
        fs.watch( p, {persistent: true, recursive: false}, callback )
    })
}

module.exports = function(){
    return new Promise(function(resolve,reject){

        watchRec( '.', preRun.bind( null, build , 'build') )

    })
}
