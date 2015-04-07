
import { fourier } from 'fourier'

let defaultConfig = {

    nFreq : 32,

    windowSize : 512

}

let average = function( arr, start=0, end=0 ){
    let sum = 0
    end = end || ( arr.length - start )
    for( let i=start; i<end; i++ )
        sum += arr[ i ]
    return sum / ( end-start )
}
let variance = function( arr, start=0, end=0 ){
    let e = 0
    let esquare = 0

    end = end || ( arr.length - start )
    for( let i=start; i<end; i++ ){
        e += arr[ i ]
        esquare += arr[ i ] * arr[ i ]
    }
    e /= ( end-start )
    esquare /= ( end-start )

    return esquare - e*e
}
/**
 * return a number which is bigger when the signal seems to look like following the expected period ( T )
 *
 * do mean comparaison
 */
let curveLikehood = function( expectedT, channel ){

    const nPeriod = 2

    let avgWidth = expectedT * nPeriod

    // compute the avg
    let avgs = []

    let k = ( channel.length / avgWidth ) << 0
    let end = channel.length
    while( k-- ){
        let s = end - avgWidth
        avgs[ k ] = average( channel, s, end )
        end = s
    }


    return variance( avgs ) / average( avgs )
}


let nextBatch = function( buffer ){

    // copy output
    for( var i=buffer.length; i--; )
        this.instantFreq[ i ] = buffer[ i ]


    // shift the window
    for( var i=this._windows.length; i--; ){
        if( this._windows[ i ].length > this._config.windowSize )
            this._windows[ i ].shift()

        this._windows[ i ].push( buffer[ i ] )
    }

    // compute the average
    for( var i=this._windows.length; i--; )
        this.avgFreq[ i ] = average( this._windows[ i ] )

    // compute the smooth
    let h=5
    for( var i=this._windows.length; i--; )
        this.smoothInstantFreq[ i ] = average( this._windows[ i ], Math.max( this._windows[ i ].length - h, 0 ), this._windows[ i ].length )

    // compute best channel
    this.relevantness = this._windows.map( curveLikehood.bind( null, this.instantT ) )

    let bestChannel = this._windows[ 31 ]

    let img = []
    for( let i = bestChannel.length; i--; )
        img.push( 0 )
    // /let r = fourier.fft( bestChannel, img )

}

export class BeatAnalyser {

    constructor( config ){


        this._config = config || {}
        for( var i in defaultConfig )
            this._config[ i ] = this._config[ i ] || defaultConfig[ i ]


        // avg amplitude for each frequency ( computed on a sliding window )
        this.avgFreq = new Buffer( this._config.nFreq )

        this.smoothInstantFreq = new Buffer( this._config.nFreq )

        this.instantFreq = new Buffer( this._config.nFreq )

        this.relevantness = new Buffer( this._config.nFreq )

        this.instantT = 100

        // save all the point in a sliding window for computation
        this._windows = []



        for( var k=this._config.nFreq; k--; )
            this._windows.push( [] )
    }

    nextBatch( buffer ){
        nextBatch.call( this, buffer )
    }
}
