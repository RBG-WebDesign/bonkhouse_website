"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type HeroShaderBackgroundProps = {
  className?: string;
  src: string;
};

const vertexShaderSource = `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const fragmentShaderSource = `
precision mediump float;
#define GLSLIFY 1

uniform float u_time;
uniform vec2 u_mouse;
uniform vec2 u_resolution;
uniform vec2 u_image_resolution;
uniform sampler2D u_texture;
varying vec2 v_uv;

float smoothNoise(vec2 st);

vec2 coverUv(vec2 uv) {
  float screenAspect = u_resolution.x / u_resolution.y;
  float imageAspect = u_image_resolution.x / u_image_resolution.y;
  vec2 scale = vec2(1.0);

  if (screenAspect > imageAspect) {
    scale.y = imageAspect / screenAspect;
  } else {
    scale.x = screenAspect / imageAspect;
  }

  return (uv - 0.5) * scale + 0.5;
}

vec2 distort(vec2 uv, vec2 center, float strength, float frequency) {
    vec2 dir = uv - center;
    float dist = length(dir);
    float distortion = sin(dist * frequency - u_time * 0.5) * strength;
    distortion *= smoothstep(0.5, 0.0, dist);
    return uv + dir * distortion;
}

vec2 rippleFromCenter(vec2 uv, vec2 normalizedUV, float aspect) {
    vec2 center = vec2(0.0);
    vec2 dir = normalizedUV - center;
    float dist = max(length(dir), 0.001);
    vec2 radialDir = dir / dist;
    vec2 uvDir = vec2(radialDir.x / aspect, radialDir.y);

    float outerFade = smoothstep(1.05, 0.05, dist);
    float innerFade = smoothstep(0.0, 0.16, dist);
    float wave = sin(dist * 42.0 - u_time * 2.35);
    float wideWave = sin(dist * 18.0 - u_time * 1.35 + smoothNoise(normalizedUV * 4.0) * 1.8);
    float shimmer = smoothNoise(normalizedUV * 10.0 + u_time * 0.18) - 0.5;
    float displacement = (wave * 0.024 + wideWave * 0.012 + shimmer * 0.004) * outerFade * innerFade;

    return uv + uvDir * displacement;
}

vec3 chromaticAberration(sampler2D tex, vec2 uv, float strength) {
    // Stronger at edges
    float edgeFactor = length(vec2(0.5, 0.5) - uv) * 2.0;
    strength *= edgeFactor * 1.5;
    
    vec2 offset = vec2(strength, 0.0);
    
    float r = texture2D(tex, coverUv(uv - offset)).r;
    float g = texture2D(tex, coverUv(uv)).g;
    float b = texture2D(tex, coverUv(uv + offset)).b;
    
    return vec3(r, g, b);
}

