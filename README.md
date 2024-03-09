
# Xzero JS

Xzero JS is modern JavaScript library (ES6 module) for displaying 3D models, scenes and 360° panoramas on the web. Just use the ```html<xzero>``` element to get started. Our full documentation can be found [HERE](https://xzerojs.org).

```html
<xzero src="model.gltf" loading="lazy" autorotate></xzero>
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

Load the script and add the <xzero> HTML element to your page.

### CDN

```html
<script src="https://cdn.jsdelivr.net/gh/xzeroent/xzero-js/xzero.min.js"></script>
```

### NPM

```javascript
npm i xzero-js

import * as XzeroJS from "xzero-js";
```


## ES6 module import

Instead of loading the module with a separate ```html <script type="module">``` tag you can import it to your existing script module:

```javascript
import * as XzeroJS from "./xzero.min.js";
```

Or you can import the module dynamically only when needed. The following snippet checks for the presence of a <xzero> element on the page and imports the module if one is found.

```html
<script type="module">
if ( document.querySelector('xzero') ) {
	import( './xzero.min.js' );
}
</script>
```


## Plugins

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


## Documentation

[Read our full documentation](https://xzerojs.org)

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](#)
