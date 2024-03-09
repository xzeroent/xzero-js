/* XZERO JS v1.1, https://xzerojs.org/ */

import {
	Vector2,
	Vector3,
	Box3,
	Color,
	Spherical,
	MathUtils,
	
	Scene,
	WebGLRenderer,
	PerspectiveCamera,
	Object3D,
	Mesh,
	MeshBasicMaterial,
	MeshToonMaterial,
	MeshPhongMaterial,
	LineBasicMaterial,
	BufferAttribute,
	BufferGeometry,
	SphereGeometry,
	LineLoop,
	PointLightHelper,
	ArrowHelper,
	Clock,	
	Layers,
	Raycaster,
	AmbientLight,
	PointLight,
	AnimationMixer,
	
	LoopOnce,
	LoopRepeat,
	LinearEncoding,
	sRGBEncoding,
	LinearToneMapping,
	NoToneMapping,
	MixOperation,
} from './three/three.module.js';

import { Animations } from "./core/Animations.js";
import { AutoRotation } from "./core/AutoRotation.js";
import { ElementObserver } from "./core/ElementObserver.js";
import { ModelLoader } from "./core/ModelLoader.js";
import { Overlays } from "./core/Overlays.js";
import { SoftReflection } from './core/SoftReflection.js';
import { SoftShadow } from './core/SoftShadow.js';
import { OrbitControls } from "./three/OrbitControls.mod.js";


class XzeroJS extends HTMLElement {

	constructor() {
		
		super();
		
		this.state = STATES.PENDING;
		this.size = new Vector2();
		this.needsUpdate = false;
		this.needsResize = false;
		
		this.setupRoot();
		this.setupScene();
		
		this.overlays = new Overlays( this );
		this.scriptedAnimations = new Animations();
		this.autoRotation = new AutoRotation( this.controls );
		this.observer = new ElementObserver( this );
		this.raycaster = new Raycaster();
		this.actions = [];
		
		for ( let attr of XzeroJS.observedAttributes ) {
			this[ this.toCamelCase(attr) ] = this.getAttribute(attr);
		}
		
	}
	
	
	/* callbacks */	
	
	connectedCallback() {
		
		if ( this.disposed ) return;
				
		if ( this.state === STATES.PENDING ) {
		
			this.state = STATES.READY;
			
			// load model according to attr loading
			
			if ( ! this.src && ! this.env ) {
				this.state = STATES.EMPTY;				
				
			} else if ( this.getAttribute('loading') === 'eager' ) {
				this.updateSrc();				
					
			} else if ( this.getAttribute('loading') === 'lazy' ) {
				this.state = STATES.LAZY;
				
			} else { // loading = auto				
					
				if ( this.ownerDocument.readyState === 'complete' ) {
					this.updateSrc();
					
				} else {
					window.addEventListener( 'load', () => this.updateSrc() );
					
				}
				
			}
			
		} else {
		
			this.requestRender();
		
		}
		
	}
	
	
	disconnectedCallback() {
		
		this.cancelRender();
		
	}
	
	
	adoptedCallback() {
		
		if ( this.state === STATES.PENDING ) return;
		this.observer.reset();
		
	}
	
	
	showCallback() {
		
		this.requestRender();
		
	}
	
	
	hideCallback() {
		
		this.cancelRender();
		
	}
	
	
	enterViewCallback() {
		
		if ( this.state === STATES.LAZY ) {
			this.updateSrc();
		}
		
		if ( this.autorotate ) {
			this.autoRotation.enable();
		}
		
		this.requestRender();	
		
	}
	
	
	leaveViewCallback() {
		
	}
	
	
	resizeCallback() {

		if ( this.state != STATES.LOADED ) return;
		
		this.needsResize = true;
		this.requestRender();
		
	}
		

	sleepCallback() {
		
		this.sleeping = true;
		
		for ( let node of this.overlaySlot.assignedNodes() ) {
			if ( node.mutationObserver ) continue;
			
			node.mutationObserver = new MutationObserver( mutations => {
				mutations.forEach( mutation => this.requestRender() );    
			} );

			node.mutationObserver.observe( node, { attributes: true } );
		}
		
		if ( this.debug ) {
			this.root.querySelector('.debug-sleep').style.display = '';
		}
		
	}
	
	
	wakeupCallback() {
		
		this.sleeping = false;
		
		for ( let node of this.overlaySlot.assignedNodes() ) {
			if ( ! node.mutationObserver ) continue;
			
			node.mutationObserver.disconnect();
			delete node.mutationObserver;			
		}
		
		if ( this.debug ) {
			this.root.querySelector('.debug-sleep').style.display = 'none';
		}
		
	}
	

	failCallback( msg ) {
		
		if ( this.disposed ) return;
		
		delete this.loader;
		
		console.error( msg );
		
		this.setAttribute( 'state', 'error' );		
		this.dispatch( 'error' );
		
	}
	
	
	
