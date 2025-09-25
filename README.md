# Xzero JS - A 3D Javascript Library with HTML Syntax

Xzero JS is a modern JavaScript library (ES6 module) for displaying 3D models, scenes and 360° panoramas on the web. Just use the `<xzero-js>` element to get started. Our full documentation can be found [HERE](https://xzerojs.org).

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
<script
  type="module"
  src="https://cdn.jsdelivr.net/npm/xzero-js@1.2.1/xzero.min.js"
></script>
```

### NPM

```bash
npm i xzero-js
```

```javascript
import * as XzeroJS from "xzero-js";
```

### ES6 module import

Instead of loading the module with a separate `<script type="module">` tag you can import it to your existing script module:

```javascript
import * as XzeroJS from "./xzero.min.js";
```

Or you can import the module dynamically only when needed. The following snippet checks for the presence of a <xzero> element on the page and imports the module if one is found.

```html
<script type="module">
  if (document.querySelector("xzero-js")) {
    import("./xzero.min.js");
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
import { SoftReflection } from "./core/SoftReflection.js";
import { SoftShadow } from "./core/SoftShadow.js";
import { OrbitControls } from "./three/OrbitControls.mod.js";
```

# Getting Started

Load the script module and add the `<xzero-js>` HTML element to your page:

```html
<script type="module" src="xzero-js.min.js"></script>
<xzero-js src="3d-model.fbx"></xzero-js>
```

### Attributes/Properties

Attributes are specified in the HTML element code like:

```html
<xzero-js attribute-name="value"></xzero-js>
```

Properties can be accessed with JavaScript code like `element.propertyName = "value";`

Property names are in **camelCase**.

---

## BASICS

### `src` (source)

The source URL of the 3D file. All resources (like textures) should be in the same directory unless you specify a `resource-path`.

See the supported file types.

- **Type:** URL String
- **Attribute:** `<xzero-js src="file.fbx" ...>`
- **Property:** `element.src = "file.fbx";`

```html
<xzero-js id="example" src="assets/hyper.fbx"></xzero-js>

<button onclick="document.getElementById('example').src='assets/origami.stl';">
  Change src
</button>
```

---

### `resource-path`

Defines a path from which all resources (like textures) are loaded.

- **Type:** URL String
- **Attribute:** `<xzero-js resource-path="https://www.example.com/3d/assets/" ...>`
- **Property:** `element.resourcePath = "https://www.example.com/3d/assets/";`

---

### `draco-path`

This setting only affects Draco-compressed GLTF files. The Draco decoder files are loaded from this path.

- **Type:** URL String
- **Attribute:** `<xzero-js draco-path="https://www.example.com/draco-decoder/" ...>`
- **Property:** `element.dracoPath = "https://www.example.com/draco-decoder/";`

If `draco-path` is not set, the `draco` directory should be in the same directory as the 3D model.
For example: If `src` is `/assets/3d/my-model.gltf`, the Draco files should be at `/assets/3d/draco/`.

---

### `env` (environment)

URL to an environment map for material reflectivity or use as panorama background. The image must be in equirectangular projection and the dimensions should be a power of two: `256x128`, `512x256`, `1024x512`, `2048x1024` or `4096x2048` pixels.

See Reflectivity.

- **Type:** URL String
- **Attribute:** `<xzero-js env="example.jpg" ...>`
- **Property:** `element.env = "example.jpg";`

If `src` is not set, the image is displayed as panorama background.

### `env-background`

---

### `ratio`

If the height of the `<xzero-js>` element is not set by CSS styles, the height is determined by its width and this aspect ratio.

- **Format:** Number\:Number
- **Default:** `1:1` (square)
- **Attribute:** `<xzero-js ratio="3:2" ...>`
- **Property:** `element.src = "3:2";`

```html
<xzero-js
  style="display:inline-block"
  src="assets/hyper.fbx"
  ratio="3:2"
></xzero-js>
<xzero-js
  style="display:inline-block"
  src="assets/hyper.fbx"
  ratio="16:9"
></xzero-js>
```

---

### `autorotate`

Whether the direction of view rotates over time.

- **Type:** Boolean
- **Attribute:** `<xzero-js autorotate ...>`
- **Property:** `element.autorotate = true;`

```html
<xzero-js
  src="assets/hyper.fbx"
  env="assets/environment.jpg"
  autorotate
></xzero-js>
```

---

### `debug`

Displays 3D axes and helpful information for setup and development. Logs information about the object hierarchy and materials in the developer console.

- **Type:** Boolean
- **Attribute:** `<xzero-js debug ...>`
- **Property:** `element.debug = true;`

```html
<xzero-js src="assets/hyper.fbx" debug zoomable></xzero-js>
```

---

## VIEW

### `direction`

Specifies the horizontal angle of view.

- **Type:** Number (degree of range: -180 to 180)
- **Default:** `0`
- **Attribute:** `<xzero-js direction="90" ...>`
- **Property:** `element.direction = 90;`

```html
<xzero-js
  src="assets/hyper.fbx"
  elevation="45"
  autorotate
  autorotate-delay="1"
  autorotate-speed="1.5"
  autorotate-elevation="0"
></xzero-js>
```

- `autorotate-delay`
- `autorotate-speed`
- `autorotate-elevation`

```html
<xzero-js
  src="assets/hyper.fbx"
  debug
  direction="-45"
  direction-limit="-70 70"
  autorotate
></xzero-js>
```

---

### `elevation`

Specifies the vertical angle of view.

- **Type:** Number (degree of range: -90 to 90)
- **Default:** `0`
- **Attribute:** `<xzero-js elevation="45" ...>`
- **Property:** `element.elevation = 45;`

```html
<xzero-js
  src="assets/hyper.fbx"
  debug
  elevation="45"
  elevation-limit="-90 90"
></xzero-js>
```

- `elevation-limit`

---

### `grabbable`

Whether the model can be rotated by mouse or touch.

- **Type:** Boolean
- **Default:** `true`
- **Attribute:** `<xzero-js grabbable="false" ...>`
- **Property:** `element.grabbable = false;`

---

### `inertia`

Specifies the inertia of rotation by mouse or touch.

- **Type:** Number (range 0 - 1)
- **Default:** `0.25`
- **Attribute:** `<xzero-js inertia="0.5" ...>`
- **Property:** `element.inertia = "0.5";`

```html
Rotate to see the difference:<br /><br />
<xzero-js
  style="display:inline-block"
  src="assets/hyper.fbx"
  inertia="0"
></xzero-js>
<xzero-js
  style="display:inline-block"
  src="assets/hyper.fbx"
  inertia="1"
></xzero-js>
```

---

### `zoom`

Specifies the distance to the model.

- **Type:** Number (range: 0.01 to 100)
- **Default:** `2`
- **Attribute:** `<xzero-js zoom="1.5" ...>`
- **Property:** `element.zoom = 1.5;`

```html
<xzero-js
  id="example"
  src="assets/hyper.fbx"
  debug
  zoomable
  zoom="1.25"
  zoom-limit="0.5 4"
></xzero-js
><br />

Zoom:
<input
  type="range"
  min="0.5"
  max="4"
  value="1.25"
  step="0.25"
  oninput="document.getElementById('example').moveTo({zoom : this.value});"
/>
```

- `zoom-limit`

---

### `zoomable`

Whether zoom can be changed by mousewheel or gestures.

- **Type:** Boolean
- **Attribute:** `<xzero-js zoomable ...>`
- **Property:** `element.zoomable = true;`

---

### `center`

Specifies the position the camera is looking at and rotating around (to focus on different parts of a model).

In combination with `look-around`, the position of the camera is set (to navigate through a 3D scene).

See Positions and Units.

- **Type:** `Number Number Number` (x/y/z separated by space)
- **Default:** `0 0 0` (vertical center of the model `y = 0`)
- **Attribute:** `<xzero-js center="0 0.5 0" ...>`
- **Property:** `element.center = "0 0.5 0";`

```html
<xzero-js
  id="example"
  src="assets/hyper.fbx"
  debug
  center="-0.5 0.2 0"
></xzero-js>

<button
  onclick="document.getElementById('example').moveTo({center:'0 0 0'}, {speed:0.5});"
>
  Go to 0 0 0
</button>
```

---

### `look-around`

With `look-around` the model is viewed from inside like a panorama.

- **Type:** Boolean
- **Attribute:** `<xzero-js look-around ...>`
- **Property:** `element.lookAround = true;`

You cannot zoom if look-around is enabled. Instead use `center` to navigate in the scene. You may need to set `elevation-limit` so you can look up.

```html
<xzero-js
  id="example"
  src="assets/primitives.fbx"
  debug
  look-around
  elevation-limit="-30 30"
></xzero-js>

<button
  onclick="document.getElementById('example').moveTo({center:'0 0.00007 0.0002', direction: -180}, {speed: 0.5});"
>
  Go to sphere
</button>
<button
  onclick="document.getElementById('example').moveTo({center:'0 0.00007 -0.0002', direction: 0}, {speed: 0.5});"
>
  Go to cone
</button>
```

---

## ANIMATION

### `playing`

Whether the animations are playing. See Animation.

- **Type:** Boolean
- **Attribute:** `<xzero-js playing ...>`
- **Property:** `element.playing = true;`

### `loop`

Whether the animation loops instead of stopping at the last frame.

- **Type:** Boolean
- **Attribute:** `<xzero-js loop ...>`
- **Property:** `element.loop = true;`

### `speed`

Specifies the playback speed.

- **Type:** Number (factor)
- **Default:** `1`
- **Attribute:** `<xzero-js speed="1.5" ...>`
- **Property:** `element.speed = 1.5;`

```html
<xzero-js
  id="example"
  src="assets/hyper.fbx"
  playing
  loop
  speed="1.5"
></xzero-js>

<button onclick="document.getElementById('example').playing=false;">
  Pause
</button>
<button onclick="document.getElementById('example').playing=true;">Play</button>
```

---

### `time`

Specifies the current animation time, even if the animation is not playing.

- **Type:** Number (time in seconds)
- **Default:** `0`
- **Attribute:** `<xzero-js time="2.5" ...>`
- **Property:** `element.time = 2.5;`

The time cannot be set to a value lower than `start` or higher than `end`.

```html
<xzero-js id="example" src="assets/hyper.fbx" time="1.25"></xzero-js>
<button onclick="document.getElementById('example').time = 2.1;">
  Change time
</button>
```

---

### `start` / `end`

If specified, the playback starts at `start` time and ends at `end` time.

- **Type:** Number (time in seconds)
- **Attribute:** `<xzero-js start="1.5" ...>` / `<xzero-js end="2.5" ...>`
- **Property:** `element.start = 1.5;` / `element.end = 2.5;`

The `end` time must be higher than the `start` time.

```html
A-B Play / Playback Range<br /><br />
<xzero-js src="assets/hyper.fbx" playing loop start="1.6" end="2.1"></xzero-js>
```

---

## PRESENTATION

### `reflection`

Displays a ground reflection effect. The reflection fades out at the bottom edge of the element and at low elevations.

- **Type:** Number (range 0 - 1)
- **Attribute:** `<xzero-js reflection="0.5" ...>`
- **Property:** `element.reflection = 0.5;`

The geometry should be at a positive Y position.

- `reflection-softness`
- `reflection-color`

```html
<xzero-js
  src="assets/hyper.fbx"
  reflection="0.5"
  reflection-softness="0.75"
  playing
  loop
  zoomable
></xzero-js>
```

---

### `shadow`

Displays a soft shadow on the ground.

- **Type:** Number (range 0 - 1)
- **Attribute:** `<xzero-js shadow="1" ...>`
- **Property:** `element.shadow = 1;`

Only geometry with visible faces on the bottom side casts shadows.

- `shadow-softness`
- `shadow-color`

```html
<xzero-js
  src="assets/hyper.fbx"
  elevation="15"
  shadow="1"
  shadow-softness="0.75"
  playing
  loop
></xzero-js>
```

---

### `wireframe`

Whether all materials are rendered as wireframe.

- **Type:** Boolean
- **Attribute:** `<xzero-js wireframe ...>`
- **Property:** `element.wireframe = true;`

```html
<xzero-js
  style="display:inline-block"
  src="assets/materials.fbx"
  wireframe
></xzero-js>

<!-- example: render specific materials as wireframe -->
<xzero-js
  style="display:inline-block"
  id="example"
  src="assets/materials.fbx"
></xzero-js>
<script>
  document.getElementById("example").addEventListener("load", function () {
    this.getMaterial("SphereMaterial").wireframe = true;
  });
</script>
```

---

### `color`

Changes all materials to this color.

- **Type:** Color
- **Attribute:** `<xzero-js color="#FF0000" ...>`
- **Property:** `element.color = "#FF0000";`

```html
<xzero-js
  style="display:inline-block"
  src="assets/materials.fbx"
  color="#ff0000"
></xzero-js>

<!-- example: change color of specific materials -->
<xzero-js
  style="display:inline-block"
  id="example"
  src="assets/materials.fbx"
></xzero-js>
<script>
  document.getElementById("example").addEventListener("load", function () {
    this.getMaterial("CubeMaterial").color.set("#ff0000");
  });
</script>
```

---

## LIGHT

### `ambient-light`

Specifies the strength of the ambient light. This light has no position or direction.

- **Type:** Number (factor)
- **Default:** `0.5`
- **Attribute:** `<xzero-js ambient-light="0.2" ...>`
- **Property:** `element.ambientLight = 0.2;`

```html
<xzero-js
  style="display:inline-block"
  src="assets/hyper.fbx"
  ambient-light="0"
></xzero-js>
<xzero-js
  style="display:inline-block"
  src="assets/hyper.fbx"
  ambient-light="0.8"
></xzero-js>
```

- `ambient-light-color`

---

### `point-light`

Specifies the strength of a point light. The light is centered above the model by default.

- **Type:** Number (factor)
- **Default:** `0.5`
- **Attribute:** `<xzero-js point-light="0.2" ...>`
- **Property:** `element.pointLight = 0.2;`

```html
<xzero-js
  style="display:inline-block"
  src="assets/hyper.fbx"
  point-light="0"
  autorotate
></xzero-js>
<xzero-js
  style="display:inline-block"
  src="assets/hyper.fbx"
  point-light="0.8"
  point-light-position="-1 1 0.5"
  autorotate
></xzero-js>
```

- `point-light-position`
- `point-light-color`

---

### `camera-light`

Specifies the strength of the camera light.

- **Type:** Number (factor)
- **Default:** `0`
- **Attribute:** `<xzero-js camera-light="0.5" ...>`
- **Property:** `element.cameraLight = 0.5;`

```html
<xzero-js
  src="assets/hyper.fbx"
  camera-light="0.5"
  point-light="0"
  ambient-light="0.25"
  autorotate
></xzero-js>
```

- `camera-light-color`

---

## OTHER

### `loading`

Specifies the loading behavior:

- `auto` (default) loads the model after the window `load` event

- `lazy` loads the model when the element becomes visible in the view

- `eager` loads the model as soon as possible

- **Type:** String (`"auto"`, `"lazy"` or `"eager"`)

- **Default:** `auto`

- **Attribute:** `<xzero-js loading="lazy" ...>`

- **Property:** `element.loading = "lazy";`

---

### `state` (read-only)

The current loading state. You can use the CSS attribute selector to apply CSS styles based on the current state.

- **Type:** String (`""`, `"loading"`, `"loaded"` or `"error"`)
- **Attribute (read-only):** `<xzero-js state="loaded" ...>`

The attribute is read-only.

```html
<xzero-js id="example" src="assets/hyper.fbx"></xzero-js>

<style>
  /* fade in when loaded */
  #example {
    opacity: 0;
    transition: opacity 5s ease;
  }
  #example[state="loaded"] {
    opacity: 1;
  }
