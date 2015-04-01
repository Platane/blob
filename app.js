import {AnalyzerPlayer} from './analyzerPlayer'


// xhr request the sound file as buffer
let loadSound = function( url ){

    let request = new XMLHttpRequest()
    request.open( 'GET', url )
    request.responseType = 'arraybuffer'

    return new Promise(function( resolve, reject ){

        request.onload = () => resolve( request.response )

        request.send()
    })
}



// instanciate the soundPlayer
let soundPlayer = new AnalyzerPlayer()

loadSound( 'sample.mp3' )

.then( soundPlayer.bindBuffer.bind( soundPlayer ) )
.then( () => console.log('loaded, playing') )
.then( soundPlayer.play.bind( soundPlayer ) )


// error handling
.then( null, err => console.log( err.stack ) )


var drawF = (function(){
var canvas = document.createElement( 'canvas' )
document.body.appendChild( canvas )
var ctx = canvas.getContext( '2d' )
return function( beat ){
    var w = canvas.width = 1024
    var h = canvas.height = 512

    ctx.clearRect( 0, 0, w, h )
    ctx.fillStyle = '#000000'
    ctx.globalAlpha = 1


    var arr = beat.avgFreq
    var l = Math.min( arr.length, 64 )

    var maxVal = 255
    var minVal = 0

    for( var k = 0; k<l ; k++ ){

        ctx.beginPath()
        ctx.rect( k/l*w+1, (1-arr[ k ]/maxVal)*h, 1/l*w-2, arr[ k ]/maxVal*h )
        ctx.fill()
    }


    ctx.globalAlpha = 0.7
    var arr = beat.smoothInstantFreq

    for( var k = 0; k<l ; k++ ){


        ctx.fillStyle = k == 5 ? '#1237AE' : '#823234'
        ctx.beginPath()
        ctx.rect( k/l*w+3, (1-arr[ k ]/maxVal)*h, 1/l*w-6, arr[ k ]/maxVal*h )
        ctx.fill()
    }
}
})()


var drawC = (function(){
    var canvas = document.createElement( 'canvas' )
    document.body.appendChild( canvas )
    var ctx = canvas.getContext( '2d' )

    var avg=[]
    var inst=[]
    var key=5

    return function( beat ){
        var w = canvas.width = 2048
        var h = canvas.height = 256

        ctx.clearRect( 0, 0, w, h )



        avg.push( beat.avgFreq[ key ] )
        inst.push( beat.smoothInstantFreq[ key ] )

        var rx = w / Math.max( avg.length, 3000 )



        ctx.beginPath()
        ctx.moveTo(0,h)
        for( var k = 0; k<inst.length ; k++ ){
            ctx.lineTo( k*rx, (1-inst[k]/255)*h )
        }
        ctx.strokeStyle = '#1237AE'
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(0,h)
        for( var k = 0; k<avg.length ; k++ ){
            ctx.lineTo( k*rx, (1-avg[k]/255)*h )
        }
        ctx.strokeStyle = '#000000'
        ctx.stroke()
    }
})()


var cycle = function(){

    drawF( soundPlayer.beat )
    drawC( soundPlayer.beat )

    window.requestAnimationFrame( cycle )
}
cycle()
