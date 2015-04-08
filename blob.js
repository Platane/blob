



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
    ctx.fillStyle = `rgb(${stick.color.r},${stick.color.g},${stick.color.b})`

    for( var i = stick.blob.length; i--; )
        drawOneBlob( ctx, dim, stick.cx, stick.blob[ i ].cy, stick.blob[ i ].l, stickRadius )
}


var drawJonction = function( ctx, dim, ox, oy, width, height, gaussOrigins, tau, color, threshold ){


    let _width2 = ((width*dim.x)>>1 ) +1
    let _height2 = ((height*dim.y)>>1 ) +1

    let _cx = 0|(ox*dim.x) + _width2
    let _cy = 0|(oy*dim.y) + _height2

    // extract imageData
    let imageData = ctx.getImageData( _cx-_width2, _cy-_height2, _width2*2, _height2*2 )

    let x, y, sum, k, j

    for( x=0; x<_width2; x++ )
    for( y=0; y<_height2; y++ )
    {
        sum = 0

        for( j=gaussOrigins.length; j--; )
            sum += gauss( 0, gaussOrigins[ j ] - _cy/dim.y, tau, x/dim.x, y/dim.y )


        let alpha = sum < threshold ? 0 : Math.min( Math.max( 0.75, (sum - threshold)*80 ), 1 )* 255

        // top right
        k = (( _width2 + x ) + ( _height2 + y ) * imageData.width ) * 4
        imageData.data[ k   ] = color.r
        imageData.data[ k+1 ] = color.g
        imageData.data[ k+2 ] = color.b
        imageData.data[ k+3 ] = alpha

        // top left
        k = k - x * 8
        imageData.data[ k   ] = color.r
        imageData.data[ k+1 ] = color.g
        imageData.data[ k+2 ] = color.b
        imageData.data[ k+3 ] = alpha

        // bot left
        k = k - y * 8 * imageData.width
        imageData.data[ k  ] = imageData.data[ k+1 ] = imageData.data[ k+2 ] = 128
        imageData.data[ k   ] = color.r
        imageData.data[ k+1 ] = color.g
        imageData.data[ k+2 ] = color.b
        imageData.data[ k+3 ] = alpha

        // bot left
        k = k + x * 8
        imageData.data[ k  ] = imageData.data[ k+1 ] = imageData.data[ k+2 ] = 128
        imageData.data[ k   ] = color.r
        imageData.data[ k+1 ] = color.g
        imageData.data[ k+2 ] = color.b
        imageData.data[ k+3 ] = alpha

    }

    ctx.putImageData( imageData, _cx-_width2, _cy-_height2 )

}

/**
 * draw all the jonctions between the blobs of the stick
 */
var drawBlobyJonction = function( ctx, dim, stick, stickRadius, tau ){

    var azone = computeActiveZone( stickRadius, tau, 0.03 )

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
