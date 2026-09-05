(function () {
  var VS = "attribute vec2 a_position;varying vec2 v_uv;void main(){v_uv=a_position*0.5+0.5;gl_Position=vec4(a_position,0.0,1.0);}";
  var FS = [
    "precision mediump float;",
    "uniform float u_time;uniform vec2 u_mouse;uniform vec2 u_resolution;uniform vec2 u_image_resolution;uniform sampler2D u_texture;varying vec2 v_uv;",
    "float noise(vec2 st){return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.5453123);}",
    "float smoothNoise(vec2 st){vec2 i=floor(st);vec2 f=fract(st);f=f*f*(3.0-2.0*f);float bl=noise(i);float br=noise(i+vec2(1.0,0.0));float tl=noise(i+vec2(0.0,1.0));float tr=noise(i+vec2(1.0,1.0));return mix(mix(bl,br,f.x),mix(tl,tr,f.x),f.y);}",
    "vec2 coverUv(vec2 uv){float sa=u_resolution.x/u_resolution.y;float ia=u_image_resolution.x/u_image_resolution.y;vec2 s=vec2(1.0);if(sa>ia){s.y=ia/sa;}else{s.x=sa/ia;}return (uv-0.5)*s+0.5;}",
    "vec2 rippleFromCenter(vec2 uv,vec2 nuv,float aspect){vec2 dir=nuv;float dist=max(length(dir),0.001);vec2 rd=dir/dist;vec2 ud=vec2(rd.x/aspect,rd.y);float outerFade=smoothstep(1.05,0.05,dist);float innerFade=smoothstep(0.0,0.16,dist);float wave=sin(dist*42.0-u_time*2.35);float wideWave=sin(dist*18.0-u_time*1.35+smoothNoise(nuv*4.0)*1.8);float shimmer=smoothNoise(nuv*10.0+u_time*0.18)-0.5;float disp=(wave*0.024+wideWave*0.012+shimmer*0.004)*outerFade*innerFade;return uv+ud*disp;}",
    "vec3 chromaticAberration(sampler2D tex,vec2 uv,float strength){float edge=length(vec2(0.5)-uv)*2.0;strength*=edge*1.5;vec2 off=vec2(strength,0.0);float r=texture2D(tex,coverUv(uv-off)).r;float g=texture2D(tex,coverUv(uv)).g;float b=texture2D(tex,coverUv(uv+off)).b;return vec3(r,g,b);}",
    "void main(){vec2 uv=v_uv;float aspect=u_resolution.x/u_resolution.y;vec2 nuv=vec2((uv.x-0.5)*aspect,uv.y-0.5);vec2 nm=vec2((u_mouse.x-0.5)*aspect,u_mouse.y-0.5);",
    "vec2 duv=rippleFromCenter(uv,nuv,aspect);",
    "float md=max(length(nuv-nm),0.001);float mi=1.0-smoothstep(0.0,0.34,md);vec2 mdel=nuv-nm;vec2 mdir=mdel/max(length(mdel),0.001);vec2 mud=vec2(mdir.x/aspect,mdir.y);float mw=sin(md*38.0-u_time*2.8)*0.008*mi;",
    "float nv=smoothNoise(nuv*3.0+u_time*0.1)*0.006;duv+=mud*(mw+nv*mi);",
    "float cd=length(nuv);float rg=0.5+0.5*sin(cd*32.0-u_time*2.35);vec3 color=chromaticAberration(u_texture,duv,0.008+rg*0.006+mi*0.008);",
    "color*=smoothstep(1.2,0.5,length(v_uv-vec2(0.5)));",
    "float pulse=0.5+0.5*sin(u_time*2.0);float glow=smoothstep(0.3+0.1*pulse,0.0,length(nuv-nm));color+=vec3(0.1,0.05,0.2)*glow;",
    "gl_FragColor=vec4(color,1.0);}"
  ].join("\n");

  var canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%";
  var gl = canvas.getContext("webgl", { alpha: true, antialias: false, depth: false, stencil: false });
  if (!gl) return;

  function makeShader(type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null;
  }
  var vs = makeShader(gl.VERTEX_SHADER, VS);
  var fs = makeShader(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) return;
  var program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

  var posLoc = gl.getAttribLocation(program, "a_position");
  var timeLoc = gl.getUniformLocation(program, "u_time");
  var mouseLoc = gl.getUniformLocation(program, "u_mouse");
  var resLoc = gl.getUniformLocation(program, "u_resolution");
  var imgResLoc = gl.getUniformLocation(program, "u_image_resolution");
  var texLoc = gl.getUniformLocation(program, "u_texture");
  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  var pointer = { x: 0.5, y: 0.5 };
  var imageSize = { width: 1, height: 1 };
  var motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var start = performance.now();
  var host = null;
  var visible = false;
  var ready = false;
  var frame = 0;

  function active() {
    return ready && host && host.isConnected && visible && !document.hidden;
  }

  function schedule() {
    if (!frame && active()) frame = requestAnimationFrame(render);
  }

  function sync() {
    cancelAnimationFrame(frame);
    frame = 0;
    schedule();
  }

  var visibility = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.target !== host) return;
      visible = entry.isIntersecting;
      sync();
    });
  });
  var size = new ResizeObserver(sync);

  function attach() {
    // Wait for the live React tree, not the raw design-canvas template.
    var nextHost = document.querySelector("#dc-root [data-hero-background]");
    if (nextHost === host && canvas.parentElement === host) return;
    visibility.disconnect();
    size.disconnect();
    host = nextHost;
    visible = false;
    if (host) {
      host.appendChild(canvas);
      visibility.observe(host);
      size.observe(host);
    }
    sync();
  }

  // The runtime can replace the hero even while rendering is paused.
  new MutationObserver(attach).observe(document.body, { childList: true, subtree: true });
  attach();
  document.addEventListener("visibilitychange", sync);
  motion.addEventListener("change", sync);

  document.addEventListener("pointermove", function (e) {
    if (!active() || motion.matches) return;
    var rect = host.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    var x = (e.clientX - rect.left) / rect.width;
    var y = 1 - (e.clientY - rect.top) / rect.height;
    pointer.x = Math.max(0, Math.min(1, x));
    pointer.y = Math.max(0, Math.min(1, y));
  });

  function render(now) {
    frame = 0;
    if (active()) {
      var rect = host.getBoundingClientRect();
      var ratio = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.max(1, Math.floor(rect.width * ratio));
      var h = Math.max(1, Math.floor(rect.height * ratio));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(texLoc, 0);
      gl.uniform1f(timeLoc, motion.matches ? 0 : (now - start) / 1000);
      gl.uniform2f(mouseLoc, pointer.x, pointer.y);
      gl.uniform2f(resLoc, canvas.width, canvas.height);
      gl.uniform2f(imgResLoc, imageSize.width, imageSize.height);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    if (!motion.matches) schedule();
  }

  var image = new Image();
  image.onload = function () {
    imageSize = { width: image.naturalWidth, height: image.naturalHeight };
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    ready = true;
    schedule();
  };
  image.src = "/hero/background-bonkhouse.png";
})();

