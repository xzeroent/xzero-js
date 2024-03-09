import {
	Color,
	LinearFilter,
	MathUtils,
	Matrix4,
	Mesh,
	PerspectiveCamera,
	Plane,
	PlaneGeometry,
	RGBAFormat,
	ShaderMaterial,
	UniformsUtils,
	Vector2,
	Vector3,
	Vector4,
	WebGLRenderTarget,
	WebGLMultisampleRenderTarget,
	MeshBasicMaterial
} from "../three/three.module.js";


class SoftReflection {
	
	constructor ( options ) {
		
		this.renderer = options.renderer;
		this.scene = options.scene;
		this.camera = options.camera;

		this.material = new ShaderMaterial( {
			uniforms: {
				'softness': {
					value: 0
				},
				
				'opacity': {
					value: 1
				},
				
				'color': {
					value: null
				},
				
				'tDiffuse': {
					value: null
				},

				'textureMatrix': {
					value: null
				}
			},
			fragmentShader: this.fragmentShader,
			vertexShader: this.vertexShader
		} );


		this.plane = new Mesh(
			new PlaneGeometry( 8, 8 ),
			this.material
		);
		this.plane.onBeforeRender = ()=>{
			this.render();
		};
		
		//this.plane.position.y = 0;
		this.plane.rotateX( - Math.PI / 2 );
		this.plane.renderOrder = -2;
		
		
		let color = ( options.color !== undefined ) ? new Color( options.color ) : new Color( 0x7F7F7F );
		let textureWidth = options.size;
		let textureHeight = options.size;

		this.reflectorPlane = new Plane();
		this.normal = new Vector3();
		this.reflectorWorldPosition = new Vector3();
		this.cameraWorldPosition = new Vector3();
		this.rotationMatrix = new Matrix4();
		this.lookAtPosition = new Vector3( 0, 0, - 1 );
		this.clipPlane = new Vector4();

		this.view = new Vector3();
		this.target = new Vector3();
		this.q = new Vector4();

		this.textureMatrix = new Matrix4();
		
		this.virtualCamera = new PerspectiveCamera();
		this.virtualCamera.layers.enableAll();
		this.virtualCamera.layers.disable( 1 );


		let parameters = {
			minFilter: LinearFilter,
			magFilter: LinearFilter,
			format: RGBAFormat
		};
		
		if ( options.multisample ) {
			this.renderTarget = new WebGLMultisampleRenderTarget( textureWidth, textureHeight, parameters );
			this.renderTarget.samples = 4;
			
		} else {
			this.renderTarget = new WebGLRenderTarget( textureWidth, textureHeight, parameters );
		}
		
		this.renderTarget.texture.generateMipmaps = false;


		this.material.uniforms[ "tDiffuse" ].value = this.renderTarget.texture;
		this.material.uniforms[ "textureMatrix" ].value = this.textureMatrix;
		this.material.transparent = true;
		
	}
	


	render () {

		this.reflectorWorldPosition.setFromMatrixPosition( this.plane.matrixWorld );
		this.cameraWorldPosition.setFromMatrixPosition( this.camera.matrixWorld );

		this.rotationMatrix.extractRotation( this.plane.matrixWorld );

		this.normal.set( 0, 0, 1 );
		this.normal.applyMatrix4( this.rotationMatrix );

		this.view.subVectors( this.reflectorWorldPosition, this.cameraWorldPosition );

		// Avoid rendering when reflector is facing away
		if ( this.view.dot( this.normal ) > 0 ) return;

		this.view.reflect( this.normal ).negate();
		this.view.add( this.reflectorWorldPosition );

		this.rotationMatrix.extractRotation( this.camera.matrixWorld );

		this.lookAtPosition.set( 0, 0, - 1 );
		this.lookAtPosition.applyMatrix4( this.rotationMatrix );
		this.lookAtPosition.add( this.cameraWorldPosition );

		this.target.subVectors( this.reflectorWorldPosition, this.lookAtPosition );
		this.target.reflect( this.normal ).negate();
		this.target.add( this.reflectorWorldPosition );

		this.virtualCamera.position.copy( this.view );
		this.virtualCamera.up.set( 0, 1, 0 );
		this.virtualCamera.up.applyMatrix4( this.rotationMatrix );
		this.virtualCamera.up.reflect( this.normal );
		this.virtualCamera.lookAt( this.target );
		this.virtualCamera.far = this.camera.far; // Used in WebGLBackground
		this.virtualCamera.updateMatrixWorld();
		this.virtualCamera.projectionMatrix.copy( this.camera.projectionMatrix );


		// Update the texture matrix
		this.textureMatrix.set(
			0.5, 0.0, 0.0, 0.5,
			0.0, 0.5, 0.0, 0.5,
			0.0, 0.0, 0.5, 0.5,
			0.0, 0.0, 0.0, 1.0
		);
		this.textureMatrix.multiply( this.virtualCamera.projectionMatrix );
		this.textureMatrix.multiply( this.virtualCamera.matrixWorldInverse );
		this.textureMatrix.multiply( this.plane.matrixWorld );


		// Render

		this.plane.visible = false;

		this.renderTarget.texture.encoding = this.renderer.outputEncoding;
		this.renderer.setRenderTarget( this.renderTarget );
		this.renderer.render( this.scene, this.virtualCamera );

		this.renderer.setRenderTarget( null );
		
		this.plane.visible = true;

	}
	
