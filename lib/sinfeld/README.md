# SINFELD: Evil Resident (embedded)

`game.js` and `tv.mjs` are copied from the PlatformerGame project. Edit them there and copy them back here.
Local edits to keep when re-copying `tv.mjs` (the original lives in Documents/Websites/PlatformerGame):
- Camera distance fits the model bounds inside the stage, with header and mobile-control space reserved by the host component.
- Rendering uses 60 fps on desktop and 30 fps on mobile, caps pixel density, resizes through ResizeObserver, and pauses while the page is hidden. Both entry points return cleanup functions for listeners, animation, audio, and WebGL resources.
- Game audio loads on the first gesture. All sources use mono TV-speaker filtering and a 0.38 master gain after saturation; voices and grunts have lower input gains, and reverb is a short cabinet reflection.
- Touch buttons disable native selection and callouts, capture each held pointer, and release on cancellation, lost capture, blur, or a hidden page.
- The CRT shader's `lines` uniform: scanline density follows the tube's rendered size instead of a fixed 384, so the effect survives on small screens.
- Stronger CRT look than the original: heavier scanlines/grille, more curvature, colour fringing and vignette, a glass glare streak in the shader, and glass opacity 0.26 (was 0.11).
Assets live in `public/sinfeld/`. The about page mounts `components/sinfeld-tv.tsx`, which sets `window.SINFELD_EMBED`,
`SINFELD_ASSET_BASE` and `SINFELD_TRANSPARENT`, imports both files, then calls `startSinfeld()` and `startSinfeldTv()`.
