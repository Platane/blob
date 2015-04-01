
let defaultConfig = {

    nFreq : 32,

    windowSize : 512

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
    for( var i=this._windows.length; i--; ){

        let s = 0
        for( var k=this._windows[ i ].length; k--; )
            s += this._windows[ i ][ k ]
        s /= this._windows[ i ].length

        this.avgFreq[ i ] = s
    }

    // compute the smooth
    let h=5
    for( var i=this._windows.length; i--; ){

        let s = 0
        for( var k= Math.max( this._windows[ i ].length - h, 0 ) ; k< this._windows[ i ].length; k++ )
            s += this._windows[ i ][ k ]
        s /= h

        this.smoothInstantFreq[ i ] = s
    }
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


        // save all the point in a sliding window for computation
        this._windows = []



        for( var k=this._config.nFreq; k--; )
            this._windows.push( [] )
    }

    nextBatch( buffer ){
        nextBatch.call( this, buffer )
    }
}
