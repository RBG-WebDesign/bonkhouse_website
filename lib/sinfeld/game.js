// Standalone: runs on load. Embedded (window.SINFELD_EMBED = true): the host calls window.startSinfeld() once the DOM is mounted.
function startSinfeld() {
  const canvas = document.querySelector("#game");
  const ctx = canvas.getContext("2d");
  const loading = document.querySelector("#loading");
  const music = document.querySelector("#music");
  const musicToggle = document.querySelector("#music-toggle");
  const shell = canvas.closest(".game-shell");
  const listeners = new AbortController();
  window.sinfeldListeners?.abort();
  window.sinfeldListeners = listeners;
  const { signal } = listeners;
  let animationFrame = 0;
  let resumeMusic = false;
  let resumeAudio = false;

  // Embedding: a host page may set window.SINFELD_ASSET_BASE (e.g. "/sinfeld/") so every asset URL resolves there.
  const ASSET_BASE = window.SINFELD_ASSET_BASE || "";
  const VIEW = { width: 1280, height: 720 };
  // The CRT feed crops the 16:9 canvas to 4:3 (x 160..1120) and the tube hides a little more at the edges.
  const SAFE = { left: 200, right: 1080, top: 44, bottom: 690 };
  const WORLD = { ground: 604 }; // endless: no width, no bounds
  // Parallax layers, back to front. speed 1 = moves with the world (the street the player runs on).
  // 8-bit title flow: stepped palette fade in, hard blink, fast flicker on press, cut to black, stepped fade into play.
  const TITLE = {
    file: "source/ui/title.png",
    crop: { y: 100, height: 760 }, // rows of the source art that hold the logo
    scale: 0.7, // 1254px art * 0.7 = 878px, inside the 960px-wide 4:3 window
    fadeSteps: 4, // NES fades stepped through a few palette brightnesses, never a smooth ramp
    stepTime: 0.18,
    blink: 0.5, // seconds per half-cycle of PRESS ANY BUTTON
    flickerRate: 0.05, // seconds per half-cycle once a button is pressed
    flickerTime: 1.1,
    blackout: 0.2,
  };
  // Story screen after the start flicker: compressed console stills up top, typed white pixel text below.
  const STORY = {
    images: ["source/ui/story-1.png", "source/ui/story-2.png"],
    pages: [
      { image: 0, lines: ["Once upon a time...", "", "in the year 202X..."] },
      { image: 1, lines: ["A bald orphan was looking", "for a house."] },
      { image: 0, lines: ["A Bonk.. House?!"] },
    ],
    pageTime: 4.6, // seconds before a page auto-advances
    charTime: 0.045, // typewriter speed
    fadeSteps: 3,
    stepTime: 0.12,
  };
  // Difficulty ramps with distance run: obstacles creep faster and spawn closer together.
  const PROGRESSION = { rampDistance: 8000, speedBoost: 150, minGapScale: 0.55 };
  // The Bonkhouse: a glowing door with a vortex inside at a fixed distance. Walking in ends the run.
  const GOAL = { x: 10000, width: 130, height: 210, clearBefore: 700 };
  const WIN = { suck: 2.3, collapse: 0.9, black: 0.6 }; // phases: pixels spiral in, CRT dies, darkness, then the ending card
  const ENDING = { image: 0, lines: ["Donathan found", "the Bonkhouse.", "", "THE END...?"] };
  const winSequence = { active: false, elapsed: 0, particles: [], centerX: 0, centerY: 0, popTimer: 0, cues: {} };
  const VORTEX = { growFrom: 0.5, growRange: 1800, winGrowth: 1.1 }; // door size 0.5x far away -> 1x at the door -> 2.1x while it eats him
  const VORTEX_SFX = {
    slurp: "audio/sfx/vortex/suction-slurp.wav",
    whistle: "audio/sfx/vortex/vacuum-whistle.wav",
    pop: "audio/sfx/vortex/pop-quick.wav",
    scratch: "audio/sfx/vortex/record-scratch.wav",
    cork: "audio/sfx/vortex/cork-pop-rising.wav",
  };
  let vortexHum = null;
  // Vortex motion is accumulated per frame. Multiplying the clock by a changing rate makes the angle jump around.
  const vortexMotion = { spin: 0, hue: 0, pulse: 0 };
  // UI blips reuse the vortex clips at different pitches: cork pop to start, quick pop to advance, tiny high pop per typed letter.
  const UI_SFX = { start: VORTEX_SFX.cork, advance: VORTEX_SFX.pop, type: VORTEX_SFX.pop };
  let typedSeen = 0;
  let endingClock = 0;
  const VULTURE = { frameWidth: 39, scale: 2.4, fps: 7, speed: 120, hover: WORLD.ground - 300, bob: 16, gapMin: 1500, gapRandom: 1800, firstAt: 1400 };
  const HIT = { stop: 0.09, flash: 0.32 }; // hitstop freeze and red edge flash on a survivable hit
  let screen = "title"; // title | starting | story | play | ending
  let storyPage = 0;
  let storyClock = 0;
  let vultures = [];
  let nextVultureX = 0;
  let hitStop = 0;
  let hitFlash = 0;
  let bestDistance = 0;
  try { bestDistance = Number(localStorage.getItem("sinfeld-best")) || 0; } catch { /* storage blocked: best stays per-session */ }
  let titleClock = 0;
  let playClock = 99;
  const CITY_LAYERS = [
    { file: "back.png", speed: 0.08 },
    { file: "middle.png", speed: 0.3 },
    { file: "foreground-empty.png", speed: 1 },
  ];
  const PLAYER_SCALE = 1.24;
  const PLAYER_LIFT = 0; // fraction of sprite height the runner is drawn above the ground line
  const RISE_GRAVITY = 1700;
  const APEX_GRAVITY = 700;
  const FALL_GRAVITY = 1450;
  const APEX_WINDOW = 220;
  const JUMP_SPEED = 850;
  const TOUCHDOWN_DELAY = 0.05;
  const JUMP_CUT = 0.45; // upward velocity kept when the jump key is released early
  const JUMP_BUFFER = 0.1; // seconds a jump press is remembered before touchdown
  const COYOTE_TIME = 0.08; // seconds after leaving a ledge that a jump still works
  const SOUL_MAX = 100;
  const SOUL_DAMAGE = 34;
  const DAMAGE_INVULNERABILITY = 1.15;
  // Ground enemies, all from the enemies pack. Each unlocks once the difficulty ramp reaches its threshold.
  // Each has its own pattern, so the player reads the sprite and reacts differently:
  //   slimer  hopper  - creeps, then hops at you when you get close: jump early or late, not on top of it
  //   bettle  burst   - rests, then dashes a short way: wait out the dash, then go
  //   dino    charger - walks until you are in range, then sprints: commit to a long jump
  //   dog     chaser  - comes from BEHIND, faster than a walk: jump when it reaches your heels
  const ENEMY_TYPES = {
    slimer: { sheet: "slimer-idle.png", frameWidth: 41, scale: 2.4, lift: 0.2, fps: 8, speed: 30, unlock: 0, weight: 4,
      behaviour: "hopper", hopRange: 340, hopEvery: 1.5, hopUp: 560, hopAlong: 210 },
    bettle: { sheet: "bettle.png", frameWidth: 36, scale: 2.4, lift: 0.1, fps: 6, speed: 20, unlock: 0.12, weight: 3,
      behaviour: "burst", dashSpeed: 320, rest: 1.1, dash: 0.42 },
    dino: { sheet: "dino.png", frameWidth: 32, scale: 3, lift: 0, fps: 10, speed: 60, unlock: 0.3, weight: 3,
      behaviour: "charger", chargeRange: 520, chargeSpeed: 290 },
    dog: { sheet: "dog.png", frameWidth: 33, scale: 2.8, lift: 0, fps: 12, speed: 430, unlock: 0.5, weight: 0,
      behaviour: "chaser", everyMin: 7, everyRandom: 6 },
  };
  const GROUND = { gapMin: 650, gapRandom: 900, gravity: 1500 };
  let nextDogIn = 9;
  const CAR = { scale: 2.5, fps: 12, laneY: WORLD.ground + 132, everyMin: 3, everyRandom: 5 }; // near lane, drives right past the player
  // All sound is 16-bit-console processed WAV (scripts/snesify_audio.py) and plays through the TV speaker chain.
  const CAR_SFX_URL = "audio/sfx/muscle-car-driveby.wav";
  const CAR_SFX_VOLUME = 0.4;
  const MUSIC_VOLUME = 0.38;
  const MUSIC_DUCKED_VOLUME = 0.14;
  const GRUNT_SFX = [1, 2, 3, 4, 5].map((number) => `audio/sfx/grunts/grunt-0${number}.wav`);
  const DEATH_SFX = ["audio/sfx/death/scream-01.wav", "audio/sfx/death/scream-02.wav"]; // only when Donathan actually dies
  const VOICE = {
    opening: "audio/voice/donathan-find-way-to-bonkhouse.wav",
    ambient: [
      "audio/voice/donathan-alright.wav",
      "audio/voice/donathan-on-our-way-to-bonk.wav",
      "audio/voice/donathan-time-to-bonk.wav",
    ],
    tryAgain: "audio/voice/announcer-try-again.wav",
    youLose: "audio/voice/announcer-you-lose.wav",
    youWin: "audio/voice/announcer-you-win.wav",
  };
  const GAME_AUDIO_URLS = [CAR_SFX_URL, ...GRUNT_SFX, ...DEATH_SFX, VOICE.opening,
    ...VOICE.ambient, VOICE.tryAgain, VOICE.youLose, VOICE.youWin, ...Object.values(VORTEX_SFX)];

  const animationRates = {
    start_jump: 3.2, // 400ms sheet -> 125ms takeoff
    jumploop: 0.76, // 400ms of poses stretched over the 0.125s-0.65s window so the last pose lands on the apex
    jumpfall: 1,
    jumpland: 1.15,
  };

  const animationNames = [
    "idle",
    "start_walking_export",
    "walking",
    "stop_walking",
    "start_jump",
    "jumploop",
    "jumpfall",
    "jumpland",
  ];

  const assets = { animations: {}, layers: [], enemies: {}, vulture: null, carFrames: [], noise: null, title: null, story: [] };
  const fogCanvas = Object.assign(document.createElement("canvas"), { width: VIEW.width, height: VIEW.height });
  const fogCtx = fogCanvas.getContext("2d");
  const effectCanvas = Object.assign(document.createElement("canvas"), { width: VIEW.width, height: VIEW.height });
  const effectCtx = effectCanvas.getContext("2d");
  let enemies = [];
  let cars = [];
  let nextSlimeX = 0;
  let nextCarIn = 1;
  let runOver = false;
  let clock = 0;
  const keys = new Set();
  const touch = { left: false, right: false, jump: false };
  let cameraX = 0;
  let lastTime = 0;
  let ready = false;
  let gameAudioContext = null;
  let gameAudioPromise = null;
  const gameAudioBuffers = new Map();
  let gameAudioOutput = null;
  let gameReverb = null;
  let activeVoice = null;
  let openingVoicePending = true;
  let nextVoiceIn = 14 + Math.random() * 12;
  let lastGruntIndex = -1;
  let lastDeathIndex = -1;
  let screenShake = 0;
  let hudFlash = 0;
  let musicSource = null;
  let musicGain = null;
  const deathSequence = { active: false, elapsed: 0, announced: false, particles: [], centerX: 0, centerY: 0 };

  const player = {
    x: 180,
    y: WORLD.ground,
    vx: 0,
    vy: 0,
    width: 38,
    height: 105,
    facing: 1,
    grounded: true,
    state: "idle",
    frame: 0,
    frameElapsed: 0,
    stateElapsed: 0,
    animationComplete: false,
    justLanded: true,
    landingDelay: 0,
    jumpBuffer: 0,
    coyote: 0,
    soul: SOUL_MAX,
    displayedSoul: SOUL_MAX,
    trailingSoul: SOUL_MAX,
    invulnerable: 0,
  };

  function loadImage(source) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Could not load ${source}`));
      image.src = ASSET_BASE + source;
    });
  }

  async function loadAnimation(name) {
    const base = `exports/character/aseprite/${name}`;
    const data = await fetch(`${ASSET_BASE}${base}.json`).then((response) => {
      if (!response.ok) throw new Error(`Could not load ${base}.json`);
      return response.json();
    });
    const image = await loadImage(`exports/character/aseprite/${data.meta.image}`);
    assets.animations[name] = { data, image };
  }

  async function loadGame() {
    try {
      await Promise.all([
        ...animationNames.map(loadAnimation),
        ...Object.entries(ENEMY_TYPES).map(([key, type]) =>
          loadImage(`source/enemies/enemies-pack/sprite-sheets/${type.sheet}`).then((image) => { assets.enemies[key] = image; }),
        ),
        ...[1, 2, 3, 4, 5].map((i) =>
          loadImage(`source/environment/miami-synth/sprites/running/car-running${i}.png`).then(
            (image) => { assets.carFrames[i - 1] = image; },
          ),
        ),
        loadImage(TITLE.file).then((image) => { assets.title = image; }),
        loadImage("source/enemies/enemies-pack/sprite-sheets/vulture.png").then((image) => { assets.vulture = image; }),
        ...STORY.images.map((file, index) => loadImage(file).then((image) => { assets.story[index] = image; })),
        document.fonts.load("20px 'Press Start 2P'").catch(() => {}),
        loadImage("source/kenney-development-essentials/Noise/perlin-noise.png").then((image) => { assets.noise = image; }),
        ...CITY_LAYERS.map((layer, index) =>
          loadImage(`source/environment/cyberpunk-city/version-2/Layers/${layer.file}`).then(
            (image) => { assets.layers[index] = { image, speed: layer.speed }; },
          ),
        ),
      ]);
      if (signal.aborted) return;
      resetWorld();
      titleClock = 0;
      ready = true;
      // Audio downloads and decoding wait until the first player gesture.
      canvas.dataset.ready = "true";
      loading.classList.add("hidden");
      document.dispatchEvent(new CustomEvent("game:ready"));
      queueFrame();
    } catch (error) {
      if (signal.aborted) return;
      loading.querySelector("p").textContent = "Asset load failed";
      console.error(error);
    }
  }

  function isDown(...codes) {
    return codes.some((code) => keys.has(code));
  }

  function pressedLeft() {
    return isDown("KeyA", "ArrowLeft") || touch.left;
  }

  function pressedRight() {
    return isDown("KeyD", "ArrowRight") || touch.right;
  }

  function recordStateTrace(state) {
    const stateTrace = JSON.parse(canvas.dataset.stateTrace || "[]");
    stateTrace.push({
      state,
      time: Math.round(performance.now()),
      y: Math.round(player.y),
      velocityY: Math.round(player.vy),
    });
    canvas.dataset.stateTrace = JSON.stringify(stateTrace.slice(-20));
  }

  function setState(next, force = false) {
    if (!force && player.state === next) return;
    player.state = next;
    player.frame = 0;
    player.frameElapsed = 0;
    player.stateElapsed = 0;
    player.animationComplete = false;
    recordStateTrace(next);
  }

  function animationFinished() {
    return player.animationComplete;
  }

  function advanceAnimation(dt) {
    const animation = assets.animations[player.state];
    const frames = animation.data.frames;
    const animationRate = animationRates[player.state] ?? 1;
    player.stateElapsed += dt;
    if (player.animationComplete) return;
    player.frameElapsed += dt * 1000 * animationRate;

    while (player.frameElapsed >= frames[player.frame].duration) {
      player.frameElapsed -= frames[player.frame].duration;
      if (player.frame < frames.length - 1) {
        player.frame += 1;
      } else if (["idle", "walking"].includes(player.state)) {
        player.frame = 0;
      } else {
        player.frameElapsed = frames[player.frame].duration;
        player.animationComplete = true;
        break;
      }
    }
  }

  function pressJump() {
    player.jumpBuffer = JUMP_BUFFER;
  }

  function releaseJump() {
    if (player.vy < 0) player.vy *= JUMP_CUT;
  }

  function startJump() {
    player.vy = -JUMP_SPEED;
    player.grounded = false;
    player.justLanded = false;
    player.landingDelay = 0;
    player.jumpBuffer = 0;
    player.coyote = 0;
    setState("start_jump", true);
    lastGruntIndex = playRandomSound(GRUNT_SFX, .85, lastGruntIndex, 0.52);
  }

  function updatePlayer(dt) {
    player.invulnerable = Math.max(0, player.invulnerable - dt);
    if (deathSequence.active || winSequence.active) return;
    const left = pressedLeft();
    const right = pressedRight();
    const direction = runOver ? 0 : Number(right) - Number(left);
    const sprinting = isDown("ShiftLeft", "ShiftRight");
    const maxSpeed = sprinting ? 480 : 340;
    const acceleration = player.grounded ? 1900 : 1050;
    const deceleration = player.grounded ? 2300 : 420;

    if (direction) {
      player.vx += direction * acceleration * dt;
      player.vx = Math.max(-maxSpeed, Math.min(maxSpeed, player.vx));
      player.facing = direction;
    } else {
      const amount = deceleration * dt;
      if (Math.abs(player.vx) <= amount) player.vx = 0;
      else player.vx -= Math.sign(player.vx) * amount;
    }

    player.x += player.vx * dt;
    const gravity =
      Math.abs(player.vy) < APEX_WINDOW
        ? APEX_GRAVITY
        : player.vy > 0
          ? FALL_GRAVITY
          : RISE_GRAVITY;
    player.vy += gravity * dt;
    player.y += player.vy * dt;

    player.grounded = false;
    if (player.y >= WORLD.ground && player.vy >= 0) {
      player.y = WORLD.ground;
      player.vy = 0;
      player.grounded = true;
      if (!player.justLanded) {
        player.justLanded = true;
        player.landingDelay = TOUCHDOWN_DELAY;
        recordStateTrace("touchdown");
      }
    }

    if (!player.grounded) player.justLanded = false;

    player.coyote = player.grounded ? COYOTE_TIME : Math.max(0, player.coyote - dt);
    if (player.jumpBuffer > 0 && player.coyote > 0 && !runOver) startJump();
    else player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);

    const moving = Math.abs(player.vx) > 28;
    if (!player.grounded) {
      if (player.state === "start_jump" && animationFinished()) {
        setState("jumploop");
      } else if (player.state === "jumploop" && player.vy >= 0) {
        setState("jumpfall"); // apex: fall pose starts the moment vertical velocity crosses zero
      } else if (!["start_jump", "jumploop", "jumpfall"].includes(player.state)) {
        setState("jumpfall"); // walked off a ledge
      }
    } else if (player.landingDelay > 0) {
      player.landingDelay = Math.max(0, player.landingDelay - dt);
      if (player.landingDelay === 0) setState("jumpland", true);
    } else if (player.state === "jumpland") {
      if (direction && player.stateElapsed > 0.1) setState("start_walking_export");
      else if (animationFinished()) setState(moving ? "walking" : "idle");
    } else if (moving) {
      if (["idle", "stop_walking"].includes(player.state)) setState("start_walking_export");
      else if (player.state === "start_walking_export" && animationFinished()) setState("walking");
    } else if (["walking", "start_walking_export"].includes(player.state)) {
      setState("stop_walking");
    } else if (player.state === "stop_walking" && animationFinished()) {
      setState("idle");
    }

    advanceAnimation(dt);
  }

  function difficulty() {
    return Math.min(1, Math.max(0, player.x) / PROGRESSION.rampDistance);
  }

  function gapScale() {
    return 1 - difficulty() * (1 - PROGRESSION.minGapScale);
  }

  function recordBest() {
    const distance = Math.max(0, Math.floor(player.x / 10));
    if (distance <= bestDistance) return;
    bestDistance = distance;
    try { localStorage.setItem("sinfeld-best", String(bestDistance)); } catch { /* ignore */ }
  }

  function pickEnemyType() {
    const level = difficulty();
    const pool = Object.keys(ENEMY_TYPES).filter((key) => ENEMY_TYPES[key].unlock <= level && ENEMY_TYPES[key].weight > 0);
    const total = pool.reduce((sum, key) => sum + ENEMY_TYPES[key].weight, 0);
    let roll = Math.random() * total;
    for (const key of pool) {
      roll -= ENEMY_TYPES[key].weight;
      if (roll <= 0) return key;
    }
    return pool[pool.length - 1];
  }

  function enemyHeight(key) {
    return assets.enemies[key].height * ENEMY_TYPES[key].scale;
  }

  function spawnEnemy(type, x, dir = -1) {
    enemies.push({ type, x, dir, elapsed: Math.random(), timer: 0.6 + Math.random(), height: 0, lift: 0, along: 0, dashing: false, charging: false });
  }

  function updateEnemy(enemy, dt, creep) {
    const type = ENEMY_TYPES[enemy.type];
    enemy.elapsed += dt;
    enemy.timer -= dt;
    const toPlayer = player.x - enemy.x;
    switch (type.behaviour) {
      case "hopper":
        if (enemy.height > 0 || enemy.lift > 0) { // mid-hop: ballistic arc toward where the player was
          enemy.lift -= GROUND.gravity * dt;
          enemy.height += enemy.lift * dt;
          enemy.x += enemy.along * dt;
          if (enemy.height <= 0) { enemy.height = 0; enemy.lift = 0; enemy.along = 0; }
        } else {
          enemy.x -= (type.speed + creep) * dt;
          if (Math.abs(toPlayer) < type.hopRange && enemy.timer <= 0) {
            enemy.lift = type.hopUp;
            enemy.height = 0.01;
            enemy.along = Math.sign(toPlayer) * type.hopAlong;
            enemy.timer = type.hopEvery;
          }
        }
        break;
      case "burst":
        if (enemy.timer <= 0) {
          enemy.dashing = !enemy.dashing;
          enemy.timer = enemy.dashing ? type.dash : type.rest;
        }
        enemy.x -= ((enemy.dashing ? type.dashSpeed : type.speed) + creep) * dt;
        break;
      case "charger":
        enemy.charging = Math.abs(toPlayer) < type.chargeRange && toPlayer < 0;
        enemy.x -= ((enemy.charging ? type.chargeSpeed : type.speed) + creep) * dt;
        break;
      case "chaser":
        enemy.x += (type.speed + creep * 0.5) * dt; // runs the same way as the player, from behind
        break;
      default:
        enemy.x -= (type.speed + creep) * dt;
    }
  }

  function resetWorld() {
    stopVortexHum();
    winSequence.active = false;
    winSequence.particles = [];
    enemies = [];
    vultures = [];
    nextDogIn = 9;
    nextVultureX = player.x + VULTURE.firstAt;
    for (const car of cars) stopCarSound(car);
    cars = [];
    nextSlimeX = player.x + 900;
    nextCarIn = 1;
    nextVoiceIn = 14 + Math.random() * 12;
    runOver = false;
  }

  function setupGameAudioGraph() {
    gameAudioOutput = gameAudioContext.createDynamicsCompressor();
    gameAudioOutput.threshold.value = -16;
    gameAudioOutput.knee.value = 12;
    gameAudioOutput.ratio.value = 6;
    gameAudioOutput.attack.value = 0.004;
    gameAudioOutput.release.value = 0.18;
    // TV speaker: everything (music included) is squeezed through one small mono driver.
    const speaker = gameAudioContext.createGain();
    speaker.channelCount = 1;
    speaker.channelCountMode = "explicit"; // mono, like a CRT with one speaker
    const rumbleCut = gameAudioContext.createBiquadFilter();
    rumbleCut.type = "highpass";
    rumbleCut.frequency.value = 240;
    rumbleCut.Q.value = .7;
    const cabinet = gameAudioContext.createBiquadFilter();
    cabinet.type = "peaking"; // boxy midrange honk of a small cone
    cabinet.frequency.value = 1600;
    cabinet.Q.value = .8;
    cabinet.gain.value = 2.5;
    const trebleCut = gameAudioContext.createBiquadFilter();
    trebleCut.type = "lowpass";
    trebleCut.frequency.value = 3800;
    trebleCut.Q.value = 0.7;
    const drive = gameAudioContext.createWaveShaper(); // gentle cone saturation
    const curve = new Float32Array(1024);
    for (let i = 0; i < curve.length; i += 1) {
      const x = (i / (curve.length - 1)) * 2 - 1;
      curve[i] = Math.tanh(x * 1.2) / Math.tanh(1.2);
    }
    drive.curve = curve;
    drive.oversample = "2x";
    // Attenuate AFTER the EQ and saturation so even overlapping effects have
    // headroom. Every sound, including music, leaves through this mono speaker.
    const master = gameAudioContext.createGain();
    master.gain.value = .38;
    gameAudioOutput.connect(speaker).connect(rumbleCut).connect(cabinet).connect(trebleCut).connect(drive)
      .connect(master).connect(gameAudioContext.destination);
    musicSource = gameAudioContext.createMediaElementSource(music);
    musicGain = gameAudioContext.createGain();
    musicGain.gain.value = MUSIC_VOLUME;
    music.volume = 1;
    musicSource.connect(musicGain).connect(gameAudioOutput);

    const seconds = .24; // a small cabinet reflection, without the long hall tail
    const impulse = gameAudioContext.createBuffer(
      1,
      Math.floor(gameAudioContext.sampleRate * seconds),
      gameAudioContext.sampleRate,
    );
    for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
      const samples = impulse.getChannelData(channel);
      for (let index = 0; index < samples.length; index += 1) {
        const decay = Math.pow(1 - index / samples.length, 2.45);
        samples[index] = (Math.random() * 2 - 1) * decay;
      }
    }
    gameReverb = gameAudioContext.createConvolver();
    gameReverb.buffer = impulse;
    gameReverb.connect(gameAudioOutput);
  }

  function setMusicLevel(level) {
    // Web Audio gain works on mobile Safari, where element volume is limited.
    if (musicGain) musicGain.gain.setTargetAtTime(level, gameAudioContext.currentTime, .08);
    else music.volume = level;
  }

  function updateMusicButton(playing) {
    musicToggle.setAttribute("aria-pressed", String(playing));
    musicToggle.lastChild.textContent = playing ? " Music on" : " Music off";
  }

  async function startMusicFromGesture() {
    if (signal.aborted || document.hidden || !music.paused || music.dataset.userPaused === "true") return;
    try {
      setMusicLevel(activeVoice ? MUSIC_DUCKED_VOLUME : MUSIC_VOLUME);
      await music.play();
      updateMusicButton(true);
    } catch (error) {
      console.warn("Music could not start until another player interaction.", error);
    }
  }

  async function unlockGameAudio(startMusic = true) {
    if (signal.aborted || document.hidden) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    if (!gameAudioContext) {
      gameAudioContext = new AudioContext();
      setupGameAudioGraph();
    }
    if (!gameAudioPromise) {
      gameAudioPromise = Promise.all(GAME_AUDIO_URLS.map(async (url) => {
        try {
          const response = await fetch(ASSET_BASE + url, { signal });
          if (!response.ok) throw new Error(`Could not load ${url}`);
          const buffer = await gameAudioContext.decodeAudioData(await response.arrayBuffer());
          if (signal.aborted) return;
          gameAudioBuffers.set(url, buffer);
        } catch (error) {
          if (!signal.aborted) console.warn(`Game audio is unavailable: ${url}`, error);
        }
      }));
    }

    const musicStart = startMusic ? startMusicFromGesture() : Promise.resolve();
    if (gameAudioContext.state === "suspended") await gameAudioContext.resume().catch(() => {});
    await musicStart;
    await gameAudioPromise;
    if (signal.aborted) return;
    if (openingVoicePending && ready && !runOver && screen === "play") {
      openingVoicePending = false;
      playVoice(VOICE.opening);
    }
  }

  function playSound(url, volume = 1, playbackRate = 1, reverbAmount = 0) {
    const buffer = gameAudioBuffers.get(url);
    if (signal.aborted || !buffer || gameAudioContext?.state !== "running") return null;

    const source = gameAudioContext.createBufferSource();
    const gain = gameAudioContext.createGain();
    source.buffer = buffer;
    source.playbackRate.value = playbackRate;
    gain.gain.value = volume;
    source.connect(gain).connect(gameAudioOutput);
    if (reverbAmount > 0 && gameReverb) {
      const wet = gameAudioContext.createGain();
      wet.gain.value = reverbAmount * .35;
      gain.connect(wet).connect(gameReverb);
    }
    source.start();
    return { source, gain };
  }

  function playRandomSound(urls, volume, previousIndex, reverbAmount = 0) {
    if (!urls.length) return previousIndex;
    let index = Math.floor(Math.random() * urls.length);
    if (urls.length > 1 && index === previousIndex) index = (index + 1) % urls.length;
    playSound(urls[index], volume, 0.97 + Math.random() * 0.06, reverbAmount);
    return index;
  }

  function stopActiveVoice() {
    if (!activeVoice || !gameAudioContext) return;
    const voice = activeVoice;
    activeVoice = null;
    const now = gameAudioContext.currentTime;
    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setTargetAtTime(0, now, 0.025);
    voice.source.stop(now + 0.12);
  }

  function playVoice(url, interrupt = false) {
    if (activeVoice && !interrupt) return false;
    if (interrupt) stopActiveVoice();

    const voice = playSound(url, 1, 1, 0.58);
    if (!voice) return false;
    activeVoice = voice;
    setMusicLevel(MUSIC_DUCKED_VOLUME);
    voice.source.onended = () => {
      if (activeVoice !== voice) return;
      activeVoice = null;
      setMusicLevel(MUSIC_VOLUME);
    };
    return true;
  }

  function startCarSound(car) {
    const carAudioBuffer = gameAudioBuffers.get(CAR_SFX_URL);
    if (car.sound || !carAudioBuffer || gameAudioContext?.state !== "running") return;

    const source = gameAudioContext.createBufferSource();
    const gain = gameAudioContext.createGain();
    const panner = gameAudioContext.createStereoPanner();
    const filter = gameAudioContext.createBiquadFilter();
    const oscillator = gameAudioContext.createOscillator();
    const modulation = gameAudioContext.createGain();
    source.buffer = carAudioBuffer;
    source.loop = true;
    gain.gain.value = 0;
    filter.type = "lowpass";
    filter.frequency.value = 1800 + Math.random() * 1700;
    filter.Q.value = 0.5 + Math.random() * 0.8;
    oscillator.frequency.value = 0.7 + Math.random() * 1.8;
    modulation.gain.value = 0.006 + Math.random() * 0.014;
    oscillator.connect(modulation).connect(source.playbackRate);
    source.connect(filter).connect(gain).connect(panner).connect(gameAudioOutput);
    const basePitch = 0.91 + Math.random() * 0.14;
    source.start(0, (car.elapsed + Math.random() * carAudioBuffer.duration) % carAudioBuffer.duration);
    oscillator.start();
    car.sound = { source, gain, panner, oscillator, basePitch };
  }

  function stopCarSound(car) {
    if (!car.sound || !gameAudioContext) return;
    const now = gameAudioContext.currentTime;
    car.sound.gain.gain.cancelScheduledValues(now);
    car.sound.gain.gain.setTargetAtTime(0, now, 0.045);
    car.sound.source.stop(now + 0.2);
    car.sound.oscillator.stop(now + 0.2);
    car.sound = null;
  }

  function smoothstep(edge0, edge1, value) {
    const amount = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
    return amount * amount * (3 - 2 * amount);
  }

  function updateCarSound(car) {
    startCarSound(car);
    if (!car.sound) return;

    const carWidth = (assets.carFrames[0]?.width || 120) * CAR.scale;
    const screenX = car.x - cameraX + carWidth / 2;
    const listenerX = VIEW.width * 0.38;
    const entryFade = smoothstep(-300, 180, screenX);
    const exitFade = 1 - smoothstep(VIEW.width - 180, VIEW.width + 360, screenX);
    const distance = Math.min(1, Math.abs(screenX - listenerX) / (VIEW.width * 0.78));
    const proximity = 0.38 + (1 - distance) * 0.62;
    const volume = CAR_SFX_VOLUME * entryFade * exitFade * proximity;
    const pan = Math.max(-1, Math.min(1, (screenX - listenerX) / (VIEW.width * 0.55)));
    const pitch = car.sound.basePitch * (1.04 - smoothstep(listenerX - 160, listenerX + 220, screenX) * 0.1);
    const now = gameAudioContext.currentTime;

    car.sound.gain.gain.setTargetAtTime(volume, now, 0.045);
    car.sound.panner.pan.setTargetAtTime(pan, now, 0.05);
    car.sound.source.playbackRate.setTargetAtTime(pitch, now, 0.08);
  }

  function updateSoulMeter(dt = 0) {
    const displayRate = 6.5;
    const trailRate = 1.45;
    player.displayedSoul += (player.soul - player.displayedSoul) * Math.min(1, dt * displayRate);
    player.trailingSoul += (player.soul - player.trailingSoul) * Math.min(1, dt * trailRate);
    if (Math.abs(player.displayedSoul - player.soul) < 0.08) player.displayedSoul = player.soul;
    if (Math.abs(player.trailingSoul - player.soul) < 0.08) player.trailingSoul = player.soul;

    hudFlash = Math.max(0, hudFlash - dt);
  }

  function flashSoulMeter() {
    hudFlash = 0.56;
  }

  function createDeathParticles(centerX, centerY) {
    return Array.from({ length: 44 }, (_, index) => {
      const angle = (index / 44) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
      const speed = 130 + Math.random() * 520;
      return {
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 4 + Math.random() * 15,
        hue: [188, 204, 286, 326][index % 4] + Math.random() * 12,
        life: 0.75 + Math.random() * 1.15,
        maxLife: 1.9,
      };
    });
  }

  function beginDeathSequence() {
    runOver = true;
    player.jumpBuffer = 0;
    player.vx = 0;
    player.vy = 0;
    deathSequence.active = true;
    deathSequence.elapsed = 0;
    deathSequence.announced = false;
    deathSequence.centerX = player.x - cameraX;
    deathSequence.centerY = player.y - 78;
    deathSequence.particles = createDeathParticles(deathSequence.centerX, deathSequence.centerY);
    screenShake = 0.85;
    recordBest();
    for (const car of cars) stopCarSound(car);
    stopActiveVoice();
    lastDeathIndex = playRandomSound(DEATH_SFX, 1, lastDeathIndex, 0.64);
  }

  function damagePlayer() {
    if (player.invulnerable > 0 || deathSequence.active) return;
    player.soul = Math.max(0, player.soul - SOUL_DAMAGE);
    player.invulnerable = DAMAGE_INVULNERABILITY;
    player.vy = -290;
    player.vx = -210;
    player.grounded = false;
    screenShake = 0.34;
    hitStop = HIT.stop;
    hitFlash = HIT.flash;
    flashSoulMeter();
    if (player.soul <= 0) beginDeathSequence();
    else lastGruntIndex = playRandomSound(GRUNT_SFX, .85, lastGruntIndex, 0.52); // survivable hit: grunt, not a scream
  }

  function goalProximity() {
    return 1 - Math.min(1, Math.max(0, (GOAL.x - player.x) / VORTEX.growRange));
  }

  function goalSize() {
    const base = VORTEX.growFrom + goalProximity() * (1 - VORTEX.growFrom);
    if (!winSequence.active) return base;
    return base + Math.min(1, winSequence.elapsed / WIN.suck) * VORTEX.winGrowth;
  }

  function updateVortexHum(dt) {
    // The slurp, pitched way down and looped, is the vortex's hum. It swells as Donathan gets close.
    const proximity = goalProximity();
    const dying = winSequence.active && winSequence.elapsed >= WIN.suck; // the tube is gone, so is the hum
    const wanted = proximity > 0.02 && !deathSequence.active && !dying;
    if (wanted && !vortexHum && gameAudioBuffers.get(VORTEX_SFX.slurp) && gameAudioContext?.state === "running") {
      const source = gameAudioContext.createBufferSource();
      const gain = gameAudioContext.createGain();
      source.buffer = gameAudioBuffers.get(VORTEX_SFX.slurp);
      source.loop = true;
      source.playbackRate.value = 0.35;
      gain.gain.value = 0;
      source.connect(gain).connect(gameAudioOutput);
      source.start();
      vortexHum = { source, gain };
    }
    if (!vortexHum) return;
    if (!wanted) {
      stopVortexHum();
      return;
    }
    const now = gameAudioContext.currentTime;
    const pull = winSequence.active ? Math.min(1, winSequence.elapsed / WIN.suck) : 0;
    vortexHum.gain.gain.setTargetAtTime(0.12 + proximity * 0.45 + pull * 0.5, now, 0.1);
    vortexHum.source.playbackRate.setTargetAtTime(0.35 + proximity * 0.25 + pull * 1.4, now, 0.1);
  }

  function stopVortexHum() {
    if (!vortexHum || !gameAudioContext) return;
    const now = gameAudioContext.currentTime;
    vortexHum.gain.gain.setTargetAtTime(0, now, 0.08);
    vortexHum.source.stop(now + 0.4);
    vortexHum = null;
  }

  function beginWin() {
    winSequence.active = true;
    winSequence.elapsed = 0;
    winSequence.centerX = GOAL.x - cameraX;
    winSequence.centerY = WORLD.ground - (GOAL.height * goalSize()) / 2;
    winSequence.popTimer = 0.3;
    winSequence.cues = {};
    runOver = true;
    playSound(VORTEX_SFX.whistle, 1.1, 1, 0.35); // the long vacuum slide
    playSound(VORTEX_SFX.slurp, 1.5, 0.85, 0.5);
    player.vx = 0;
    player.vy = 0;
    recordBest();
    stopActiveVoice();
    for (const car of cars) stopCarSound(car);

    // Sample the current sprite frame into pixel particles that will spiral into the vortex.
    const animation = assets.animations[player.state];
    const frame = animation.data.frames[player.frame].frame;
    const scratch = Object.assign(document.createElement("canvas"), { width: frame.w, height: frame.h });
    const scratchCtx = scratch.getContext("2d");
    scratchCtx.drawImage(animation.image, frame.x, frame.y, frame.w, frame.h, 0, 0, frame.w, frame.h);
    const data = scratchCtx.getImageData(0, 0, frame.w, frame.h).data;
    const step = 3;
    const originX = player.x - cameraX - 80 * PLAYER_SCALE;
    const originY = player.y - 210 * PLAYER_SCALE;
    winSequence.particles = [];
    for (let py = 0; py < frame.h; py += step) {
      for (let px = 0; px < frame.w; px += step) {
        const index = (py * frame.w + px) * 4;
        if (data[index + 3] < 128) continue;
        const sx = player.facing < 0 ? originX + (frame.w - px) * PLAYER_SCALE : originX + px * PLAYER_SCALE;
        const sy = originY + py * PLAYER_SCALE;
        const dx = sx - winSequence.centerX;
        const dy = sy - winSequence.centerY;
        winSequence.particles.push({
          radius: Math.hypot(dx, dy),
          angle: Math.atan2(dy, dx),
          color: `rgb(${data[index]}, ${data[index + 1]}, ${data[index + 2]})`,
          delay: Math.random() * 0.7,
          age: 0,
          size: step * PLAYER_SCALE,
          prevX: sx,
          prevY: sy,
        });
      }
    }
  }

  function updateWin(dt) {
    winSequence.elapsed += dt;
    const pull = Math.min(1, winSequence.elapsed / WIN.suck);
    winSequence.centerY = WORLD.ground - (GOAL.height * goalSize()) / 2; // the mouth rises as the door swells
    screenShake = Math.max(screenShake, pull * 0.7);
    for (const particle of winSequence.particles) {
      particle.prevX = winSequence.centerX + Math.cos(particle.angle) * particle.radius;
      particle.prevY = winSequence.centerY + Math.sin(particle.angle) * particle.radius;
      particle.delay -= dt;
      if (particle.delay > 0) continue;
      particle.age += dt;
      if (particle.age < 0.22) {
        particle.radius += 90 * dt; // a moment of resistance: pixels bulge outward before the pull wins
        particle.angle += dt * 1.5;
        continue;
      }
      const force = 3.6 + particle.age * 2.5;
      particle.radius = Math.max(0, particle.radius * Math.exp(-force * dt) - 60 * dt);
      particle.angle += dt * (5 + 160 / (particle.radius + 10)); // whip around faster near the mouth
    }
    winSequence.particles = winSequence.particles.filter((particle) => particle.radius > 2 || particle.delay > 0);

    // Little vocal pops as pixels get swallowed, a spinback when the tube gives out, a cork pop for the final dot.
    winSequence.popTimer -= dt;
    if (winSequence.particles.length > 0 && winSequence.popTimer <= 0 && winSequence.elapsed < WIN.suck) {
      playSound(VORTEX_SFX.pop, 0.55, 0.9 + Math.random() * 1.1, 0.2);
      winSequence.popTimer = 0.09 + Math.random() * 0.12;
    }
    if (!winSequence.cues.scratch && winSequence.elapsed >= WIN.suck) {
      winSequence.cues.scratch = true;
      stopVortexHum();
      playSound(VORTEX_SFX.scratch, 1.6, 1, 0.25);
    }
    if (!winSequence.cues.cork && winSequence.elapsed >= WIN.suck + WIN.collapse * 0.7) {
      winSequence.cues.cork = true;
      playSound(VORTEX_SFX.cork, 1.3, 0.9, 0.3);
    }
    if (winSequence.elapsed >= WIN.suck + WIN.collapse + WIN.black) {
      screen = "ending";
      endingClock = 0;
      typedSeen = 0;
      stopVortexHum();
      music.pause();
      updateMusicButton(false);
      playVoice(VOICE.youWin, true);
    }
  }

  function returnToTitle() {
    uiSound("advance");
    resetPlayer();
    cameraX = player.x - VIEW.width * 0.38;
    screen = "title";
    titleClock = 0;
    openingVoicePending = true;
    delete music.dataset.userPaused;
  }

  function updateDeathSequence(dt) {
    deathSequence.elapsed += dt;
    screenShake = Math.max(0, screenShake - dt);
    for (const particle of deathSequence.particles) {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= Math.pow(0.12, dt);
      particle.vy *= Math.pow(0.12, dt);
      particle.life -= dt;
    }
    if (!deathSequence.announced && deathSequence.elapsed >= 1.75) {
      deathSequence.announced = true;
      playVoice(VOICE.youLose, true);
    }
  }

  function updateWorld(dt) {
    clock += dt;
    updateSoulMeter(dt);
    updateVortexHum(dt);
    {
      const pull = winSequence.active ? Math.min(1, winSequence.elapsed / WIN.suck) : 0;
      vortexMotion.spin += dt * (3.2 + goalProximity() * 2 + pull * 14);
      vortexMotion.hue += dt * (140 + pull * 400);
      vortexMotion.pulse += dt * (6 + pull * 20);
    }
    if (winSequence.active) {
      updateWin(dt);
      return;
    }
    if (deathSequence.active) {
      updateDeathSequence(dt);
      return;
    }
    screenShake = Math.max(0, screenShake - dt);
    if (!runOver) {
      nextVoiceIn -= dt;
      if (nextVoiceIn <= 0) {
        const line = VOICE.ambient[Math.floor(Math.random() * VOICE.ambient.length)];
        if (playVoice(line)) nextVoiceIn = 16 + Math.random() * 18;
        else nextVoiceIn = 3;
      }
    }
    const creep = difficulty() * PROGRESSION.speedBoost;
    if (!runOver && player.grounded && player.x >= GOAL.x) {
      beginWin();
      return;
    }
    while (nextSlimeX < player.x + VIEW.width && nextSlimeX < GOAL.x - GOAL.clearBefore) {
      spawnEnemy(pickEnemyType(), nextSlimeX);
      nextSlimeX += (GROUND.gapMin + Math.random() * GROUND.gapRandom) * gapScale();
    }
    if (difficulty() >= ENEMY_TYPES.dog.unlock && player.x < GOAL.x - GOAL.clearBefore) {
      nextDogIn -= dt;
      if (nextDogIn <= 0) {
        spawnEnemy("dog", cameraX - 360, 1);
        nextDogIn = (ENEMY_TYPES.dog.everyMin + Math.random() * ENEMY_TYPES.dog.everyRandom) * gapScale();
      }
    }
    for (const enemy of enemies) updateEnemy(enemy, dt, creep);
    enemies = enemies.filter((enemy) => (enemy.dir > 0 ? enemy.x < cameraX + VIEW.width + 400 : enemy.x > cameraX - 300));

    while (nextVultureX < player.x + VIEW.width + 200 && nextVultureX < GOAL.x - GOAL.clearBefore) {
      vultures.push({ x: nextVultureX, elapsed: Math.random() * 4 });
      nextVultureX += (VULTURE.gapMin + Math.random() * VULTURE.gapRandom) * gapScale();
    }
    for (const vulture of vultures) {
      vulture.x -= (VULTURE.speed + creep) * dt;
      vulture.elapsed += dt;
      vulture.y = VULTURE.hover + Math.sin(vulture.elapsed * 3) * VULTURE.bob;
    }
    vultures = vultures.filter((vulture) => vulture.x > cameraX - 300);

    nextCarIn -= dt;
    if (nextCarIn <= 0) {
      cars.push({ x: cameraX - 400, speed: 560 + Math.random() * 200, elapsed: 0 });
      nextCarIn = CAR.everyMin + Math.random() * CAR.everyRandom;
    }
    for (const car of cars) {
      car.x += car.speed * dt;
      car.elapsed += dt;
      updateCarSound(car);
    }
    cars = cars.filter((car) => {
      const visible = car.x < cameraX + VIEW.width + 400;
      if (!visible) stopCarSound(car);
      return visible;
    });

    if (runOver) return;
    for (let index = enemies.length - 1; index >= 0; index -= 1) {
      const enemy = enemies[index];
      const type = ENEMY_TYPES[enemy.type];
      const bottom = WORLD.ground - enemy.height + 4;
      const top = bottom - enemyHeight(enemy.type) + 24; // forgiving: hit the body, not the top wobble
      const reach = type.frameWidth * type.scale * 0.45;
      if (Math.abs(enemy.x - player.x) < reach && player.y > top && player.y - 200 < bottom) {
        enemies.splice(index, 1);
        damagePlayer();
        break;
      }
    }
    // Vultures fly at head height: standing under them is safe, jumping into them is not.
    const half = (assets.vulture.height * VULTURE.scale) / 2;
    const headTop = player.y - 200;
    for (let index = vultures.length - 1; index >= 0; index -= 1) {
      const vulture = vultures[index];
      if (Math.abs(vulture.x - player.x) < 50 && headTop < vulture.y + half && player.y > vulture.y - half) {
        vultures.splice(index, 1);
        damagePlayer();
        break;
      }
    }
  }

  function resetPlayer() {
    const retrying = runOver || deathSequence.active;
    deathSequence.active = false;
    deathSequence.elapsed = 0;
    deathSequence.announced = false;
    deathSequence.particles = [];
    Object.assign(player, {
      x: 180,
      y: WORLD.ground,
      vx: 0,
      vy: 0,
      grounded: true,
      justLanded: true,
      landingDelay: 0,
      jumpBuffer: 0,
      coyote: 0,
      soul: SOUL_MAX,
      displayedSoul: SOUL_MAX,
      trailingSoul: SOUL_MAX,
      invulnerable: 0,
    });
    setState("idle", true);
    resetWorld();
    updateSoulMeter();
    if (retrying) playVoice(VOICE.tryAgain, true);
  }

  function cityFilter() {
    if (winSequence.active) return `hue-rotate(${Math.round(winSequence.elapsed * 260)}deg) saturate(1.7)`;
    if (deathSequence.active) return `grayscale(${Math.min(1, deathSequence.elapsed * 0.8).toFixed(2)}) contrast(1.25)`;
    if (hitFlash > 0) return `hue-rotate(${Math.round(-55 * (hitFlash / HIT.flash))}deg) saturate(1.8)`;
    return "none";
  }

  function drawCity() {
    ctx.imageSmoothingEnabled = false;
    ctx.filter = cityFilter();
    for (const layer of assets.layers) {
      const scale = VIEW.height / layer.image.height;
      const tileWidth = layer.image.width * scale;
      const scroll = cameraX * layer.speed;
      let x = -(((scroll % tileWidth) + tileWidth) % tileWidth); // works for negative scroll too
      for (; x < VIEW.width; x += tileWidth) {
        ctx.drawImage(layer.image, Math.floor(x), 0, Math.ceil(tileWidth) + 1, VIEW.height);
      }
    }
    ctx.filter = "none";

    const gradient = ctx.createLinearGradient(0, 0, 0, VIEW.height);
    gradient.addColorStop(0, "rgba(8, 11, 18, 0.08)");
    gradient.addColorStop(0.72, "rgba(8, 11, 18, 0.18)");
    gradient.addColorStop(1, "rgba(4, 7, 12, 0.72)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  }

  function drawEnemies() {
    ctx.imageSmoothingEnabled = false;
    let dogBehind = false;
    for (const enemy of enemies) {
      const type = ENEMY_TYPES[enemy.type];
      const sheet = assets.enemies[enemy.type];
      const frames = Math.floor(sheet.width / type.frameWidth);
      const w = type.frameWidth * type.scale;
      const h = sheet.height * type.scale;
      const fps = type.fps * (enemy.dashing || enemy.charging ? 2.2 : 1);
      const frame = Math.floor(enemy.elapsed * fps) % frames;
      const x = Math.round(enemy.x - cameraX - w / 2);
      const y = Math.round(WORLD.ground - enemy.height - h * (1 + type.lift) + 4);
      if (enemy.dir > 0) {
        if (enemy.x < cameraX - 20) dogBehind = true;
        ctx.save();
        ctx.translate(x + w, y);
        ctx.scale(-1, 1); // sheets face left; the chaser runs right
        ctx.drawImage(sheet, frame * type.frameWidth, 0, type.frameWidth, sheet.height, 0, 0, w, h);
        ctx.restore();
      } else {
        ctx.drawImage(sheet, frame * type.frameWidth, 0, type.frameWidth, sheet.height, x, y, w, h);
      }
    }
    if (dogBehind && Math.floor(clock * 6) % 2 === 0) { // something is coming up behind you
      ctx.font = "34px 'Press Start 2P', monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = "#12061c";
      ctx.fillText("!", SAFE.left + 3, WORLD.ground - 327);
      ctx.fillStyle = "#ffe066";
      ctx.fillText("!", SAFE.left, WORLD.ground - 330);
    }
  }

  function drawGoal() {
    const sx = GOAL.x - cameraX;
    if (sx < -300 || sx > VIEW.width + 300) return;
    const size = goalSize();
    const width = GOAL.width * size;
    const height = GOAL.height * size;
    const left = Math.round(sx - width / 2);
    const top = WORLD.ground - height;
    const pull = winSequence.active ? Math.min(1, winSequence.elapsed / WIN.suck) : 0;
    const pulse = 0.6 + 0.4 * Math.sin(vortexMotion.pulse);
    const hue = vortexMotion.hue % 360;
    const spin = vortexMotion.spin;

    // Spiralling vortex, clipped to the doorway. Grows with proximity, spins up while feeding.
    ctx.save();
    ctx.beginPath();
    ctx.rect(left, top, width, height);
    ctx.clip();
    ctx.fillStyle = "#06020c";
    ctx.fillRect(left, top, width, height);
    const cx = sx;
    const cy = top + height / 2;
    ctx.lineWidth = 9 * size;
    ctx.lineCap = "round";
    for (let i = 0; i < 16; i += 1) {
      const t = i / 16;
      const radius = (6 + t * 170) * size;
      const start = spin + t * Math.PI * 5;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, start, start + 2.1);
      ctx.strokeStyle = `hsl(${(hue + t * 360) % 360}, 100%, ${55 + pulse * 12}%)`;
      ctx.stroke();
    }
    ctx.restore();

    // Glowing rectangular frame.
    ctx.save();
    ctx.shadowColor = `hsl(${hue}, 100%, 65%)`;
    ctx.shadowBlur = (18 + pulse * 26) * size;
    ctx.lineWidth = 6 * size;
    ctx.strokeStyle = `hsl(${hue}, 100%, 75%)`;
    ctx.strokeRect(left, top, width, height);
    ctx.restore();

    // Floating pixel arrow pointing down at the door.
    const ay = top - 70 + Math.sin(clock * 4) * 10;
    ctx.fillStyle = "#12061c";
    ctx.fillRect(cx - 12, ay - 46, 24, 30);
    ctx.beginPath();
    ctx.moveTo(cx - 30, ay - 18);
    ctx.lineTo(cx + 30, ay - 18);
    ctx.lineTo(cx, ay + 12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ffe066";
    ctx.fillRect(cx - 8, ay - 42, 16, 24);
    ctx.beginPath();
    ctx.moveTo(cx - 24, ay - 18);
    ctx.lineTo(cx + 24, ay - 18);
    ctx.lineTo(cx, ay + 6);
    ctx.closePath();
    ctx.fill();
  }

  function drawWinParticles() {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.lineCap = "round";
    for (const particle of winSequence.particles) {
      const px = winSequence.centerX + Math.cos(particle.angle) * particle.radius;
      const py = winSequence.centerY + Math.sin(particle.angle) * particle.radius;
      const size = Math.max(1, particle.size * Math.min(1, particle.radius / 60 + 0.35));
      if (particle.delay <= 0 && particle.age >= 0.22) {
        ctx.strokeStyle = particle.color; // motion streak from where it was last frame
        ctx.lineWidth = size;
        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        ctx.moveTo(particle.prevX, particle.prevY);
        ctx.lineTo(px, py);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = particle.color;
      ctx.fillRect(Math.round(px), Math.round(py), size, size);
    }
    ctx.restore();
  }

  function drawTvDeath() {
    // The phosphor gives out: tearing bands and colour separation build, then the picture collapses to a line and a dot.
    const elapsed = winSequence.elapsed;
    effectCtx.clearRect(0, 0, VIEW.width, VIEW.height);
    effectCtx.drawImage(canvas, 0, 0);
    const strength = Math.min(1, elapsed / WIN.suck);

    if (elapsed < WIN.suck) {
      // The whole picture is dragged toward the mouth: zoom about the vortex plus a darkening ring.
      const zoom = 1 + strength * strength * 0.45;
      ctx.drawImage(effectCanvas, winSequence.centerX - winSequence.centerX * zoom, winSequence.centerY - winSequence.centerY * zoom,
        VIEW.width * zoom, VIEW.height * zoom);
      const ring = ctx.createRadialGradient(winSequence.centerX, winSequence.centerY, 60, winSequence.centerX, winSequence.centerY, VIEW.width * 0.7);
      ring.addColorStop(0, "rgba(0,0,0,0)");
      ring.addColorStop(1, `rgba(0,0,0,${0.75 * strength})`);
      ctx.fillStyle = ring;
      ctx.fillRect(0, 0, VIEW.width, VIEW.height);
      effectCtx.drawImage(canvas, 0, 0);
      const bands = Math.floor(2 + strength * 10);
      for (let i = 0; i < bands; i += 1) {
        const by = Math.floor(Math.random() * VIEW.height);
        const bh = 6 + Math.floor(Math.random() * 40 * strength);
        const shift = (Math.random() - 0.5) * 90 * strength;
        ctx.drawImage(effectCanvas, 0, by, VIEW.width, bh, shift, by, VIEW.width, bh);
      }
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = 0.35 * strength;
      ctx.filter = "hue-rotate(120deg)";
      ctx.drawImage(effectCanvas, 6 + strength * 14, 0);
      ctx.filter = "hue-rotate(-120deg)";
      ctx.drawImage(effectCanvas, -6 - strength * 14, 0);
      ctx.restore();
      if (Math.random() < strength * 0.25) { // brightness stutter
        ctx.fillStyle = `rgba(255, 255, 255, ${0.08 + Math.random() * 0.2 * strength})`;
        ctx.fillRect(0, 0, VIEW.width, VIEW.height);
      }
      return;
    }

    const p = Math.min(1, (elapsed - WIN.suck) / WIN.collapse);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    if (p < 0.7) {
      const squash = 1 - p / 0.7;
      const h = Math.max(3, VIEW.height * squash * squash);
      ctx.save();
      ctx.filter = `brightness(${1 + (1 - squash) * 2.5})`;
      ctx.drawImage(effectCanvas, 0, (VIEW.height - h) / 2, VIEW.width, h);
      ctx.restore();
    } else {
      const q = (p - 0.7) / 0.3; // line shrinks to a dot, then dies
      const w = VIEW.width * (1 - q);
      ctx.fillStyle = `rgba(255, 255, 255, ${1 - q * 0.6})`;
      ctx.fillRect((VIEW.width - w) / 2, VIEW.height / 2 - 2, w, 4);
      ctx.fillStyle = "#fff";
      ctx.fillRect(VIEW.width / 2 - 3, VIEW.height / 2 - 3, 6, 6);
    }
  }

  function drawEnding() {
    const image = assets.story[ENDING.image];
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    const scale = Math.floor(Math.min((SAFE.right - SAFE.left) / image.width, 400 / image.height));
    const dw = image.width * scale;
    const dh = image.height * scale;
    const dx = Math.round((VIEW.width - dw) / 2);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, dx, SAFE.top, dw, dh);
    ctx.font = "24px 'Press Start 2P', monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#ffffff";
    const typed = Math.max(0, Math.floor((endingClock - 0.4) / STORY.charTime));
    let remaining = typed;
    let y = SAFE.top + dh + 40;
    for (const line of ENDING.lines) {
      ctx.fillText(line.slice(0, Math.max(0, remaining)), dx + 8, y);
      remaining -= line.length + 1;
      y += 40;
    }
    if (endingClock > 3 && Math.floor(endingClock / 0.5) % 2 === 0) {
      ctx.font = "16px 'Press Start 2P', monospace";
      ctx.textAlign = "center";
      ctx.fillText("PRESS ANY BUTTON", VIEW.width / 2, SAFE.bottom - 28);
    }
    steppedFade(endingClock / (STORY.fadeSteps * STORY.stepTime), STORY.fadeSteps);
  }

  function drawVultures() {
    const sheet = assets.vulture;
    const frames = Math.floor(sheet.width / VULTURE.frameWidth);
    const w = VULTURE.frameWidth * VULTURE.scale;
    const h = sheet.height * VULTURE.scale;
    ctx.imageSmoothingEnabled = false;
    for (const vulture of vultures) {
      const frame = Math.floor(vulture.elapsed * VULTURE.fps) % frames;
      ctx.save();
      ctx.translate(Math.round(vulture.x - cameraX + w / 2), Math.round(vulture.y - h / 2));
      ctx.scale(-1, 1); // sheet faces right; flip to face the runner
      ctx.drawImage(sheet, frame * VULTURE.frameWidth, 0, VULTURE.frameWidth, sheet.height, 0, 0, w, h);
      ctx.restore();
    }
  }

  function drawHitFlash() {
    if (hitFlash <= 0) return;
    const alpha = (hitFlash / HIT.flash) * 0.6;
    const vignette = ctx.createRadialGradient(VIEW.width / 2, VIEW.height / 2, VIEW.height * 0.25, VIEW.width / 2, VIEW.height / 2, VIEW.width * 0.62);
    vignette.addColorStop(0, "rgba(255, 40, 70, 0)");
    vignette.addColorStop(1, `rgba(255, 40, 70, ${alpha})`);
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  }

  function drawCars() {
    ctx.imageSmoothingEnabled = false;
    for (const car of cars) {
      const image = assets.carFrames[Math.floor(car.elapsed * CAR.fps) % assets.carFrames.length];
      const w = image.width * CAR.scale;
      const h = image.height * CAR.scale;
      ctx.drawImage(image, Math.round(car.x - cameraX), Math.round(CAR.laneY - h), w, h); // sheet already faces right
    }
  }

  function drawFog() {
    const size = 512;
    const top = WORLD.ground - 180;
    fogCtx.clearRect(0, 0, VIEW.width, VIEW.height);
    fogCtx.globalCompositeOperation = "source-over";
    for (const [parallax, drift, alpha] of [[0.35, 18, 0.8], [0.6, -30, 0.7]]) {
      fogCtx.globalAlpha = alpha;
      const scroll = cameraX * parallax + clock * drift;
      let x = -(((scroll % size) + size) % size);
      for (; x < VIEW.width; x += size) fogCtx.drawImage(assets.noise, x, top, size, size);
    }
    fogCtx.globalAlpha = 1;
    fogCtx.globalCompositeOperation = "multiply"; // tint the grey noise cool teal
    fogCtx.fillStyle = "#9fd8e6";
    fogCtx.fillRect(0, top, VIEW.width, VIEW.height - top);
    fogCtx.globalCompositeOperation = "destination-in"; // fade the fog in from its top edge
    const fade = fogCtx.createLinearGradient(0, top, 0, VIEW.height);
    fade.addColorStop(0, "rgba(0,0,0,0)");
    fade.addColorStop(0.55, "rgba(0,0,0,0.7)");
    fade.addColorStop(1, "rgba(0,0,0,1)");
    fogCtx.fillStyle = fade;
    fogCtx.fillRect(0, 0, VIEW.width, VIEW.height);

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.6;
    ctx.drawImage(fogCanvas, 0, 0);
    ctx.restore();
  }

  function steppedFade(progress, steps) {
    // 0 = fully black, 1 = clear, quantised to the palette steps
    const level = Math.min(steps, Math.floor(progress * steps));
    if (level >= steps) return;
    ctx.fillStyle = `rgba(0, 0, 0, ${1 - level / steps})`;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  }

  function drawTitle() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    const fadeDuration = TITLE.fadeSteps * TITLE.stepTime;
    if (screen === "starting" && titleClock > TITLE.flickerTime) return; // blackout before play

    const image = assets.title;
    const dw = image.width * TITLE.scale;
    const dh = TITLE.crop.height * TITLE.scale;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, 0, TITLE.crop.y, image.width, TITLE.crop.height, Math.round((VIEW.width - dw) / 2), 16, dw, dh);

    const half = screen === "starting" ? TITLE.flickerRate : TITLE.blink;
    const textOn = screen === "starting" || titleClock > fadeDuration;
    if (textOn && Math.floor(titleClock / half) % 2 === 0) {
      ctx.font = "22px 'Press Start 2P', monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = "#f5eedb";
      ctx.fillText("PRESS ANY BUTTON TO START", VIEW.width / 2, SAFE.bottom - 30);
    }
    if (screen === "title") steppedFade(titleClock / fadeDuration, TITLE.fadeSteps);
  }

  function uiSound(kind) {
    const play = () => {
      if (kind === "start") playSound(UI_SFX.start, 0.9, 1.1, 0.25);
      else if (kind === "advance") playSound(UI_SFX.advance, 0.7, 1.5, 0.15);
      else playSound(UI_SFX.type, 0.12, 1.5 + Math.random() * 0.25); // soft, low tick
    };
    if (gameAudioContext?.state === "running" && gameAudioBuffers.size) play();
    else unlockGameAudio().then(play); // first press: wait for the context to resume, then blip
  }

  function typewriterBlips(text, typedCount) {
    // One blip per newly revealed non-space character, at most one per frame.
    if (typedCount <= typedSeen) return;
    const fresh = text.slice(typedSeen, typedCount);
    typedSeen = typedCount;
    if (/\S/.test(fresh) && typedCount % 3 === 0) uiSound("type"); // every third letter, not a machine gun
  }

  function pressStart() {
    if (screen !== "title" || !ready) return;
    screen = "starting";
    titleClock = 0;
    uiSound("start");
  }

  function beginStory() {
    screen = "story";
    storyPage = 0;
    storyClock = 0;
    typedSeen = 0;
  }

  function storyTypedLength(page) {
    return page.lines.join("\n").length;
  }

  function advanceStory() {
    const page = STORY.pages[storyPage];
    const typeTime = STORY.fadeSteps * STORY.stepTime + storyTypedLength(page) * STORY.charTime;
    uiSound("advance");
    if (storyClock < typeTime) {
      storyClock = typeTime; // first press finishes the line, second press turns the page
      typedSeen = storyTypedLength(page);
      return;
    }
    storyPage += 1;
    storyClock = 0;
    typedSeen = 0;
    if (storyPage >= STORY.pages.length) beginPlay();
  }

  function beginPlay() {
    screen = "play";
    playClock = 0;
    unlockGameAudio(); // audio was already unlocked by the start press; this queues the opening line
  }

  function drawStory() {
    const page = STORY.pages[storyPage];
    const image = assets.story[page.image];
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);

    // Still in the upper part of the screen, integer-scaled so the console pixels stay hard.
    const scale = Math.floor(Math.min((SAFE.right - SAFE.left) / image.width, 440 / image.height)); // 256x144 still -> 3x = 768x432
    const dw = image.width * scale;
    const dh = image.height * scale;
    const dx = Math.round((VIEW.width - dw) / 2);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, dx, SAFE.top, dw, dh);

    // Story text: small white pixel font, typed a character at a time, a few lines only.
    const fadeTime = STORY.fadeSteps * STORY.stepTime;
    const typed = Math.max(0, Math.floor((storyClock - fadeTime) / STORY.charTime));
    ctx.font = "24px 'Press Start 2P', monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#ffffff";
    let remaining = typed;
    let y = SAFE.top + dh + 44;
    for (const line of page.lines) {
      ctx.fillText(line.slice(0, Math.max(0, remaining)), dx + 8, y);
      remaining -= line.length + 1;
      y += 44;
    }
    steppedFade(storyClock / fadeTime, STORY.fadeSteps);
  }

  function drawPlayer() {
    if (deathSequence.active && deathSequence.elapsed > 0.08) return;
    if (winSequence.active) return; // the sprite has become particles
    if (player.invulnerable > 0 && Math.floor(player.invulnerable * 18) % 2 === 0) return;
    const animation = assets.animations[player.state];
    const frameData = animation.data.frames[player.frame].frame;
    const screenX = Math.round(player.x - cameraX);
    const drawWidth = frameData.w * PLAYER_SCALE;
    const drawHeight = frameData.h * PLAYER_SCALE;
    const anchorX = 80 * PLAYER_SCALE;
    const anchorY = 210 * PLAYER_SCALE + drawHeight * PLAYER_LIFT;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (player.facing < 0) {
      ctx.translate(screenX, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(
        animation.image,
        frameData.x,
        frameData.y,
        frameData.w,
        frameData.h,
        -anchorX,
        player.y - anchorY,
        drawWidth,
        drawHeight,
      );
    } else {
      ctx.drawImage(
        animation.image,
        frameData.x,
        frameData.y,
        frameData.w,
        frameData.h,
        screenX - anchorX,
        player.y - anchorY,
        drawWidth,
        drawHeight,
      );
    }
    ctx.restore();
  }

  function drawDeathSequence() {
    const elapsed = deathSequence.elapsed;
    const centerX = deathSequence.centerX;
    const centerY = deathSequence.centerY;
    effectCtx.clearRect(0, 0, VIEW.width, VIEW.height);
    effectCtx.drawImage(canvas, 0, 0);

    if (elapsed < 1.65) {
      const rippleRadius = elapsed * 760;
      for (let ring = 0; ring < 6; ring += 1) {
        const radius = rippleRadius - ring * 92;
        if (radius < 12) continue;
        const thickness = 30 + (5 - ring) * 4;
        const scale = 1 + (0.065 - ring * 0.006) * (1 - elapsed / 1.65);
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + thickness, 0, Math.PI * 2);
        ctx.arc(centerX, centerY, Math.max(0, radius - thickness), 0, Math.PI * 2, true);
        ctx.clip("evenodd");
        ctx.globalAlpha = 0.78;
        ctx.drawImage(
          effectCanvas,
          centerX - centerX * scale,
          centerY - centerY * scale,
          VIEW.width * scale,
          VIEW.height * scale,
        );
        ctx.restore();
      }

      const rayAlpha = Math.max(0, 0.24 * (1 - elapsed / 1.65));
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(elapsed * 0.7);
      ctx.globalCompositeOperation = "screen";
      for (let ray = 0; ray < 32; ray += 1) {
        const angle = (ray / 32) * Math.PI * 2;
        const next = angle + Math.PI / 32;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(angle) * 1100, Math.sin(angle) * 1100);
        ctx.lineTo(Math.cos(next) * 1100, Math.sin(next) * 1100);
        ctx.closePath();
        ctx.fillStyle = `hsla(${(ray * 29 + elapsed * 240) % 360}, 100%, 58%, ${rayAlpha})`;
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (const particle of deathSequence.particles) {
      if (particle.life <= 0) continue;
      const alpha = Math.min(1, particle.life / 0.7);
      ctx.globalAlpha = alpha;
      ctx.shadowBlur = 24;
      ctx.shadowColor = `hsl(${particle.hue}, 100%, 64%)`;
      ctx.fillStyle = `hsl(${particle.hue}, 100%, 72%)`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius * alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(255,255,255,0.82)";
      ctx.stroke();
    }
    const flashRadius = 80 + Math.min(1, elapsed / 1.1) * 760;
    const flash = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, flashRadius);
    flash.addColorStop(0, `rgba(235, 255, 255, ${Math.max(0, 0.9 - elapsed * 0.7)})`);
    flash.addColorStop(0.18, `rgba(38, 210, 255, ${Math.max(0, 0.55 - elapsed * 0.34)})`);
    flash.addColorStop(0.52, `rgba(205, 48, 255, ${Math.max(0, 0.32 - elapsed * 0.18)})`);
    flash.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = flash;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.restore();

    const fade = smoothstep(0.95, 2.35, elapsed);
    ctx.fillStyle = `rgba(2, 1, 8, ${fade * 0.96})`;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);

    const textAlpha = smoothstep(1.75, 2.55, elapsed);
    if (textAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = textAlpha;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "54px 'Press Start 2P', monospace"; // fits the 4:3 tube window with margin
      ctx.shadowBlur = 30;
      ctx.shadowColor = "#ff285f";
      ctx.fillStyle = "#f8ecdf";
      ctx.fillText("YOU ARE DEAD", VIEW.width / 2, VIEW.height / 2 - 24);
      ctx.shadowBlur = 16;
      ctx.font = "24px 'Press Start 2P', monospace";
      if (Math.floor(Math.max(0, elapsed - 2.25) / 0.48) % 2 === 0) {
        ctx.fillStyle = "#65e8ff";
        ctx.fillText("TRY AGAIN?", VIEW.width / 2, VIEW.height / 2 + 56);
      }
      ctx.restore();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, VIEW.width, VIEW.height);
    ctx.save();
    if (screenShake > 0) {
      const strength = 4 + screenShake * 13;
      ctx.translate((Math.random() - 0.5) * strength, (Math.random() - 0.5) * strength);
    }
    drawCity();
    drawGoal();
    drawEnemies();
    drawVultures();
    drawPlayer();
    drawCars();
    drawFog();
    drawHitFlash();
    if (winSequence.active) drawWinParticles();
    ctx.restore();
    if (deathSequence.active) drawDeathSequence();

    drawHud();
    if (winSequence.active) drawTvDeath();
  }

  function drawHud() {
    // 16-bit style: chunky segmented soul bar with a bevelled plate, pixel font with a hard drop shadow.
    const x = SAFE.left;
    const y = SAFE.top;
    const segments = 20;
    const segW = 14;
    const segH = 18;
    const gap = 3;
    const plateX = x + 92;
    const plateW = segments * (segW + gap) + gap + 5;
    const plateH = segH + 12;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.textBaseline = "top";
    ctx.font = "16px 'Press Start 2P', monospace";
    const label = (text, tx, ty, align, color = "#f5eedb") => {
      ctx.textAlign = align;
      ctx.fillStyle = "#12061c";
      ctx.fillText(text, tx + 2, ty + 2);
      ctx.fillStyle = color;
      ctx.fillText(text, tx, ty);
    };
    label("SOUL", x, y + 6, "left");

    // plate with a 2px bevel: light top-left, dark bottom-right
    ctx.fillStyle = "#7de5f2";
    ctx.fillRect(plateX, y, plateW, plateH);
    ctx.fillStyle = "#2a0f3a";
    ctx.fillRect(plateX + 2, y + 2, plateW - 2, plateH - 2);
    ctx.fillStyle = "#0b0412";
    ctx.fillRect(plateX + 4, y + 4, plateW - 6, plateH - 6);

    const filled = Math.round((player.displayedSoul / SOUL_MAX) * segments);
    const trailing = Math.round((player.trailingSoul / SOUL_MAX) * segments);
    const flashing = hudFlash > 0 && Math.floor(hudFlash * 24) % 2 === 0;
    for (let i = 0; i < segments; i += 1) {
      const sx = plateX + 7 + i * (segW + gap);
      const sy = y + 6;
      if (i < trailing && i >= filled) {
        ctx.fillStyle = "#ff2f4f"; // damage just taken drains as a red trail
        ctx.fillRect(sx, sy, segW, segH);
        continue;
      }
      if (i >= filled) continue;
      const t = i / (segments - 1);
      const hue = 316 - t * 130; // magenta on the left through to cyan on the right
      ctx.fillStyle = flashing ? "#ffffff" : `hsl(${hue}, 100%, 62%)`;
      ctx.fillRect(sx, sy, segW, segH);
      ctx.fillStyle = flashing ? "#ffffff" : `hsl(${hue}, 100%, 82%)`;
      ctx.fillRect(sx, sy, segW, 5); // highlight band = two-tone chunky segment
      ctx.fillStyle = flashing ? "#ffffff" : `hsl(${hue}, 100%, 38%)`;
      ctx.fillRect(sx, sy + segH - 4, segW, 4);
    }

    const toGo = Math.max(0, Math.ceil((GOAL.x - player.x) / 10));
    label(`BONKHOUSE ${String(toGo).padStart(4, "0")}M`, SAFE.right, y + 6, "right");
    ctx.font = "11px 'Press Start 2P', monospace";
    label(`BEST ${String(bestDistance).padStart(4, "0")}M`, SAFE.right, y + 32, "right", "#9fd8e6");
    ctx.restore();
  }

  function queueFrame() {
    if (!animationFrame && ready && !signal.aborted && !document.hidden) animationFrame = requestAnimationFrame(loop);
  }

  function loop(time) {
    animationFrame = 0;
    if (signal.aborted || document.hidden || !ready || !canvas.isConnected) return;
    if (lastTime && time - lastTime < 1000 / 60 - .5) { queueFrame(); return; }
    const dt = Math.max(0, Math.min((time - lastTime) / 1000 || 0, 1 / 30));
    lastTime = time;
    if (screen === "ending") {
      endingClock += dt;
      const text = ENDING.lines.join("\n");
      typewriterBlips(text, Math.min(text.length, Math.max(0, Math.floor((endingClock - 0.4) / STORY.charTime))));
      drawEnding();
      queueFrame();
      return;
    }
    if (screen === "story") {
      storyClock += dt;
      if (storyClock > STORY.pageTime) advanceStory();
      if (screen === "story") {
        const page = STORY.pages[storyPage];
        const typed = Math.floor((storyClock - STORY.fadeSteps * STORY.stepTime) / STORY.charTime);
        typewriterBlips(page.lines.join("\n"), Math.min(storyTypedLength(page), Math.max(0, typed)));
        drawStory();
      }
      queueFrame();
      return;
    }
    if (screen !== "play") {
      titleClock += dt;
      if (screen === "starting" && titleClock > TITLE.flickerTime + TITLE.blackout) beginStory();
      if (screen !== "story") drawTitle();
      queueFrame();
      return;
    }
    hitFlash = Math.max(0, hitFlash - dt);
    if (hitStop > 0) {
      hitStop -= dt; // freeze the world for a few frames so the hit lands
    } else {
      updatePlayer(dt);
      updateWorld(dt);
    }

    const targetCamera = player.x - VIEW.width * 0.38;
    if (!winSequence.active) cameraX += (targetCamera - cameraX) * Math.min(1, dt * 5.5);
    draw();
    playClock += dt;
    steppedFade(playClock / (TITLE.fadeSteps * TITLE.stepTime), TITLE.fadeSteps);
    queueFrame();
  }

  window.addEventListener("keydown", (event) => {
    if (document.hidden || event.ctrlKey || event.metaKey || event.altKey || ["Tab", "Escape", "Shift", "Control", "Alt", "Meta"].includes(event.key)) return;
    if (event.target instanceof Element && event.target.closest("button,a,input,textarea,select")) return;
    unlockGameAudio();
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "Space"].includes(event.code)) event.preventDefault();
    if (screen !== "play") {
      if (event.repeat) return;
      if (screen === "story") advanceStory();
      else if (screen === "ending") { if (endingClock > 3) returnToTitle(); }
      else pressStart();
      return;
    }
    if (winSequence.active) return;
    if (deathSequence.active) {
      if (!event.repeat && deathSequence.elapsed >= 2.25) resetPlayer();
      return;
    }
    keys.add(event.code);
    if (["KeyW", "ArrowUp", "Space"].includes(event.code) && !event.repeat) pressJump();
    if (event.code === "KeyR") resetPlayer();
  }, { signal });

  window.addEventListener("keyup", (event) => {
    keys.delete(event.code);
    if (["KeyW", "ArrowUp", "Space"].includes(event.code)) releaseJump();
  }, { signal });
  function releaseControls() {
    keys.clear();
    touch.left = touch.right = touch.jump = false;
    releaseJump();
    shell.querySelectorAll("[data-control]").forEach(button => { delete button.dataset.held; });
  }
  window.addEventListener("blur", releaseControls, { signal });
  document.addEventListener("visibilitychange", () => {
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    lastTime = 0;
    releaseControls();
    if (document.hidden) {
      resumeMusic = !music.paused;
      resumeAudio = gameAudioContext?.state === "running";
      music.pause();
      if (resumeAudio) gameAudioContext.suspend().catch(() => {});
    } else {
      // Queue resume even if a just-requested suspension is still completing.
      if (resumeAudio && gameAudioContext?.state !== "closed") gameAudioContext.resume().catch(() => {});
      if (resumeMusic && music.dataset.userPaused !== "true") music.play().catch(() => {});
      queueFrame();
    }
  }, { signal });

  // The CRT stage sends tv:click only for clean clicks, so dragging the set around never counts as a button press.
  canvas.addEventListener("pointerdown", () => canvas.dispatchEvent(new CustomEvent("tv:click", { bubbles: true })), { signal });
  shell.addEventListener("contextmenu", event => event.preventDefault(), { signal });
  shell.addEventListener("selectstart", event => event.preventDefault(), { signal });
  for (const surface of document.querySelectorAll("#game, #tv-stage")) {
    surface.addEventListener("tv:click", () => {
      unlockGameAudio();
      if (screen === "story") advanceStory();
      else if (screen === "ending") { if (endingClock > 3) returnToTitle(); }
      else if (screen !== "play") pressStart();
      else if (deathSequence.active && deathSequence.elapsed >= 2.25) resetPlayer();
    }, { signal });
  }

  document.querySelectorAll("[data-control]").forEach((button) => {
    const control = button.dataset.control;
    const pointers = new Set();
    const press = (event) => {
      event.preventDefault();
      pointers.add(event.pointerId);
      button.setPointerCapture(event.pointerId);
      button.dataset.held = "true";
      unlockGameAudio();
      if (screen === "title") canvas.dispatchEvent(new CustomEvent("tv:click", { bubbles: true }));
      if (screen !== "play") {
        if (screen === "story") advanceStory();
        else if (screen === "ending") { if (endingClock > 3) returnToTitle(); }
        else pressStart();
        return;
      }
      if (winSequence.active) return;
      if (deathSequence.active) {
        if (deathSequence.elapsed >= 2.25) resetPlayer();
        return;
      }
      touch[control] = true;
      if (control === "jump") pressJump();
    };
    const release = (event) => {
      event.preventDefault();
      pointers.delete(event.pointerId);
      if (pointers.size) return;
      delete button.dataset.held;
      touch[control] = false;
      if (control === "jump") releaseJump();
    };
    button.addEventListener("pointerdown", press, { signal });
    button.addEventListener("pointerup", release, { signal });
    button.addEventListener("pointercancel", release, { signal });
    button.addEventListener("lostpointercapture", release, { signal });
    button.addEventListener("touchstart", event => event.preventDefault(), { passive: false, signal });
    window.addEventListener("blur", () => pointers.clear(), { signal });
    document.addEventListener("visibilitychange", () => { if (document.hidden) pointers.clear(); }, { signal });
  });

  setMusicLevel(MUSIC_VOLUME);
  musicToggle.addEventListener("click", async () => {
    await unlockGameAudio(false);
    if (signal.aborted) return;
    if (music.paused) {
      delete music.dataset.userPaused;
      setMusicLevel(activeVoice ? MUSIC_DUCKED_VOLUME : MUSIC_VOLUME);
      await music.play();
      updateMusicButton(true);
    } else {
      music.pause();
      music.dataset.userPaused = "true";
      updateMusicButton(false);
    }
  }, { signal });

  signal.addEventListener("abort", () => {
    ready = false;
    cancelAnimationFrame(animationFrame);
    releaseControls();
    music.pause();
    if (gameAudioContext && gameAudioContext.state !== "closed") gameAudioContext.close().catch(() => {});
    gameAudioBuffers.clear();
  }, { once: true });

  loadGame();
  return () => listeners.abort();
}

window.startSinfeld = startSinfeld;
if (!window.SINFELD_EMBED) startSinfeld();
