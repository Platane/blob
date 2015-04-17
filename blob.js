var u=require('./point')


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



/**
 * draw one stick body
 */
var drawOneBlob = function( ctx, dim, cx, cy, l, stickRadius ){
    ctx.beginPath()
    // ctx.arc( cx*dim.x, (cy-l)*dim.y+1, stickRadius*dim.y, Math.PI, 0 )
    ctx.fill()
    ctx.beginPath()
    ctx.rect( cx*dim.x-stickRadius*dim.x, (cy-l)*dim.y, stickRadius*2*dim.x, l*2*dim.y)
    ctx.stroke()
    ctx.beginPath()
    // ctx.arc( cx*dim.x, (cy+l)*dim.y-1, stickRadius*dim.y, 0, Math.PI )
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

var _dim
var _ctx
let computeGaussLine = (function(){


    const phy=0.04


    let first_t=phy*1.2

    let isInside = function( gaussx, gaussOrigins, tau, threshold, x, y ){
        let sum=0
        for(var k=gaussOrigins.length; k--;)
            sum+=gauss( gaussx, gaussOrigins[k], tau, x, y )
        return !(sum / threshold << 0 )
    }

    // the point at the threshold value on the line o +t*v
    let pointOnTheshold = function( o, v, gaussx, gaussOrigins, tau, threshold ){

        let t=first_t
        let alpha=1
        while ( t>phy/40 ){

            // is the point inside?
            // yes => alpha = 1
            // no => alpha = -1
            alpha = ( isInside( gaussx, gaussOrigins, tau, threshold, o.x, o.y ) << 1 )-1

            _ctx.beginPath()
            _ctx.arc( o.x*_dim.x, o.y*_dim.y, _dim.x*Math.sqrt(t)*0.05, 0, Math.PI*2 )
            if ( isInside( gaussx, gaussOrigins, tau, threshold, o.x, o.y )){
                _ctx.fillStyle='red'
            }else{
                _ctx.fillStyle='blue'
            }
            _ctx.fill()


            o.x += alpha*t*v.x
            o.y += alpha*t*v.y

            t = t/2
        }
    }

    return function( ox, oy, width, height, gaussOrigins, tau, threshold ){


        //                        /
        //                   /
        //               3
        //            /
        //         /
        //       2
        //      /
        //     /
        //    1-------------------------x
        //    (ox, oy)                 (ox+width/2, gaussOrigins[0]=oy)


        let gaussx = ox+width/2


        let points=[]


        let e={x:0, y:0}
        let last={x:0, y:0}
        let v={x:0, y:0}

        // first point
        e.x=ox
        e.y=oy
        points.push({ x:e.x, y:e.y })

        // in order to have the first tangete set as ...
        last.x=e.x-0.5
        last.y=e.y-0.5


        // limit
        let limit={
            x:ox+width/2,
            y:oy+height/2,
        }

        // iterate
        while( e.x<limit.x && e.y<limit.y ){

            // compute the next v
            v.x=e.x-last.x
            v.y=e.y-last.y
            u.normalize(v)

            // compute the next o position
            e.x=e.x+v.x*phy
            e.y=e.y+v.y*phy

            // compute the next tangente
            let tmp = v.y
            v.y = -v.x
            v.x = tmp

            // find the new point on threshold
            pointOnTheshold( e, v, gaussx, gaussOrigins, tau, threshold )

            // add it to the line
            points.push({ x:e.x, y:e.y })

            last = points[ points.length-2 ]

            if (points.length>3)
                break
        }


        return points
    }
})()

var drawJonction = function( ctx, dim, ox, oy, width, height, gaussOrigins, tau, color, threshold ){

    _dim = dim
    _ctx = ctx

    var points = computeGaussLine( ox, oy, width, height, gaussOrigins, tau, threshold )

    var pointss = [
        {x:0, y:0},
        {x:0.5, y:0},
        {x:0.7, y:0.4},
        {x:0.8, y:0.4},
    ]

    ctx.save()
    // ctx.scale( dim.x, dim.y )
    ctx.beginPath()
    points.forEach(function(e, i){
        ctx[ i==0 ? 'moveTo' : 'lineTo' ]( e.x*dim.x, e.y*dim.y )
    })
    ctx.strokeStyle=`rgb(${color.r},${color.g},${color.b})`
    ctx.stroke()
    ctx.restore()

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
