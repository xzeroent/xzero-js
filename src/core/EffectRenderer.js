import {
	WebGLRenderTarget,
	WebGLMultisampleRenderTarget,
	Mesh,
	PlaneGeometry,
	OrthographicCamera,
} from "../three/three.module.js";


class EffectRenderer {
	
	constructor( renderer, material, size, multisample = false ) {

		this.renderer = renderer;

		if ( multisample ) {
			this.target = new WebGLMultisampleRenderTarget( size, size );
			this.target.samples = 2;		
		} else {
			this.target = new WebGLRenderTarget( size, size );
		}
		
		this.camera = new OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
		let geometry = new PlaneGeometry( 2, 2 );
		this.mesh = new Mesh( geometry, material );

	}
	
	render() {
		
		this.renderer.setRenderTarget( this.target );			
		this.renderer.render( this.mesh, this.camera );
		
	}
	
	setSize( size ) {
		this.target.setSize( size, size );		
	}
	
	dispose() {
		
		this.target.dispose();
		this.mesh.geometry.dispose();
		this.target = null;
		this.renderer = null;
		this.camera = null;
		
	}
	
}


export { EffectRenderer };