
// enable to display some stuff
const degug = !true

/**
 * compute the value k for which the blob looks like a circle ( with stickradius as radius ) for a given tau param
 * meaning the point ( p ) for which gauss( p ) < k form a circle
 *
 * @private
 */
var computeThreshold = function( stickRadius, tau ){
    return gauss( 0, 0, tau, 0, stickRadius )
}

/**
 * compute the minimal distance d of interaction between two blob
 * meaning that if the distant between the two blob is lower that d, the blob does not form a perfect circle ( one influence the other )
 *
 * @private
 *
 * @param stickRadius   {number}    the radius of both blob when they are perfect circle
 * @param tau           {number}    the tau param of both blob
 * @param epsylon       {number}    if the variantion of the blob in inferior to this value, the blob is considered unchanged
 *
 */
var computeActiveZone = function( stickRadius, tau, epsylon ){
    return Math.sqrt( - 2 * Math.log( epsylon ) * tau*tau ) + stickRadius
}


// 2d gauss fonction
var gauss = function( cx, cy, tau, x, y ){

    var xx = cx - x
    var yy = cy - y

    var d = ( xx*xx + yy*yy ) / ( tau * tau )

    return Math.exp( -0.5 * d  )
}


// instanciate a canvas with a 2 gauss function drawn, in order to speed up gauss sum ( not used yet )
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
 * draw one stick body
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
 * draw all the stick body
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


    if( degug ){
        ctx.clearRect( _cx-_width2+0.5, _cy-_height2+0.5, _width2*2, _height2*2 )

        ctx.save()
        ctx.strokeStyle = 'rgb(220,100,30)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.rect( _cx-_width2+0.5, _cy-_height2+0.5, _width2*2, _height2*2 )
        ctx.stroke()
        ctx.restore()
    }

    var _o = {
        x: ox*dim.x,
        y: oy*dim.y
    }
    var _d = {
        x: width/2*dim.x,
        y: width/2*dim.y
    }
    var _h = height*dim.y

    var r = (gaussBuffer.tau/gaussBuffer.w)/ tau /2

    ctx.save()
    ctx.translate( _o.x+_d.x, _o.y+_h  )

    ctx.drawImage( gaussBuffer.canvas, 0, -_h, _d.x*r, _d.y*r  )

    ctx.scale( 1,-1)
    ctx.drawImage( gaussBuffer.canvas, 0, 0, _d.x*r, _d.y*r  )

    ctx.restore()

    // return

    // extract imageData
    let imageData = ctx.getImageData( _cx-_width2, _cy-_height2, _width2*2, _height2*2 )

    let x, y, sum, k, j, alpha

    let th = 255*threshold

    for( x=0; x<_width2; x++ )
    for( y=0; y<_height2; y++ )
    {

        k = (( _width2 + x ) + ( _height2 + y ) * imageData.width ) * 4

        alpha = (0|imageData.data[ k+3 ] / th) * 255


        // top right
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
        imageData.data[ k   ] = color.r
        imageData.data[ k+1 ] = color.g
        imageData.data[ k+2 ] = color.b
        imageData.data[ k+3 ] = alpha

        // bot left
        k = k + x * 8
        imageData.data[ k   ] = color.r
        imageData.data[ k+1 ] = color.g
        imageData.data[ k+2 ] = color.b
        imageData.data[ k+3 ] = alpha

    }

    ctx.putImageData( imageData, _cx-_width2, _cy-_height2 )

}

/**
 * draw all the jonctions between the blobs of the stick
 * determine the zone where blob overlap and delegate to drawJonction for the resolution
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

    drawBodyStick( ctx, dim, stick, stickRadius )

    drawBlobyJonction( ctx, dim, stick, stickRadius, tau )

}