</style>
```

---

### `grabbing` (read-only)

Whether the model is currently rotated by mouse or touch.

- **Type:** Boolean
- **Attribute (read-only):** `<xzero-js grabbing ...>`
- **Property (read-only):** `console.log( element.grabbing );`

The attribute/property is read-only.

```html
Click or Grab?<br /><br />
<xzero-js id="example" src="assets/hyper.fbx"></xzero-js>

<script>
  document
    .getElementById("example")
    .addEventListener("click", function (event) {
      if (this.lastMove > 2) return; // ignore grabbing
      alert("it was a click!");
    });
</script>
```

---

### `lastMove` (read-only)

The change in degrees of the last grab (start of grabbing to release). It is useful to determine whether a click event should be ignored.

- **Type:** Number (degree)
- **Property (read-only):** `console.log( element.lastMove );`

---

### `high-quality` (init-only)

This attribute only affects screens/devices with a pixel ratio of 1 (not HiDPI). If this attribute is present, the model is rendered at double resolution to smooth the edges.

- **Type:** Boolean
- **Attribute (init-only):** `<xzero-js high-quality ...>`

The attribute cannot be changed.

---

### `preserve-buffer` (init-only)

If this attribute is present, access to the image data of the canvas is possible.

- **Type:** Boolean
- **Attribute (init-only):** `<xzero-js preserve-buffer ...>`

The attribute cannot be changed.

```js
// access image data
my_image.src = hyper3d.canvas.toDataURL("image/jpeg", 0.9);
```

---

### `scene` (read-only)

Gives you access to the THREE.js `Scene`. See **Working with THREE.js**.

- **Type:** THREE.js `Scene`
- **Property (read-only):** `console.log( element.scene );`

You can also use common HTML element attributes/properties such as `id`, `class`, `style`, `tabindex`, etc.
MDN docs: [id](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/id) • [class](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/class) • [style](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/style) • [tabindex](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex)

---

## Events

Events can be handled with JavaScript code like:

```js
element.addEventListener("event", function () {
  /* ... */
});
```

or specified as attributes ("on" followed by the event name):

```html
<xzero-js onevent="..."></xzero-js>
```

### LOADING

### `load`

Triggered when all files are loaded. You can use this event for final adjustments right before the model is displayed.

- **Attribute:** `<xzero-js onload="alert('load complete');" ...>`
- **Event:** `hyper3d.addEventListener("load", function(){ alert('load complete'); });`

```html
<xzero-js id="example" src="assets/hyper.fbx"></xzero-js>
<script>
  document.getElementById("example").addEventListener("load", function () {
    console.log(this.model);
    alert("load complete");
  });
