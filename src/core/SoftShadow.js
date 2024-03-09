import {
	Mesh,
	Color,
	Vector2,
	Vector3,
	PerspectiveCamera,
	WebGLRenderTarget,
	WebGLMultisampleRenderTarget,
	DepthTexture,
	ShaderMaterial,
	PlaneGeometry,
	MeshBasicMaterial,	
} from "../three/three.module.js";

import { EffectRenderer } from './EffectRenderer.js';


class SoftShadow {
	
	constructor( options ) {
		
		this.cache = {};
		
		this.renderer = options.renderer;
		this.scene = options.scene;
		this.element = options.element;
		this.size = options.size || 512;
		//this.multisample = multisample;
		
		if ( ! this.renderer.capabilities.isWebGL2 && ! this.renderer.extensions.get('WEBGL_depth_texture') ) {
			this.plane = new Mesh();
			this.unsupported = true;
			return;			
		}
		
		this.shadowCamera = new PerspectiveCamera( 46, 1, 1.29, 3.1 );
		this.shadowCamera.position.set( 0, -2.3, 0 );
		this.shadowCamera.lookAt( 0 , 0, 0 );
		this.shadowCamera.layers.disableAll();
		this.shadowCamera.layers.enable(0);
		
		
		//if ( multisample ) {
		//	this.target = new WebGLMultisampleRenderTarget( size, size );
		//	this.target.samples = 2;		
		//} else {
		this.target = new WebGLRenderTarget( this.size, this.size );
		//}
		
		this.target.texture.generateMipmaps = false;
		this.target.depthBuffer = true;		
		this.target.depthTexture = new DepthTexture();
		
		
		this.depthReadMaterial = new ShaderMaterial( {
			vertexShader: this.vertexShader,			
			fragmentShader: this.depthReadShader,
			uniforms: {
				cameraNear: { value: 0.05 },
				cameraFar: { value: 1 },
				tDepth: { value: this.target.depthTexture }
			}
		} );
		
		this.blur1Mat = new ShaderMaterial( {
			vertexShader: this.vertexShader,			
			fragmentShader: this.blurShader,
			uniforms: {
				tDiffuse: { value: null },
				delta: { value: null },
				iterations: { value: 6 },
			}
		} );
		this.blur2Mat = new ShaderMaterial( {
			vertexShader: this.vertexShader,			
			fragmentShader: this.blurShader,
			uniforms: {
				tDiffuse: { value: null },
				delta: { value: null },
				iterations: { value: 6 },
			}
		} );
		
		
		
		this.planeMaterial = new MeshBasicMaterial({ transparent: true, opacity: 1.0, dithering: true });
		


		this.plane = new Mesh( new PlaneGeometry( 2, 2 ), this.planeMaterial );
		this.plane.layers.disableAll();
		this.plane.layers.enable(3);
		this.plane.position.y = 0.001;
		this.plane.rotateX(  Math.PI / 2 );
		this.plane.scale.set( 1, 1, -1 );
		this.plane.renderOrder = -1;
		
		
	
		this.effectDepthMap = new EffectRenderer( this.renderer, this.depthReadMaterial, this.size );
		
		this.effectBlur1 = new EffectRenderer( this.renderer, this.blur1Mat, this.size );			
		this.blur1Mat.uniforms.tDiffuse.value =  this.effectDepthMap.target.texture;
		
		this.effectBlur2 = new EffectRenderer( this.renderer, this.blur2Mat, this.size );	
		this.blur2Mat.uniforms.tDiffuse.value =  this.effectBlur1.target.texture;
		
		this.effectBlur2.target.texture.anisotropy = 2;
		this.planeMaterial.map = this.effectBlur2.target.texture;		
		
		
	}
	
	
	renderIfNeeded( element ) {
		
		if (
			this.cache.w == element.size.x &&
			this.cache.h == element.size.y &&
			this.cache.src == element.src &&
			this.cache.time == element.time &&
			this.cache.shadow == element.shadow &&
			this.cache.shadowSoftness == element.shadowSoftness &&
			this.cache.shadowColor == element.shadowColor		
		) return; // no changes		
		
		this.render();
		
		this.cache.w = element.size.x;
		this.cache.h = element.size.y;
		this.cache.src = element.src;
		this.cache.time = element.time;
		this.cache.shadow = element.shadow;
		this.cache.shadowSoftness = element.shadowSoftness;
		this.cache.shadowColor = element.shadowColor;	
		
	}
	
