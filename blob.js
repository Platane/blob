



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

    var left = ( 0 | ( ox * dim.x ) )+1
    var right = ( 0 | ( ( ox + width ) * dim.x ) )-1
    var top = 0 | ( oy * dim.y )
    var bot = 0 | ( ( oy + height ) * dim.y )

    ctx.fillStyle = color

    //return

    for( var x=left; x<=right; x++ )
    for( var y=top; y<=bot; y++ )
    {
        var sum = 0

        for( var k=gaussOrigins.length; k--; )
            sum += gauss( ox+width/2, gaussOrigins[ k ], tau, x/dim.x, y/dim.y )

        if( sum < threshold )
            continue

        ctx.globalAlpha = Math.min(1 , ( sum - threshold ) * 80 )

        ctx.beginPath()
        ctx.rect( x, y, 1, 1 )
        ctx.fill()
    }

    // TODO use symetry
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