	/* methods */
	
	
	setupRoot() {
		
		this.root = this.attachShadow({ mode: 'open' });
	
		this.root.innerHTML = `
			<style>
				:host {
					position: relative;
					display: block;
					width: 100%;
					max-width: 100%;
					z-index: 0;
					overflow: hidden;
					user-drag: none;
					user-select: none;
					cursor: -webkit-grab;
					cursor: grab;
				}
				:host([hidden]) {
					display: none;
				}
				:host([grabbing]) {
					cursor: -webkit-grabbing;
					cursor: grabbing;
				}
				:host([grabbable=false]) {
					cursor: initial;
				}
				:host([debug]),
				:host([debug]) ::slotted(*) {
					outline: 1px cyan dotted;
				}
				
				
				::slotted(*) {
					position: absolute;
					left: 0;
					top: 0;
				}
				
				:host(:not([state="loaded"])) ::slotted(*) {
					display: none;
				}
				
				::slotted([out-of-view]) {
					display: none !important;
				}
				
				
				.wrap {
					position: relative;
					height: 100%;
					overflow: hidden;
				}
				.wrap canvas {
					position: absolute;
					top: 0;
					left: 0;
					z-index: 100;
					pointer-events: none;
				}
				
				.ratio {
					position: relative;
				}
				
				.debug-text {
					position: absolute;
					top: 0.5em;
					color: cyan;
					font-size: 12px;
					font-family: sans-serif;
					line-height: 1em;
					pointer-events: none;
					z-index: 101;
				}
				
				.debug-sleep {
					color: magenta;
					padding-left: 1em;
				}
				:host(:not([state="loaded"])) .debug-sleep {
					display: none;
				} 
				
				.debug-state {
					left: 0.5em;
				}
				:host([state="error"]) .debug-state::before {
					content: "error";
					color: red;
				}
				:host([state="empty"]) .debug-state::before {
					content: "empty";
					color: red;
				}
				:host([state="loading"]) .debug-state::before {
					content: "loading";
				}
				:host([state="loaded"]) .debug-state::before {
					content: "loaded";
				}
				
				.debug-direction {
					width: 10em;
					text-align: center;
					left: calc( 50% - 5em );
				}
				.debug-elevation {
					right:  0.5em;
				}
				.debug-zoom {
					right:  0.5em;
					top: 2em;
				}
				.debug-center {
					left:  0.5em;
					top: 2em;
				}
				
			</style>
			
			<div part="wrap" class="wrap"><div part="ratio" class="ratio"></div></div>
			
			<slot name="overlay"></slot>
		`;
		
		this.wrap = this.root.querySelector('.wrap');
		this.ratioDiv = this.root.querySelector('.ratio');
		
		this.overlaySlot = this.root.querySelector('slot');
		this.overlaySlot.addEventListener( 'slotchange', () => this.requestRender() );		
		
	}
	
	
	setupScene() {

		this.clock = new Clock();

		this.scene = new Scene();
		
		this.model = new Object3D();
		this.scene.add( this.model );
		
		this.renderer = new WebGLRenderer( {
			alpha: true,
			antialias: true,
			preserveDrawingBuffer: this.hasAttribute('preserve-buffer')
		} );
		
		this.renderer.setPixelRatio( this.hasAttribute('high-quality') ? 2 : window.devicePixelRatio );
		
		this.canvas = this.renderer.domElement;
		this.canvas.setAttribute('part', 'canvas');
		this.wrap.appendChild( this.canvas );
				
		this.camera = new PerspectiveCamera( 45, this.offsetWidth / this.offsetHeight, 0.001, 10000 );
		this.camera.position.set( 0, 0, 2 );
		this.camera.layers.enableAll();
		this.scene.add( this.camera );
		
		
		this.controls = new OrbitControls( this.camera, this.renderer.domElement, this );
		this.controls.enablePan = false;
		this.controls.enableKeys = false;
		this.controls.rotateSpeed = 1.0;
		this.controls.zoomSpeed = 1.0;		
		
		this.grabbing = false;		
		this.lastMove = 0;
		
		this.controls.addEventListener( 'start', () => {
			
			this.cancelMoveTo();
			
			this.startV2 = new Vector2( this.direction, this.elevation );
		
			this.grabbing = true;
			this.setAttribute( 'grabbing', '' );
			this.dispatch( 'grab' );
			
		} );
		
		this.controls.addEventListener( 'end', () => {
			if ( this.startV2 ) {
				// determine position difference from start to end
				let diff = new Vector2( Math.abs(this.startV2.x - this.direction), Math.abs(this.startV2.y - this.elevation) );
				if ( diff.x > 180 ) diff.x = 360 - diff.x;
				this.lastMove = diff.x + diff.y;
				if ( this.lastMove < 0.1 ) this.lastMove = 0;
			}
			this.grabbing = false;
			this.removeAttribute( 'grabbing' );
			this.dispatch( 'release' );
			
		} );
		
		this.controls.addEventListener( 'change', () => {
			let elevation = this.elevationFromGround;
			if ( elevation <= 0 ) {
				this.groundAlpha = 0;
			} else if ( elevation < 5 ) {
				this.groundAlpha = elevation / 5;
			} else {
				this.groundAlpha = 1;
			}
			this.updateReflection();

			this.dispatch( 'move' );
			
			this.hasMoved = true;
		} );


		this.ambientLS = new AmbientLight( 0xffffff, 0.5, 0, 2 );
		this.scene.add( this.ambientLS );
		
		this.cameraLS = new PointLight( 0xffffff, 0, 0, 2 );
		this.camera.add( this.cameraLS );		
		
		this.pointLS = new PointLight( 0xffffff, 0.5, 0, 2 );
		this.scene.add( this.pointLS );
		
	
	}
	
	
	updateSize() {
		
		this.size.set( this.offsetWidth, this.offsetHeight );
		
		this.camera.aspect = this.size.x / this.size.y;
		this.camera.updateProjectionMatrix();

		this.renderer.setSize( this.size.x, this.size.y );
		
		if ( this.softShadow ) this.softShadow.setSize( this.effectResolution ); 
		if ( this.softReflection ) this.softReflection.setSize( this.effectResolution );
		
		this.needsResize = false;
		
	}
	

	addModel( obj3d, info={} ) {

		delete this.loader;
		
		if ( this.disposed ) return;
		
		
		// tonemaping
		
		if ( info.sRGB ) {
			this.renderer.outputEncoding = sRGBEncoding;
			this.renderer.toneMapping = LinearToneMapping;
			this.renderer.physicallyCorrectLights = true;
			
		} else {
			this.renderer.outputEncoding = LinearEncoding;
			this.renderer.toneMapping = NoToneMapping;
			this.renderer.physicallyCorrectLights = false;
			
		}
		
		
		// anisotrophy / dithering
		
		obj3d.traverse( child => {
			if ( child.isMesh && child.material ) {
				child.material.dithering = true;
				if ( child.material.map ) child.material.map.anisotropy = this.limitAnisotropy(4);
			}
		} );

		
		// fit model
		
		this.model.position.set(0, 0, 0);
			
		let box = new Box3().setFromObject( obj3d );
		
		let size = new Vector3();
		box.getSize( size );
		
		let max_extent = Math.max( size.x, size.y, size.z );
		
		this.autoScale = 1 / max_extent;
		this.model.scale.setScalar( this.autoScale );
		
		this.model.add( obj3d );

		this.defaultCenter = new Vector3( 0, (box.min.y+box.max.y) / 2 * this.autoScale, 0);

		
		this.state = STATES.LOADED;
		
		this.updateCenter();
		this.updateDirection();
		this.updateElevation();
		this.updateZoom();
		this.updateWireframe();
		this.updateColor();
		this.updateAutorotate();
		this.updateEnvironment();
		this.updatePointLightPosition();
		
		
		// materials
		
		this.materials = this.getMaterials();
		
		
		// animation
		
		this.mixer = new AnimationMixer( this.model );
		this.animations = obj3d.animations;
		this.duration = 0;
		this.actions = [];
		
		if ( this.animations && this.animations[0] ) {
		
			this.animations.forEach( clip => {
				
				let action = this.mixer.clipAction( clip, obj3d );
				action.setLoop( LoopOnce );
				action.clampWhenFinished = true;
				this.actions.push( action );
				
				// get longest duration
				if ( clip.duration > this.duration ) this.duration = clip.duration;
				
			} );
		
			this.time = this.start;
		
		}
		

		/* warm up render */
		
		this.model.traverse( child => child.frustumCulled = false );
		this.renderer.render(this.scene, this.camera);
		this.renderer.clear();
		this.model.traverse( child => child.frustumCulled = true );
			
			
		this.needsResize = true;
		this.requestRender();
			

		if ( this.debug ) {	
			setTimeout( ()=>{
				
				let objs = [];
				obj3d.traverse( child => {
					objs.push( '- '.repeat(this.countObjectDepth(child)) + (child.name || '(Unnamed Object)') );
				} );
				console.log( 'Hierarchy: \n' + objs.join('\n') );
				
				let names = [];
				let materials = this.getMaterials();
				for ( let material of materials ) {
					names.push( material.name || '(Unnamed Material)' );
				}
				console.log( 'Materials: ' + names.join(' ') );
				console.log( 'Animated: ' + (this.actions[0] ? 'yes' : 'no') );
				console.log( 'Scaling factor: '+this.autoScale );
			}, 1 );
		}
		
		
		this.setAttribute( 'state', 'loaded' );
		this.dispatch( 'load' );		
		
	}
	

	
	removeModel() {
		
		if (this.mixer) this.mixer.stopAllAction();
		this.mixer = null;
		this.animations = null;
		this.actions = [];
		
		this.model.traverse( child => this.model.remove(child) );
		
		this.model.scale.setScalar( 1 );
		this.model.position.set(0, 0, 0);
		
		this.state = STATES.EMPTY;
		this.removeAttribute( 'state' );
		
		this.materials = null;
		
	}
	
	
	updateEnvironment() {

		if ( this.state === STATES.PENDING ) return;
		
		let materials = this.getMaterials();
		for ( let material of materials ) {
			Object.assign( material, {
				envMap : this.envMap,
				reflectivity : this.getReflectivityBySpecular(material),
				combine : MixOperation
			} );
			//console.log( material.name + ' : ' + this.getReflectivityBySpecular(material) );
		}
		
		this.scene.background = ( this.envBackground && this.envMap ) ? this.envMap : null;
		
		this.requestRender();
		
	}

	
	// start render loop if not running
	
