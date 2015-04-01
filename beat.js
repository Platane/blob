
let defaultConfig = {

    nFreq : 32,

    windowSize : 128

}



let nextBatch = function( buffer ){

    // copy output
    for( var i=buffer.length; i--; )
        this.instantFreq[ i ] = buffer[ i ]


    // shift the window
    for( var i=this._windows.length; i--; ){
        this._windows[ i ].shift()
        this._windows[ i ].push( buffer[ i ] )

    }

    // compute the average
    for( var i=this._windows.length; i--; ){

        let s = 0
        for( var k=this._windows[ i ].length; k--; )
            s += this._windows[ i ][ k ]
        s /= this._windows[ i ].length

        this.avgFreq[ i ] = s
    }

    // compute the smooth
    let h=10
    for( var i=this._windows.length; i--; ){

        let s = 0
        for( var k=this._windows[ i ].length - h ; k< this._windows[ i ].length; k++ )
            s += this._windows[ i ][ k ]
        s /= h

        this.smoothInstantFreq[ i ] = s
    }
}

export class BeatAnalyser {

    constructor( config ){


        this._config = config || defaultConfig

        // avg amplitude for each frequency ( computed on a sliding window )
        this.avgFreq = new Buffer( this._config.nFreq )

        this.smoothInstantFreq = new Buffer( this._config.nFreq )

        this.instantFreq = new Buffer( this._config.nFreq )


        // save all the point in a sliding window for computation
        this._windows = []

        let zeros = []
        for( var k=this._config.windowSize; k--; )
            zeros.push( 0 )


        for( var k=this._config.nFreq; k--; )
            this._windows.push( zeros.slice() )
    }

    nextBatch( buffer ){
        nextBatch.call( this, buffer )
    }
}
