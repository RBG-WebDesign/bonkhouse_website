# SINFELD: Evil Resident (embedded)

`game.js` and `tv.mjs` are copied verbatim from the PlatformerGame project. Edit them there and copy them back here.
Assets live in `public/sinfeld/`. The about page mounts `components/sinfeld-tv.tsx`, which sets `window.SINFELD_EMBED`,
`SINFELD_ASSET_BASE` and `SINFELD_TRANSPARENT`, imports both files, then calls `startSinfeld()` and `startSinfeldTv()`.