</script>
```

- `model`
- `camera`

### `error`

Triggered if loading fails.

- **Attribute:** `<xzero-js onerror="alert('loading failed');" ...>`
- **Event:** `hyper3d.addEventListener("error", function(){ alert('loading failed'); });`

```html
<xzero-js src="MISSING_FILE.fbx" onerror="alert('loading failed');"></xzero-js>
```

### INTERACTION AND UPDATES

### `move`

Triggered when the view changes (`direction`, `elevation`, `zoom` or `center`).

- **Attribute:** `<xzero-js onmove="console.log('move');" ...>`
- **Event:** `hyper3d.addEventListener("move", function(){ console.log('move'); });`

```html
<xzero-js id="example" src="assets/origami.stl" debug autorotate></xzero-js
><br />
Front facing? <strong id="info">no</strong>
<script>
  let was_front_facing = false;
  document.getElementById("example").addEventListener("move", function () {
    let front_facing = this.direction < -60 && this.direction > -120;
    if (front_facing !== was_front_facing) {
      was_front_facing = front_facing;
      document.getElementById("info").innerText = front_facing ? "yes" : "no";
    }
  });
</script>
```

### `grab`

Triggered on `mousedown`/`touchstart` when grabbing begins.

- **Attribute:** `<xzero-js ongrab="console.log('grab');" ...>`
- **Event:** `hyper3d.addEventListener("grab", function(){ console.log('grab'); });`

### `release`

Triggered on `mouseup`/`touchend` when grabbing ends.

- **Attribute:** `<xzero-js ongrab="console.log('release');" ...>`
- **Event:** `hyper3d.addEventListener("release", function(){ console.log('release'); });`

### `render`

Triggered every frame the model was rendered.

- **Attribute:** `<xzero-js onrender="console.log('render');" ...>`
- **Event:** `hyper3d.addEventListener("render", function(){ console.log('render'); });`

### ANIMATION

### `finish`

Triggered when the animation ends (if `loop` is false).

- **Attribute:** `<xzero-js onfinish="alert('animation finished');" ...>`
- **Event:** `hyper3d.addEventListener("finish", function(){ console.log('animation finished'); });`

```html
<xzero-js
  id="example"
  src="assets/hyper.fbx"
  playing
  onfinish="this.animateTo({'direction':180});"
  speed="2"
