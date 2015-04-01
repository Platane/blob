/* global AudioContext, webkitAudioContext */

// promisify decodeAudioData
let decodeBuffer = ( context, buffer ) =>
    new Promise( ( resolve, reject ) => context.decodeAudioData( buffer , resolve ) )


// instanciate the source buffer and connect it to the context destination
let bindAudioBuffer = function( audioBuffer ){

    let context = this._ctx

    // create a source buffer
    let source = this._src = context.createBufferSource()

    // bind the audio buffer
    source.buffer = audioBuffer

    // wire the destination ( ie output sound )
    source.connect( context.destination )
}



export class SoundPlayer {

    constructor(){

        // instanciate the context
        let context = this._ctx = new ( AudioContext || webkitAudioContext )()

    }

    bindBuffer( buffer ) {

        return decodeBuffer( this._ctx, buffer )
        .then( bindAudioBuffer.bind( this ) )

    }

    bindStream( stream ) {

        // TODO
        //createMediaStreamSource(stream)

        //return decodeBuffer( this._ctx, buffer )
        //.then( bindAudioBuffer.bind( this ) )

    }

    play() {
        this._src.start(0)
    }
}