	requestRender() {
		
		if ( this.renderRequestId ) return;
		this.renderRequestId = requestAnimationFrame( ()=>this.render() );
		
	}
	
	cancelRender() {
		
		if ( ! this.renderRequestId ) return;
		cancelAnimationFrame( this.renderRequestId );
		delete this.renderRequestId;
		
	}
	
	needsRender() {
		
		return this.visible && this.withinView && (
			this.autorotate ||
			this.grabbing ||
			this.hasMoved ||
			this.scriptedAnimations.count ||
			this.playing
		);
		
	}
	
	
	render() {
		
		delete this.renderRequestId;
		
		if ( this.state !== STATES.LOADED ) return;
		
		if ( this.needsResize ) {
			this.updateSize();
		}		
		
		if ( this.needsRender() ) {
			this.requestRender();
		}
		
		if ( this.sleeping ) {
			this.wakeupCallback();
		}		
		
		let delta = this.clock.getDelta();
		if ( delta > 0.1 ) delta = 0.1;
		
		this.scriptedAnimations.update( delta );
		
		
		this.hasMoved = false;
		this.controls.update( delta );

		if ( ! this.moveAni ) this.autoRotation.update( delta, this.hasMoved );
		
		if ( this.playing ) this.updateAnimation( delta );
		
		if ( this.debug ) this.updateDebug();
		
		if ( this.shadow ) this.softShadow.renderIfNeeded( this );
		
		this.renderer.render( this.scene, this.camera );
				
		this.overlays.update();
		
		this.dispatch( 'render' );
		
		if ( ! this.renderRequestId ) {
			this.sleepCallback();
		}		
		
	}
	
	
	updateAnimation( delta ) {
		
		// no animation to play?
		if ( ! this.mixer || ! this.actions[0] ) {
			this.playing = false;
			return;
		}
		
		
		// scale delta
		delta *= this.speed;
		
		
		// jump to start time
		if ( this.mixer.time < this.start ) {
			delta += this.start - this.mixer.time;
		}
		
		
		// finish and loop
		
		if ( this.mixer.time >= this.endTime ) {
			if ( this.loop ) {
				this.time = this.start + (this.endTime - this.mixer.time);
				this.dispatch( 'loop' );
				
			} else {
				this.time = this.endTime;
				this.playing = false;
				delta = 0;
				this.dispatch( 'finish' );
			}
		}
		
		this.mixer.update( delta );		
		
	}
	
	
	
	/* public */
	
	update() {
		this.requestRender();
	}

	
	/* public */
	
	moveTo( properties, options={} ) {
		
		this.autoRotation.interrupt();
		this.cancelMoveTo();
		
		let max_diff = 0;
		
		let aniprops = {};
		if ( properties.direction !== undefined ) {
			aniprops.direction = properties.direction;
			let diff = Math.abs( properties.direction - this.direction );
			if ( diff > 180 ) diff = 360 - diff;
			max_diff = Math.max( max_diff, diff );
		}
		if ( properties.elevation !== undefined ) {
			aniprops.elevation = properties.elevation;
			let diff = Math.abs( properties.elevation - this.elevation );
			max_diff = Math.max( max_diff, diff );
		}
		if ( properties.zoom !== undefined ) {
			aniprops.zoom = properties.zoom;
			let diff = Math.abs( properties.zoom - this.zoom ) * 45;
			max_diff = Math.max( max_diff, diff );
		}
		if ( properties.center !== undefined ) {
			aniprops.center = properties.center;
			let size = new Vector3();
			let diff = this.toNormalizedUnits( this.getVector3(properties.center) ).distanceTo( this.centerV3 ) * 100;
			max_diff = Math.max( max_diff, diff );
		}
		
		let duration = 0.2 + max_diff / 100 / (options.speed || 1);
		
		this.moveAni = this.scriptedAnimations.add( {
			target : this,
			properties : aniprops,
			duration : duration,
			easing : options.easing,
			onfinish : () => {
				delete this.moveAni;
				if ( typeof options.onfinish === 'function' ) options.onfinish.bind(this)();
			},
			oncancel : () => {
				delete this.moveAni;
				if ( typeof options.oncancel === 'function' ) options.oncancel.bind(this)();
			}
		} );
		
		this.requestRender();
		
		return this.moveAni;
	}
	
	
	cancelMoveTo() {
		if ( this.moveAni ) {
			this.moveAni.cancel();
			delete this.moveAni;
		}
	}
	

	/* public */
	
	animateTo( properties, options={} ) {
		
		let ccprops = {};
		for ( let p in properties ) {
			ccprops[ this.toCamelCase(p) ] = properties[p];
		}
		
		let ani = {
			target : this,
			properties : ccprops
		};
		
		Object.assign( ani, options );
		
		this.requestRender();
		
		return this.scriptedAnimations.add( ani );
		
	}
	

	/* public */
	
	raycast( clientX=0, clientY=0 ) {
		
		let empty_res = {name: "", object: null, origin: "", hit: ""};
		
		clientX = this.getNumber( clientX );
		clientY = this.getNumber( clientY );

		let bounds = this.getBoundingClientRect();
		
		let x = clientX - bounds.left;
		let y = clientY - bounds.top;
		
		if ( x < 0 || y < 0 || x > bounds.width || y > bounds.height ) return empty_res;
		
		let normalized = new Vector2( x / bounds.width * 2 - 1, y / bounds.height * -2 + 1 );
		this.raycaster.setFromCamera( normalized, this.camera );
		let results = this.raycaster.intersectObject( this.model, true );
		let output;
		
		// ignore invisble, unnamed u. names beginning with underscore
		for ( let result of results ) {
			if ( ! result.object.visible || ! result.object.name || result.object.name.substr(0,1)==='_' ) continue;
			output = result;
			break;			
		}
		
		
		if ( output ) {
			return {
				name: output.object.name,
				object: output.object,
				origin : this.toModelUnits( output.object.getWorldPosition(new Vector3()) ).toArray().join(' '),
				hit: this.toModelUnits( output.point ).toArray().join(' '),
			};
			
		} else {
			return empty_res;
			
		}
	}
	
	
	/* public */
	
	getObject( name ) {
		
		this.requestRender();
		return this.model.getObjectByName(name);
	
	}
	
	/* public */
	
	getPosition( name ) {
		
		this.requestRender();
		
		let obj = this.model.getObjectByName(name);
		
		if ( ! obj ) {
			return '0 0 0';
		}
		
		return this.toModelUnits( obj.getWorldPosition(new Vector3()) ).toArray().join(' ');
		
	}
	

	/* public */
	
	getMaterial( name ) {
		
		if ( ! this.materials ) return null;
		
		this.requestRender();
		
		for ( let material of this.materials ) {
			if ( material.name === name ) return material;
		}
		
		return null;
		
	}
	

	
	
	// basic, toon, phong
	