float noise(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float smoothNoise(vec2 st) {
    vec2 ipos = floor(st);
    vec2 fpos = fract(st);
    
    fpos = fpos * fpos * (3.0 - 2.0 * fpos);
    
    float bl = noise(ipos);
    float br = noise(ipos + vec2(1.0, 0.0));
    float tl = noise(ipos + vec2(0.0, 1.0));
    float tr = noise(ipos + vec2(1.0, 1.0));
    
    float b = mix(bl, br, fpos.x);
    float t = mix(tl, tr, fpos.x);
    
    return mix(b, t, fpos.y);
}

void main() {
    // Adjust for aspect ratio
    vec2 uv = v_uv;
    float aspect = u_resolution.x / u_resolution.y;
    vec2 normalizedUV = vec2((uv.x - 0.5) * aspect, uv.y - 0.5);
    vec2 normalizedMouse = vec2((u_mouse.x - 0.5) * aspect, u_mouse.y - 0.5);
    
    // Main outward ripple from the image center
    vec2 distortedUV = rippleFromCenter(uv, normalizedUV, aspect);

    // Mouse adds a smaller local wake so the center ripple stays dominant
    float mouseDistance = max(length(normalizedUV - normalizedMouse), 0.001);
    float mouseInfluence = 1.0 - smoothstep(0.0, 0.34, mouseDistance);
    vec2 mouseDelta = normalizedUV - normalizedMouse;
    vec2 mouseDir = mouseDelta / max(length(mouseDelta), 0.001);
    vec2 mouseUvDir = vec2(mouseDir.x / aspect, mouseDir.y);
    float mouseWave = sin(mouseDistance * 38.0 - u_time * 2.8) * 0.008 * mouseInfluence;
    
    // Add some noise for more interesting distortion
    vec2 noiseCoord = normalizedUV * 3.0 + u_time * 0.1;
    float noiseVal = smoothNoise(noiseCoord) * 0.006;
    distortedUV += mouseUvDir * (mouseWave + noiseVal * mouseInfluence);
    
    // Apply chromatic aberration (stronger at edges)
    float centerDistance = length(normalizedUV);
    float ringGlow = 0.5 + 0.5 * sin(centerDistance * 32.0 - u_time * 2.35);
    vec3 color = chromaticAberration(u_texture, distortedUV, 0.008 + ringGlow * 0.006 + mouseInfluence * 0.008);
    
    // Add a subtle vignette effect
    float vignette = smoothstep(1.2, 0.5, length(v_uv - vec2(0.5)));
    color *= vignette;
    
    // Add a subtle pulsing glow around mouse
    float pulse = 0.5 + 0.5 * sin(u_time * 2.0);
    float glow = smoothstep(0.3 + 0.1 * pulse, 0.0, length(normalizedUV - normalizedMouse));
    color += vec3(0.1, 0.05, 0.2) * glow;
    
    gl_FragColor = vec4(color, 1.0);
}
`;

export function HeroShaderBackground({ className, src }: HeroShaderBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef({ x: 0.5, y: 0.5 });
  const [hasFallback, setHasFallback] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      depth: false,
      preserveDrawingBuffer: false,
      stencil: false
    });

    if (!gl) {
      setHasFallback(true);
      return;
    }

    const parent = canvas.parentElement ?? canvas;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let animationFrame = 0;
    let disposed = false;
    let imageSize = { width: 1, height: 1 };
    const startTime = performance.now();

    const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);

    if (!program) {
      setHasFallback(true);
      return;
    }

    const positionLocation = gl.getAttribLocation(program, "a_position");
    const timeLocation = gl.getUniformLocation(program, "u_time");
    const mouseLocation = gl.getUniformLocation(program, "u_mouse");
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const imageResolutionLocation = gl.getUniformLocation(program, "u_image_resolution");
    const textureLocation = gl.getUniformLocation(program, "u_texture");
    const positionBuffer = gl.createBuffer();
    const texture = gl.createTexture();

    if (!positionBuffer || !texture) {
      setHasFallback(true);
      return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.floor(rect.width * pixelRatio));
      const height = Math.max(1, Math.floor(rect.height * pixelRatio));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      gl.viewport(0, 0, width, height);
    };

    const render = (now: number) => {
      if (disposed) {
        return;
      }

      resize();

      const elapsed = reducedMotion ? 0 : (now - startTime) / 1000;
      const pointer = pointerRef.current;

      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(textureLocation, 0);
      gl.uniform1f(timeLocation, elapsed);
      gl.uniform2f(mouseLocation, pointer.x, pointer.y);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform2f(imageResolutionLocation, imageSize.width, imageSize.height);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      if (!reducedMotion) {
        animationFrame = requestAnimationFrame(render);
      }
    };

    const updatePointer = (event: PointerEvent) => {
      const rect = parent.getBoundingClientRect();
      pointerRef.current = {
        x: clamp((event.clientX - rect.left) / rect.width),
        y: clamp(1 - (event.clientY - rect.top) / rect.height)
      };
    };

    const resetPointer = () => {
      pointerRef.current = { x: 0.5, y: 0.5 };
    };

    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      if (disposed) {
        return;
      }

      imageSize = {
        width: image.naturalWidth,
        height: image.naturalHeight
      };

      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

      parent.addEventListener("pointermove", updatePointer);
      parent.addEventListener("pointerleave", resetPointer);
      window.addEventListener("resize", resize);

      render(performance.now());
    };
    image.onerror = () => {
      setHasFallback(true);
    };
    image.src = src;

    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      parent.removeEventListener("pointermove", updatePointer);
      parent.removeEventListener("pointerleave", resetPointer);
      window.removeEventListener("resize", resize);
      gl.deleteBuffer(positionBuffer);
      gl.deleteTexture(texture);
      gl.deleteProgram(program);
    };
  }, [src]);

  return (
    <div
      aria-hidden="true"
      className={cn("hero-shader-background", hasFallback && "hero-shader-background--fallback", className)}
    >
      <canvas className="hero-shader-background__canvas" ref={canvasRef} />
    </div>
  );
}

function clamp(value: number) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0.5));
}

function createProgram(gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

  if (!vertexShader || !fragmentShader) {
    return null;
  }

  const program = gl.createProgram();

  if (!program) {
    return null;
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);

  if (!shader) {
    return null;
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}
