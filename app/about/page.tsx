"use client";

import { useEffect, useRef } from "react";

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

const GLYPHS = "ABEKNOZX?!#%&Ж▲◼△Ø¥";

function pickWord() {
  const r = Math.random();
  if (r < 0.08) return "JOSH";
  if (r < 0.5) return "BONK";
  let s = "";
  const len = 3 + Math.floor(Math.random() * 4);
  for (let i = 0; i < len; i++) {
    s += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
  }
  return s;
}

export default function AboutPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 320;
    const H = 180;
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
    let word = "";
    let wordFrames = 0;
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
    const onDown = () => {
      burst = 24;
      flashPhoto = Math.floor(Math.random() * photos.length);
      flashFrames = 4;
      word = "BONK";
      wordFrames = 7;
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

      // giant flashing words, drawn low-res so they come out chunky
      if (wordFrames <= 0 && Math.random() < 0.015) {
        word = pickWord();
        wordFrames = 6 + Math.floor(Math.random() * 10);
      }
      if (wordFrames > 0) {
        const size = 70 + Math.random() * 30;
        const x = W / 2 + (Math.random() - 0.5) * 30;
        const y = H / 2 + (Math.random() - 0.5) * 44;
        bctx.save();
        bctx.font = `${size}px ${bebas}`;
        bctx.textAlign = "center";
        bctx.textBaseline = "middle";
        bctx.fillStyle = "rgba(255,0,60,0.75)";
        bctx.fillText(word, x - 3, y + 1);
        bctx.fillStyle = "rgba(0,255,255,0.75)";
        bctx.fillText(word, x + 3, y - 1);
        bctx.fillStyle =
          Math.random() < 0.2 ? "#000" : Math.random() < 0.55 ? "#ffd400" : "#fff";
        bctx.fillText(word, x, y);
        bctx.restore();
        wordFrames--;
      }

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
  );
}
