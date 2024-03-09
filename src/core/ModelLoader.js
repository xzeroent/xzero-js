'use strict';

import {
	LoadingManager,
	FileLoader,
	Mesh,
	MeshPhongMaterial,
	PlaneGeometry,
	TextureLoader,
	EquirectangularReflectionMapping,
} from '../three/three.module.js';

import { GLTFLoader } from "../three/loaders/gltf/GLTFLoader.js";
import { DRACOLoader } from "../three/loaders/gltf/DRACOLoader.js";

import { FBXLoader } from "../three/loaders/fbx/FBXLoader.mod.js";

import { OBJLoader } from "../three/loaders/obj/OBJLoader.js";
import { MTLLoader } from "../three/loaders/obj/MTLLoader.js";

import { STLLoader } from "../three/loaders/stl/STLLoader.js";

const SUPPORTED_TYPES = [
	'gltf',
	'glb',
	'fbx',
	'obj',
	'stl',
];

class ModelLoader {

	constructor() {

		this.aborted = false;
		
		this.manager = new LoadingManager();
				
		this.manager.onStart = ( url, itemsLoaded, itemsTotal ) => {

			if ( this.aborted ) return;
			// the file is loaded and not read from three cache
			this.waitToComplete = true;

		};

		this.manager.onLoad = () => {

			if ( this.aborted ) return;
			if ( this.waitToComplete ) this.callComplete();

		};

		this.manager.onProgress = ( url, itemsLoaded, itemsTotal ) => {

			if ( this.aborted ) return;
			if ( this.debug ) console.log( `Loading file (${itemsLoaded}/${itemsTotal}) ` + ( this.isDataUri(url) ? this.src : url ) );

		};

		this.manager.onError = ( url ) => {

			if ( this.aborted ) return;
			this.aborted = true;
			this.fail( 'Failed loading: ' + ( this.isDataUri(url) ? this.src : url ) );

		};
		
		this.manager.setURLModifier(
			( url ) => {
				
				//console.log( 'URL : ' + url );
				
				if ( this.isDataUri(url) || url === this.src ) { // affect only assets not src
					return url;
					
				} else if ( this.asset_path ) { // discard paths and absolute urls if asset_path is given
					return this.asset_path + this.getBasename( url );
					
				} else if ( this.isAbsolute(url) ) { // return absolute urls unchanged
					return url;
					
				} else { // discard paths and prepend path of src file
					return this.abs_path + this.getBasename( url );		
					
				}				
			}
		);		

	}
	
	
	getFileFormat( src ) {
		
		let extension;
		
		if ( this.isDataUri(src) ) { // data uri with mime-type like model/gltf
			src = src.split(';')[0];
			let parts = src.split('/');
			extension = parts[parts.length - 1].toLowerCase();
			
		} else { // regular url
			src = this.getBasename( src );
			let parts = src.split('.');
			extension = parts[parts.length - 1].toLowerCase();
		
		}
		
		if ( SUPPORTED_TYPES.indexOf(extension) !== -1 ) {
			return extension;
			
		} else {
			return null;
			
		}
		
	}
	
	
	getBasename( filename ) {
		
		// remove querystring
		if ( filename.indexOf('?') !== -1 ) {
			let parts = filename.split('?');
			filename = parts[0];
		}
		
		// remove path
		if ( filename.indexOf('/') !== -1 ) {
			let parts = filename.split('/');
			filename = parts[parts.length - 1];
		}
		
		// remove windows style path
		if ( filename.indexOf('\\') !== -1 ) {
			let parts = filename.split('\\');
			filename = parts[parts.length - 1];
		}
		
		return filename;
		
	}
	
	getPath( filename ) {
		
		if ( ! this.includesPath(filename) ) return '';
		return filename.substr( 0, filename.lastIndexOf('/')+1 );
		
	}
	
	includesPath( url ) {
		return ! this.isDataUri(url) && url.includes('/');
	}
	
	appendSlash( path ) {
		
		if ( ! path ) return '';
		if ( ! path.endsWith('/') ) path += '/';
		return path;
		
	}
	
	isAbsolute( url ) {
		return url.startsWith('https://') || url.startsWith('http://');
	}
	
	isDataUri( url ) {
		return url.startsWith('data:') || url.startsWith('blob:');
	}	
	
