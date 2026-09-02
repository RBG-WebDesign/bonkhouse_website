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

    const W = 480;
    const H = 270;
    const buffer = document.createElement("canvas");
    buffer.width = W;
    buffer.height = H;
    const bctx = buffer.getContext("2d")!;
    const noise = bctx.createImageData(W, H);

    const photos = PHOTOS.map((src) => {
      const img = new Image();
      img.src = src;
      return img;
    });

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
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.imageSmoothingEnabled = false;
    };
    resize();
    window.addEventListener("resize", resize);

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
      const maxFrames = isBonk
        ? 18 + Math.floor(Math.random() * 14)
        : 35 + Math.floor(Math.random() * 35);

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

    const drawActiveWords = () => {
      for (let i = activeWords.length - 1; i >= 0; i--) {
        const event = activeWords[i];
        drawWordEvent(event);
        event.frames--;
        if (event.frames <= 0) {
          activeWords.splice(i, 1);
        }
      }
    };

    const onDown = () => {
      burst = 24;
      flashPhoto = Math.floor(Math.random() * photos.length);
      flashFrames = 4;
      // a click forces BONK into the sequence without resetting the sentence
      activeWords.push(makeWordEvent("BONK"));
      nextWordAt = performance.now() + 90;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerdown", onDown);

    const tick = () => {
      frame++;

      // static, dimmed to keep the flicker moody instead of strobing
      const d = noise.data;
      const redPhase = frame % 240 < 8;
      const greenPhase = frame % 620 < 6;
      for (let i = 0; i < d.length; i += 4) {
        const v = 20 + Math.random() * 160;
        d[i] = redPhase ? v * 1.4 : v;
        d[i + 1] = greenPhase ? v * 1.4 : v * 0.96;
        d[i + 2] = redPhase || greenPhase ? v * 0.3 : v;
        d[i + 3] = 255;
      }
      bctx.putImageData(noise, 0, 0);

      // subliminal photo splice, a few frames at a time
      if (flashFrames <= 0 && Math.random() < 0.006) {
        flashPhoto = Math.floor(Math.random() * photos.length);
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
        flashFrames--;
      }

      // the phrase runs continuously, one scattered word at a time
      if (performance.now() >= nextWordAt) {
        spawnNextWord();
      }
      drawActiveWords();

      // vertical hold slipping
      const jumpY =
        Math.random() < 0.04 ? (Math.random() - 0.5) * canvas.height * 0.5 : 0;
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

      // horizontal slice tearing, worse when agitated
      const slices = 2 + Math.floor(burst);
      for (let s = 0; s < slices; s++) {
        const sy = Math.random() * canvas.height;
        const sh = 4 + Math.random() * 42;
        const dx = (Math.random() - 0.5) * (30 + burst * 22);
        ctx.drawImage(canvas, 0, sy, canvas.width, sh, dx, sy, canvas.width, sh);
      }

      // the cursor drags the signal sideways
      const cy = mouseY * canvas.height;
      ctx.drawImage(
        canvas,
        0,
        cy - 22,
        canvas.width,
        44,
        (mouseX - 0.5) * 140,
        cy - 22,
        canvas.width,
        44
      );

      // occasional chroma ghost
      if (burst > 8 || frame % 200 < 3) {
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = 0.3;
        ctx.drawImage(canvas, 7, 0);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
      }

      burst = Math.max(0, burst - 0.8);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
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
          animation: about-hue 13s steps(1, end) infinite;
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
