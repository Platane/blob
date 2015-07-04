var u=require('./point')


// enable to display some stuff
const debug = window && window.location && window.location.search.match(/debug/)

// used to compute the minimal distance for which the blob are different from two circles
const epsylon = 0.1
const epsylonActiveZone = 0.01


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

// for debug purpose
var _dim
var _ctx

/**
 * compute the line along the frontier between the inside/outise of the blobm for the top left quarter ( other can be found by symetry )
 * use vectorial approch
 *
 * @return array of point
 *
 */
let computeGaussLine = (function(){


    let isInside = function( gaussx, gaussOrigins, tau, threshold, x, y ){
        let sum=0
        for(var k=gaussOrigins.length; k--;)
            sum+=gauss( gaussx, gaussOrigins[k], tau, x, y )
        return !(sum / threshold << 0 )
    }

    /**
     * pointOnTheshold - compute the point that on the intersection of a line and the border of the blob
     *   use dichotomie, finda point inside, a point inside and reduce the intervalle
     *   assuming the blob is formed by severals gauss function, each aligned horizontaly, each withe the same tau
     *
     *  the param phy is an aproximation of the distance,
     *    notice that the algorithm will found the point only if the distance is in ] 0, 2 phy [
     *
     * @param {point} o                 a point of the line
     * @param {point} v                 the director vector of the line
     * @param {number} gaussx           the origin in x on the gauss functions
     * @param {array of number} gaussx  all the origins in y of the gauss functions
     * @param {number} tau              tau factor of the gauss functions
     * @param {number} threshold        threshold of the blob, delimit the border
     * @param {number} phy              unit which represent the aproximal distance t with o + t* v is the point
     * @param {number} precision        unit which represent the precision interval, at the end, the point is found with a certain precision ( good practice to make it function of phy )
     *
     * @return {boolean}     true if the point have been found, Also at the end the __point is stored in the o value__
     */
    let pointOnTheshold = function( o, v, gaussx, gaussOrigins, tau, threshold, phy, precision ){

        // use dichotomie to resolve t

        const t_min=precision
        let t=phy

        let alpha
        let inside

        // to the algorithm to valid, it must found a point ouside, and a point inside,
        // otherwise it can t be assumed that the point is solution
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


            alpha *= t
            o.x += alpha*v.x
            o.y += alpha*v.y

            t = t/2
        }

        // may not be a solution
        // besauce is not inside a inside/outside intervalle
        return has_inside && has_outside
    }

    if (debug)
        pointOnTheshold = function( o, v, gaussx, gaussOrigins, tau, threshold, phy, precision ){

            const t_min=precision
            let t=phy

            let alpha
            let inside

            let has_inside=false
            let has_outside=false

            let loopCounter=0


            _ctx.lineWidth = 0.0001
            _ctx.beginPath()
            // _ctx.moveTo(0,0)
            // _ctx.lineTo(0.1,0)
            _ctx.moveTo(o.x -v.x*0.03, o.y -v.y*0.03)
            _ctx.lineTo(o.x +v.x*0.03, o.y +v.y*0.03)
            _ctx.stroke()


            while ( t>t_min ){

                inside = isInside( gaussx, gaussOrigins, tau, threshold, o.x, o.y )

                _ctx.beginPath()
                _ctx.arc( o.x, o.y, Math.sqrt(t)*0.02, 0, Math.PI*2 )
                if ( inside ){
                    _ctx.fillStyle='red'
                }else{
                    _ctx.fillStyle='blue'
                }
                _ctx.fill()


                has_inside = has_inside || ( inside == true )
                has_outside = has_outside || ( inside == false )

                // is the point inside?
                // yes => alpha = 1
                // no => alpha = -1
                alpha = ( inside << 1 )-1

                alpha *= t
                o.x += alpha*v.x
                o.y += alpha*v.y

                t = t/2

                loopCounter ++
            }

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


        // phy is the estimated distance between two point,
        // should be fonction of the with ( which is a fair estimation of the radius of the blob quarter )
        let phy=width*0.08

        // phy may be reduced because a valid solution was not found with a greater phy,
        // when phy is smaller that this min value, stop trying and return the points already found
        let phy_min=phy/4

        let gaussx = ox+width/2

        let points=[]


        let e={x:0, y:0}
        let last={x:0, y:0}
        let v={x:0, y:0}
        let tmp_v={x:0, y:0}
        let n

        // find the first point, it the first point on the border on the horizontal line
        last.x=ox
        last.y=oy
        tmp_v.x=0
        tmp_v.y=-1
        pointOnTheshold( last, tmp_v, gaussx, gaussOrigins, tau, threshold, height/3, phy*0.02 )

        if (last.y -oy > height/2 ) {

            return [
                { x: ox, y: oy },
                { x: ox, y: oy+height/2 },
            ]

        }

        // first point
        points.push({ x:ox, y:oy })
        points.push({ x:last.x, y:last.y })

        // first v
        v.x=0.2
        v.y=0.7
        u.normalize(v)

        // limit of the quarter, break when the limit is exceed
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
            if ( !pointOnTheshold( e, tmp_v, gaussx, gaussOrigins, tau, threshold, phy, phy*0.02 )){
                // not found, retry with a smaller phy
                phy /= 2
                continue
            }

            // compute the next v
            tmp_v.x=e.x-last.x
            tmp_v.y=e.y-last.y

            n=u.norme( tmp_v )

            if (n>phy*1.6){
                // point is too far from the last
                // retry with a smaller phy
                // the 1.6 const is set to be greater that sqrt(2), so it accept a angle deviation of pi/4
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


        // treat the last point so it does not ecxeed the quarter
        if ( last.x>limit.x ){

            // take the point where last, last-1 intersect x = limit.x

            // v is still last-1  last
            n= (last.x-limit.x)/v.x

            last.x -= v.x*n
            last.y -= v.y*n
        }
        if ( last.y>limit.y ){

            // take the point where last, last-1 intersect y = limit.y

            // v is still last-1  last
            n= (last.y-limit.y)/v.y

            last.x -= v.x*n
            last.y -= v.y*n
        }

        points[points.length-1].x =last.x
        points[points.length-1].y =last.y

        return points
    }
})()