	toDataUri( data, type ) {
		return 'data:' + type + ';base64,' + btoa(data);
	}
	
	
	findMtlLib( data ) {
		
		let m = data.match(/^\s*mtllib\s+([^\n\r]+)/m);
		return this.getBasename( ( m ) ? m[1] : '' );
		
	}
	
	
	callComplete() {
		if ( this.aborted ) return;
		if ( ! this.complete || ! this.obj3d ) return;
		this.complete( this.obj3d, this.completeOptions );
	}

	
	load( src, asset_path, draco_path, complete, fail, debug ) {
		
		// empty mesh for env use
		if ( ! src ) {
			this.obj3d = new Mesh( new PlaneGeometry(), new MeshPhongMaterial( { colorWrite: false, depthWrite: false } ) );
			this.complete = complete;
			this.callComplete();
			return;
		}
		
		
		this.src = src;
		this.complete = complete;
		this.fail = fail;
		this.debug = debug;
		
		let format = this.getFileFormat( src );
		
		this.abs_path = this.getPath( new URL( src, self.location.href ).href );
		this.asset_path = this.appendSlash( asset_path );
		this.draco_path = this.appendSlash( draco_path );
		
		
		if ( ! format ) {
			fail( 'Format unsupported: ' + src );
			return;
		}
		
		
		if ( format == 'fbx' ) {
			
			let loader = new FBXLoader( this.manager );

			loader.load( src, obj3d => {
				if ( this.aborted ) return;
				this.obj3d = obj3d;
				if ( ! this.waitToComplete ) this.callComplete();
			} );
			
			
		} else if ( format == 'gltf' || format == 'glb' ) {
			
			let loader = new GLTFLoader( this.manager );
			
			const dracoLoader = new DRACOLoader();
			dracoLoader.setDecoderPath( (this.draco_path || this.abs_path + 'draco/' ) );
			loader.setDRACOLoader( dracoLoader );			

			loader.load( src, gltf => {				
				if ( this.aborted ) return;
				//console.log(gltf);
				this.obj3d = gltf.scene;
				this.obj3d.animations = gltf.animations;
				this.completeOptions = { sRGB: true };
				if ( ! this.waitToComplete ) this.callComplete();
			} );
			
			
		} else if ( format == 'stl' ) {
			
			let loader = new STLLoader( this.manager );

			loader.load( src, geometry => {				
				if ( this.aborted ) return;
				
				let material;
				if ( geometry.hasColors ) {
					material = new MeshPhongMaterial( { opacity: geometry.alpha, vertexColors: true } );
				} else {
					material = new MeshPhongMaterial( { color: 0x999999 } );
				}
				
				let mesh = new Mesh( geometry, material );
				this.obj3d = mesh;
				if ( ! this.waitToComplete ) this.callComplete();
			} );
				
		
		} else if ( format == 'obj' ) {
						
			var raw_loader = new FileLoader( this.manager );

			raw_loader.load( src, ( data ) => {
				if ( this.aborted ) return;
				if ( ! data ) return;				
				
				let mtl_src = this.findMtlLib( data );
				src = this.toDataUri( data, 'model/obj' );
					
				let loader = new OBJLoader( this.manager );

				if ( mtl_src ) { // has materials
				
					let mtlLoader = new MTLLoader( this.manager );
					mtlLoader.load( mtl_src, materials => {
						if ( this.aborted ) return;
						
						materials.preload();
						loader.setMaterials( materials );
						loader.load( src, obj3d => {
							if ( this.aborted ) return;
							this.obj3d = obj3d;
							if ( ! this.waitToComplete ) this.callComplete();
						} );
						
					} );
				
				} else { // no materials
					
					loader.load( src, obj3d => {
						if ( this.aborted ) return;
						
						obj3d.traverse( child => {
							if ( child.isMesh ) {
								child.material = new MeshPhongMaterial( { color: 0x999999 } );
							}
						} );						
						
						this.obj3d = obj3d;		
						if ( ! this.waitToComplete ) this.callComplete();						
					} );
					
				}
			} );
			
			
		}
		
		
	}
	
	
	abort() {
		
		this.aborted = true;
		
	}
	
	
	
	loadEnv( src, complete, fail, debug ) {
		
		this.src = src;
		this.fail = fail;
		this.debug = debug;
		
		this.abs_path = this.getPath( new URL( src, self.location.href ).href );

		let loader = new TextureLoader( this.manager );

		loader.load( src, envMap => {
			if ( this.aborted ) return;
			envMap.mapping = EquirectangularReflectionMapping;
			//envMap.encoding = sRGBEncoding;
			complete( envMap );
		} );

		
	}
	

};


export { ModelLoader };