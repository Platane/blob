import {AnalyzerPlayer} from './analyzerPlayer'


// instanciate the soundPlayer
let soundPlayer = new AnalyzerPlayer()


// create the file input
;(function(){

    // TODO filter

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



import { drawStick } from './blob'
var drawS = (function(){
    var canvas = document.createElement( 'canvas' )
    canvas.setAttribute('id', 'blob')
    document.body.appendChild( canvas )
    var ctx = canvas.getContext( '2d' )

    var tau = 0.056
    var stickRadius = 0.051
    var sticks = [
        {
            color: '#126392',
            cx: 0.5,
            blob:[
                { cy: 0.3, l:0.1 },
                { cy: 0.5, l:0.023 },
            ]
        },
        {
            color: '#486ed1',
            cx: 0.35,
            blob:[
                { cy: 0.6, l:0.03 },
                { cy: 0.5, l:0.02 },
            ]
        },
        {
            color: '#4ed153',
            cx: 0.65,
            blob:[
                { cy: 0.4, l:0.03 },
                { cy: 0.5, l:0.01 },
            ]
        }
    ]


    var h = canvas.height = 250
    var w = canvas.width = 250

    let t=0

    return function( beat ){


        t++

        sticks[ 0 ].blob[ 0 ].l = Math.sin( t * 0.01 ) * 0.06 + 0.1
        sticks[ 0 ].blob[ 0 ].cy = Math.sin( t * 0.07 ) * 0.1 + 0.5

        sticks[ 2 ].blob[ 0 ].cy = Math.sin( t * 0.05 ) * 0.15 + 0.7

        sticks[ 1 ].blob[ 0 ].cy = Math.sin( t * 0.05 + 2.98 ) * 0.15 + 0.7

        ctx.clearRect( 0, 0, w, h )
        for( let i = sticks.length; i--; )
            drawStick( ctx, {x: w, y: h}, sticks[ i ], stickRadius, tau )

    }
})()

var cycle = function(){

    try{
    drawF( soundPlayer.beat )
    drawC( soundPlayer.beat )
    drawLk( soundPlayer.beat )
    drawS()

    }catch( e ){
        console.log( e.stack )
    }
    window.requestAnimationFrame( cycle )
}

drawS()
