import {
	Vector2,
	Vector3,
	Raycaster,
	MathUtils,
} from "../three/three.module.js";


class Overlays {
	
	constructor( element ) {

		this.element = element;
		this.raycaster = new Raycaster();

	}
	
	
	update() {
		
		let lookAround = this.element.lookAround;
		let cam_distance = this.element.relativeCameraPosition.length();
		
		let overlays = [];
		
		for ( let overlay of this.element.overlaySlot.assignedNodes() ) {
			
			if ( ! overlay.ready ) {
				// prevent grab through overlays
				overlay.addEventListener('pointerdown', function(event){ event.stopPropagation(); });
				overlay.addEventListener('touchstart', function(event){ event.stopPropagation(); });
				overlay.ready = true;
			}
			
			if ( this.isHiddenByStyle(overlay) ) continue;
			
			let pos = ( overlay.getAttribute('position') || '0 0 0' ).split(' ');
			let world_pos = this.element.toNormalizedUnits( new Vector3( ...pos ) );	
			let element_pos = this.element.worldToElement( world_pos );
			
			overlay.angle = MathUtils.radToDeg( this.element.relativeCameraPosition.angleTo( this.element.relativeToTarget(world_pos) ) );
			if ( lookAround ) overlay.angle = 180 - overlay.angle;
			
			if ( lookAround && overlay.angle > 80 ) {
				overlay.setAttribute('out-of-view', '');
			} else {
				overlay.removeAttribute('out-of-view');				
			}
			
			if ( this.isHiddenComputed(overlay) ) continue;
			
			overlays.push( overlay );
			
			this.updateTransform(
				overlay,
				element_pos.x - overlay.offsetWidth / 2,
				element_pos.y - overlay.offsetHeight / 2,
				world_pos,
				cam_distance
			);
			
			this.testPosition( overlay, element_pos );
			if ( overlay.hasAttribute('angle-test') ) this.testAngle( overlay, overlay.angle, overlay.getAttribute('angle-test') || 90 );
			if ( overlay.hasAttribute('occlusion-test') ) this.testOcclusion( overlay, element_pos, world_pos );
			
			
		}
		
		
		/* z-index sort */
		
		overlays.sort( function(a, b) {
			return b.angle - a.angle;
		} );
	
		for (var i=0; i < overlays.length; i++) {
			
			let behind = ! lookAround && ! overlays[i].hasAttribute('always-on-top') && overlays[i].angle > 90;
			
			overlays[i].style.zIndex = ( behind ? 12 : 102 ) + i;
			
			if ( behind ) {
				if ( ! overlays[i].hasAttribute('behind') ) overlays[i].setAttribute('behind', '');
			} else {
				if ( overlays[i].hasAttribute('behind') ) overlays[i].removeAttribute('behind');				
			}
			
		}
		
		
	}
	
	
	updateTransform( overlay, x, y, world_pos, cam_distance ) {
		
		let scale = 1;
	
		if ( overlay.hasAttribute('zoom-scale') ) {
			scale *= 1 / this.element.zoom + 0.5;
		}
		if ( overlay.hasAttribute('element-scale') ) {
			scale *= this.element.size.x / 500;
		}
		if ( overlay.hasAttribute('depth-scale') ) {
			if ( this.element.lookAround ) {
				scale *= 1 / world_pos.distanceTo( this.element.camera.position );
			} else {
				scale *= cam_distance / world_pos.distanceTo( this.element.camera.position ) ;
			}
		}

		overlay.style.transform = `translate(${x}px, ${y}px)` + ( (scale !== 1) ? ` scale(${scale})` : '' );
		overlay.style.left = '';
		overlay.style.top = '';

	}
	

	
	
	testPosition( overlay, element_pos ) {
		
		if ( element_pos.x < this.element.size.x / 2 ) {
			if ( ! overlay.hasAttribute('at-left') ) overlay.setAttribute('at-left', '');
			if ( overlay.hasAttribute('at-right') ) overlay.removeAttribute('at-right');
		} else {
			if ( ! overlay.hasAttribute('at-right') ) overlay.setAttribute('at-right', '');
			if ( overlay.hasAttribute('at-left') ) overlay.removeAttribute('at-left');
		}
		
		if ( element_pos.y < this.element.size.y / 2 ) {
			if ( ! overlay.hasAttribute('at-top') ) overlay.setAttribute('at-top', '');
			if ( overlay.hasAttribute('at-bottom') ) overlay.removeAttribute('at-bottom');
		} else {
			if ( ! overlay.hasAttribute('at-bottom') ) overlay.setAttribute('at-bottom', '');
			if ( overlay.hasAttribute('at-top') ) overlay.removeAttribute('at-top');
		}
		
		if ( element_pos.x < 0 || element_pos.y < 0 || element_pos.x > this.element.size.x || element_pos.y > this.element.size.y ) {
			if ( ! overlay.hasAttribute('outside') ) overlay.setAttribute('outside', '');			
		} else {
			if ( overlay.hasAttribute('outside') ) overlay.removeAttribute('outside');
		}
		
	}
	
	
	testAngle( overlay, angle, max_angle ) {
				
		if ( angle <= max_angle ) {
			if ( ! overlay.hasAttribute('within-angle') ) overlay.setAttribute('within-angle', '');
		} else {
			if ( overlay.hasAttribute('within-angle') ) overlay.removeAttribute('within-angle');			
		}		
		
	}
	
	
	testOcclusion( overlay, element_pos, world_pos ) {
		
		let distance = world_pos.distanceTo( this.element.camera.position );
		
		let normalized = new Vector2( element_pos.x / this.element.size.x * 2 - 1, element_pos.y / this.element.size.y * -2 + 1 );
		this.raycaster.setFromCamera( normalized, this.element.camera );
		let results = this.raycaster.intersectObject( this.element.model, true );

		if ( results[0] && results[0].distance < distance ) { // occluded
			if ( ! overlay.hasAttribute('occluded') ) overlay.setAttribute('occluded', '');
		} else {
			if ( overlay.hasAttribute('occluded') ) overlay.removeAttribute('occluded');
		}		
		
	}
	
	
	isHiddenByStyle( node ) {
		return node.style.display === 'none' || node.hasAttribute('hidden');
	}
	
	isHiddenComputed( node ) {
		return getComputedStyle(node).display === 'none';
	}
	
	
}


export { Overlays };