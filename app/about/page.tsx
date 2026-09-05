"use client";

import { useEffect, useRef } from "react";
import { SinfeldTv } from "@/components/sinfeld-tv";

const PHOTOS = [
  "img-0901.jpg",
  "img-0915.jpg",
  "img-0919.jpg",
  "img-0937.jpg",
  "img-0939.jpg",
  "img-5960.jpg",
  "img-5961.jpg",
  "mg-1633.jpg",
  "mg-1634.jpg",
  "mg-1638.jpg",
  "mg-1639.jpg",
  "mg-1646.jpg"
].map((f) => `/photos/house-house-2024/${f}`);

const PHRASE = [
  "BONK", "WE", "DON'T", "KNOW", "BONK", "WHO", "WE", "ARE", "YET",
  "BONK", "RUNNING", "OUT", "OF", "TIME", "BONK", "WE", "DO", "THIS",
  "BONK", "BECAUSE", "WE", "LOVE", "TO", "BONK", "AND", "WITHOUT",
  "THE", "BONK", "WE", "WOULD", "BE", "DEAD"
];

type WordEvent = {
  text: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
  frames: number;
  maxFrames: number;
  style: number;
};

export default function AboutPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const backdrop = canvas.parentElement!;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const smallScreen = window.matchMedia("(pointer: coarse), (max-width: 767px)");
    let engaged = false;
    let pixelScale = 1;

    const W = 480;
    const H = 270;
    const buffer = document.createElement("canvas");
    buffer.width = W;
    buffer.height = H;
    const bctx = buffer.getContext("2d")!;

    // Performance: the static runs at 30fps (looks identical to 60 for noise)
    // and the noise itself is pre-rendered once into a few oversized frames
    // that get shuffled and offset each tick, instead of half a million
    // Math.random() calls per frame.
    const FPS = 30;
    const frameScale = FPS / 60; // word lifetimes were tuned in 60fps ticks
    const NOISE_FRAMES = 6;
    const PAD = 64;
    const noiseFrames = Array.from({ length: NOISE_FRAMES }, () => {
      const c = document.createElement("canvas");
      c.width = W + PAD;
      c.height = H + PAD;
      const nctx = c.getContext("2d")!;
      const img = nctx.createImageData(c.width, c.height);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = 20 + Math.random() * 160;
        d[i] = v;
        d[i + 1] = v * 0.96;
        d[i + 2] = v;
        d[i + 3] = 255;
      }
      nctx.putImageData(img, 0, 0);
      return c;
    });

    // A flash needs one photo, so do not download the entire gallery on entry.
    const photos: (HTMLImageElement | undefined)[] = [];
    const photoAt = (index: number) => {
      if (!photos[index]) {
        const img = new Image();
        img.decoding = "async";
        img.src = PHOTOS[index];
        photos[index] = img;
      }
      return photos[index];
    };

    let raf = 0;
    let frame = 0;
    let burst = 0;
    let flashPhoto = -1;
    let flashFrames = 0;
    let phraseIndex = 0;
    const activeWords: WordEvent[] = [];
    let nextWordAt = performance.now() + 300;
    const bebas =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--font-bebas")
        .trim() || "Impact, sans-serif";
    let mouseX = 0.5;
    let mouseY = 0.5;

    const resize = () => {
      const maxWidth = smallScreen.matches ? 640 : 1280;
      pixelScale = Math.min(1, maxWidth / window.innerWidth, 720 / window.innerHeight);
      canvas.width = Math.round(window.innerWidth * pixelScale);
      canvas.height = Math.round(window.innerHeight * pixelScale);
      ctx.imageSmoothingEnabled = false;
    };
    resize();

    const onMove = (e: PointerEvent) => {
      mouseX = e.clientX / window.innerWidth;
      mouseY = e.clientY / window.innerHeight;
      burst = Math.min(burst + 0.5, 6);
    };
    const makeWordEvent = (text: string): WordEvent => {
      const isBonk = text === "BONK";

      // words favor the outer parts of the frame, avoiding dead center
      let x: number;
      let y: number;
      const zone = Math.floor(Math.random() * 8);
      switch (zone) {
        case 0: x = 0.08 + Math.random() * 0.28; y = 0.10 + Math.random() * 0.25; break;
        case 1: x = 0.62 + Math.random() * 0.30; y = 0.08 + Math.random() * 0.28; break;
        case 2: x = 0.05 + Math.random() * 0.30; y = 0.62 + Math.random() * 0.28; break;
        case 3: x = 0.64 + Math.random() * 0.30; y = 0.62 + Math.random() * 0.28; break;
        case 4: x = 0.03 + Math.random() * 0.24; y = 0.30 + Math.random() * 0.40; break;
        case 5: x = 0.73 + Math.random() * 0.24; y = 0.30 + Math.random() * 0.40; break;
        case 6: x = 0.25 + Math.random() * 0.50; y = 0.05 + Math.random() * 0.18; break;
        default: x = 0.20 + Math.random() * 0.60; y = 0.78 + Math.random() * 0.17; break;
      }

      const size = isBonk ? 72 + Math.random() * 72 : 38 + Math.random() * 58;
      const maxFrames = Math.max(
        2,
        Math.round((isBonk ? 18 + Math.random() * 14 : 35 + Math.random() * 35) * frameScale)
      );

      return {
        text,
        x,
        y,
        size,
        rotation: (Math.random() - 0.5) * (isBonk ? 0.24 : 0.12),
        frames: maxFrames,
        maxFrames,
        style: Math.floor(Math.random() * 4)
      };
    };

    const spawnNextWord = () => {
      const text = PHRASE[phraseIndex];
      activeWords.push(makeWordEvent(text));
      phraseIndex = (phraseIndex + 1) % PHRASE.length;

      // old words can linger and overlap for a beat, but only a few at once
      while (activeWords.length > 5) {
        activeWords.shift();
      }

      if (text === "BONK") {
        burst = Math.max(burst, 7);
        nextWordAt = performance.now() + 900 + Math.random() * 700;
      } else {
        // irregular timing stops the sentence from feeling like subtitles
        const r = Math.random();
        if (r < 0.12) {
          nextWordAt = performance.now() + 3200 + Math.random() * 1500;
        } else if (r < 0.38) {
          nextWordAt = performance.now() + 1400 + Math.random() * 600;
        } else {
          nextWordAt = performance.now() + 2000 + Math.random() * 1200;
        }
      }
    };

    const drawWordEvent = (event: WordEvent) => {
      const progress = event.frames / event.maxFrames;
      const isBonk = event.text === "BONK";
      const jitter = isBonk ? 6 : 2.5;
      const x = event.x * W + (Math.random() - 0.5) * jitter;
      const y = event.y * H + (Math.random() - 0.5) * jitter;
      const alpha = Math.min(1, progress * 2.5);

      bctx.save();
      bctx.translate(x, y);
      bctx.rotate(event.rotation + (Math.random() - 0.5) * 0.015);
      bctx.font = `${event.size}px ${bebas}`;
      bctx.textAlign = "center";
      bctx.textBaseline = "middle";

      // chromatic registration ghosts
      bctx.globalAlpha = alpha * 0.65;
      bctx.fillStyle = "rgb(255,0,45)";
      bctx.fillText(event.text, -4 - Math.random() * 3, 1);
      bctx.fillStyle = "rgb(0,255,255)";
      bctx.fillText(event.text, 4 + Math.random() * 3, -1);

      bctx.globalAlpha = alpha;
      switch (event.style) {
        case 0: bctx.fillStyle = "#fff"; break;
        case 1: bctx.fillStyle = "#ffd400"; break;
        case 2: bctx.fillStyle = "#ff003c"; break;
        default: bctx.fillStyle = isBonk ? "#fff" : "#d7d7d7"; break;
      }
      bctx.fillText(event.text, 0, 0);

      if (isBonk && Math.random() < 0.25) {
        bctx.globalAlpha = 0.9;
        bctx.fillStyle = "#000";
        bctx.fillText(event.text, (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 8);
      }

      bctx.restore();
    };

    const drawActiveWords = (elapsedFrames: number) => {
      for (let i = activeWords.length - 1; i >= 0; i--) {
        const event = activeWords[i];
        drawWordEvent(event);
        event.frames -= elapsedFrames;
        if (event.frames <= 0) {
          activeWords.splice(i, 1);
        }
      }
    };

    const onDown = (event: PointerEvent) => {
      if (reducedMotion.matches || (event.target instanceof Element && event.target.closest("header, button, a"))) return;
      burst = 24;
      flashPhoto = Math.floor(Math.random() * PHOTOS.length);
      photoAt(flashPhoto);
      flashFrames = 4;
      // a click forces BONK into the sequence without resetting the sentence
      activeWords.push(makeWordEvent("BONK"));
      nextWordAt = performance.now() + 90;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerdown", onDown);

    let lastTick = 0;
    const tick = (now: number) => {
      raf = 0;
      if (document.hidden) return;
      if (!reducedMotion.matches) raf = requestAnimationFrame(tick);
      const fps = engaged ? 15 : smallScreen.matches ? 20 : FPS;
      if (now - lastTick < 1000 / fps) return;
      const elapsedFrames = lastTick ? Math.min(3, (now - lastTick) / (1000 / FPS)) : 1;
      lastTick = now;
      frame++;

      // static, dimmed to keep the flicker moody instead of strobing: a
      // pre-rendered noise frame drawn at a random offset reads as fresh noise
      const redPhase = frame % 120 < 4;
      const greenPhase = frame % 310 < 3;
      bctx.drawImage(
        noiseFrames[(frame * 7 + Math.floor(Math.random() * NOISE_FRAMES)) % NOISE_FRAMES],
        -Math.floor(Math.random() * PAD),
        -Math.floor(Math.random() * PAD)
      );
      if (redPhase || greenPhase) {
        bctx.globalCompositeOperation = "multiply";
        bctx.fillStyle = redPhase ? "rgb(255,150,70)" : "rgb(170,255,80)";
        bctx.fillRect(0, 0, W, H);
        bctx.globalCompositeOperation = "source-over";
      }

      // subliminal photo splice, a few frames at a time
      if (!reducedMotion.matches && flashFrames <= 0 && Math.random() < 0.006) {
        flashPhoto = Math.floor(Math.random() * PHOTOS.length);
        photoAt(flashPhoto);
        flashFrames = 2 + Math.floor(Math.random() * 4);
      }
      if (flashFrames > 0) {
        const img = photos[flashPhoto];
        if (img?.complete && img.naturalWidth) {
          bctx.save();
          if (Math.random() < 0.3) {
            bctx.translate(W, 0);
            bctx.scale(-1, 1);
          }
          bctx.globalAlpha = 0.85;
          bctx.filter =
            Math.random() < 0.35
              ? "invert(1) contrast(1.8)"
              : "saturate(2.6) contrast(1.5) brightness(0.9)";
          bctx.drawImage(
            img,
            (Math.random() - 0.5) * 50 - 10,
            (Math.random() - 0.5) * 36 - 8,
            W + 40,
            H + 30
          );
          bctx.restore();
          bctx.filter = "none";
          bctx.globalAlpha = 1;
        }
        flashFrames -= elapsedFrames;
      }

      // the phrase runs continuously, one scattered word at a time
      if (!reducedMotion.matches && performance.now() >= nextWordAt) {
        spawnNextWord();
      }
      drawActiveWords(elapsedFrames);

      // vertical hold slipping
      const jumpY =
        !reducedMotion.matches && Math.random() < 0.04 ? (Math.random() - 0.5) * canvas.height * 0.5 : 0;
      ctx.drawImage(buffer, 0, jumpY, canvas.width, canvas.height);
      if (jumpY) {
        ctx.drawImage(
          buffer,
          0,
          jumpY + (jumpY > 0 ? -canvas.height : canvas.height),
          canvas.width,
          canvas.height
        );
      }

      // horizontal slice tearing, worse when agitated. Slices come from the
      // small buffer, not the screen canvas: copying a full-screen canvas onto
      // itself forces a readback each time and was the other big cost.
      const scaleY = H / canvas.height;
      const slices = Math.min(12, 2 + Math.floor(burst));
      for (let s = 0; s < slices; s++) {
        const sy = Math.random() * canvas.height;
        const sh = (4 + Math.random() * 42) * pixelScale;
        const dx = (Math.random() - 0.5) * (30 + burst * 22) * pixelScale;
        ctx.drawImage(buffer, 0, sy * scaleY, W, sh * scaleY, dx, sy, canvas.width, sh);
      }

      // the cursor drags the signal sideways
      const cy = mouseY * canvas.height;
      ctx.drawImage(buffer, 0, (cy - 22 * pixelScale) * scaleY, W, 44 * pixelScale * scaleY, (mouseX - 0.5) * 140 * pixelScale, cy - 22 * pixelScale, canvas.width, 44 * pixelScale);

      // occasional chroma ghost
      if (burst > 8 || frame % 100 < 2) {
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = 0.3;
        ctx.drawImage(canvas, 7 * pixelScale, 0);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
      }

      burst = Math.max(0, burst - 1.6 * elapsedFrames);
    };
    const dimBackdrop = () => {
      engaged = true;
      backdrop.dataset.dimmed = "true";
    };
    const resumeDrawing = () => {
      cancelAnimationFrame(raf);
      lastTick = 0;
      backdrop.dataset.hidden = String(document.hidden);
      if (!document.hidden) raf = requestAnimationFrame(tick);
    };
    const onDisplayChange = () => { resize(); resumeDrawing(); };
    document.addEventListener("tv:click", dimBackdrop, { once: true });
    document.addEventListener("visibilitychange", resumeDrawing);
    reducedMotion.addEventListener("change", resumeDrawing);
    window.addEventListener("resize", onDisplayChange);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onDisplayChange);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.removeEventListener("tv:click", dimBackdrop);
      document.removeEventListener("visibilitychange", resumeDrawing);
      reducedMotion.removeEventListener("change", resumeDrawing);
    };
  }, []);

  return (
    <>
    {/* Pixel font for the game's canvas text. */}
    <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" />
    <div aria-hidden className="about-void">
      <canvas ref={canvasRef} />
      <div className="about-scanlines" />
      <div className="about-vignette" />
      <style>{`
        .about-void {
          position: fixed;
          inset: 0;
          z-index: 40;
          overflow: hidden;
          background: #000;
          cursor: crosshair;
        }
        .about-void canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          opacity: 1;
          transition: opacity 800ms ease;
          animation: about-hue 13s steps(1, end) infinite;
        }
        .about-void[data-dimmed="true"] canvas { opacity: .5; }
        .about-void[data-hidden="true"] canvas,
        .about-void[data-hidden="true"] .about-scanlines { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) {
          .about-void canvas, .about-void .about-scanlines { animation: none !important; transition: none; }
        }
        .about-scanlines {
          position: absolute;
          inset: -100% 0 0 0;
          pointer-events: none;
          background: repeating-linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0) 0px,
            rgba(0, 0, 0, 0) 3px,
            rgba(0, 0, 0, 0.45) 4px
          );
          animation: about-roll 9s linear infinite;
        }
        .about-vignette {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(
            ellipse at center,
            rgba(0, 0, 0, 0) 55%,
            rgba(0, 0, 0, 0.85) 100%
          );
        }
        @keyframes about-roll {
          to { transform: translateY(50%); }
        }
        @keyframes about-hue {
          0%, 91% { filter: none; }
          92%, 93% { filter: hue-rotate(120deg) saturate(2); }
          94%, 96% { filter: none; }
          97%, 98% { filter: invert(1); }
          99% { filter: none; }
        }
      `}</style>
    </div>
    {/* The game's CRT floats over the static; the static is its backdrop. */}
    <SinfeldTv />
    </>
  );
}
