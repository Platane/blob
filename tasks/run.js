require( './build' )()
.then(null, function( err ){
    console.log(err.stack)
})

require( './serve' )()


require( './watch' )()
.then(null, function( err ){
    console.log(err.stack)
})
