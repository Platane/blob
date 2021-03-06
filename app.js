import {AnalyzerPlayer} from './analyzerPlayer'


// instanciate the soundPlayer
let soundPlayer = new AnalyzerPlayer()


// create the file input
;(function(){

    // TODO filter file type

    // read the file as bufferArray
    let readFile = function( file ){

        let reader = new FileReader()

        return new Promise( function( resolve, reject ){

            reader.onload = () => resolve( reader.result )

            reader.onError = reject

            reader.readAsArrayBuffer( file )
        })
    }

    // read the file, load it into the player, play
    let processFile = ( file ) => readFile( file )
            .then( soundPlayer.bindBuffer.bind( soundPlayer ) )
            .then( () => console.log('playing  ..') )
            .then( soundPlayer.play.bind( soundPlayer ) )
            .then( cycle )

            .then( null, err => console.log( err.stack ) )

    // input button event handler
    let dom = document.createElement('input')
    dom.setAttribute('type', 'file')
    dom.setAttribute('style', 'display:block;')
    document.body.appendChild( dom )
    dom.addEventListener('change', (event) => processFile( event.target.files[0] ) )


    // drag and drop handler
    document.body.addEventListener('drop', function(event) {
        processFile( event.dataTransfer.files[0] )
        event.preventDefault()
        event.stopPropagation() })

    document.body.addEventListener('dragover', function(event) {
        event.preventDefault()
        event.stopPropagation()  })
})()


const key=31

/**
 * draw the instant frequencies on a canvas
 *
 * @param beat {beat} the beat object
 */
var drawF = (function(){
    var canvas = document.createElement( 'canvas' )
    canvas.setAttribute('id', 'freq')
    document.body.appendChild( canvas )
    var ctx = canvas.getContext( '2d' )

    return function( beat ){
        var w = canvas.width = 1024
        var h = canvas.height = 400

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
        var arr = beat.instantFreq

        for( var k = 0; k<l ; k++ ){


            ctx.fillStyle = k == key ? '#1237AE' : '#823234'
            ctx.beginPath()
            ctx.rect( k/l*w+3, (1-arr[ k ]/maxVal)*h, 1/l*w-6, arr[ k ]/maxVal*h )
            ctx.fill()
        }
    }
})()


/**
 * ..
 *
 * @param beat {beat} the beat object
 */
var drawLk = (function(){

    var canvas = document.createElement( 'canvas' )
    canvas.setAttribute('id', 'lk')
    document.body.appendChild( canvas )
    var ctx = canvas.getContext( '2d' )
    return function( beat ){

        var w = canvas.width = 1024
        var h = canvas.height = 80

        ctx.clearRect( 0, 0, w, h )
        ctx.fillStyle = '#000000'
        ctx.globalAlpha = 1


        var arr = beat.avgFreq
        var l = Math.min( arr.length, 64 )
        var maxVal = 3

        var arr = beat.relevantness

        for( var k = 0; k<l ; k++ ){

            ctx.fillStyle = k == key ? '#1237AE' : '#823234'

            ctx.beginPath()
            ctx.rect( k/l*w+3, (1-arr[ k ]/maxVal)*h, 1/l*w-6, arr[ k ]/maxVal*h )
            ctx.fill()
        }
    }
})()


/**
 * draw the mean power over time, for a given constant
 *
 * @param beat {beat} the beat object
 */
var drawC = (function(){
    var canvas = document.createElement( 'canvas' )
    canvas.setAttribute('id', 'curve')
    document.body.appendChild( canvas )
    var ctx = canvas.getContext( '2d' )

    var avg=[]
    var inst=[]

    return function( beat ){
        var w = canvas.width = 1024
        var h = canvas.height = 200

        ctx.clearRect( 0, 0, w, h )
        ctx.lineWidth = 0.5


        avg.push( beat.avgFreq[ key ] )
        inst.push( beat.smoothInstantFreq[ key ] )

        var rx = w / Math.max( avg.length, 3000 )


        ctx.beginPath()
        ctx.rect( avg.length*rx - rx*beat._config.windowSize , (1-avg[ avg.length-1 ]/255)*h -30, rx*beat._config.windowSize, 60   )
        ctx.strokeStyle = '#a14294'
        ctx.stroke()


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

// render loop of the charts
var cycle = function(){

    try{
        drawF( soundPlayer.beat )
        drawC( soundPlayer.beat )
        drawLk( soundPlayer.beat )

    }catch( e ){
        console.log( e.stack )
    }
    window.requestAnimationFrame( cycle )
}







// stuff about the bloby stick drawing
import {} from './rainbowStick'
