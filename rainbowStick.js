/* jshint -W116, -E030 */
import { drawStick } from './blob'
import Color from 'color'

// some constant

// number of stick
const n = 1

// gooy value, larger value for larger goo area
// const tau = 0.045
const tau = 0.065

// the width of the stick ( set to fit best the screen, depending of the number of sticks )
const stickRadius = 1/n*0.4 *0.8* 0.2




// instanciate the stick array
let sticks = Array.apply(null, Array(n))
    // for each value of a n length array, return the object
    .map( ( _ , i ) => ({

        // cx is the position horizontal
        cx: (i+1)/(n+1),

        // the color as constant value and saturation and hue grows along the index
        color: Color().hsv( ((i/n) * 360 + 90) % 360, 90, 90 ).rgb(),

        // the blob array is longuer and for an index close to the midle of the array
        blob: Array.apply(null, Array( Math.ceil( (1-Math.abs(0.5-i/n))*4) ))

            // return the object
            .map( ( ) => ({

                // vertical position, random
                cy: Math.random()*0.6+0.3,

                // vertical length, random
                l: Math.random()*0.01
            })
            ),
    })
    )


// init the canvas
var canvas = document.createElement( 'canvas' )
canvas.setAttribute('id', 'blob')
document.body.appendChild( canvas )
var ctx = canvas.getContext( '2d' )
var h = canvas.height = 500
var w = canvas.width = 500


// for each blob in each stick, create a function with custom param to animate randomly
let posFn = sticks.map( (s, i) =>
        s.blob.map( function(){
                let y = (Math.random() -0.5) * 2 * (1-Math.abs(0.5-i/n)) * 0.4 + 0.5
                let A = ( Math.random() * 0.4 + 0.6 ) * (1-Math.abs(0.5-i/n)) * 0.3
                let w = 3.14 * 5 * ( Math.random() * 0.4 + 0.6 )
                let tau = 3.14 * 2 * Math.random()

                // 0 < x < 1
                return function position( x ){
                    return y + A * Math.sin(x*w+tau)
                }
            })
        )

// mouse the blob on mousemove
document.body.addEventListener( 'mousemove', function( event ){
    let x = event.pageX / window.innerWidth

    // apply the position function for each blob
    sticks.forEach( ( s, i ) =>
        s.blob.forEach( ( b , j )=>
            b.cy = posFn[ i ][ j ]( x )
        )
    )
})


// track the fps ( with stat.js)
let stats = {
    // mock the object until the lib is loaded
    begin: function(){},
    end: function(){},
}
window.onload = function(){
    if( window.Stats ){
        stats = new window.Stats()
        stats.domElement.style.position = 'absolute'
        stats.domElement.style.right = '0px'
        stats.domElement.style.bottom = '0px'
        document.body.appendChild( stats.domElement )
    }
}

// animation loop
let t=0
let cycle = function(){

    t++

    ctx.clearRect( 0, 0, w, h )

    // track the sticks redraw
    stats.begin()
    for( let i = sticks.length; i--; )
        drawStick( ctx, {x: w, y: h}, sticks[ i ], stickRadius, tau )
    stats.end()

    // loop
    window.requestAnimationFrame( cycle )
}

// start the loop
cycle()
