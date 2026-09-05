"use client";

import { useEffect } from "react";

// The SINFELD: Evil Resident runner, rendered on a 3D CRT that floats over the about page static.
// Runtime lives in lib/sinfeld (game.js + tv.mjs, copied from the PlatformerGame project); assets in public/sinfeld.
const ASSET_BASE = "/sinfeld/";

declare global {
  interface Window {
    SINFELD_EMBED?: boolean;
    SINFELD_ASSET_BASE?: string;
    SINFELD_TRANSPARENT?: boolean;
    startSinfeld?: () => (() => void);
    sinfeldListeners?: AbortController;
  }
}

export function SinfeldTv() {
  useEffect(() => {
    let cancelled = false;
    let stopGame: (() => void) | undefined;
    let stopTv: (() => void) | undefined;
    window.SINFELD_EMBED = true;
    window.SINFELD_ASSET_BASE = ASSET_BASE;
    window.SINFELD_TRANSPARENT = true;

    (async () => {
      const [, tv] = await Promise.all([import("@/lib/sinfeld/game.js"), import("@/lib/sinfeld/tv.mjs")]);
      if (cancelled) return;
      stopGame = window.startSinfeld?.();
      stopTv = tv.startSinfeldTv();
    })().catch(() => {
      if (cancelled) return;
      const message = document.querySelector("#loading p");
      if (message) message.textContent = "Game could not load. Reload to try again.";
    });

    return () => {
      cancelled = true;
      stopTv?.();
      stopGame?.();
    };
  }, []);

  return (
    <section className="sinfeld-shell game-shell" aria-label="SINFELD: Evil Resident">
      <canvas id="tv-stage" tabIndex={0} aria-label="Playable game displayed on a three-dimensional CRT television" />
      <canvas id="game" width={1280} height={720} tabIndex={0} aria-label="Playable endless runner canvas" />

      <div id="loading" className="loading-panel">
        <p>Loading</p>
        <div className="loading-line">
          <i />
        </div>
      </div>

      <button id="music-toggle" className="music-toggle" type="button" aria-pressed="false" aria-label="Toggle music">
        <span className="music-bars" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        Music off
      </button>

      <div className="touch-controls" aria-label="Touch controls">
        <button type="button" data-control="left" aria-label="Move left">
          ←
        </button>
        <button type="button" data-control="right" aria-label="Move right">
          →
        </button>
        <button type="button" data-control="jump" className="jump-button" aria-label="Jump">
          ↑
        </button>
      </div>

      <audio id="music" loop preload="none" src={`${ASSET_BASE}audio/music/music-loop.mp3`} />

      <style>{`
        .sinfeld-shell {
          --game-bottom-space: 0px;
          position: fixed;
          inset: 0;
          height: 100dvh;
          z-index: 45; /* above the about-page static (40), below the site header (50) */
          overflow: hidden;
          pointer-events: none;
          -webkit-user-select: none;
          user-select: none;
          -webkit-touch-callout: none;
        }
        .sinfeld-shell #tv-stage {
          position: absolute;
          top: var(--bh-header-height, 80px);
          left: 0;
          z-index: 2;
          display: block;
          width: 100%;
          height: calc(100% - var(--bh-header-height, 80px) - var(--game-bottom-space));
          opacity: 0;
          outline: none;
          pointer-events: none;
          touch-action: none;
          transition: opacity 700ms ease;
        }
        .sinfeld-shell.tv-mode #tv-stage { opacity: 1; pointer-events: auto; }
        .sinfeld-shell #game {
          position: absolute;
          z-index: 1;
          top: calc(var(--bh-header-height, 80px) + (100% - var(--bh-header-height, 80px) - var(--game-bottom-space)) / 2);
          left: 50%;
          width: min(100%, calc((100dvh - var(--bh-header-height, 80px) - var(--game-bottom-space)) * 16 / 9));
          aspect-ratio: 16 / 9;
          transform: translate(-50%, -50%);
          image-rendering: pixelated;
          outline: none;
          pointer-events: auto;
          touch-action: none;
          transition: opacity 500ms ease;
        }
        .sinfeld-shell.tv-mode #game { opacity: 0; pointer-events: none; }
        .sinfeld-shell .loading-panel {
          position: absolute;
          inset: 0;
          z-index: 10;
          display: grid;
          place-content: center;
          justify-items: center;
          gap: 12px;
          background: rgba(0, 0, 0, 0.75);
          color: #f5eedb;
          transition: opacity 350ms ease, visibility 350ms ease;
        }
        .sinfeld-shell .loading-panel.hidden { opacity: 0; visibility: hidden; }
        .sinfeld-shell .loading-panel p {
          margin: 0;
          font: 700 12px/1 Consolas, monospace;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }
        .sinfeld-shell .loading-line { width: 190px; height: 3px; overflow: hidden; background: rgba(255, 255, 255, 0.1); }
        .sinfeld-shell .loading-line i {
          display: block;
          width: 45%;
          height: 100%;
          background: #65e8ff;
          animation: sinfeld-load 800ms ease-in-out infinite alternate;
        }
        @keyframes sinfeld-load { to { transform: translateX(125%); } }
        .sinfeld-shell .music-toggle {
          position: absolute;
          z-index: 6;
          right: 14px;
          bottom: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid rgba(245, 238, 219, 0.2);
          border-radius: 2px;
          padding: 8px 10px;
          color: #f5eedb;
          background: rgba(8, 11, 18, 0.6);
          font: 700 10px/1 Consolas, monospace;
          text-transform: uppercase;
          cursor: pointer;
          opacity: 0.45;
          pointer-events: auto;
          transition: opacity 200ms ease;
        }
        .sinfeld-shell .music-toggle:hover { opacity: 1; border-color: #65e8ff; }
        .sinfeld-shell .music-bars { display: flex; align-items: end; gap: 2px; height: 11px; }
        .sinfeld-shell .music-bars i { width: 2px; height: 40%; background: #ff5c35; }
        .sinfeld-shell .music-toggle[aria-pressed="true"] .music-bars i { animation: sinfeld-music 480ms ease-in-out infinite alternate; }
        .sinfeld-shell .music-toggle[aria-pressed="true"] .music-bars i:nth-child(2) { animation-delay: -200ms; }
        .sinfeld-shell .music-toggle[aria-pressed="true"] .music-bars i:nth-child(3) { animation-delay: -350ms; }
        @keyframes sinfeld-music { to { height: 100%; } }
        .sinfeld-shell .touch-controls { display: none; }
        @media (pointer: coarse), (max-width: 767px) {
          .sinfeld-shell { --game-bottom-space: calc(126px + env(safe-area-inset-bottom, 0px)); }
          .sinfeld-shell .music-toggle {
            right: max(12px, env(safe-area-inset-right));
            bottom: calc(82px + env(safe-area-inset-bottom, 0px));
            min-height: 32px;
            opacity: .8;
          }
          .sinfeld-shell .touch-controls {
            position: absolute;
            z-index: 6;
            right: max(12px, env(safe-area-inset-right));
            bottom: calc(12px + env(safe-area-inset-bottom, 0px));
            left: max(12px, env(safe-area-inset-left));
            display: grid;
            grid-template-columns: 1fr 1fr 1.3fr;
            gap: 10px;
            pointer-events: auto;
            touch-action: none;
          }
          .sinfeld-shell .touch-controls button {
            min-height: 58px;
            border: 1px solid rgba(101, 232, 255, 0.35);
            border-radius: 7px;
            color: #f5eedb;
            background: rgba(16, 22, 34, 0.7);
            font: 400 24px/1 Impact, sans-serif;
            touch-action: none;
            -webkit-user-select: none;
            user-select: none;
            -webkit-touch-callout: none;
          }
          .sinfeld-shell .touch-controls button[data-held="true"] { background: rgba(40, 61, 76, .95); border-color: #65e8ff; }
          .sinfeld-shell .touch-controls .jump-button { border-color: rgba(255, 92, 53, 0.55); color: #ff5c35; }
        }
        @media (orientation: landscape) and (max-height: 600px) {
          .sinfeld-shell { --game-bottom-space: env(safe-area-inset-bottom, 0px); }
          .sinfeld-shell .touch-controls { grid-template-columns: 58px 58px 1fr 72px; }
          .sinfeld-shell .jump-button { grid-column: 4; }
        }
      `}</style>
    </section>
  );
}
