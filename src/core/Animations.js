import {
	Color,
	Vector3
} from '../three/three.module.js';


class Animations {

	constructor() {		
		this.set = new Set();
	}
	
	
	add ( options ) {
		let ani = new Animation( options, this );
		this.set.add( ani );
		return ani;
	}
	
	update ( delta=0 ) {
		for ( let ani of this.set ) {
			ani.update( delta );
		}		
	}
	
	dispose () {
		for ( let ani of this.set ) {
			ani.dispose();
		}
		this.set.clear();
		this.set = null;
	}
	
	get count() {
		return this.set.size;
	}
	
}


class Animation {
	
	constructor( options, manager ) {
		
		this.target = options.target;
		this.properties = options.properties;
		
		this.time = 0;
		this.duration = options.duration || 0.5;
		
		this.easing = this.toCamelCase( options.easing || 'ease-in-out' );
		if ( ! this[ this.easing ] ) this.easing = 'ease-in-out';
		
		this.onfinish = options.onfinish;
		this.oncancel = options.oncancel;
		this.manager = manager;
		
		this.from = {};
		for ( let prop in this.properties ) {
			this.from[prop] = this.target[prop];
		}
		
	}
	
	update ( delta=0 ) {
		
		this.time += delta;
		let t = this.time / this.duration;
		
		if ( t >= 1 ) {
			t = 1;
		} else {
			t = this[ this.easing ]( t );
		}
		
		// update properties
		for ( let prop in this.properties ) {
			if ( prop === 'direction' ) {
				this.target[prop] = this.lerpAngle( this.from[prop], this.properties[prop], t );
				
			} else if ( prop.toLowerCase().includes('color') ) { // colors
				this.target[prop] = new Color(this.from[prop]).lerp( new Color(this.properties[prop]) , t );

			} else if ( prop === 'center' || prop === 'position' || prop === 'pointLightPosition' ) { // vectors
				this.target[prop] = this.getVector3(this.from[prop]).lerp( this.getVector3(this.properties[prop]), t ).toArray().join(' ');
			
			} else {
				this.target[prop] = this.lerp( this.from[prop], this.properties[prop], t );
				
			}
		}
		
		if ( t === 1 ) { // complete
			this.manager.set.delete( this );
			if ( typeof this.onfinish === 'function' ) this.onfinish.bind( this.target )( this );
			this.dispose();
		}		
		
	}
	
	
	// public
	
	finish () {
		if ( ! this.target ) return; // was disposed
		this.time = this.duration;
		this.update();
	}
	cancel () {
		if ( ! this.target ) return; // was disposed
		this.manager.set.delete( this ); 
		if ( typeof this.oncancel === 'function' ) this.oncancel.bind( this.target )( this );
		this.dispose();
	}
	
	
	// extrapolate
	
	lerp ( val1, val2, t ) {
		return (1 - t) * val1 + t * val2;
	}
	
	lerpAngle ( fromA, toA, t ) {
		fromA = this.wrap(fromA, -180, 180);
		toA = this.wrap(toA, -180, 180);
		if ( Math.abs(fromA - toA) > 180 ) {
			if ( fromA > 0 ) {
				fromA -= 360;
			} else {
				fromA += 360;
			}
		}
		return this.wrap( this.lerp(fromA, toA, t), -180, 180 );
	}
	
	wrap ( val, min, max ) {
		let range = max - min;
		return min + ( ( ( (val - min) % range ) + range ) % range );
	}
	
	
	// easing equations
	
	linear (t) { return t; }
	
	ease (t) { return this.easeInOut(t); }
	easeIn (t) { return t*t; }
	easeOut (t) { return t*(2-t); }
	easeInOut (t) { return t<.5 ? 2*t*t : -1+(4-2*t)*t; }
	
	back (t) { return (t=t-1)*t*(2.70158*t + 1.70158) + 1; }

	elastic (t) {
		let p=.3;
		if (t==0) return 0; if (t==1) return 1;
		let s = p/(2*Math.PI) * Math.asin (1);
		return Math.pow(2,-10*t) * Math.sin( (t-s)*(2*Math.PI)/p ) + 1;
	}
	
	bounce (t) {
		if (t < (1/2.75)) {
			return (7.5625*t*t);
		} else if (t < (2/2.75)) {
			return (7.5625*(t-=(1.5/2.75))*t + .75);
		} else if (t < (2.5/2.75)) {
			return (7.5625*(t-=(2.25/2.75))*t + .9375);
		} else {
			return (7.5625*(t-=(2.625/2.75))*t + .984375);
		}
	}
	
	
	// conversion
	
	toCamelCase( name ) {
		
		let [first, ...others] = name.split('-');
		
		if ( ! others.length ) return first;
		
		let s = first;
		others.forEach(	part => { s += part.charAt(0).toUpperCase() + part.slice(1) } );
		return s;
		
	}
	
	getVector3( val, defaultVal=0, min, max ) {
		let [x, y, z] = String(val).split(' ');
		x = this.getNumber(x, defaultVal, min, max);
		y = this.getNumber(y, defaultVal, min, max);
		z = this.getNumber(z, defaultVal, min, max);
		return new Vector3(x, y, z);	
	}
	
	getNumber( val, defaultVal=0, min, max ) {
		if ( val === null || isNaN(val) ) return defaultVal; // null is possible defaultVal
		val = Number(val);
		if ( min !== undefined && val < min ) val = min;
		if ( max !== undefined && val > max ) val = max;
		return val;
	}
	
	
	dispose() {
		this.target = null;
		this.manager = null;
		this.onfinish = null;
		this.oncancel = null;
	}
	
	
}



export { Animations, Animation };