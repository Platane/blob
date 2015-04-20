var u=require('./point')


// enable to display some stuff
const degug = !true


const epsylon = 0.001

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
    ctx.fill()
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

var _stat = {
    nPoint:0,
    nPointMax:0,
    nPointMin:0,
    generation:0,
}
var _dim
var _ctx
let computeGaussLine = (function(){


    let isInside = function( gaussx, gaussOrigins, tau, threshold, x, y ){
        let sum=0
        for(var k=gaussOrigins.length; k--;)
            sum+=gauss( gaussx, gaussOrigins[k], tau, x, y )
        return !(sum / threshold << 0 )
    }

    // the point at the threshold value on the line o +t*v
    let pointOnTheshold = function( o, v, gaussx, gaussOrigins, tau, threshold, phy ){



        let t=phy
        let t_min=phy*0.02

        let alpha
        let inside
        let has_inside=false
        let has_outside=false

        while ( t>t_min ){


            inside = isInside( gaussx, gaussOrigins, tau, threshold, o.x, o.y )

            has_inside = has_inside || ( inside == true )
            has_outside = has_outside || ( inside == false )

            // is the point inside?
            // yes => alpha = 1
            // no => alpha = -1
            alpha = ( inside << 1 )-1


            _ctx.beginPath()
            _ctx.arc( o.x, o.y, Math.sqrt(t)*0.03, 0, Math.PI*2 )
            if ( isInside( gaussx, gaussOrigins, tau, threshold, o.x, o.y )){
                _ctx.fillStyle='red'
            }else{
                _ctx.fillStyle='blue'
            }
            _ctx.fill()


            alpha *= t
            o.x += alpha*v.x
            o.y += alpha*v.y

            t = t/2
        }

        // may not be a solution
        // besauce is not inside a inside/outside intervalle
        if ( !has_inside || !has_outside ){
            _ctx.beginPath()
            _ctx.arc( o.x, o.y, 0.001, 0, Math.PI*2 )
            _ctx.fillStyle='purple'
            _ctx.fill()
        }
        return has_inside && has_outside
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


        let phy=width*0.08
        let phy_min=phy/8

        let gaussx = ox+width/2


        let points=[]


        let e={x:0, y:0}
        let last={x:0, y:0}
        let v={x:0, y:0}
        let tmp_v={x:0, y:0}
        let n

        // first point
        last.x=ox
        last.y=oy
        points.push({ x:last.x, y:last.y })

        // first v
        v.x=0.5
        v.y=0.5
        u.normalize(v)

        // limit
        let limit={
            x:ox+width/2,
            y:oy+height/2,
        }

        // iterate
        while( last.x<limit.x && last.y<limit.y && phy>phy_min ){

            // compute the next o position
            e.x=last.x+v.x*phy
            e.y=last.y+v.y*phy

            // compute the tangente
            tmp_v.x= v.y
            tmp_v.y=-v.x

            // find the new point on threshold
            if ( !pointOnTheshold( e, tmp_v, gaussx, gaussOrigins, tau, threshold, phy )){

                // not found, retry with a smaller phy
                phy /= 2
                continue
            }

            // compute the next v
            tmp_v.x=e.x-last.x
            tmp_v.y=e.y-last.y

            n=u.norme( tmp_v )

            if (n>phy*1.4){
                // point is too far from the last
                // retry with a smaller phy
                phy /= 2
                continue
            }


            //prepare next loop
            v.x=tmp_v.x/n
            v.y=tmp_v.y/n

            last.x=e.x
            last.y=e.y

            // add it to the line
            points.push({ x:last.x, y:last.y })

        }


        return points
    }
})()

var drawJonction = function( ctx, dim, ox, oy, width, height, gaussOrigins, tau, color, threshold ){

    _ctx = ctx

    let c = {
        x: ox+width/2,
        y: oy+height/2
    }
    let line = function(e){
        ctx.lineTo( e.x-c.x, e.y-c.y ) }

    ctx.save()

    ctx.scale( dim.x, dim.y )

    // ctx.beginPath()
    // ctx.rect( ox-0.001, oy-0.001, width+2*0.001, height+2*0.001 )
    // ctx.fillStyle='#333'
    // ctx.fill()

    let points = computeGaussLine( ox, oy, width, height, gaussOrigins, tau, threshold )

    if (points[points.length-1].y<c.y)
        points.push({
            x: points[points.length-1].x,
            y: c.y,
        })
    points.push(c)

    ctx.beginPath()
    ctx.rect( ox, oy, width, height )
    ctx.clip()

    ctx.translate( c.x, c.y )


    // ctx.fillStyle=`rgb(${color.r},${color.g},${color.b})`
    ctx.strokeStyle=`rgb(${color.r},${color.g},${color.b})`
    ctx.lineWidth=1/dim.x

    let endPoint={
        x: 0,
        y: points[ points.length-1 ].y-c.y
    }

    ctx.beginPath()
    ctx.moveTo( 0, -height/2 )
    points.forEach(line)
    ctx.stroke()

    for(var k=points.length; k--;){
        ctx.beginPath()
        ctx.arc(  points[k].x-c.x, points[k].y-c.y , 0.005, 0, Math.PI*2 )
        ctx.fillStyle='orange'
        ctx.fill()
    }

    return ctx.restore()



    ctx.scale( 1, -1 )
    ctx.beginPath()
    ctx.moveTo( 0, -height/2 )
    points.forEach(line)
    ctx.fill()

    ctx.scale( -1, 1 )
    ctx.beginPath()
    ctx.moveTo( 0, -height/2 )
    points.forEach(line)
    ctx.fill()

    ctx.scale( 1, -1 )
    ctx.beginPath()
    ctx.moveTo( 0, -height/2 )
    points.forEach(line)
    ctx.fill()



    ctx.restore()

}

/**
 * draw all the jonctions between the blobs of the stick
 * determine the zone where blob overlap and delegate to drawJonction for the resolution
 */
var drawBlobyJonction = function( ctx, dim, stick, stickRadius, tau ){

    var azone = computeActiveZone( stickRadius, tau, epsylon )

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
