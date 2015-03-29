
var gauss = function( cx, cy, tau, x, y ){

    var xx = cx - x
    var yy = cy - y

    var d = ( xx*xx + yy*yy ) / ( tau * tau )

    if ( d > 10 )
        return 0
    else if ( d < 1.4 )
        return 1
    else
        return Math.exp( -0.5 * d  )
}

var gaussStick = function( cx, cy, tau, l, x, y ){

    var xx = cx - x
    var yy = cy - y

    if( Math.abs( yy ) < l ){

        var d = ( xx*xx ) / ( tau * tau )

        return Math.exp( -0.5 * d )
    } else {

        yy += - ( Math.abs( yy ) / yy ) * l

        var d = ( xx*xx + yy*yy ) / ( tau * tau )

        return Math.exp( -0.5 * d )
    }
}

var valueAt=  function(x,y){
    var v = 0
    for( var i = blob.length; i--; ){
        var u = blob[ i ]
        v += gaussStick( u.x, u.y, u.tau, u.l, x, y)
    }
    return v
}

var thresholdValueAt = function(x,y){
    return 1-valueAt( x,y )
    return valueAt( x,y ) < 0.5  ? 1 : 0
}


var blob = [
    {x: 100, y: 100, tau:20, l:10},
    {x: 100, y: 180, tau:20, l:10},
]







var draw
;(function(){
    var canvas = document.createElement( 'canvas' )
    document.body.appendChild( canvas )
    var ctx = canvas.getContext( '2d' )
    draw = function( maxW, maxH, fnValue ){

        var w = canvas.width = 350
        var h = canvas.height = 350


        var r = Math.max( maxW/w , maxH/h )

        var imgData = ctx.getImageData( 0, 0, w, h )
        var arr = imgData.data


        var x, y, e, k
        for(var i = w; i-- ;)
        for(var j = h; j-- ;)
        {
            x = i * r
            y = j * r

            k = (i*w + j)<<2

            e = fnValue( y, x )

            arr[ k ] = arr[ k+1 ] = arr[ k+2 ] = 0|(e * 255)
            arr[ k+3 ] = 255
        }

        ctx.putImageData( imgData, 0, 0 )
    }
})()



var cycle
;(function(){

    var sin = function( c, A, w, phy, t ){
        return c + A * Math.sin( w * t + phy )
    }

    var rand = function( a, b ){
        return Math.random() * ( b-a ) + a
    }

    var posFn = blob.map( function(){

        var fx = sin.bind( null, rand( 50, 150 ), rand( 10, 80 ), rand( 0.01, 0.06 ), rand(0, 6.28)  )
        var fy = sin.bind( null, rand( 50, 150 ), rand( 10, 80 ), rand( 0.01, 0.06 ), rand(0, 6.28)  )

        return function( t ){
            return {
                x: fx( t ),
                y: fy( t )
            }
        }
    })



    var t = 0
    cycle = function(){

        t++

        blob[ 0 ].l = Math.sin( t * 0.07 ) * 10 + 10
        blob[ 0 ].y = Math.sin( t * 0.07 ) * 10 + 100


        stats.begin()
        draw( 200, 200, thresholdValueAt )
        stats.end()

        window.requestAnimationFrame( cycle )
    }

})()




var stats
window.onload = function(){

    var domE = document.createElement('span')
    domE.style.position = 'absolute';
    domE.style.right = '0px';
    domE.style.bottom = '50px';

    document.body.appendChild( domE );

    var displaySize = function(){
        domE.innerHTML = window.innerWidth+' x '+window.innerHeight
    }

    if( window.Stats ){
        stats = new Stats();

        stats.domElement.style.position = 'absolute';
        stats.domElement.style.right = '0px';
        stats.domElement.style.bottom = '0px';

        document.body.appendChild( stats.domElement );

        var _begin = stats.begin
        stats.begin = function(){
            displaySize()
            _begin.call( this )
        }
    } else {

        // mock
        stats = {
            begin: function(){ displaySize() },
            end: function(){},
        }
    }


    // start loop
    cycle()

}