	changeMaterialType( name, type ) {
		
		this.requestRender();
		
		let material = this.getMaterial( name );
		
		if ( ! material) return null;
		
		
		let new_material;
		if ( type === 'basic' ) {
			new_material = new MeshBasicMaterial();
		} else if ( type === 'toon' ) {
			new_material = new MeshToonMaterial();
		} else {
			new_material = new MeshPhongMaterial();
		}
		
		new_material.copy( material );
			
		
		// replace materials
		
		this.model.traverse( child => {
			if ( child.isMesh && child.material ) {
				if ( child.material[0] ) { // array of materials
					let material_array = [];
					for ( let mat of child.material ) {
						if ( mat.name === name ) {
							material_array.push( new_material );
						} else { // unchanged
							material_array.push( mat );
						}
					}
					child.material = material_array;
					
				} else { // single material
					if ( child.material.name === name ) child.material = new_material;
					
				}
			}
		} );
		
		if ( this.materials ) {
			this.materials.delete( material );
			this.materials.add( new_material );
		}
		
		return new_material;
		
	}
	
	
	getMaterials() {
		
		let materials = new Set();
		
		this.model.traverse( child => {
			if ( child.isMesh && child.material ) {
				if ( child.material[0] ) { // array of materials
					for ( let mat of child.material ) {
						materials.add( mat );
					}
				} else {
					materials.add( child.material );
				}
			}
		} );
		
		return materials;
		
	}

	
	
	/* attributes */
	
	static get observedAttributes() {		
		return [
			'src',					
			'resource-path',		
			'draco-path',		
			// 'loading',	// not observed
				
			'env',				
			//'env-reflectivity',		//a
			'env-background',		
			
			'ratio',
				
			'playing',				
			'loop',					
			'speed',				//a
			'time',					//a
			'start',				
			'end',					

			'direction',			//a
			'direction-limit',		
			'elevation',			//a
			'elevation-limit',		
			'center',				//a
	
			'zoomable',				
			'zoom',					//a
			'zoom-limit',			
	
			'grabbable',				
			'look-around',				
			'inertia',				
				
			'autorotate',			
			'autorotate-delay',		
			'autorotate-speed',		//a
			'autorotate-elevation',	
			
			'ambient-light',		//a
			'ambient-light-color',	//a
			'point-light',			//a
			'point-light-position',	//a
			'point-light-color',	//a
			'camera-light',			//a
			'camera-light-color',	//a
			
			'reflection',			//a
			'reflection-softness',	//a
			'reflection-color',		//a
			'shadow',				//a
			'shadow-softness',		//a
			'shadow-color',			//a
			
			'wireframe',			
			'color',				//a
							
			'debug',				
		];
	}
	
	
	attributeChangedCallback( attr, old, val ) {
		
		if ( this.ignoreAttributeChange ) return;		
		if ( this.state === STATES.PENDING ) return;
		this[ this.toCamelCase(attr) ] = val;
	
	}
	
	
	toCamelCase( name ) {
		
		let [first, ...others] = name.split('-');
		
		if ( ! others.length ) return first;
		
		let s = first;
		others.forEach(	part => { s += part.charAt(0).toUpperCase() + part.slice(1) } );
		return s;
		
	}
	
	
	reflectToAttribute( attr, val='' ) {
		
		if ( this.state === STATES.PENDING ) return;
		
		setTimeout( () => {
			this.ignoreAttributeChange = true;
			if ( val === null ) {
				this.removeAttribute( attr );
			} else {
				this.setAttribute( attr, val );
			}
			this.ignoreAttributeChange = false;
		}, 1 );
		
	}
	
	
	
	set src( v ) {
		this._src = this.getString(v);
		this.reflectToAttribute( 'src', this._src || null );
		this.updateSrc();		
		this.updateLookAround();
	}
	
	get src() {
		return this._src;
	}
	
	updateSrc() {

		if ( this.state === STATES.PENDING ) return;
	
		this.removeModel();
				
		if ( ! this.src && ! this.env ) return;
		
		this.state = STATES.LOADING;
		this.setAttribute( 'state', 'loading' );
	
		if ( this.loader ) {
			this.loader.abort();
		}
		
		setTimeout( () => {
		
			this.loader = new ModelLoader();
			this.loader.load(
				this.src,
				this.resourcePath,
				this.dracoPath,
				( obj3d, info={} ) => {
					// on inital load, also load env before complete
					if ( this.env && ! this.envLoaded ) {
						this.updateEnvSrc( () => {
							this.addModel( obj3d, info );
						} );
					} else {
						this.addModel( obj3d, info );
					}
				},
				( msg ) => this.failCallback(msg),
				this.debug
			);
		
		}, 1);
		
	}
	

	
	set resourcePath( v ) {
		this._resourcePath = this.getString(v);
		this.reflectToAttribute( 'resource-path', this._resourcePath || null );
	}	
	get resourcePath() {
		return this._resourcePath;
	}
	
	
	set dracoPath( v ) {
		this._dracoPath = this.getString(v);
		this.reflectToAttribute( 'draco-path', this._dracoPath || null );
	}	
	get dracoPath() {
		return this._dracoPath;
	}	
	
	
	set env( v ) {
		this._env = this.getString(v);
		this.reflectToAttribute( 'env', this._env || null );
		this.updateEnvSrc();
		this.updateLookAround();
	}
	
	get env() {
		return this._env;
	}
	
	updateEnvSrc( completeCallback ) {

		if ( this.state === STATES.PENDING ) return;
	
		if ( ! this.env ) {
			this.envMap = null;
			this.updateEnvironment();
			return;
		}
		
		if ( this.envLoader ) {
			this.envLoader.abort();
		}
		
		this.envLoader = new ModelLoader();
		this.envLoader.loadEnv(
			this.env,
			( envMap ) => {
				this.envMap = envMap;
				this.envLoaded = true;
				if ( completeCallback ) {
					completeCallback();
				} else {
					this.updateEnvironment();
				}
			},
			( msg ) => this.failCallback(msg),
			this.debug
		);	
		
	}
	
	
	set envBackground( v ) {
		this._envBackground = this.getBoolean(v);
		this.reflectToAttribute( 'env-background', this._envBackground ? '' : null );
		this.updateEnvironment();
	}	
	get envBackground() {
		if ( this.env && ! this.src ) return true; // always show background in env mode (no model present)
		return this._envBackground;
	}
	
	
	/*
	set envReflectivity( v ) {
		this._envReflectivity = this.getNumber( v, 0.25, 0, 1 );
		this.reflectToAttribute( 'env-reflectivity', this.isSet(v) ? this._envReflectivity : null );
		this.updateEnvironment();
	}
	get envReflectivity() {
		return this._envReflectivity;
	}
	*/
	
	
	set ratio( v ) {
		if ( v && String(v).includes(':') ) {
			let [w, h] = String(v).split(':');
			this._ratio  = this.getNumber( w, 1, 1 ) + ":" + this.getNumber( h, 1, 1 );
			this.reflectToAttribute( 'ratio', this._ratio );
		} else {
			this._ratio = '1:1';
			this.reflectToAttribute( 'ratio', null );
		}
		
		let [w, h] = this._ratio.split(':');
		this.ratioDiv.style.paddingTop = h / w * 100 + '%';
	}
	get ratio() {
		this._ratio;
	}

	
	set playing( v ) {
		this._playing = this.getBoolean(v);
		this.reflectToAttribute( 'playing', this._playing ? '' : null );
		
		if ( this._playing && this.actions[0] ) {
			if ( this.time == this.endTime ) { // at end?
				this.time = this.start;
			}
			this.requestRender();
		}
	}	
	get playing() {
		return this._playing;
	}
	
	
	set time( v ) {
		this._time = this.getNumber( v, 0, 0 );
		this.updateTime();	
	}
	get time() {
		if ( ! this.mixer || ! this.actions[0] ) return this._time || 0;
		return this.mixer.time;
	}
	