var drawJonction = function( ctx, dim, ox, oy, width, height, gaussOrigins, tau, color, threshold ){

    // expose for debug
    _ctx = ctx

    let c = {
        x: ox+width/2,
        y: oy+height/2
    }
    let line = function(e){
        ctx.lineTo( e.x-c.x, e.y-c.y ) }

    ctx.save()

    ctx.scale( dim.x, dim.y )

    let points = computeGaussLine( ox, oy, width, height, gaussOrigins, tau, threshold )

    // used for rasterization approximation in context draw
    let precision = 0.5/dim.x;

    // complete the path
    let last = points[points.length-1]
    if (last.x<c.x)
        points.push({
            x: last.x,
            y: c.y+precision
        },{
            x: c.x+precision,
            y: c.y+precision
        })
    else
        last.x += precision

    if ( debug ){
        ctx.beginPath()
        ctx.rect( ox, oy, width, height )
        ctx.lineWidth=1/dim.x
        ctx.stroke()
    }

    // clip
    ctx.beginPath()
    ctx.rect( ox, oy, width, height )
    ctx.clip()

    ctx.translate( c.x, c.y )


    ctx.fillStyle=`rgb(${color.r},${color.g},${color.b})`



    if (debug){
        ctx.save()
        ctx.lineStyle='black'
        ctx.lineWidth=0.5/dim.x

        ctx.moveTo(width/2 -c.x, -c.y)
        points.forEach(e =>
            ctx.lineTo(e.x-c.x, e.y-c.y)
        )
        ctx.stroke()

        ctx.restore()
        return ctx.restore()
    }




    ctx.beginPath()
    ctx.moveTo( -precision, -height/2 )
    points.forEach(line)
    ctx.fill()

    ctx.scale( 1, -1 )
    ctx.beginPath()
    ctx.moveTo( -precision, -height/2 )
    points.forEach(line)
    ctx.fill()

    ctx.scale( -1, 1 )
    ctx.beginPath()
    ctx.moveTo( -precision, -height/2 )
    points.forEach(line)
    ctx.fill()

    ctx.scale( 1, -1 )
    ctx.beginPath()
    ctx.moveTo( -precision, -height/2 )
    points.forEach(line)
    ctx.fill()



    ctx.restore()

}

/**
 * draw all the jonctions between the blobs of the stick
 * determine the zone where blob overlap and delegate to drawJonction for the resolution
 */
var drawBlobyJonction = function( ctx, dim, stick, stickRadius, tau ){

    var azone = computeActiveZone( stickRadius, tau, epsylonActiveZone )

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
