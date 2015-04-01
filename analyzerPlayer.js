import {SoundPlayer} from './player'
import {BeatAnalyser} from './beat'

let analyze = function( ){

    let buffer = this._analyzerBuffer

    // extract frequency
    this._analyzer.getByteFrequencyData( buffer )

    // tick the beat analyzer
    this.beat.nextBatch( buffer )

}

export class AnalyzerPlayer extends SoundPlayer {

    constructor(){

        super()

        let fftSize = 128

        /// instanciate a beat analyzer ( intended to be public )
        this.beat = new BeatAnalyser({
            nFreq: fftSize
        })


        // instanciate the processor
        this._analyzer = this._ctx.createAnalyser()
        this._analyzer.fftSize = fftSize
        this._analyzer.minDecibels = -90
        this._analyzer.maxDecibels = -10
        this._analyzer.smoothingTimeConstant = 0.85

        // instanciate this once ( save it for later use )
        this._analyzerBuffer = new Uint8Array( this._analyzer.frequencyBinCount )

        // connect to the destination
        this._analyzer.connect( this._ctx.destination )

    }

    bindBuffer( buffer ){

        return super.bindBuffer( buffer )

        .then( function(){

            this._analyzer.disconnect()
            this._src.disconnect()

            this._src.connect( this._analyzer )
            this._analyzer.connect( this._ctx.destination )

        }.bind( this ))

    }

    play(){

        super.play()

        // launch the analyzer loop
        let fn = analyze.bind( this )
        let cycle = function(){

            fn()

            requestAnimationFrame( cycle )
        }
        cycle()

    }

}