	updateTime() {
		if ( this.mixer && this.actions[0] ) {
			for ( let action of this.actions ) {
				action.reset();
				action.play();
			}
			this.mixer.time = 0;
			this.mixer.update( this._time );
			this.requestRender();	
		}
	}
	
	
	set loop( v ) {
		this._loop = this.getBoolean(v);
		this.reflectToAttribute( 'loop', this._loop ? '' : null );
	}
	get loop() {
		return this._loop;
	}
	
	
	set speed( v ) {
		this._speed = this.getNumber( v, 1 );
		this.reflectToAttribute( 'speed', this.isSet(v) ? this._speed : null );
	}
	get speed() {
		return this.getNumber( this._speed, 1 );
	}
	
		
	set start( v ) {
		this._start = this.getNumber( v, 0, 0 );
		this.reflectToAttribute( 'start', this.isSet(v) ? this._start : null );
		if ( this.isSet(v) && this.isSet(this._end) && this._end < this._start ) {
			this.end = this._start;
		}
	}
	get start() {
		return this._start || 0;
	}
	
	
	set end( v ) {
		this._end = this.getNumber( v, null );
		this.reflectToAttribute( 'end', this.isSet(v) ? this._end : null );
		if ( this.isSet(v) && this.isSet(this._start) && this._start > this._end ) {
			this.start = this._end;
		}
	}
	get end() {
		return this._end;
	}
	
	get endTime() {
		if ( this.end && this.end < this.duration ) {
			return this.end;
		} else {
			return this.duration;
		}
	}
	
	
	set autorotate( v ) {
		this._autorotate = this.getBoolean( v );
		this.reflectToAttribute( 'autorotate', this._autorotate ? '' : null );
		this.updateAutorotate();
	}
	get autorotate() {
		return this._autorotate;
	}

	updateAutorotate() {
		if ( this.state === STATES.PENDING ) return;
		
		if ( this._autorotate ) {
			this.autoRotation.enable();
			this.requestRender();
		} else {
			this.autoRotation.disable();
		}
	}
	
	
	set autorotateDelay( v ) {
		this._autorotateDelay = this.getNumber( v, 0, 0 );
		this.reflectToAttribute( 'autorotate-delay', this.isSet(v) ? this._autorotateDelay : null );
		this.autoRotation.delay = this._autorotateDelay;
		if ( this.autoRotation.waitTime > this.autoRotation.delay ) this.autoRotation.waitTime = this.autoRotation.delay;
	}
	get autorotateDelay() {
		return this._autorotateDelay;
	}
	
	set autorotateSpeed( v ) {
		this._autorotateSpeed = this.getNumber( v, 1 );
		this.reflectToAttribute( 'autorotate-speed', this.isSet(v) ? this._autorotateSpeed : null );
		this.autoRotation.speed = this._autorotateSpeed;
	}
	get autorotateSpeed() {
		return this._autorotateSpeed;
	}
	
	set autorotateElevation( v ) {
		this._autorotateElevation = this.getNumber( v, null, -90, 90 );
		this.reflectToAttribute( 'autorotate-elevation', this.isSet(v) ? this._autorotateElevation : null );
		if ( this._autorotateElevation !== null ) {
			this.autoRotation.polarAngle = MathUtils.degToRad( this._autorotateElevation * -1 + 90 );
		} else {
			delete this.autoRotation.polarAngle;			
		}
	}
	get autorotateElevation() {
		return this._autorotateElevation;
	}

	
	
	set inertia( v ) {
		this._inertia = this.getNumber( v, 0.5, 0, 1 );
		this.reflectToAttribute( 'inertia', this.isSet(v) ? this._inertia : null );
		
		if ( this._inertia ) {
			this.controls.enableDamping = true;
			this.controls.dampingFactor = 1 / this._inertia / 20;
		} else {
			this.controls.enableDamping = false;			
		}
	}
	get inertia() {
		return this._inertia;
	}
	
	
	
	set ambientLight( v ) {
		this._ambientLight = this.getNumber( v, 0.5, 0 );
		this.reflectToAttribute( 'ambient-light', this.isSet(v) ? this._ambientLight : null );
		
		if ( this._ambientLight ) {
			this.ambientLS.visible = true;			
			this.ambientLS.intensity = this._ambientLight;
		} else {			
			this.ambientLS.visible = false;
		}
		this.requestRender();
	}
	get ambientLight() {
		return this._ambientLight;
	}
		
	set ambientLightColor( v ) {
		this._ambientLightColor = this.getValue( v, '#ffffff' );
		this.reflectToAttribute( 'ambient-light-color', this.isSet(v) ? this.getHexColor(this._ambientLightColor) : null );
		this.ambientLS.color = new Color( this._ambientLightColor );
		this.requestRender();
	}
	get ambientLightColor() {
		return this._ambientLightColor;
	}

	
	set pointLight( v ) {
		this._pointLight = this.getNumber( v, 0.5, 0 );
		this.reflectToAttribute( 'point-light', this.isSet(v) ? this._pointLight : null );
		
		if ( this._pointLight ) {
			this.pointLS.visible = true;			
			this.pointLS.intensity = this._pointLight;
		} else {			
			this.pointLS.visible = false;
		}		
		this.requestRender();
	}
	get pointLight() {
		return this._pointLight;
	}
	
	
	set pointLightPosition( v ) {
		if ( this.isSet(v) ) {
			this._pointLightPosition = this.getVector3(v);
			this.reflectToAttribute( 'point-light-position', this._pointLightPosition.toArray().join(' ') );
		} else {
			delete this._pointLightPosition;
			this.reflectToAttribute( 'point-light-position', null );
		}
		this.updatePointLightPosition();
		this.requestRender();
	}
	
	get pointLightPosition() {
		if ( this.state !== STATES.LOADED ) return '0 0 0';
		if (this._pointLightPosition) return this._pointLightPosition.toArray().join(' ');
		return this.defaultPointLightPosition.toArray().join(' ');
	}
	
	get defaultPointLightPosition() {
		return new Vector3(0, this.autoScale * 1.2 , 0);
	}
	
	updatePointLightPosition() {
		if ( this.state !== STATES.LOADED ) return;
		
		let pos;
		if (this._pointLightPosition) pos = this._pointLightPosition;
		else pos = this.defaultPointLightPosition;
		
		this.pointLS.position.copy( this.toNormalizedUnits(pos) );		
	}
	
	
	
	set pointLightColor( v ) {
		this._pointLightColor = this.getValue( v, '#ffffff' );
		this.reflectToAttribute( 'point-light-color', this.isSet(v) ? this.getHexColor(this._pointLightColor) : null );
		this.pointLS.color = new Color( this._pointLightColor );
		this.requestRender();
	}
	get pointLightColor() {
		return this._pointLightColor;
	}
	
	
	set cameraLight( v ) {
		this._cameraLight = this.getNumber( v, 0, 0 );
		this.reflectToAttribute( 'camera-light', this.isSet(v) ? this._cameraLight : null );
		
		if ( this._cameraLight ) {
			this.cameraLS.visible = true;			
			this.cameraLS.intensity = this._cameraLight;
		} else {			
			this.cameraLS.visible = false;
		}		
		this.requestRender();
	}
	get cameraLight() {
		return this._cameraLight;
	}
		
