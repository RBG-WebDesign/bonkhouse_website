# Retro CRT TV Web Asset

Use `retro-crt-tv.glb` in the website.

## Optimization

- Original GLB: 31.97 MB
- Web GLB: approximately 1.11 MB
- Embedded textures: resized from 2048 to 1024 pixels
- Color and emissive textures: WebP quality 82
- Normal and metallic-roughness textures: WebP quality 90
- Geometry: preserved without Draco or Meshopt compression

The GLB uses `EXT_texture_webp`, so load it with a modern glTF loader that
supports WebP textures. The `textures/` folder contains optional loose WebP
copies for material reuse. The GLB itself is self-contained and does not need
those loose files at runtime.
