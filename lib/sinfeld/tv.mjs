import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// Standalone: runs on load. Embedded (window.SINFELD_EMBED = true): the host imports this module and calls startSinfeldTv().
export async function startSinfeldTv() {
  const shell = document.querySelector(".game-shell");
  const stage = document.querySelector("#tv-stage");
  const gameCanvas = document.querySelector("#game");
  const statusDot = document.querySelector("#tv-status-dot");
  const statusLabel = document.querySelector("#tv-status");

  const ASSET_BASE = window.SINFELD_ASSET_BASE || "";
  const MODEL_URL = ASSET_BASE + "exports/props/retro-crt-tv/retro-crt-tv.glb";
  const FEED = { width: 1024, height: 768 };

  let renderer;
  let camera;
  let scene;
  let television;
  let tvPivot; // centred parent so spins and bobs happen around the visual middle of the set
  let feedTexture;
  let feedCanvas;
  let feedContext;
  let screenMaterial;
  let screenHeight = 0; // tube height in world units, for the scanline density
  let crtLight;
  let baseCamera;
  let pointerX = 0;
  let pointerY = 0;
  // Mouse interaction: hover tilts the set, drag spins it with inertia, a click punches the camera in.
  const spin = { yaw: 0, pitch: 0, velYaw: 0, velPitch: 0, dragging: false, lastX: 0, lastY: 0, moved: 0, idle: 0 };
  const SPIN = { perPixel: 0.0045, inertia: 0.88, returnAfter: 2.5, returnRate: 0.03 }; // drag feel and the drift back to facing front
  let punch = 0;
  const CAMERA_DISTANCE = 2.0;
  const BACKGROUND = 0x0e0d16; // flat placeholder, to be replaced
  let gameReady = gameCanvas.dataset.ready === "true";

  function setStatus(text, ready = false) {
    if (statusLabel) statusLabel.textContent = text; // the page no longer shows a status line; kept for console fallback
    if (statusDot) statusDot.classList.toggle("ready", ready);
  }

  function createFeed() {
    feedCanvas = document.createElement("canvas");
    feedCanvas.width = FEED.width;
    feedCanvas.height = FEED.height;
    feedContext = feedCanvas.getContext("2d", { alpha: false });

    feedTexture = new THREE.CanvasTexture(feedCanvas);
    feedTexture.colorSpace = THREE.SRGBColorSpace;
    feedTexture.flipY = false;
    feedTexture.generateMipmaps = false;
    feedTexture.minFilter = THREE.LinearFilter;
    feedTexture.magFilter = THREE.LinearFilter;
    feedTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  }

  function drawTuningSignal(time) {
    const width = FEED.width;
    const height = FEED.height;
    const image = feedContext.createImageData(width, height);
    const pixels = image.data;
    const seed = Math.floor(time * 0.08);

    for (let y = 0; y < height; y += 2) {
      for (let x = 0; x < width; x += 2) {
        const value = (x * 13 + y * 7 + seed * 17) % 42;
        const index = (y * width + x) * 4;
        pixels[index] = value;
        pixels[index + 1] = value + 8;
        pixels[index + 2] = value + 13;
        pixels[index + 3] = 255;
      }
    }

    feedContext.putImageData(image, 0, 0);
    feedContext.fillStyle = "rgba(4, 8, 12, 0.82)";
    feedContext.fillRect(0, height / 2 - 48, width, 96);
    feedContext.fillStyle = "#65e8ff";
    feedContext.font = "700 30px Consolas, monospace";
    feedContext.textAlign = "center";
    feedContext.textBaseline = "middle";
    feedContext.fillText("TUNING CHANNEL 08", width / 2, height / 2);
  }

  function drawGameFeed(time) {
    if (!gameReady) {
      drawTuningSignal(time);
      feedTexture.needsUpdate = true;
      return;
    }

    const sourceAspect = gameCanvas.width / gameCanvas.height;
    const feedAspect = FEED.width / FEED.height;
    const sourceWidth = gameCanvas.height * feedAspect;
    const sourceX = (gameCanvas.width - sourceWidth) / 2;

    feedContext.imageSmoothingEnabled = false;
    if (sourceAspect > feedAspect) {
      feedContext.drawImage(
        gameCanvas,
        sourceX,
        0,
        sourceWidth,
        gameCanvas.height,
        0,
        0,
        FEED.width,
        FEED.height,
      );
    } else {
      const sourceHeight = gameCanvas.width / feedAspect;
      const sourceY = (gameCanvas.height - sourceHeight) / 2;
      feedContext.drawImage(
        gameCanvas,
        0,
        sourceY,
        gameCanvas.width,
        sourceHeight,
        0,
        0,
        FEED.width,
        FEED.height,
      );
    }
    feedTexture.needsUpdate = true;
  }

  function createCrtMaterial() {
    return new THREE.ShaderMaterial({
      uniforms: {
        map: { value: feedTexture },
        time: { value: 0 },
        resolution: { value: new THREE.Vector2(FEED.width, FEED.height) },
        // Visible scanline count. Updated every frame from the tube's on-screen
        // size so the lines stay ~2 device pixels apart on any display; a fixed
        // count aliased into mush when the set rendered small (phones).
        lines: { value: 384 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D map;
        uniform float time;
        uniform vec2 resolution;
        uniform float lines;
        varying vec2 vUv;

        float hash(vec2 point) {
          return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453);
        }

        void main() {
          vec2 centered = vUv * 2.0 - 1.0;
          float radius2 = dot(centered, centered);
          vec2 curved = centered * (1.0 + 0.16 * radius2);
          vec2 uv = curved * 0.5 + 0.5;

          if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
            gl_FragColor = vec4(0.002, 0.004, 0.005, 1.0);
            return;
          }

          float aberration = 0.0028 + radius2 * 0.0022;
          float red = texture2D(map, uv + vec2(aberration, 0.0)).r;
          float green = texture2D(map, uv).g;
          float blue = texture2D(map, uv - vec2(aberration, 0.0)).b;
          vec3 color = vec3(red, green, blue);

          vec2 glowStep = vec2(3.5) / resolution;
          vec3 glow = texture2D(map, uv + vec2(glowStep.x, 0.0)).rgb;
          glow += texture2D(map, uv - vec2(glowStep.x, 0.0)).rgb;
          glow += texture2D(map, uv + vec2(0.0, glowStep.y)).rgb;
          glow += texture2D(map, uv - vec2(0.0, glowStep.y)).rgb;
          glow += texture2D(map, uv + glowStep).rgb;
          glow += texture2D(map, uv - glowStep).rgb;
          glow *= 0.1667;
          glow = max(glow - 0.2, 0.0);

          // Lift midtones, add gain, then push saturation so the picture reads
          // punchy through the scanlines and glass.
          color = pow(max(color, vec3(0.0)), vec3(0.6)) * 1.75;
          float luma = dot(color, vec3(0.299, 0.587, 0.114));
          color = mix(vec3(luma), color, 1.4);
          color += glow * 0.7;

          float scanline = 0.8 + 0.22 * sin(uv.y * lines * 6.2831853);
          float grille = 0.90 + 0.10 * sin(uv.x * lines * 0.889 * 6.2831853);
          float noise = (hash(uv * resolution + floor(time * 60.0)) - 0.5) * 0.035;
          float flicker = 0.985 + 0.015 * sin(time * 47.0);
          float vignette = pow(clamp(1.0 - radius2 * 0.42, 0.0, 1.0), 1.4);
          float edgeGlow = 1.0 + 0.08 * exp(-12.0 * abs(centered.y + 0.08));
          // Glass glare: a soft diagonal reflection streak across the tube,
          // brighter toward the upper left where the key light sits.
          float glare = 0.12 * smoothstep(0.26, 0.0, abs(centered.x * 0.55 + centered.y - 0.35))
                      * (0.55 + 0.45 * smoothstep(1.0, -1.0, centered.x));

          color = color * scanline * grille * flicker * vignette * edgeGlow + noise;
          color += vec3(0.026, 0.044, 0.052) * vignette;
          color += vec3(0.012, 0.028, 0.032) * (1.0 - vignette);
          color += vec3(0.78, 0.88, 0.95) * glare;
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
  }

  function configureScene() {
    renderer = new THREE.WebGLRenderer({
      canvas: stage,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    scene = new THREE.Scene();
    // A host page can ask for a transparent stage so its own backdrop shows behind the floating set.
    scene.background = window.SINFELD_TRANSPARENT ? null : new THREE.Color(BACKGROUND);

    camera = new THREE.PerspectiveCamera(31, 16 / 9, 0.01, 20);
    baseCamera = new THREE.Vector3(CAMERA_DISTANCE, 0.08, 0.28);
    camera.position.copy(baseCamera);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.HemisphereLight(0x8bdff2, 0x161018, 1.6));

    const key = new THREE.DirectionalLight(0xffe9cf, 2.6);
    key.position.set(2.4, 2.1, 1.6);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);

    const cyanRim = new THREE.PointLight(0x45dfff, 8, 4, 2);
    cyanRim.position.set(0.3, 0.5, -1.4);
    scene.add(cyanRim);

    const magentaRim = new THREE.PointLight(0xff4d9d, 6, 4, 2);
    magentaRim.position.set(-0.8, 0.2, 1.4);
    scene.add(magentaRim);

    createFeed();
  }

  function findScreenMesh(root) {
    let screen = null;
    root.traverse((object) => {
      if (!screen && object.isMesh && object.material?.emissiveMap) screen = object;
    });
    return screen;
  }

  function findGlassMesh(root, screen) {
    const candidates = [];
    root.traverse((object) => {
      if (object.isMesh && object !== screen && object.material?.map) {
        candidates.push(object);
      }
    });
    candidates.sort(
      (left, right) => left.position.distanceTo(screen.position) - right.position.distanceTo(screen.position),
    );
    const glass = candidates[0];
    return glass && glass.position.distanceTo(screen.position) < 0.08 ? glass : null;
  }

  async function loadTelevision() {
    const gltf = await new GLTFLoader().loadAsync(MODEL_URL);
    television = gltf.scene;

    const screen = findScreenMesh(television);
    if (!screen) throw new Error("CRT screen material was not found");
    const glass = findGlassMesh(television, screen);

    screenMaterial = createCrtMaterial();
    screen.material = screenMaterial;
    screen.material.name = "Live game CRT shader";
    screen.renderOrder = 1;

    if (glass) {
      glass.material = glass.material.clone();
      glass.material.transparent = true;
      glass.material.opacity = 0.26;
      glass.material.depthWrite = false;
      glass.material.roughness = 0.32;
      glass.material.metalness = 0.04;
      glass.material.needsUpdate = true;
      glass.renderOrder = 2;
    }

    television.traverse((object) => {
      if (!object.isMesh) return;
      object.castShadow = object !== screen;
      object.receiveShadow = true;
    });

    const box = new THREE.Box3().setFromObject(television);
    const center = box.getCenter(new THREE.Vector3());
    television.position.sub(center);
    tvPivot = new THREE.Group();
    tvPivot.add(television);
    scene.add(tvPivot);
    tvPivot.updateMatrixWorld(true);

    const screenBox = new THREE.Box3().setFromObject(screen);
    screenHeight = screenBox.getSize(new THREE.Vector3()).y;
    const screenCenter = screenBox.getCenter(new THREE.Vector3());
    crtLight = new THREE.PointLight(0x9beaff, 3.2, 3.2, 2);
    crtLight.position.copy(screenCenter).add(new THREE.Vector3(0.16, 0, 0));
    crtLight.castShadow = false;
    scene.add(crtLight);

    shell.classList.add("tv-mode");
    setStatus("CRT linked / Live", true);
    stage.focus({ preventScroll: true });
  }

  // Portrait screens (phones): the frame is narrower than the set, so back the
  // camera off until the set spans about 90% of the width. Landscape keeps
  // the original distance. (Bonkhouse-site edit; not in the PlatformerGame
  // original.)
  function frameDistance() {
    const aspect = camera ? camera.aspect : 16 / 9;
    return CAMERA_DISTANCE * Math.max(1, 0.81 / aspect);
  }

  function resizeRenderer() {
    const width = Math.max(1, stage.clientWidth);
    const height = Math.max(1, stage.clientHeight);
    const pixelRatio = renderer.getPixelRatio();
    const targetWidth = Math.floor(width * pixelRatio);
    const targetHeight = Math.floor(height * pixelRatio);

    if (stage.width !== targetWidth || stage.height !== targetHeight) {
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
  }

  function render(time) {
    if (!stage.isConnected) return; // host page navigated away
    resizeRenderer();
    drawGameFeed(time);
    if (screenMaterial) {
      screenMaterial.uniforms.time.value = time * 0.001;
      if (screenHeight > 0) {
        // Tube height in device pixels ≈ its share of the camera's vertical
        // frame at the current distance × the canvas height. Aim for ~3
        // device pixels per scanline so the lines read at any size.
        const frameHeight = 2 * camera.position.length() * Math.tan((camera.fov * Math.PI) / 360);
        const tubePixels = (screenHeight / frameHeight) * stage.height;
        screenMaterial.uniforms.lines.value = Math.max(110, Math.min(320, Math.round(tubePixels / 3)));
      }
    }
    if (crtLight) {
      const flicker = Math.sin(time * 0.047) * 0.12 + Math.sin(time * 0.013) * 0.08;
      crtLight.intensity = 3.2 + flicker;
    }

    // Spin inertia after a drag, plus a slow idle drift so the set never sits perfectly still.
    if (!spin.dragging) {
      spin.yaw += spin.velYaw;
      spin.pitch += spin.velPitch;
      spin.velYaw *= SPIN.inertia;
      spin.velPitch *= SPIN.inertia;
      spin.idle += 1 / 60;
      if (spin.idle > SPIN.returnAfter) { // left alone: settle back to the nearest front-facing angle
        const home = Math.round(spin.yaw / (Math.PI * 2)) * Math.PI * 2;
        spin.yaw += (home - spin.yaw) * SPIN.returnRate;
        spin.pitch += (0 - spin.pitch) * SPIN.returnRate;
      }
      spin.yaw += Math.sin(time * 0.00025) * 0.0004;
    }
    spin.pitch = Math.max(-0.4, Math.min(0.4, spin.pitch));

    // Click punch: the camera lunges toward the tube and settles back with a little roll.
    punch = Math.max(0, punch - 0.028);
    const distance = frameDistance() - punch * punch * 0.45;
    camera.position.x += (distance - camera.position.x) * 0.16;
    camera.position.y += (baseCamera.y + pointerY * 0.06 - camera.position.y) * 0.06;
    camera.position.z += (baseCamera.z - pointerX * 0.14 - camera.position.z) * 0.06;
    camera.lookAt(0, 0, 0);
    camera.rotation.z += Math.sin(time * 0.03) * punch * 0.03;

    if (tvPivot) {
      tvPivot.rotation.y += (spin.yaw + pointerX * 0.22 - tvPivot.rotation.y) * 0.1;
      tvPivot.rotation.x += (spin.pitch - pointerY * 0.12 - tvPivot.rotation.x) * 0.1;
      tvPivot.position.y = Math.sin(time * 0.0011) * 0.025; // floating bob
    }
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }

  document.addEventListener("game:ready", () => {
    gameReady = true;
  });

  stage.style.cursor = "grab";

  stage.addEventListener("pointerdown", (event) => {
    spin.dragging = true;
    spin.lastX = event.clientX;
    spin.lastY = event.clientY;
    spin.moved = 0;
    spin.idle = 0;
    spin.velYaw = 0;
    spin.velPitch = 0;
    stage.setPointerCapture(event.pointerId);
    stage.style.cursor = "grabbing";
  });

  stage.addEventListener("pointermove", (event) => {
    const rect = stage.getBoundingClientRect();
    pointerX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointerY = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    if (!spin.dragging) return;
    const dx = event.clientX - spin.lastX;
    const dy = event.clientY - spin.lastY;
    spin.lastX = event.clientX;
    spin.lastY = event.clientY;
    spin.moved += Math.abs(dx) + Math.abs(dy);
    const stepYaw = dx * SPIN.perPixel;
    const stepPitch = dy * SPIN.perPixel * 0.6;
    spin.yaw += stepYaw;
    spin.pitch += stepPitch;
    spin.velYaw = stepYaw * 0.35; // a fraction of the last move carries on as inertia
    spin.velPitch = stepPitch * 0.35;
  });

  const endDrag = () => {
    if (!spin.dragging) return;
    spin.dragging = false;
    stage.style.cursor = "grab";
    spin.idle = 0;
    if (spin.moved < 6) { // a click, not a drag: camera punch, and the game gets a button press
      punch = 1;
      stage.dispatchEvent(new CustomEvent("tv:click", { bubbles: true }));
    }
  };
  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);

  stage.addEventListener("pointerleave", () => {
    pointerX = 0;
    pointerY = 0;
  });

  try {
    configureScene();
    requestAnimationFrame(render);
    await loadTelevision();
  } catch (error) {
    console.error("CRT presentation unavailable, using direct game feed.", error);
    shell.classList.remove("tv-mode");
    setStatus("Direct canvas fallback", true);
  }
}

window.startSinfeldTv = startSinfeldTv;
if (!window.SINFELD_EMBED) startSinfeldTv();