	set cameraLightColor( v ) {
		this._cameraLightColor = this.getValue( v, '#ffffff' );
		this.reflectToAttribute( 'camera-light-color', this.isSet(v) ? this.getHexColor(this._cameraLightColor) : null );
		this.cameraLS.color = new Color( this._cameraLightColor );
		this.requestRender();
	}
	get cameraLightColor() {
		return this._cameraLightColor;
	}
	

	
	set reflection( v ) {
		this._reflection = this.getNumber( v, 0, 0, 1 );
		this.reflectToAttribute( 'reflection', this.isSet(v) ? this._reflection : null );
		this.updateReflection();
	}
	get reflection() {
		return this._reflection;
	}
	
	updateReflection() {
		
		if ( this._reflection ) {
		
			if ( ! this.softReflection ) {
				
				this.softReflection = new SoftReflection( {
					renderer : this.renderer,
					scene : this.scene,
					camera : this.camera,
					size: this.effectResolution,
					multisample: this.renderer.capabilities.isWebGL2,
				} );

				this.scene.add( this.softReflection.plane );
				
			}
			
			this.softReflection.opacity = this._reflection * this.groundAlpha;
			this.softReflection.softness = this._reflectionSoftness;
			this.softReflection.color = this._reflectionColor;
			
		} else {
			
			if ( this.softReflection ) {
				this.softReflection.dispose();
				this.scene.remove( this.softReflection.plane );
				delete this.softReflection;
			}

		}
		this.requestRender();
		
	}

	set reflectionSoftness( v ) {
		this._reflectionSoftness = this.getNumber( v, 0, 0, 2 );
		this.reflectToAttribute( 'reflection-softness', this.isSet(v) ? this._reflectionSoftness : null );
		this.updateReflection();
	}
	get reflectionSoftness() {
		return this._reflectionSoftness;
	}
	
	set reflectionColor( v ) {
		this._reflectionColor = this.getValue( v, '#ffffff' );
		this.reflectToAttribute( 'reflection-color', this.isSet(v) ? this.getHexColor(this._reflectionColor) : null );
		this.updateReflection();
	}
	get reflectionColor() {
		return this._reflectionColor;
	}

	

	set shadow( v ) {
		this._shadow = this.getNumber( v, 0, 0, 1 );
		this.reflectToAttribute( 'shadow', this.isSet(v) ? this._shadow : null );
		this.updateShadow();
	}
	get shadow() {
		return this._shadow;
	}
	
	updateShadow() {
		
		if ( this._shadow ) {
		
			if ( ! this.softShadow ) {			
				this.softShadow = new SoftShadow( {
					renderer: this.renderer,
					scene: this.scene,
					size: this.effectResolution,
					element: this
				} );
				this.scene.add( this.softShadow.plane );				
			}
			
			this.softShadow.opacity = this._shadow;
			this.softShadow.softness = this._shadowSoftness;
			this.softShadow.color = this._shadowColor;
			
		} else {
			
			if ( this.softShadow ) {
				this.softShadow.dispose();
				this.scene.remove( this.softShadow.plane );
				delete this.softShadow;
			}

		}
		this.requestRender();
		
	}
	
	set shadowSoftness( v ) {
		this._shadowSoftness = this.getNumber( v, 1, 0, 2 );
		this.reflectToAttribute( 'shadow-softness', this.isSet(v) ? this._shadowSoftness : null );
		this.updateShadow();
	}
	get shadowSoftness() {
		return this._shadowSoftness;
	}
	
	set shadowColor( v ) {
		this._shadowColor = this.getValue( v, '#000000' );
		this.reflectToAttribute( 'shadow-color', this.isSet(v) ? this.getHexColor(this._shadowColor) : null );
		this.updateShadow();
	}
	get shadowColor() {
		return this._shadowColor;
	}
	
	
	
	set grabbable( v ) {
		this.controls.enableRotate = this.getBoolean(v, true);
		this.reflectToAttribute( 'grabbable', this.controls.enableRotate ? null : 'false' );
	}
	get grabbable() {
		return this.controls.enableRotate;
	}
	
	set lookAround( v ) {
		this._lookAround = this.getBoolean( v );
		this.reflectToAttribute( 'look-around', this._lookAround ? '' : null );
		this.updateLookAround();
	}
	get lookAround() {
		if ( this.env && ! this.src ) return true; // always look around in env mode (no model present)
		return this._lookAround;
	}
	
	updateLookAround() {
		if ( this.lookAround ) {
			this.controls.rotateSpeed = -0.16;
			this.zoomable = false;
			this.zoom = 0.01;
			this.zoomLimit = '0.01 100';
		} else {
			this.controls.rotateSpeed = 1;			
		}
	}
	
	
	
	
	set debug( v ) {
		this._debug = this.getBoolean( v );
		this.reflectToAttribute( 'debug', this._debug ? '' : null );
		
		if ( this._debug ) {
			if ( ! this.debugX ) {
				
				let circle = new BufferGeometry();
				let segments = 64, radius = 0.5;
				let vertices = new Float32Array(segments*3);
				let angle = 2 * Math.PI / segments;
				for (let i = 0; i < segments*3; i+=3) {
					vertices[i] = radius * Math.cos(angle * i/3);
					vertices[i+1] = radius * Math.sin(angle * i/3);
					vertices[i+2] = 0;
				}
				circle.setAttribute( 'position', new BufferAttribute( vertices, 3 ) );
				
				this.debugCircle = new LineLoop( circle, new LineBasicMaterial( { color: 'cyan' } ) );
				this.debugCircle.rotateX( - Math.PI / 2 );
				this.debugCircle.position.y = -0.01;
				this.debugCircle.layers.set(1);
				this.scene.add( this.debugCircle );
				
				this.debugCenter = new Mesh( new SphereGeometry( 0.012, 8, 6 ), new MeshBasicMaterial( { color: 'cyan', depthTest: false, transparent: true } ) );
				this.debugCenter.layers.set(1);
				this.scene.add( this.debugCenter );

				this.debugX = new ArrowHelper( new Vector3(1,0,0), new Vector3(-1,0,0), 2, 0xff0000, 0.05, 0.025 );
				this.debugX.layers.set(1);
				this.scene.add( this.debugX );
				
				this.debugY = new ArrowHelper( new Vector3(0,1,0), new Vector3(0,-1,0), 2, 0x00ff00, 0.05, 0.025 );
				this.debugY.layers.set(1);
				this.scene.add( this.debugY );
				
				this.debugZ = new ArrowHelper( new Vector3(0,0,-1), new Vector3(0,0,1), 2, 0x0000ff, 0.05, 0.025 );
				this.debugZ.layers.set(1);
				this.scene.add( this.debugZ );
				
				
				this.pointLSHelper = new PointLightHelper( this.pointLS, 0.075, 0xffa500 );
				this.scene.add( this.pointLSHelper );
				
				
				this.wrap.insertAdjacentHTML(
					'beforeend',
					`<span part="debug" class="debug-text debug-state"><span class="debug-sleep">sleeping</span></span>
					<span part="debug" class="debug-text debug-direction"></span>
					<span part="debug" class="debug-text debug-elevation"></span>
					<span part="debug" class="debug-text debug-zoom"></span>	
					<span part="debug" class="debug-text debug-center"></span>`
				);
			}			
			
		} else if ( this.debugX ) {
			
			this.scene.remove( this.debugCircle );
			delete this.debugCircle;
			/*
			this.scene.remove( this.debugDirection );
			delete this.debugDirection;
			*/
			
			this.scene.remove( this.debugCenter );
			delete this.debugCenter;

			this.scene.remove( this.debugX );
			delete this.debugX;
			this.scene.remove( this.debugY );
			delete this.debugY;
			this.scene.remove( this.debugZ );
			delete this.debugZ;

			this.scene.remove( this.pointLSHelper );
			delete this.pointLSHelper;
			
			this.root.querySelectorAll('.debug-text').forEach( item => item.remove() );
			
		}		
		this.requestRender();
	}
	
