
# Xzero JS

Xzero JS is modern JavaScript library (ES6 module) for displaying 3D models, scenes and 360° panoramas on the web. Just use the <xzero-js> element to get started. Our full documentation can be found [HERE](https://xzerojs.org).

```html
<xzero-js src="model.gltf" loading="lazy"></xzero-js>
```


## Features

- Only one file to load, no dependencies! < 250 KB (gzipped)
- Support for GLTF/GLB, FBX, OBJ and STL, with PBR, environment maps and Draco
- View modes: orbit and look around, constrainable angles of view
- Effects without effort, just turn them on: soft shadows and reflections
- Fully interactive, make 3D objects in your scene hoverable and clickable
- Easy to use with attributes, properties and events as with native HTML elements
- Cross-browser and mobile compatible, responsive, works in WebViews
- Pin HTML elements to 3D positions to use them as hotspots or labels.
- Play/control the animation of the model, animate the view and every property
- Many examples of common use cases like swapping materials and navigating the scene
- Based on the THREE.js library for WebGL


## Installation

Load the script and add the <xzero-js> HTML element to your page.

### CDN

```html
<script src="https://cdn.jsdelivr.net/npm/xzero-js@1.1.6/xzero.min.js"></script>
```

### NPM

```bash
npm i xzero-js
```

```javascript
import * as XzeroJS from "xzero-js";
```


### ES6 module import

Instead of loading the module with a separate ```html <script type="module">``` tag you can import it to your existing script module:

```javascript
import * as XzeroJS from "./xzero.min.js";
```

Or you can import the module dynamically only when needed. The following snippet checks for the presence of a <xzero> element on the page and imports the module if one is found.

```html
<script type="module">
if ( document.querySelector('xzero-js') ) {
	import( './xzero.min.js' );
}
</script>
```


### Plugins

```javascript
import { Animations } from "./core/Animations.js";
import { AutoRotation } from "./core/AutoRotation.js";
import { ElementObserver } from "./core/ElementObserver.js";
import { ModelLoader } from "./core/ModelLoader.js";
import { Overlays } from "./core/Overlays.js";
import { SoftReflection } from './core/SoftReflection.js';
import { SoftShadow } from './core/SoftShadow.js';
import { OrbitControls } from "./three/OrbitControls.mod.js";
```


# Getting Started

## Attributes/Properties
Attributes are specified in the HTML element code like ```html <xzero-js attribute-name="value"></xzero-js>```

Properties can be accessed with JavaScript code like element.propertyName = "value";   Property names are in "camelCase"!

### **BASICS**

### src (source)
The source URL of the 3D file. All resources (like textures) should be in the same directory unless you specify a resource-path.
See the supported file types.

```html
<xzero-js id="example" src="assets/model.fbx"></xzero-js>
					
<button onclick="document.getElementById('example').src='assets/origami.stl';">
	Change src
</button>
```

| Attribute | Type     | Property                |
| :-------- | :------- | :------------------------- |
| `<xzero-js src="file.fbx" ...>` | `URL String` | `element.src = "file.fbx";` |


### resource-path
Defines a path from which all resources (like textures) are loaded.


| Attribute | Type     | Property                |
| :-------- | :------- | :------------------------- |
| `<xzero-js resource-path="https://www.example.com/3d/assets/" ...>` | `URL String` | `element.resourcePath = "https://www.example.com/3d/assets/";` |


### draco-path
This setting only affects Draco-compressed GLTF files. The Draco decoder files are loaded from this path.


| Attribute | Type     | Property                |
| :-------- | :------- | :------------------------- |
| `<xzero-js draco-path="https://www.example.com/draco-decoder/" ...>` | `URL String` | `element.dracoPath = "https://www.example.com/draco-decoder/";` |

*If draco-path is not set, the "draco" directory should be in the same directory as the 3D model.
For example: If src is /assets/3d/my-model.gltf, the draco files should be at /assets/3d/draco/*


### env (environment)
URL to an environment map for material reflectivity or use as panorama background. The image must be in equirectangular projection and the dimensions should be a power of two: 256x128, 512x256, 1024x512, 2048x1024 or 4096x2048 pixels.
See Reflectivity.

```html
<xzero-js src="assets/model.fbx" env="assets/environment.jpg" autorotate></xzero-js>
```
*If src is not set, the image is displayed as panorama background.*

| Attribute | Type     | Property                |
| :-------- | :------- | :------------------------- |
| `<xzero-js env="example.jpg" ...>` | `URL String` | `element.env = "example.jpg";` |

### env-background
Whether the environment map is displayed as panorama background.

```html
<xzero-js src="assets/model.fbx" env="assets/environment.jpg" env-background elevation-limit="-90 90" autorotate></xzero-js>
```
*If src is not set, the image is displayed as panorama background.*

| Attribute | Type     | Property                |
| :-------- | :------- | :------------------------- |
| `<xzero-js env-background ...>` | `Boolean` | `element.envBackground = true;` |


### ratio
If the height of the ```<xzero-js>``` element is not set by CSS styles, the height is determined by its width and this aspect ratio.

```html
<xzero-js style="display:inline-block" src="assets/model.fbx" ratio="3:2"></xzero-js>
<xzero-js style="display:inline-block" src="assets/model.fbx" ratio="16:9"></xzero-js>
```

| Attribute | Format     | Property                |
| :-------- | :------- | :------------------------- |
| `<xzero-js ratio="3:2" ...>` | `Number:Number` | `element.src = "3:2";` |


### autorotate
Whether the direction of view rotates over time.

```html
<xzero-js src="assets/model.fbx" elevation="45" autorotate autorotate-delay="1" autorotate-speed="1.5" autorotate-elevation="0"></xzero-js>
```

| Attribute | Type     | Property                |
| :-------- | :------- | :------------------------- |
| `<xzero-js autorotate ...>` | `Boolean` | `element.autorotate = true;` |

### autorotate-delay
Specifies the duration after which autorotate starts or resumes after an interruption.

| Attribute | Type     | Property                |
| :-------- | :------- | :------------------------- |
| `<xzero-js autorotate-delay="4" ...>` | `Number (duration in seconds) [Default=0]` | `element.autorotateDelay = 4;` |

### autorotate-speed
Specifies the speed of the rotation. You can use a negative factor to reverse the rotation direction.

| Attribute | Type     | Property                |
| :-------- | :------- | :------------------------- |
| `<xzero-js autorotate-speed="1.8" ...>` | `Number (factor) [Default=1]` | `element.autorotateSpeed = 1.8;` |

### autorotate-elevation
Whether the elevation rotates towards this value.

| Attribute | Type     | Property                |
| :-------- | :------- | :------------------------- |
| `<xzero-js autorotate-elevation="0" ...>` | `Number (degree of range: -90 to 90)` | `element.autorotateElevation = 0;` |


### debug
Displays 3D axes and helpful information for setup and development. Logs information about the object hierarchy and materials in the developer console.

```html
<xzero-js src="assets/model.fbx" debug zoomable></xzero-js>
```

| Attribute | Type     | Property                |
| :-------- | :------- | :------------------------- |
| `<xzero-js debug ...>` | `Boolean` | `element.debug = true;` |

## Documentation

[Read our full documentation](https://xzerojs.org)

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](#) 
