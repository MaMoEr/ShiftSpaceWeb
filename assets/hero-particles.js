/* Front-page hero: the ShiftSpace mark as a 3D particle volume.
   Design: docs/superpowers/specs/2026-11-26-front-hero-particle-logo-design.md
   The poster image under the canvas is the first paint. This module checks every gate
   (canvas present, motion allowed, no data saver, WebGL, hero on screen) before it loads
   three.js, so a visitor who gets the poster only never downloads it. Any failure leaves
   the canvas hidden and the poster in place. */

const canvas = document.querySelector('.hero__canvas');
const hero = canvas && canvas.closest('.hero');
const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return false;
    const lose = gl.getExtension('WEBGL_lose_context');
    if (lose) lose.loseContext();
    return true;
  } catch (e) {
    return false;
  }
}

function allowed() {
  if (!canvas || !hero) return false;
  if (motionQuery.matches) return false;
  if (navigator.connection && navigator.connection.saveData) return false;
  return webglAvailable();
}

if (allowed()) {
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      io.disconnect();
      start().catch(() => canvas.classList.remove('is-on'));
    }
  });
  io.observe(hero);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function start() {
  const [THREE, { EffectComposer }, { RenderPass }, { UnrealBloomPass }, { OutputPass }, markImg] = await Promise.all([
    import('three'),
    import('three/addons/postprocessing/EffectComposer.js'),
    import('three/addons/postprocessing/RenderPass.js'),
    import('three/addons/postprocessing/UnrealBloomPass.js'),
    import('three/addons/postprocessing/OutputPass.js'),
    loadImage(new URL('hero-mark.png', import.meta.url).href),
  ]);
  if (motionQuery.matches) return;

  /* ---------- helpers and brand colours ---------- */
  const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
  const gauss = () => {
    let u = 0, v = 0;
    while (!u) u = Math.random();
    while (!v) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  const AMBER_HEX = 0xECB200, BLACK_HEX = 0x090D16, WHITE_HEX = 0xEEF0F3;
  const AMBER = new THREE.Color(AMBER_HEX).multiplyScalar(0.5);
  const WHITE = new THREE.Color(WHITE_HEX).multiplyScalar(0.3);
  const SPARK = new THREE.Color(AMBER_HEX).multiplyScalar(1.1);

  /* ---------- renderer ---------- */
  const small = Math.min(screen.width, screen.height) < 700;
  const N = small ? 16000 : 34000;
  const PR = Math.min(devicePixelRatio || 1, small ? 1.5 : 1.75);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(PR);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BLACK_HEX);
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.7, 0.5, 0.35);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  composer.setPixelRatio(PR);

  /* ---------- the mark, sampled from the real logo image ---------- */
  function sampleMark(img) {
    const W = img.width, H = img.height;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    ctx.drawImage(img, 0, 0, W, H);
    const a = ctx.getImageData(0, 0, W, H).data;
    const fill = [], edge = [];
    const op = (i, j) => i >= 0 && j >= 0 && i < W && j < H && a[(j * W + i) * 4 + 3] > 128;
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      if (!op(i, j)) continue;
      (op(i - 1, j) && op(i + 1, j) && op(i, j - 1) && op(i, j + 1) ? fill : edge).push(i, j);
    }
    const s = 7.6 / W, pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
    for (let n = 0; n < N; n++) {
      const src = Math.random() < 0.3 ? edge : fill, k = ((Math.random() * src.length / 2) | 0) * 2;
      const px = src[k] + Math.random(), py = src[k + 1] + Math.random();
      let x = (px - W / 2) * s, y = -(py - H / 2) * s, z, c;
      if (n % 100 < 60) { // the logo itself: a thin, bright slab
        z = rand(-0.24, 0.24);
        c = Math.random() < 0.08 ? WHITE : Math.random() < 0.03 ? SPARK : AMBER;
      } else { // depth halo: in front of and behind the logo, spreading and fading with distance
        z = gauss() * 1.3;
        const az = Math.abs(z);
        x += gauss() * az * 0.18; y += gauss() * az * 0.18;
        c = (Math.random() < 0.15 ? WHITE : AMBER).clone().multiplyScalar(Math.exp(-az * 0.75) * 0.9 + 0.08);
      }
      pos[n * 3] = x; pos[n * 3 + 1] = y; pos[n * 3 + 2] = z;
      col[n * 3] = c.r; col[n * 3 + 1] = c.g; col[n * 3 + 2] = c.b;
    }
    return { pos, col };
  }
  const mark = sampleMark(markImg);

  /* ---------- particles ---------- */
  // They start on the logo, so the canvas fades in over a poster of the same frame without a jump.
  const pos = new Float32Array(mark.pos), vel = new Float32Array(N * 3), kk = new Float32Array(N);
  const size = new Float32Array(N), delay = new Float32Array(N);
  // Dissolve order: the logo peels away from left to right, as if a current carries it off.
  let minX = Infinity, maxX = -Infinity;
  for (let i = 0; i < N; i++) { const x = mark.pos[i * 3]; if (x < minX) minX = x; if (x > maxX) maxX = x; }
  for (let i = 0; i < N; i++) {
    size[i] = Math.random() < 0.025 ? rand(1.8, 2.4) : rand(0.6, 1.2);
    kk[i] = rand(0.014, 0.04);
    delay[i] = 1.6 * (mark.pos[i * 3] - minX) / (maxX - minX) + rand(0, 0.6);
  }
  // Dispersed homes: one particle per cell of a jittered grid across the view, at a random depth,
  // so the particles end up spread evenly through the space with slight variations.
  const grid = Math.ceil(Math.sqrt(N)), cells = new Uint32Array(grid * grid);
  for (let c = 0; c < cells.length; c++) cells[c] = c;
  for (let c = cells.length - 1; c > 0; c--) { const r = (Math.random() * (c + 1)) | 0, s = cells[c]; cells[c] = cells[r]; cells[r] = s; }
  const hu = new Float32Array(N), hv = new Float32Array(N), hz = new Float32Array(N), home = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const c = cells[i];
    hu[i] = ((c % grid) + Math.random()) / grid * 2 - 1;
    hv[i] = (Math.floor(c / grid) + Math.random()) / grid * 2 - 1;
    hz[i] = rand(-4.5, 3.5);
  }
  const geo = new THREE.BufferGeometry();
  const posAttr = new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('position', posAttr);
  geo.setAttribute('aTarget', new THREE.BufferAttribute(mark.pos, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(mark.col, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  // A particle dims and shrinks as it leaves its place in the logo, so the dispersed field reads
  // as fine matter suspended in a fluid rather than a sky of bright stars.
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uScale: { value: 1 } },
    vertexShader: `attribute float aSize; attribute vec3 aColor; attribute vec3 aTarget;
      uniform float uScale; varying vec3 vC;
      void main(){
        float away = smoothstep(0.8, 3.0, distance(position, aTarget));
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * mix(1.0, 0.7, away) * uScale / -mv.z;
        gl_Position = projectionMatrix * mv; vC = aColor * mix(1.0, 0.28, away);
      }`,
    fragmentShader: `varying vec3 vC;
      void main(){
        float a = smoothstep(0.5, 0.05, length(gl_PointCoord - 0.5));
        gl_FragColor = vec4(vC * a, a);
      }`,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  scene.add(points);

  // faint background dust for depth
  const dustN = 600, dust = new Float32Array(dustN * 3);
  for (let i = 0; i < dustN; i++) {
    dust[i * 3] = rand(-30, 30); dust[i * 3 + 1] = rand(-15, 15); dust[i * 3 + 2] = rand(-40, -10);
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dust, 3));
  scene.add(new THREE.Points(dustGeo, new THREE.PointsMaterial({
    color: 0x7083c4, size: 0.06, transparent: true, opacity: 0.35, depthWrite: false, sizeAttenuation: true,
  })));

  /* ---------- pointer ---------- */
  const input = { tx: 0, ty: 0, mx: 0, my: 0, lastMove: -99, ndc: new THREE.Vector2() };
  const onPointer = (e) => {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    input.tx = Math.max(-1, Math.min(1, (e.clientX - r.left) / r.width * 2 - 1));
    input.ty = Math.max(-1, Math.min(1, -((e.clientY - r.top) / r.height * 2 - 1)));
    input.lastMove = performance.now() / 1000;
  };
  hero.addEventListener('pointermove', onPointer, { passive: true });
  hero.addEventListener('pointerdown', onPointer, { passive: true });
  hero.addEventListener('pointerleave', () => { input.lastMove = -99; }, { passive: true });
  const pointerRecent = () => performance.now() / 1000 - input.lastMove < 4;

  /* ---------- sizing ---------- */
  // The poster is drawn with object-fit: cover. When the hero is wider than the poster, cover
  // crops top and bottom, so the field of view narrows to keep the scene framed like the poster.
  const posterImg = hero.querySelector('.hero__img');
  let portrait = false, W = 0, H = 0;
  function posterAspect() {
    if (posterImg && posterImg.naturalWidth && posterImg.naturalHeight) return posterImg.naturalWidth / posterImg.naturalHeight;
    return portrait ? 0.5 : 2912 / 1632;
  }
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h || (w === W && h === H)) return;
    W = w; H = h;
    const aspect = w / h;
    portrait = aspect < 1;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    const pa = posterAspect(), base = Math.tan(THREE.MathUtils.degToRad(22.5));
    const half = aspect > pa ? base * pa / aspect : base;
    camera.fov = THREE.MathUtils.radToDeg(Math.atan(half)) * 2;
    camera.aspect = aspect;
    camera.position.z = portrait ? 22 : 13.5;
    camera.updateProjectionMatrix();
    mat.uniforms.uScale.value = (h * PR * 0.5) / half * 0.045;
    points.position.set(portrait ? 0 : 1.8, portrait ? 2.0 : 0.75, 0);
    // homes fill what the camera sees at each depth, with a margin for the sway
    const D = camera.position.z, hh = half * 1.15, hw = half * aspect * 1.15;
    for (let i = 0, j = 0; i < N; i++, j += 3) {
      const z = hz[i], k = (D - z);
      home[j] = hu[i] * hw * k - points.position.x;
      home[j + 1] = hv[i] * hh * k - points.position.y + 0.4;
      home[j + 2] = z;
    }
  }
  resize();
  new ResizeObserver(resize).observe(canvas);
  if (posterImg) posterImg.addEventListener('load', () => { W = 0; resize(); });

  /* ---------- motion ---------- */
  const ray = new THREE.Raycaster(), zPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), M = new THREE.Vector3();
  // Cycle: the logo holds, then dissolves. Its particles drift out on a slow flow field until they
  // fill the space evenly, hang there like particles in a fluid, and then gather back into the logo.
  // Throughout, the camera follows the pointer and the pointer pushes particles aside.
  const HOLD = 9, DISPERSED = 9;
  let phase = 'hold', phaseT = 0, spread = 0;

  // A divergence-free 2D flow (from a stream function) plus a gentle depth wobble.
  function flow(x, y, t, out) {
    const a = 0.32 * x + 0.13 * t, b = 0.27 * y - 0.11 * t, c = 0.21 * (x + y) + 0.17 * t + 1.3;
    const cc = 0.126 * Math.cos(c);
    out[0] = -0.27 * Math.sin(a) * Math.sin(b) + cc;
    out[1] = -(0.32 * Math.cos(a) * Math.cos(b) + cc);
    out[2] = 0.3 * Math.sin(0.25 * x + 0.19 * y + 0.1 * t);
  }
  const fv = [0, 0, 0];

  function update(t, dt) {
    phaseT += dt;
    if (phase === 'hold' && phaseT > HOLD) { phase = 'out'; phaseT = 0; }
    else if (phase === 'out' && phaseT > DISPERSED) { phase = 'hold'; phaseT = 0; }
    const out = phase === 'out';
    spread += ((out && phaseT > 1 ? 1 : 0) - spread) * (1 - Math.exp(-dt * 1.2));
    bloom.strength = 0.7 - 0.35 * spread;

    const kp = 1 - Math.exp(-dt * 4.5);
    input.mx += (input.tx - input.mx) * kp; input.my += (input.ty - input.my) * kp;
    camera.position.x = input.mx * 2; camera.position.y = 0.4 + input.my * 1.3;
    camera.lookAt(points.position.x * 0.5, points.position.y * 0.5, 0);
    points.rotation.y = Math.sin(t * 0.12) * 0.3 + input.mx * 0.15;
    points.rotation.x = Math.sin(t * 0.09) * 0.06;
    points.updateMatrixWorld();

    let rx = 1e9, ry = 0, rz = 0;
    if (pointerRecent()) {
      input.ndc.set(input.mx, input.my); ray.setFromCamera(input.ndc, camera);
      if (ray.ray.intersectPlane(zPlane, M)) { points.worldToLocal(M); rx = M.x; ry = M.y; rz = M.z; }
    }

    const tgt = mark.pos;
    // Re-forming: stiffer springs and a higher speed limit for the first seconds, so the logo
    // gathers quickly, then the normal gentle springs take over.
    const reform = phase === 'hold' && phaseT < 2.5 && t > HOLD;
    const pull = reform ? 2.4 : 1, cap = reform ? 0.32 : 0.12;
    const f = Math.min(dt * 60, 2.5), dampLogo = Math.pow(0.9, f), dampFluid = Math.pow(0.985, f);
    for (let i = 0, j = 0; i < N; i++, j += 3) {
      const px = pos[j], py = pos[j + 1], pz = pos[j + 2];
      let ax, ay, az, damp;
      if (out && phaseT > delay[i]) {
        // carried by the flow, with a weak pull towards its even-spread home
        flow(px, py, t, fv);
        ax = (fv[0] * 0.014 - vel[j]) * 0.03 + (home[j] - px) * 0.0012;
        ay = (fv[1] * 0.014 - vel[j + 1]) * 0.03 + (home[j + 1] - py) * 0.0012;
        az = (fv[2] * 0.014 - vel[j + 2]) * 0.03 + (home[j + 2] - pz) * 0.0012;
        damp = dampFluid;
      } else {
        const k = kk[i] * pull;
        ax = (tgt[j] - px) * k + Math.sin(py * 2 + t) * 0.0005;
        ay = (tgt[j + 1] - py) * k + Math.sin(pz * 2 + t * 1.3) * 0.0005;
        az = (tgt[j + 2] - pz) * k;
        damp = dampLogo;
      }
      const dx = px - rx, dy = py - ry, dz = (pz - rz) * 0.5, d2 = dx * dx + dy * dy + dz * dz;
      if (d2 < 2.6) { const s = (2.6 - d2) * 0.03 / (Math.sqrt(d2) + 0.05); ax += dx * s; ay += dy * s; az += dz * s + 0.01; }
      let vx = (vel[j] + ax * f) * damp, vy = (vel[j + 1] + ay * f) * damp, vz = (vel[j + 2] + az * f) * damp;
      const sp2 = vx * vx + vy * vy + vz * vz;
      if (sp2 > cap * cap) { const s = cap / Math.sqrt(sp2); vx *= s; vy *= s; vz *= s; }
      vel[j] = vx; vel[j + 1] = vy; vel[j + 2] = vz;
      pos[j] = px + vx * f; pos[j + 1] = py + vy * f; pos[j + 2] = pz + vz * f;
    }
    posAttr.needsUpdate = true;
  }

  /* ---------- loop: runs only while the hero is on screen and the tab is visible ---------- */
  let raf = 0, last = 0, t = 0, onScreen = true, shown = false, dead = false;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    t += dt;
    try {
      update(t, dt);
      composer.render(dt);
    } catch (e) {
      stop();
      return;
    }
    if (!shown) { shown = true; requestAnimationFrame(() => canvas.classList.add('is-on')); }
  }
  function run() {
    const want = !dead && onScreen && !document.hidden;
    if (want && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
    else if (!want && raf) { cancelAnimationFrame(raf); raf = 0; }
  }
  function stop() {
    dead = true; run();
    canvas.classList.remove('is-on');
  }
  new IntersectionObserver((entries) => {
    onScreen = entries[entries.length - 1].isIntersecting; run();
  }).observe(hero);
  document.addEventListener('visibilitychange', run);
  motionQuery.addEventListener('change', () => { if (motionQuery.matches) stop(); });
  canvas.addEventListener('webglcontextlost', stop);
  run();
}