></xzero-js>
```

### `loop`

Triggered when the animation restarts (if `loop` is true).

- **Attribute:** `<xzero-js onloop="console.log('loop');" ...>`
- **Event:** `hyper3d.addEventListener("loop", function(){ console.log('loop'); });`

```html
<xzero-js id="example" src="assets/hyper.fbx" playing loop speed="3"></xzero-js
><br />
Loops: <span id="loop-count">0</span>
<script>
  document.getElementById("example").addEventListener("loop", function () {
    document.getElementById("loop-count").innerText =
      Number(document.getElementById("loop-count").innerText) + 1;
  });
</script>
```

You can also use common HTML element events such as `click`, `mouseover`, `wheel`, `touchstart`, etc.
MDN docs: [click](https://developer.mozilla.org/en-US/docs/Web/API/Element/click_event) • [mouseover](https://developer.mozilla.org/en-US/docs/Web/API/Element/mouseover_event) • [wheel](https://developer.mozilla.org/en-US/docs/Web/API/Element/wheel_event) • [touchstart](https://developer.mozilla.org/en-US/docs/Web/API/Element/touchstart_event)

---

## Methods

Methods can be called with JavaScript code like:

```js
element.method(/* ... */);
```

### `moveTo(properties, options)`

Animates one or more view properties (`direction`, `elevation`, `zoom` or `center`).

The duration is based on the distance from the current to the target value. If you call `moveTo()` multiple times, the previous move animation is canceled if it has not finished. Grabbing also cancels the move animation.

1. **properties**: Object with keys `direction`, `elevation`, `zoom` and/or `center` and their target values.
2. **options** (optional):

- `speed` — Number (factor) | Default: `1`
- `easing` — String (`"linear"`, `"ease-in"`, `"ease-out"`, `"ease-in-out"`, `"back"`, `"elastic"` or `"bounce"`) | Default: `"ease-in-out"`
- `onfinish` — Function (triggered when the animation finishes)
- `oncancel` — Function (triggered when the animation is canceled)

If you don't want the animation to be interrupted by grabbing, you can set `grabbable` to `false` and re-enable it in `onfinish`.

The method returns an **Animation Instance** with methods `finish()` and `cancel()`. See the `animateTo()` example.

```html
<xzero-js id="example" src="assets/hyper.fbx"></xzero-js>
<button id="move-button">Move!</button>
<script>
  let example = document.getElementById("example");
  document.getElementById("move-button").addEventListener("click", function () {
    example.grabbable = false;
    example.moveTo(
      {
        direction: 45,
        elevation: 30,
        zoom: 1.25,
        center: "0 0 0",
      },
      { speed: 1 }
    );
  });