(function () {
  var BASE = "/photos/house-house-2024/";
  var PHOTOS = [
    ["mg-1639.jpg", "The room filling up before the lights went down."],
    ["mg-1633.jpg", "Lobby chatter under the poster wall."],
    ["img-0937.jpg", "Audience laughter between reels."],
    ["img-0901.jpg", "Friends in full creature-feature form."],
    ["img-0915.jpg", "A lobby conversation with excellent eyewear."],
    ["img-0919.jpg", "Popcorn, costumes, and the pre-show crowd."],
    ["img-0939.jpg", "Post-show arguments, theories, and bits."],
    ["img-5960.jpg", "The custom pre-show taking over the theater."],
    ["img-5961.jpg", "A quiet room watching something deeply normal."],
    ["mg-1634.jpg", "A wide room full of pre-show arrivals."],
    ["mg-1638.jpg", "The pre-show running while people drifted in."],
    ["mg-1646.jpg", "A very useful warning from the screen."]
  ];
  var motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var gallery = null;
  var visible = false;
  var timer = 0;
  var fadeTimer = 0;
  var fadingImage = null;
  var pending = false;
  var generation = 0;
  var next = 3;
  var tick = 0;

  function active() {
    return gallery && gallery.isConnected && visible && !document.hidden && !motion.matches;
  }

  function schedule() {
    if (active() && !timer && !pending && !fadeTimer) timer = setTimeout(cycle, 4000);
  }

  function sync() {
    clearTimeout(timer);
    clearTimeout(fadeTimer);
    timer = fadeTimer = 0;
    pending = false;
    generation++;
    if (fadingImage) fadingImage.style.opacity = "1";
    fadingImage = null;
    schedule();
  }

  function cycle() {
    timer = 0;
    if (!active()) return;
    var imgs = gallery.querySelectorAll("img[data-photo-cycle]");
    if (!imgs.length) return;
    var img = imgs[tick % imgs.length];
    var photo = PHOTOS[next % PHOTOS.length];
    var current = generation;
    var preload = new Image();
    pending = true;
    // Fetch only the next photo, and keep the current one visible until decoded.
    preload.src = BASE + photo[0];
    preload.decode().then(function () {
      if (current !== generation) return;
      pending = false;
      if (!active() || !img.isConnected) { schedule(); return; }
      fadingImage = img;
      img.style.opacity = "0";
      fadeTimer = setTimeout(function () {
        fadeTimer = 0;
        if (active() && img.isConnected) {
          img.src = preload.src;
          img.alt = photo[1];
          next++;
          tick++;
        }
        img.style.opacity = "1";
        fadingImage = null;
        schedule();
      }, 350);
    }).catch(function () {
      if (current !== generation) return;
      pending = false;
      next++;
      schedule();
    });
  }

  var visibility = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.target !== gallery) return;
      visible = entry.isIntersecting;
      sync();
    });
  });

  function attach() {
    var img = document.querySelector("#dc-root img[data-photo-cycle]");
    var nextGallery = img ? img.closest("section") : null;
    if (nextGallery === gallery) return;
    visibility.disconnect();
    gallery = nextGallery;
    visible = false;
    if (gallery) visibility.observe(gallery);
    sync();
  }

  new MutationObserver(attach).observe(document.body, { childList: true, subtree: true });
  attach();
  document.addEventListener("visibilitychange", sync);
  motion.addEventListener("change", sync);
})();
