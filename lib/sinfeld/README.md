# SINFELD: Evil Resident (embedded)

`game.js` and `tv.mjs` are copied from the PlatformerGame project. Edit them there and copy them back here.
Local edits to keep when re-copying `tv.mjs` (the original lives in Documents/Websites/PlatformerGame):
- `frameDistance()` backs the camera off on portrait screens so the set fits phones.
- The CRT shader's `lines` uniform: scanline density follows the tube's rendered size instead of a fixed 384, so the effect survives on small screens.
- Stronger CRT look than the original: heavier scanlines/grille, more curvature, colour fringing and vignette, a glass glare streak in the shader, and glass opacity 0.26 (was 0.11).
Assets live in `public/sinfeld/`. The about page mounts `components/sinfeld-tv.tsx`, which sets `window.SINFELD_EMBED`,
`SINFELD_ASSET_BASE` and `SINFELD_TRANSPARENT`, imports both files, then calls `startSinfeld()` and `startSinfeldTv()`.