</script>
```

### `animateTo(properties, options)`

Animates one or more numeric properties such as `time`, `zoom`, `color`, `reflection`, `ambientLight`, `pointLightPosition`, etc.

1. **properties**: Object of properties and their target values.
2. **options** (optional):

- `duration` — Number (seconds) | Default: `0.5`
- `easing` — String (`"linear"`, `"ease-in"`, `"ease-out"`, `"ease-in-out"`, `"back"`, `"elastic"` or `"bounce"`) | Default: `"ease-in-out"`
- `onfinish` — Function (triggered when the animation finishes)
- `oncancel` — Function (triggered when the animation is canceled)

The method returns an **Animation Instance** with methods `finish()` and `cancel()`.

```html
<xzero-js
  id="example"
  src="assets/hyper.fbx"
  color="#00FF00"
  time="3"
></xzero-js>
<button id="animate-button">animateTo()</button>
<button id="finish-button">finish()</button>
<button id="cancel-button">cancel()</button>
<script>
  var my_animation;
  document
    .getElementById("animate-button")
    .addEventListener("click", function () {
      // example usage here
    });
</script>
```

### `raycast(clientX, clientY)`

Raycasting finds objects in the scene so they can be clicked or hovered.

**Parameters:** `clientX` and `clientY` as from a mouse or touch event.
**Returns:** an object with these keys:

- `name` — Name of the object
- `object` — THREE.js `Object3D`. See **Working with THREE.js**
- `origin` — The origin or pivot position of the object. See **Positions and Units**
- `hit` — The position where the ray hits

You can use objects with invisible materials as hotspots (for example `Material.visible = false` or `opacity = 0`).

The ray passes through unnamed objects, objects whose names begin with an underscore (for example `_IgnoreMe`) and invisible objects (`Object3D.visible = false`).

```html
<xzero-js id="example" src="assets/hyper.fbx" zoom="1.5"></xzero-js><br />
<div id="result">Move the mouse over the letters!</div>
<script>
  document
    .getElementById("example")
    .addEventListener("mousemove", function (event) {
      let result = this.raycast(event.clientX, event.clientY);
      if (result.name) {
        // display result
      }
    });