	render() {
		
		if ( this.unsupported ) return;
		
		if ( this.element.debug ) {
			this.element.debugX.visible = false;
			this.element.debugY.visible = false;
			this.element.debugZ.visible = false;
		}
		
		this.renderer.setRenderTarget( this.target );			
		this.renderer.render( this.scene, this.shadowCamera );
		
		this.effectDepthMap.render();		
		this.effectBlur1.render();
		this.effectBlur2.render();
		
		this.renderer.setRenderTarget( null );
		
		if ( this.element.debug ) {
			this.element.debugX.visible = true;
			this.element.debugY.visible = true;
			this.element.debugZ.visible = true;
		}
		
	}
	
	
	set opacity( attr ) {
		
		if ( this.unsupported ) return;
	
		this.planeMaterial.opacity = attr;
		
	}
	
	set color( attr ) {
		
		if ( this.unsupported ) return;
	
		this.planeMaterial.color = new Color( attr );
		
	}
	
	set softness( attr ) {
		
		if ( this.unsupported ) return;
		
		this._softness = attr;
		
		attr = (Number(attr) + 0.5);
		
		let s = this.size / (1/attr * 40);
		this.blur1Mat.uniforms.delta.value = new Vector2( s / this.size, s / this.size );
		this.blur2Mat.uniforms.delta.value = new Vector2( -s / this.size, s / this.size );
		
		let iterations = 4 + Math.ceil( attr * 1.5 ); // 5 - 8
		this.blur1Mat.uniforms.iterations.value = iterations;
		this.blur2Mat.uniforms.iterations.value = iterations;
		
	}
	
	
	
	setSize( size ) {
		
		if ( this.unsupported ) return;
		
		this.size = size;
		
		this.target.setSize( size, size );		
		this.effectBlur1.setSize( size );
		this.effectBlur2.setSize( size );
		
		this.softness = this._softness;
		
	}
	
	
	dispose() {
		
		if ( this.unsupported ) return;
		this.target.dispose();
		this.depthReadMaterial.dispose();
		this.blur1Mat.dispose();
		this.blur2Mat.dispose();
		this.planeMaterial.dispose();
		this.effectBlur1.dispose();
		this.effectBlur2.dispose();
		
		this.renderer = null;
		this.scene = null;
		this.element = null;
		this.shadowCamera = null;
		
	}


	get vertexShader() {
		return `
		
		varying vec2 vUv;

		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		}
		
		`;
	}
	
	get depthReadShader() {
		return `
		
		#include <packing>
		uniform sampler2D tDepth;
		uniform float cameraNear;
		uniform float cameraFar;
		varying vec2 vUv;

		float getDepth() {
			return viewZToOrthographicDepth( perspectiveDepthToViewZ( texture2D( tDepth, vUv ).x, cameraNear, cameraFar ), cameraNear, cameraFar );
		}

		void main() {
			
			float d = getDepth();
			if ( d > 0.999 ) discard;
			
			d -= 0.12;
			if ( d < 0.0 ) d = 0.0;
			
			float a = pow(1.0 - d * 2.0, 6.0);
			
			if ( a < 0.001 ) discard;
			
			gl_FragColor.a = a;
		}
		
		`;
	}
	

	get blurShader() {
		return `

		#include <common>
		uniform sampler2D tDiffuse;
		uniform vec2 delta;
		uniform float iterations;
		varying vec2 vUv;

		void main() {
			float alpha = 0.0;
			float total = 0.0;
			float offset = rand( vUv ) - 0.5;

			for ( float t = -iterations; t <= iterations; t ++ ) {

				float percent = ( t + offset ) / iterations;
				float weight = 1.0 - abs( percent );
				alpha += texture2D( tDiffuse, vUv + delta * percent ).a * weight;
				total += weight;

			}

			gl_FragColor.rgb = vec3(1.0, 1.0, 1.0); // tintable
			gl_FragColor.a = alpha / total;
		}
		
		`;
	}
	

	
}

export { SoftShadow };
