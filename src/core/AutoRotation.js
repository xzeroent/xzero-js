import { MathUtils } from '../three/three.module.js';


class AutoRotation {

	constructor( controls ) {
		
		this.state = ARSTATE.DISABLED;

		this.controls = controls;
		this.controls.addEventListener( 'start', () => this.pause() );
		this.controls.addEventListener( 'end', () => this.resume() );
	
		
		this.speed = 1;
		this.speedScale = 3 * 60;
		
		this.delay = 0;
		this.waitTime = 0;
		
		this.fadeTime = 0;
		this.fadeDuration = 2;
		
		this.oscillate = false;
		this.edgeRad = 0.15;
		this.edgeMinSpeed = 0.1;
		this.reverse = 1;
		
		this.polarSpeedScale = 0.5;
		this.polarEdgeRad = 0.3;
		this.polarMinSpeed = 0.02;
		
	}
	
	
	enable() {
		
		if ( this.state !== ARSTATE.DISABLED ) return;
		
		if ( this.delay ) {
			this.state = ARSTATE.WAITING;
			this.waitTime = this.delay;
			this.controls.autoRotate = false;
			
		} else {
			this.state = ARSTATE.ROTATING;
			this.waitTime = 0;
			this.fadeTime = 0;
			this.controls.autoRotate = true;
			
		}
		
	}
	
	
	disable() {
		
		this.state = ARSTATE.DISABLED;
		this.controls.autoRotate = false;
		
	}
	
	
	update( delta, hasMoved ) {
		
		//console.log(this.controls.autoRotate );
		
		if ( this.state === ARSTATE.DISABLED ) {
			return;
		
		
		} else if ( this.state === ARSTATE.WAITING ) {
			
			if ( ! hasMoved ) { // wait for full stop
				this.waitTime -= delta;
				
				// wait over ?
				
				if ( this.waitTime <= 0 ) {
					this.state = ARSTATE.ROTATING;
					this.fadeTime = 0;
				}
	
			}
			
		} else if ( this.state === ARSTATE.ROTATING ) {
			
			this.controls.autoRotate = true;
			let speed = this.speed;
			let fade_scale = 1;
			
			// fade start
			this.fadeTime += delta;
			if ( this.fadeTime < this.fadeDuration ) {
				// scale speed
				fade_scale = this.fadeTime / this.fadeDuration;
				speed *= fade_scale;
			}
			
			
			// oscillation
			if ( this.oscillate && speed ) {
				
				let angle = this.controls.getAzimuthalAngle();
				let diff = Math.min( Math.abs( this.controls.minAzimuthAngle - angle ), Math.abs( this.controls.maxAzimuthAngle - angle ) );
				
				if ( diff === 0 ) {
					this.reverse *= -1;
					speed = 0.0001;
					
				} else if ( diff < this.edgeRad ) {
					// scale speed
					speed *= MathUtils.lerp( this.edgeMinSpeed, 1, diff * (1/this.edgeRad) );
					
				}
								
				speed *= this.reverse;
			}
			
			this.controls.autoRotateSpeed = speed * this.speedScale;
			
			
			// elevation
			
			if ( typeof this.polarAngle !== 'undefined' ) {
				let angle = this.controls.getPolarAngle();
				let diff = Math.abs(this.polarAngle - angle);
				let dir = Math.sign(this.polarAngle - angle);
				let polar_speed = Math.abs(this.speed) * fade_scale;
				
				if ( diff > 0.001 && dir ) {
					if ( diff < this.polarEdgeRad ) {
						// scale speed
						polar_speed *= MathUtils.lerp( this.polarMinSpeed, 1, diff * (1/this.polarEdgeRad) );
					}
					
					if ( dir > 0 ) {
						this.controls.autoRotateSpeedY = - polar_speed * this.polarSpeedScale * this.speedScale;
					} else {
						this.controls.autoRotateSpeedY = polar_speed * this.polarSpeedScale * this.speedScale;
					}
					
				} else {
					this.controls.autoRotateSpeedY = 0;
					
				}
				
				//console.log( this.controls.getPolarAngle(), this.polarAngle, diff );
			}
			
			
		}
		
	}
	
	
	pause() {
		
		if ( this.state === ARSTATE.DISABLED ) return;
		
		this.state = ARSTATE.PAUSED;
		this.controls.autoRotate = false;
		
	}
	
	resume() {
		
		if ( this.state !== ARSTATE.PAUSED ) return;
		
		this.state = ARSTATE.WAITING;
		this.waitTime = this.delay;
		
	}
	
	
	interrupt() {
		
		if ( this.state !== ARSTATE.WAITING && this.state !== ARSTATE.ROTATING ) return;
		
		this.state = ARSTATE.WAITING;
		this.waitTime = this.delay;
		this.controls.autoRotate = false;
		
	}
	
	
}


const ARSTATE = {
	DISABLED : 0,
	PAUSED : 1,
	WAITING : 2,
	ROTATING : 3
};


export { AutoRotation };