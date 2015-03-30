
/**
 * One Dimension Interval, can compute operations on intervals such as [ 1 , 2 ] U [ 3 ,4 ] ..
 *
 *
 * @class Interval
 * @constructor
 *
 */
var eps = 0.00001
var collision = function( a , b ){
    var h = b.min - a.max,
        k = a.min - b.max
    return ( h < eps && k < eps ) || ( h > -eps && k > -eps )
}


var Interval = function(){
    this.i=[];
}

Interval.collision = collision

Interval.prototype={

    union : function( a, b ){
        if( typeof a !== 'object' )
            a={min:a,max:b}
        else
            if( a instanceof Interval ){
                for(var i=a.i.length;i--;)
                    this.union( a.i[i] )
                return this;
            }


        for(var i=this.i.length;i--;)
            if( collision( this.i[i] , a )){
                var u = this.i.splice(i,1)[0]
                a.max = Math.max( u.max , a.max )
                a.min = Math.min( u.min , a.min )

                return this.union( a )
            }

        return this.add( a )
    },

    // use it if you are sure there is no union ( use method union else )
    add : function( a, b ){
        if( typeof a !== 'object' )
            a={min:a,max:b}

        if( !this.i.length || a.min<this.i[0].min )
            this.i.unshift( a )
        else{
            var i=0,l=this.i.length;
            for(; i<l && a.min > this.i[i].min ; i++);

            this.i.splice(i,0,a)
        }

        return this
    },

    contains : function( a ){

        if( !this.i.length || this.i[0].min - a > eps )
            return false

        var i=0,l=this.i.length-1;
        for(; i<l && this.i[i+1].min - a < eps ; i++);

        return  a - this.i[i].max < eps
    },

    intersection : function( a, b ){
        if( typeof a !== 'object' )
            a=[{min:a,max:b}]
        else{
            if( a instanceof Interval )
                a = a.i
            else
                a = [a]
        }

        // push the intersection in this
        var c = [];


        // access the two set as array
        var i = [0,0]
        var sets= [ this.i , a ];

        while( i[0]<sets[0].length && i[1]<sets[1].length ){

            // greatest min
            var istart = sets[0][ [ i[0] ] ].min > sets[1][ i[1] ].min ? 0 : 1

            // lowest max
            var iend = sets[0][ [ i[0] ] ].max < sets[1][ i[1] ].max ? 0 : 1

            // start and end values
            var start = sets[ istart ][ [ i[ istart ] ] ].min,
                end = sets[ iend ][ [ i[ iend ] ] ].max



            if( start - end < eps ){
                // is a valid interval

                // need to do this due to numerical precision
                if( end - start < eps )
                    // the point are close to be equals, let's say the are equals
                    end = start = ( end + start ) /2

                c.push({ min: start, max: end })
            }
            // iend is the lowest interval, take the next in this set
            i[ iend ] ++
        }

        this.i = c;
        return this
    },

    complementary : function(){

        if( !this.i.length ){
            this.i = [{max:Infinity,min:-Infinity}]
            return this
        }

        var c = []
        for(var i=1,l=this.i.length;i<l;i++)
            c.push({
                min : this.i[i-1].max,
                max : this.i[i].min
            })

        if( this.i[0].min > -Infinity )
            c.unshift({
                min : -Infinity,
                max : this.i[0].min
            })

        if( this.i[this.i.length-1].max < Infinity )
            c.push({
                min : this.i[this.i.length-1].max,
                max : Infinity
            })

        this.i = c
        return this
    },

    translate : function( k ){
        for(var i=this.i.length;i--;){
            this.i[i].max += k
            this.i[i].min += k
        }
        return this
    },

    expand : function( k ){

        if( k<0 ){
            // make the intervals smaller
            // only risk is to have an empty interval
            for(var i=this.i.length;i--;){
                this.i[i].min -= k
                this.i[i].max += k
                if( this.i[i].min > this.i[i].max )
                    this.i.splice(i,1)
            }
        }else{
            // make the intervals larger
            // risk of overlap -> union
            var c = new Interval();
            for(var i=this.i.length;i--;)
                c.union( this.i[i].min - k , this.i[i].max + k )
            this.i=c.i
        }
        return this
    },

    clone : function(){
        var c = new Interval();
        for(var i=this.i.length;i--;)
            c.i.unshift({ max: this.i[i].max , min: this.i[i].min })
        return c
    },

    isEmpty : function(){
        return !this.i.length
    },

    closestTo : function( a ){
        if( !this.i.length  )
            return null

        var dmin=Infinity
        var x=null


        for(var i=0,l=this.i.length; i<l ; i++){

            var tmp = a - this.i[i].min

            if( tmp >= 0 && a <= this.i[i].max )
                return a

            tmp = Math.abs( tmp )
            if( tmp < dmin ){
                dmin = tmp
                x = this.i[i].min
            }

            tmp = Math.abs( a - this.i[i].max )
            if( tmp < dmin ){
                dmin = tmp
                x = this.i[i].max
            }

            if( i==l-1 || a < this.i[i].max )
                return x
        }

        return x
    },

    closestLowExtremum : function( a ){
        if( !this.i.length  )
            return null

        var dmin=Infinity
        var x=null


        for(var i=0,l=this.i.length; i<l ; i++){

            var tmp = a - this.i[i].min

            if( tmp >= 0 && a <= this.i[i].max )
                return this.i[i]

            tmp = Math.abs( tmp )
            if( tmp < dmin ){
                dmin = tmp
                x = this.i[i].min
            }

            tmp = Math.abs( a - this.i[i].max )
            if( tmp < dmin ){
                dmin = tmp
                x = this.i[i].max
            }

            if( i==l-1 || a < this.i[i].max )
                return this.i[i]
        }

        return x
    },

    clear : function(){
        this.i.length = 0
        return this
    }
}

if( typeof module != 'undefined' )
    module.exports = Interval