</script>
```

```html
<xzero-js
  id="example"
  src="assets/primitives.fbx"
  look-around
  elevation-limit="-10 10"
></xzero-js
><br />
<div id="result">Click an object!</div>
<script>
  document
    .getElementById("example")
    .addEventListener("click", function (event) {
      if (this.lastMove > 2) return; // ignore grabbing
      let result = this.raycast(event.clientX, event.clientY);
      // handle result
    });
</script>
```

### `getObject(name)`

Finds an object by name and returns a THREE.js `Object3D`. See **Working with THREE.js**.

```html
<xzero-js id="example" src="assets/hyper.fbx"></xzero-js>
<button id="toggle-button">Toggle "H" visibility</button>
<script>
  document
    .getElementById("toggle-button")
    .addEventListener("click", function () {
      let letter_H = document.getElementById("example").getObject("H");
      if (letter_H) letter_H.visible = !letter_H.visible;
    });
</script>
```

### `getPosition(name)`

Finds an object by name and returns its position as string for use as `center`, overlay `position` or `point-light-position`.

See **Positions and Units**.

```html
<xzero-js id="example" src="assets/materials.fbx" autorotate debug>
  <div slot="overlay" id="myoverlay" position="0 0 0" always-on-top>
    OVERLAY
  </div>
</xzero-js>

<button
  onclick="document.getElementById('myoverlay').setAttribute('position', document.getElementById('example').getPosition('Cube'));"
>
  Move overlay to cube
</button>
```

### `getMaterial(name)`

Finds a THREE.js `Material` by name. See **Working with THREE.js**.

```html
<xzero-js
  style="display:inline-block"
  id="example"
  src="assets/materials.fbx"
></xzero-js
><br />
<button id="flip-button">Flip materials</button>
<script>
  document.getElementById("flip-button").addEventListener("click", function () {
    let example = document.getElementById("example");
    example.getObject("Icosphere").material =
      example.getMaterial("CubeMaterial");
  });
</script>
```

### `changeMaterialType(name, type)`

This method can change materials to `basic` or `toon` type.

```html
<xzero-js
  style="width:18em;display:inline-block;"
  src="assets/materials.fbx"
  direction="45"
  zoom="1.75"
  autorotate
></xzero-js>
<xzero-js
  id="hyper2"
  style="width:18em;display:inline-block;"
  src="assets/materials.fbx"
  direction="45"
  zoom="1.75"
  autorotate
></xzero-js>
<xzero-js
  id="hyper3"
  style="width:18em;display:inline-block;"
  src="assets/materials.fbx"
  direction="45"
  zoom="1.75"
  autorotate
></xzero-js>

<script>
  // ...
</script>
```

### `update()`

When you make changes to THREE.js objects, you may need to call `update()` to wake up the element. `update()` renders the scene with the next animation frame. Multiple subsequent calls are ignored.

The `getObject()`, `getPosition()` and `getMaterial()` methods automatically call `update()`, so you don't need to.

### `dispose()`

Call `dispose()` to remove the element and free memory.

---

## Guides

### INTEGRATION

### ES6 module import

Instead of loading the module with a separate `<script type="module">` tag you can import it to your existing script module:

```js
import * as HYPER3D from "./xzero-js.min.js";
```

Or you can import the module dynamically only when needed. The following snippet checks for the presence of a `<xzero-js>` element on the page and imports the module if one is found.

```html
<script type="module">
  if (document.querySelector("xzero-js")) {
    import("./xzero-js.min.js");
  }
</script>
```

### Element size

`<xzero-js>` is a block element with 100% width. If the height is not set by CSS styles, the height is determined by the `ratio` attribute.

### Layout Shifts and Flashing

You can use the `:not(:defined)` CSS selector to style the element before the module is loaded. The following example creates a pseudo element to consume space till the module is loaded:

```html
<xzero-js ratio="1:1" src="assets/hyper.fbx"></xzero-js>

<style>
  xzero-js:not(:defined)::before {
    content: "";
    display: block;
    padding-top: 100%; /* 1:1 ratio */
  }
</style>
```

You can use the `:not([state=loaded])` CSS selector to style the element till the 3D model is loaded. See the `state` attribute.

```html
<xzero-js src="assets/hyper.fbx"></xzero-js>

<style>
  /* show loading text */
  xzero-js:not([state="loaded"])::before {
    content: "Loading...";
    position: absolute;
    top: 1em;
    left: 1em;
  }
  /* hide children */
</style>
```

### Fallback content

The content between `<xzero-js>` and `</xzero-js>` is displayed if the script module is not loaded or supported by the browser.

```html
<xzero-js src="assets/hyper.fbx"
  ><strong>FALLBACK CONTENT HERE</strong></xzero-js