	get debug() {
		return this._debug;
	}
	
	updateDebug() {
		
		this.root.querySelector('.debug-sleep').style.display = (this.sleeping) ? '' : 'none';
		this.root.querySelector('.debug-direction').textContent = 'direction: ' + Math.round(this.direction) + '°';
		this.root.querySelector('.debug-elevation').textContent = 'elevation: ' + Math.round(this.elevation) + '°';
		this.root.querySelector('.debug-zoom').textContent = 'zoom: ' + this.zoom.toFixed(2);
		let [x, y, z] = this.center.split(' ');
		this.root.querySelector('.debug-center').textContent = 'center: ' + Number(x).toFixed(5) + ' ' + Number(y).toFixed(5) + ' ' + Number(z).toFixed(5);
		
		this.debugCenter.position.copy( this.centerV3 );
		let s = this.zoom * (320 / this.size.y);
		this.debugCenter.scale.set( s, s, s );
		
		this.pointLSHelper.visible = this.pointLight > 0;
		
	}
	
	
	set center( v ) {
		if ( this.isSet(v) ) {
			this._center = this.getVector3(v);
			this.reflectToAttribute( 'center', this._center.toArray().join(' ') );
		} else {
			delete this._center;
			this.reflectToAttribute( 'center', null );
		}
		this.updateCenter();
	}
	
	get center() {
		if ( ! this._center ) return this.toModelUnits(this.defaultCenter).toArray().join(' ');
		return this._center.toArray().join(' ');
	}
	get centerV3() {
		if ( ! this._center ) return this.defaultCenter;
		return this.toNormalizedUnits(this._center);
	}
	
	updateCenter() {
		if ( this.state !== STATES.LOADED ) return;
		
		let direction = this.direction;
		let elevation = this.elevation;
		let zoom = this.zoom;
	
		this.controls.target.copy( this.centerV3 );
	
		this.camera.position.setFromSphericalCoords( zoom, MathUtils.degToRad(90 - elevation), MathUtils.degToRad( direction ) ).add( this.controls.target );
	
		this.requestRender();	
	}
	



	set direction( v ) {
		v = this.getNumber( v, 0, -180, 180 );
		this._direction = v;
		this.updateDirection();
	}
	get direction() {
		if ( this.state !== STATES.LOADED ) {
			return this._direction;
		} else {
			let spherical = new Spherical().setFromVector3( this.relativeCameraPosition );
			return MathUtils.radToDeg( spherical.theta );
		}
	}
	
	updateDirection() {
		if ( this.state !== STATES.LOADED ) return;
		this.camera.position.setFromSphericalCoords( this.zoom, MathUtils.degToRad(90 - this.elevation), MathUtils.degToRad( this._direction ) ).add( this.controls.target );
		this.controls.clearDamping();
		this.requestRender();
	}
	
		
	set elevation( v ) {
		v = this.getNumber( v, 0, -89.999, 89.999 );
		this._elevation = v;
		this.updateElevation();
		
	}	
	get elevation() {
		if ( this.state !== STATES.LOADED ) {
			return this._elevation;
		} else {
			let spherical = new Spherical().setFromVector3( this.relativeCameraPosition );
			return 90 - MathUtils.radToDeg( spherical.phi );
		}
	}
	
	updateElevation() {
		if ( this.state !== STATES.LOADED ) return;
		this.camera.position.setFromSphericalCoords( this.zoom, MathUtils.degToRad(90 - this._elevation), MathUtils.degToRad(this.direction) ).add( this.controls.target );
		this.controls.clearDamping();
		this.requestRender();
	}

	set directionLimit( v ) {
		
		if ( this.isSet(v) ) {
			
			v = String(v);
			let min, max;
			
			if ( v.indexOf(' ') !== -1 ) {
				[min, max] = v.split(' ');
			} else { // single value
				min = - Math.abs( v );
				max = Math.abs( v );
			}
			
			min = this.getNumber( min, 0, -180, 180 );
			max = this.getNumber( max, 0, -180, 180 );
			if ( min > max ) [min, max] = [max, min];
			
			this.controls.minAzimuthAngle = MathUtils.degToRad( min );
			this.controls.maxAzimuthAngle = MathUtils.degToRad( max );			
			this.autoRotation.oscillate = true;
			this._directionLimit = `${min} ${max}`;
			this.reflectToAttribute( 'direction-limit', this._directionLimit );			
			
		} else {
		
			this.controls.minAzimuthAngle = - Infinity;
			this.controls.maxAzimuthAngle = Infinity;			
			this.autoRotation.oscillate = false;
			this._directionLimit = '';
			this.reflectToAttribute( 'direction-limit', null );			
		}
		this.requestRender();
		
	}
	get directionLimit() {
		return this._directionLimit;
	}
	
	
	set elevationLimit( v ) {
		
		let min, max;
		
		if ( this.isSet(v) ) {
			
			v = String(v);
		
			if ( v.indexOf(' ') !== -1 ) {
				[min, max] = v.split(' ');
			} else { // single value
				min = - Math.abs( v );
				max = Math.abs( v );
			}
			
			min = this.getNumber( min, 0, -90, 90 );
			max = this.getNumber( max, 0, -90, 90 );
			if ( min > max ) [min, max] = [max, min];
			
		} else {
			
			min = 0;
			max = 90;
			
		}
		
		this.controls.minPolarAngle = MathUtils.degToRad( max * -1 + 90 );
		this.controls.maxPolarAngle = MathUtils.degToRad( min * -1 + 90 );
		this._elevationLimit = `${min} ${max}`;

		if ( this.isSet(v) ) {
			this.reflectToAttribute( 'elevation-limit', this._elevationLimit );	
		} else {
			this.reflectToAttribute( 'elevation-limit', null );	
		}
		this.requestRender();
		
	}
	get elevationLimit() {
		return this._elevationLimit;
	}
	
	
	set zoomLimit( v ) {
		
		let min, max;
		
		if ( v ) {
			
			v = String(v);
		
			if ( v.indexOf(' ') !== -1 ) {
				[min, max] = v.split(' ');
			} else { // single value
				min = 0.1;
				max = Math.abs( v );
			}
			
			min = this.getNumber( min, 0.01, 0.01, 100 );
			max = this.getNumber( max, 100, 0.01, 100 );
			if ( min > max ) [min, max] = [max, min];
			
		} else {
			
			min = 0.01;
			max = 100;
			
		}
		
		this.controls.minDistance = min;
		this.controls.maxDistance = max;
		this._zoomLimit = `${min} ${max}`;
		
		if ( v ) {
			this.reflectToAttribute( 'zoom-limit', this._zoomLimit );	
		} else {
			this.reflectToAttribute( 'zoom-limit', null );	
		}
		this.requestRender();
		
	}
	get zoomLimit() {
		return this._zoomLimit;
	}
	

