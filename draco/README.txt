To use GLTF files with Draco compression copy this directory into the directory of your 3D file.


# Draco 3D Data Compression

Draco is an open-source library for compressing and decompressing 3D geometric meshes and point clouds. It is intended to improve the storage and transmission of 3D graphics.
[Website](https://google.github.io/draco/) | [GitHub](https://github.com/google/draco)

## Contents

This folder contains three utilities:

* `draco_decoder.js` — Emscripten-compiled decoder, compatible with any modern browser.
* `draco_decoder.wasm` — WebAssembly decoder, compatible with newer browsers and devices.
* `draco_wasm_wrapper.js` — JavaScript wrapper for the WASM decoder.

## License

[Apache License 2.0](https://github.com/google/draco/blob/master/LICENSE)