>
```

### Using a `data:` URI

You can provide the `src` as `data:` URI of this format:

```
data:model/[file extension];base64,[base64 encoded file data]
```

_(Base64 example omitted for brevity in README presentation.)_

### Different models based on `@media`

You can show different models based on a CSS `@media` query.

```html
<xzero-js
  class="desktop-model"
  ratio="2:1"
  zoom="0.8"
  src="assets/hyper.fbx"
></xzero-js>
<xzero-js class="mobile-model" zoom="1.3" src="assets/origami.stl"></xzero-js>

<style>
  @media (min-width: 1000px) {
    .mobile-model {
      display: none;
    }
  }
  @media (max-width: 999px) {
    .desktop-model {
      display: none;
    }
  }
</style>
```

---

## 3D DATA

### Supported file types

Supported file types are `.gltf/.glb`, `.fbx`, `.obj` and `.stl`.

- **.gltf/.glb** — This modern format supports the most features, including PBR materials.
- **.fbx** — This established format is supported by common 3D software.
- **.obj** — This easy to use format is human-readable and can be opened in a text editor. Materials are stored in a separate `.mtl` file. Animations are not supported.
- **.stl** — This basic format can be used for pure geometry. Materials and animations are not supported.

Textures should be `.jpg` or `.png`. If possible use dimensions that are a power of two like `128, 256, 512, 1024, 2048, 4096` pixels.

### Draco-compressed GLTF files

To use Draco-compressed files, copy the directory `/demo/gltf-draco/draco` into the directory of your 3D model or specify `draco-path`. The directory contains the files required for decompression.

See the GLTF Draco demo.

Draco compression is only useful for complex 3D models where the savings from compression are greater than the size of the decoder files.

### Supported 3D content features

You can expect basic 3D features to work:

- Named, hierarchically arranged objects
- Triangulated Geometry, Smooth/Flat Shading, Sharp Edges
- Textures, UV Mapping, Transparency
- PBR materials (GLTF format)
- Main Timeline Animation

### Export recommendations

- Forward Axis: -Z, Up Axis: Y
- Triangulate Geometry
- Apply Modifiers
- Bake Animation, Force Start/End Keying

With `playing` / `time` all animations are played simultaneously. If you need multiple different animations, you can prepend them with empty keyframes and specify a playback range with `start` / `end`.

Blender export options: Bake Animation, Force Start/End Keying (disable: Key All Bones, NLA Strips, All Actions).

The `animations` property gives you access to all THREE.js `AnimationClips`.

### Positions and Units

The units of `center`, `point-light-position` and overlay positions are based on your model and can vary greatly.

You determine positions using your 3D software or by using `getPosition()` or `raycast()`. It is often useful to add empty named objects to determine positions.

If you are working with THREE.js please note:

The object containing your model is scaled. You can multiply `element.autoScale` to convert world units to model units.

### Reflectivity

PBR materials (from GLTF files) determine reflectivity using a Metallic-Roughness workflow and do not require any further adjustments.

Non-PBR materials determine reflectivity by the brightness of the specular color. For example, a white specular color makes the material completely reflective. But you can also determine the reflectivity by script:

```html
<xzero-js
  id="example"
  src="assets/materials.fbx"
  env="assets/environment.jpg"
  autorotate
></xzero-js>
<script>
  /* Set the reflectivity per material. */
  document.getElementById("example").addEventListener("load", function () {
    this.getMaterial("CubeMaterial").reflectivity = 0.5;
    this.getMaterial("CylinderMaterial").reflectivity = 1;
  });
</script>
```

---

## JavaScript / THREE.js

### Control Element Buttons

An example of control elements to zoom and reset the view:

```html
<xzero-js id="example" zoom-limit="0.5 4" src="assets/hyper.fbx"></xzero-js>
<button
  onclick="document.getElementById('example').moveTo({ zoom: document.getElementById('example').zoom-0.75 });"
>
  Zoom in
</button>
<button
  onclick="document.getElementById('example').moveTo({ zoom: document.getElementById('example').zoom+0.75 });"
>
  Zoom out
</button>
<button
  onclick="document.getElementById('example').moveTo({ zoom: 2, direction: 0, elevation: 0 });"
>
  Reset
</button>
```

### Accessibility / Keyboard controls

This example shows you how to make the element focusable and implement keyboard controls.

```html
Click the element (or press tab) to focus it. Then press the left or right arrow
key to rotate the view.<br /><br />

<xzero-js id="example" src="assets/hyper.fbx" tabindex="0"></xzero-js>

<style>
  #example:focus {
    outline: 2px blue solid;
  }
</style>
```

### HTML elements on top of the `<xzero-js>` element

You can show HTML elements on top with a setup like this:

```html
<div class="model-wrap">
  <xzero-js src="assets/hyper.fbx" style="width: 100%;"></xzero-js>
  <div class="model-layer">Text on top</div>
</div>

<style>
  .model-wrap {
    position: relative;
  }
  .model-layer {
    position: absolute;
    inset: 0;
  }