	set zoomable( v ) {
		this.controls.enableZoom = this.getBoolean( v );
		this.reflectToAttribute( 'zoomable', this.controls.enableZoom ? '' : null );	
	}
	get zoomable() {
		return this.controls.enableZoom;
	}
	
	
	set zoom( v ) {
		this._zoom = this.getNumber( v, 2, 0.01, 100 );		
		this.reflectToAttribute( 'zoom', this.isSet(v) ? this._zoom : null );
		this.updateZoom();
	}
	get zoom() {
		if ( this.state !== STATES.LOADED ) {
			return this._zoom;
		} else {
			return this.relativeCameraPosition.length();
		}
	}
	updateZoom() {
		if ( this.state !== STATES.LOADED ) return;
		this.camera.position.copy(
			this.relativeCameraPosition.normalize().multiplyScalar( this._zoom ).add( this.controls.target )
		);
		this.controls.clearDamping();
		this.requestRender();
	}
	
	
	set wireframe( v ) {
		this._wireframe = this.getBoolean( v );
		this.reflectToAttribute( 'wireframe', this._wireframe ? '' : null );
		this.updateWireframe();
	}
	get wireframe() {
		return this._wireframe;
	}
	updateWireframe() {
		if ( this.state !== STATES.LOADED ) return;
		this.changeAllMaterials( { wireframe : this._wireframe } );	
		this.requestRender();	
	}
	
	
	set color( v ) {
		this._color = v;
		this.reflectToAttribute( 'color', this.isSet(v) ? this.getHexColor(this._color) : null );
		this.updateColor();
	}
	get color() {
		return this._color;
	}
	
	updateColor() {
		if ( this.state !== STATES.LOADED ) return;
		
		if ( this.isSet( this._color ) ) {
			let color = new Color( this._color );
			this.changeAllMaterials( { color : color } );		
			this.requestRender();
		}
	}
	
	
	
	/* helpers */
	
	changeAllMaterials( props ) {
		
		let materials = this.getMaterials();
		for ( let material of materials ) {
			Object.assign( material, props );
		}
		
	}
	
	
	toModelUnits( v3 ) {
		return v3.clone().multiplyScalar( this.autoScale );
	}
	toNormalizedUnits( v3 ) {
		return v3.clone().divideScalar( this.autoScale );
	}
	
	worldToElement( v3 ) {
		
		let w = this.size.x / 2;
		let h = this.size.y / 2;

		let pos = v3.clone().project( this.camera );
		
		return new Vector2(
			( pos.x * w ) + w,
			- ( pos.y * h ) + h
		);
		
	}
	
	relativeToTarget( v3 ) {
		return v3.clone().sub( this.controls.target );
	}
	
	get relativeCameraPosition() {
		return this.relativeToTarget( this.camera.position );
	}
	
	get elevationFromGround() {
		let spherical = new Spherical().setFromVector3( this.camera.position );
		return 90 - MathUtils.radToDeg( spherical.phi );
	}
	
	
	get visible() {
		return this.observer.visible;
	}
	
	get withinView() {
		return this.observer.visible && this.observer.withinView;		
	}
	
	
	countObjectDepth( obj3d ) {
		let count = 0;
		obj3d.traverseAncestors( () => count++ );
		return count - 2; /* subtract scene and model container */
	}	
	
	
	dispatch( type ) {
		
		if ( this.state === STATES.PENDING ) return;
		
		let event = new CustomEvent( type );
		
		// call on-attributes for custom types, native types are called by dispatchEvent
		let onattr = this.getAttribute( 'on'+type );
		if ( onattr && this.isCustomEventType(type) ) {
			 let func = new Function( 'event', onattr );
			 func.call( this, event );
		}
		
		this.dispatchEvent( event, this );	
		
	}
	
	isCustomEventType( type ) {
		
		return typeof this['on'+type] === 'undefined';
		
	}
	
	
	disposeThree( obj ) {
		
		while ( obj.children.length > 0 ) { 
			this.disposeThree( obj.children[0] );
			obj.remove( obj.children[0] );
		}
		
		if ( obj.geometry ) obj.geometry.dispose();
		
		if ( obj.material ) {
			if ( obj.material[0] ) {
				for ( let m of obj.material ) {
					this.disposeMaterial( m );
				}
			} else {
				this.disposeMaterial( obj.material );
			}
		}
		
	}
	
	
	
	disposeMaterial( mat ) {
		
		//dispose textures
		for ( let map of TEXMAPS ) {
			if ( mat[map] ) mat[map].dispose();
		}
		
		mat.dispose();
		
	}
	
	
	dispose() {
		
		this.disposed = true;
		
		this.cancelRender();
		
		this.state = STATES.PENDING;

		if ( this.loader ) {
			this.loader.abort();
			this.loader = null;
		}
		
		this.observer.unobserve();
		this.controls.dispose();
		
		this.scriptedAnimations.dispose();
		this.removeModel();
		

		if ( this.softShadow ) this.softShadow.dispose();
		if ( this.softReflection ) this.softReflection.dispose();

		this.disposeThree( this.scene );

		if ( this.scene.background && this.scene.background.dispose ) this.scene.background.dispose();

		this.renderer.forceContextLoss();
		this.renderer.renderLists.dispose();
		this.renderer.dispose();
		
		this.renderer.domElement.remove();
		this.remove();
		
		this.canvas = null;
		this.scene = null;
		this.camera = null;
		this.renderer = null;		
			
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
	
	getString( val, defaultVal="" ) {
		if ( val === undefined || val === null ) return defaultVal;
		return String(val);
	}
	
	
	// condsider "" (attribute without value) as true and strings "0" and "false" as false
	
	getBoolean( val, defaultVal=false ) {
		if ( val === undefined || val === null ) return defaultVal;
		return (val || val === "") && val !== "0" && val !== "false"; 
	}
	
	getValue( val, defaultVal=null ) {
		if ( ! this.isSet(val) ) return defaultVal;
		return val;
	}
	
	getHexColor( val ) {
		return '#' + ( new Color(val).getHexString() );
	}
	
	isSet( val ) {
		return ( val !== undefined && val !== null && val !== "" );
	}
	
	
	get effectResolution() {
		
		const pixels = this.size.x * this.size.y;
		
		if ( pixels > 1200000 ) {
			return this.limitTextureSize(2048);
		} else if ( pixels > 500000 ) {
			return this.limitTextureSize(1024);			
		}
		
		return 512;
		
	}
	
	
	limitTextureSize( size ) {
		return Math.min( size, this.renderer.capabilities.maxTextureSize );
	}
	
	limitAnisotropy( a ) {
		return Math.min( a, this.renderer.capabilities.getMaxAnisotropy() );
	}
	
	
	getReflectivityBySpecular( material ) {
		if ( ! this.isSet( material.specular ) ) return 0;
		return Math.max( material.specular.r, material.specular.g, material.specular.b );
	}
	
	
};


const STATES = {
	PENDING : 0,
	READY : 1,
	EMPTY: 2,
	LAZY : 3,
	LOADING: 4,
	LOADED: 5
};

const TEXMAPS = [
	'map',
	'normalMap',
	'bumpMap',
	'displacementMap',
	'specularMap',
	'aoMap',
	'alphaMap',
	'metalnessMap',
	'roughnessMap',
	'envMap',
	//'emissiveMap',
	//'lightMap'
];


// init if supported

if ( customElements && WebGLRenderingContext ) {
	customElements.define( 'xzero', XzeroJS );
}


export { XzeroJS };