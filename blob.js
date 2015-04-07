



var computeThreshold = function( stickRadius, tau ){
    return gauss( 0, 0, tau, 0, stickRadius )
}
var computeActiveZone = function( stickRadius, tau, epsylon ){
    return Math.sqrt( - 2 * Math.log( epsylon ) * tau*tau ) + stickRadius
}


// gauss fonction
var gauss = function( cx, cy, tau, x, y ){

    var xx = cx - x
    var yy = cy - y

    var d = ( xx*xx + yy*yy ) / ( tau * tau )

    return Math.exp( -0.5 * d  )
}


let gaussBuffer = (function(){
    let fillGaussBuffer = function( imgData, tau ){

        let data = imgData.data

        let k, x, y

        for( x=imgData.width; x--; )
        for( y=imgData.height; y--; ){

            k = ( x*imgData.height + y )<<2

            data[ k   ] = data[ k+1 ] = data[ k+2 ] = 0
            data[ k+3 ] = gauss( 0, 0, tau, x, y ) * 255
        }
    }
    let prepareGaussBuffer = function( _canvas ){

        let canvas = _canvas || document.createElement( 'canvas' )
        let w = canvas.width = canvas.height = 100

        let epsylon = 0.01
        let tau = w / Math.sqrt( - 2 * Math.log( epsylon ) )


        let ctx = canvas.getContext('2d')

        let id = ctx.getImageData( 0, 0, w, w )

        fillGaussBuffer( id, tau )

        ctx.putImageData( id, 0, 0 )

        return { canvas: canvas, tau: tau, w: w }
    }

    return prepareGaussBuffer(  )
})()





/**
 * draw one blob
 */
var drawOneBlob = function( ctx, dim, cx, cy, l, stickRadius ){
    ctx.beginPath()
    ctx.arc( cx*dim.x, (cy-l)*dim.y+1, stickRadius*dim.y, Math.PI, 0 )
    ctx.fill()
    ctx.beginPath()
    ctx.rect( cx*dim.x-stickRadius*dim.x, (cy-l)*dim.y, stickRadius*2*dim.x, l*2*dim.y)
    ctx.fill()
    ctx.beginPath()
    ctx.arc( cx*dim.x, (cy+l)*dim.y-1, stickRadius*dim.y, 0, Math.PI )
    ctx.fill()
}


/**
 * draw all the blobs of the stick
 */
var drawBodyStick = function( ctx, dim, stick, stickRadius ){
    ctx.fillStyle = stick.color

    for( var i = stick.blob.length; i--; )
        drawOneBlob( ctx, dim, stick.cx, stick.blob[ i ].cy, stick.blob[ i ].l, stickRadius )
}


var drawJonction = function( ctx, dim, ox, oy, width, height, gaussOrigins, tau, color, threshold ){

    ctx.fillStyle = color

    //return

    let _ox = 0|(ox*dim.x)
    let _oy = 0|(oy*dim.y)

    let _width2 = (width*dim.x)>>1
    let _height2 = (height*dim.y)>>1

    for( var x=0; x<_width2; x++ )
    for( var y=0; y<_height2; y++ )
    {
        var sum = 0

        for( var k=gaussOrigins.length; k--; )
            sum += gauss( 0, gaussOrigins[ k ] - oy - height/2, tau, x/dim.x, y/dim.y )

        if( sum < threshold )
            continue

        ctx.globalAlpha = Math.max( 0.85, Math.min(1 , ( sum - threshold ) * 80 ) )


        // top right
        ctx.beginPath()
        ctx.rect( _ox + x + _width2, _oy + y + _height2, 1, 1 )
        ctx.fill()

        // top left
        ctx.beginPath()
        ctx.rect( _ox - x + _width2, _oy + y + _height2, 1, 1 )
        ctx.fill()

        // bot right
        ctx.beginPath()
        ctx.rect( _ox + x + _width2, _oy - y + _height2, 1, 1 )
        ctx.fill()

        // bot left
        ctx.beginPath()
        ctx.rect( _ox - x + _width2, _oy - y + _height2, 1, 1 )
        ctx.fill()
    }

    ctx.globalAlpha = 1
}

/**
 * draw all the jonctions between the blobs of the stick
 */
var drawBlobyJonction = function( ctx, dim, stick, stickRadius, tau ){

    var azone = computeActiveZone( stickRadius, tau, 0.005 )

    var blobs = stick.blob

    var threshold = computeThreshold( stickRadius, tau )

    var bot, top

    for( var i = blobs.length; i--; )
    for( var j = blobs.length; j--; )
    {

        if(  i != j && ( bot = blobs[ i ].cy - blobs[ i ].l ) - ( top = blobs[ j ].cy + blobs[ j ].l ) < azone && bot - top > 0 ){

            // contact
            drawJonction( ctx, dim, stick.cx-stickRadius, top, stickRadius*2, bot-top, [ bot, top ], tau, stick.color, threshold )
        }

    }

}


export function drawStick( ctx, dim, stick, stickRadius, tau ){

    drawBlobyJonction( ctx, dim, stick, stickRadius, tau )

    drawBodyStick( ctx, dim, stick, stickRadius )

}