</style>
```

### HTML elements in 3D space

You can add HTML elements (images, links, texts, ...) and move them in 3D space. See the reference for overlays. See the `raycast()` method.

### Clicking/Hovering 3D objects

See the `raycast()` method.

### Navigation in a 3D scene

To navigate in a 3D scene like in the gallery demo you need to add hotspots (overlays or 3D objects found by `raycast()`). When a hotspot is clicked you can animate the `center` position with `moveTo()` to "walk" to the hotspot position. The code of the gallery demo shows a possible setup.

### Observing the view

You can react to changes in the view by listening to the `move` event.

### Hiding objects

- Hide and exclude from `raycast()`:

```js
element.getObject("ObjectName").visible = false;
```

- Hide only, still found by `raycast()`:

```js
element.getObject("ObjectName").material.visible = false;
```

### Replacing materials

It's that simple:

```js
element.getObject("ObjectName").material = element.getMaterial("MaterialName");
```

Specify `debug` to output a list of all available material names on the developer console.

If your 3D software doesn't export unused materials you can apply them to tiny dummy objects.

Often several objects share a material, if you change one, they all change. You can clone a material to change only one object.

```html
These quads share the same material:<br /><br />
<xzero-js id="example" src="assets/material-shared.glb"></xzero-js>

<button id="toggle-button">Toggle material blue/red</button>
<button id="clone-button">One quad green</button>
<script type="module">
  let example = document.getElementById("example");
  let toggle = false;
</script>
```

### Billboards, a performant alternative to overlays

You can create textured quads and rotate them to the camera to create a billboard effect.

The quads must be facing forward and all rotations must have been applied.

```html
<xzero-js
  id="example"
  src="assets/billboard.glb"
  elevation-limit="-70 70"
  autorotate
  debug
></xzero-js>
<script>
  document.getElementById("example").addEventListener("load", function () {
    // the material named Billboard should be unlit
    this.changeMaterialType("Billboard", "basic");
  });
</script>
```

### Working with THREE.js

You can access and modify existing THREE.js objects with the `scene`, `model` and `camera` properties or by using the methods `getObject()` and `getMaterial()`.

To create new THREE.js objects you need to import the module with code like this:

```html
<xzero-js id="example" src="assets/hyper.fbx"></xzero-js>
<script type="module">
  import * as THREE from "../xzero-js.min.js";

  document.getElementById("example").addEventListener("load", function () {
    const geometry = new THREE.SphereGeometry(0.25, 16, 8);
    const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    // ...
  });
</script>
```

See the THREE.js docs: [https://threejs.org/docs/](https://threejs.org/docs/)

Call `update()` after changes to THREE.js objects to wake up the element and ensure your changes are rendered.

Tip: You can use source code from the demos to quickly implement common use cases.

---

## Troubleshooting

If you encounter problems, specify the `debug` attribute and check your browser's developer console for errors and hints.

Xzero JS uses modern web technologies that work only via `http(s)://`, not locally via the `file://` protocol.

Please use a web server for development, to view the demos and to "run code" in the documentation.

Tip: You can setup a local web-server environment like XAMPP.

### `file://` Protocol Scheme

The web page, script module, 3D file and all resources must be loaded from the same server (protocol, domain and port must match). About same-origin policy.

### Same-Origin Security Policy

See: [https://en.wikipedia.org/wiki/Same-origin_policy](https://en.wikipedia.org/wiki/Same-origin_policy)

### Model is not shown

- Was the script module loaded?
- Is the `<xzero-js>` element present, visible and big enough?
- Was the 3D file loaded?
- Is the 3D model working? Use a model from the documentation (for example `/docs/assets/hyper.fbx`) for testing.

### Model is corrupt

- Try different export settings
- Try another file format
- Add the objects in your scene one by one to narrow down errors
- Remove advanced 3D features and simplify your model
- Export the model with another 3D software like Blender: [https://www.blender.org/](https://www.blender.org/)

### Model has invisible faces

Only front side faces are rendered by default. Check the normals of the missing faces and flip them.

To render both sides, you can duplicate the geometry (with flipped normals) or modify the materials:

```html
These quads are visible from one side only:<br /><br />
<xzero-js
  id="example"
  src="assets/material-sides.glb"
  autorotate
  autorotate-speed="8"
></xzero-js>
<button id="button">Render both sides</button>
<script type="module">
  document.getElementById("button").addEventListener("click", () => {
    document
      .getElementById("example")
      .getMaterial("Blue").side = /* BOTH SIDES */ 2;
  });
</script>
```

### Model has flickering faces

This is called "Z-fighting" and occurs if two or more faces are in the same position. Remove unnecessary faces or move them further apart.

### Model is clipped

If the geometry is not centered adjust the position in the 3D software.

Increase `zoom` to show more parts of the model (zoom out). Increase the size of the `<xzero-js>` element to show it bigger.

### Cannot view model from below

See `elevation-limit`.

### Performance on low-end devices

- Avoid using `shadow` and `reflection`
- Use few overlays
- Simplify the model (less polygons, fewer materials, lower texture resolution)

### View doesn't update/render

Call `update()` after changes to THREE.js objects to wake up the element and ensure your changes are rendered.

---

## Support

Are you stuck and need help? We can point you in the right direction.

[Get Support](mailto:support@xzero.co.uk)

[Read our full documentation](https://xzerojs.org)

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](#)