	setSize( size ) {
		this.renderTarget.setSize( size, size );
	}
	
	dispose() {
		this.plane.material.dispose();
		this.renderTarget.dispose();
		this.renderer = null;
		this.scene = null;
		this.element = null;
		this.camera = null;
		this.virtualCamera = null;
	}
	
	set color( v ) {
		this.plane.material.uniforms.color.value = new Color( v );
	}
	
	set opacity( v ) {
		this.plane.material.uniforms.opacity.value = v;
	}
	
	set softness( v ) {
		if ( v == 0.0 ) {
			this.renderTarget.samples = 4;
		} else {
			this.renderTarget.samples = 2;
		}
		
		this.plane.material.uniforms.softness.value = v * 2.0;
	}


	get vertexShader() {
		return `
		
		uniform mat4 textureMatrix;
		varying vec4 vUv;

		void main() {

			vUv = textureMatrix * vec4( position, 1.0 );
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}
		
		`;
	}

	get fragmentShader() {
		return `
		#include <common>
		
		uniform vec3 color;
		uniform float opacity;
		uniform float softness;
		uniform sampler2D tDiffuse;
		varying vec4 vUv;	
		
		vec4 dithering( vec4 color ) {
			float grid_position = rand( gl_FragCoord.xy );
			vec4 dither_shift_RGBA = vec4( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0, -0.5 / 255.0 );
			dither_shift_RGBA = mix( 2.0 * dither_shift_RGBA, -2.0 * dither_shift_RGBA, grid_position );
			return color + dither_shift_RGBA;
		}
		
		vec4 getPx ( vec4 uv ) {
			vec4 base = texture2DProj( tDiffuse, uv );
			float y = uv.y * 2.0;
			if ( y > 1.0 ) {
				y = 1.0;
			}
			base.a *= opacity * y;
			return base;			
		}

		void main() {
			
			float blur = 2.0 - vUv.y * 0.5;
			
			float h = softness * blur / 1024.0; // todo real size

			vec3 c_sum = vec3( 0.0 );
			float a_sum = 0.0;
			float c_total = 0.0;
			float a_total = 0.0;
			vec4 uv = vUv * 1.0;
			vec4 px;
			
			if ( softness == 0.0 ) {
				px = getPx( uv );
				c_sum = px.rgb;
				c_total = 1.0;
				a_sum = px.a;
				a_total = 1.0;
				
			} else {
			
				for ( float x = -softness*2.0; x <= softness*2.0; x ++ ) {
					for ( float y = -softness; y <= softness; y ++ ) {
						float weight = softness*3.5 - abs(x) - abs(y);
						uv.x = vUv.x + x * h;
						uv.y = vUv.y + y * h;
						px = getPx( uv );
						a_sum += px.a * weight;
						a_total += weight;
						if ( px.a > 0.0 ) {
							c_sum += px.rgb * weight;
							c_total += weight;
						}
					}
				}
			
			}
			
			gl_FragColor.rgb = ( c_sum / c_total ) * color;
			gl_FragColor.a = a_sum / a_total;
			gl_FragColor = dithering( gl_FragColor );

		}
		
		`;
	}
	
	
}



export { SoftReflection };
