# Paper Plane Flock — Web build handover

A Unity 6 (WebGL) build of an animated paper-plane flock, meant to be embedded as a **box on a
page**: a header, a paragraph, then this. It is not a game and has no UI, no audio and no
scenes to navigate — it draws a thousand paper planes flocking in a contained volume, and
they shy away from the mouse pointer.

This document is for whoever builds the host page. It is written to be read cold, by a person
or by an agent with no access to the Unity project.

---

## 1. What you receive

The build output directory. Everything in it is required and the relative layout must be kept:

```
Web/                                    ~11 MB total
├── index.html                          # Unity's stock page — REFERENCE ONLY, don't ship it (§3)
├── test-page.html                      # working reference embed: sized box, pause-when-offscreen,
│                                       # wheel fix, live perf readout. Start here.
├── Build/
│   ├── Web.loader.js            110 KB # the only file you reference directly
│   ├── Web.framework.js.unityweb  78 KB
│   ├── Web.data.unityweb        4.3 MB # scene, meshes, shaders
│   └── Web.wasm.unityweb        6.1 MB # the engine and game code
└── TemplateData/                       # art for Unity's own index.html; drop it if you write your own
```

`.unityweb` files are **Brotli-compressed**. See §4 — it matters for how you serve them.

Those four files are what the loader fetches, and the snippet below gives it their paths
explicitly, so you can put the folder wherever you like as long as the URLs match.

## 2. Runtime requirements

- **WebGL2.** There is no WebGL1 fallback — feature-detect and show a static image instead (§7).
- **A browser with the modern WebAssembly feature set: Chrome 91+, Firefox 89+, Safari 16.4+.**
  The build is compiled with WebAssembly 2023 enabled, which is what lets the flocking simulation
  run as Burst-compiled SIMD code rather than three times slower. Every current browser qualifies,
  but a genuinely old one will fail to start rather than run slowly, so the same static-image
  fallback covers it.
- **No cross-origin isolation needed.** The build has no threads or SharedArrayBuffer, so you do
  **not** need COOP/COEP headers.
- **No backend.** It is fully static; a CDN or any static host serves it.

## 3. Embedding it

Ignore the shipped `index.html`. It is Unity's stock page — a fixed 960×600 canvas with a loading
bar, a footer and a fullscreen button — and it exists only so you can see the build working.
Write your own container instead:

```html
<div id="flock-box" style="position:relative; width:100%; aspect-ratio:16/9;">
  <canvas id="flock-canvas" style="width:100%; height:100%; display:block;"></canvas>
</div>

<script src="/flock/Build/Web.loader.js"></script>
<script>
  createUnityInstance(document.querySelector("#flock-canvas"), {
    dataUrl:      "/flock/Build/Web.data.unityweb",
    frameworkUrl: "/flock/Build/Web.framework.js.unityweb",
    codeUrl:      "/flock/Build/Web.wasm.unityweb",
    streamingAssetsUrl: "StreamingAssets",
    companyName: "DefaultCompany",
    productName: "Planes",
    productVersion: "0.1.0",
    // Caps render resolution on retina screens. Worth keeping for memory and GPU headroom,
    // but do not expect frames from it — this build is CPU-bound, see §8.
    devicePixelRatio: Math.min(window.devicePixelRatio, 1.5),
  }, (progress) => {
    // 0..1 — drive your own loading indicator with this.
  }).then((unityInstance) => {
    window.flock = unityInstance;   // keep it: §5 needs it
  });
</script>
```

**Sizing.** Unity keeps the drawing buffer matched to the canvas element's CSS size, so you size
the canvas with CSS and resizing "just works" — including when the container changes shape for
reasons Unity never sees (a CSS transition, a dragged splitter, a phone's URL bar sliding away).
Do not set the canvas `width`/`height` attributes yourself.

**Shape.** The flock is a wide volume. The camera auto-adjusts and will pull back to fit a
squarer box, but it stops pulling back at a point — past that the outermost planes are cropped
rather than letting the whole flock shrink to specks. Practical guidance:

| Box aspect | Result |
|---|---|
| 16:9 or wider | Framed as authored. Best. |
| 4:3 | Camera pulls back slightly; all planes visible. |
| 1:1 | Pulls back further; flock reads smaller. |
| Portrait (taller than wide) | Outer planes crop. Works, but not the intended shot. |

On phones prefer a landscape-ish box (16:9 or 3:2) over a tall one.

## 4. Serving it

The payload is Brotli-compressed. Two ways to serve it, and **both work**:

1. **Preferred — the host sets the header.** Serve each `.unityweb` file with
   `Content-Encoding: br` and the underlying type (`application/wasm` for `Web.wasm.unityweb`,
   `application/javascript` for `Web.framework.js.unityweb`, `application/octet-stream` for
   `Web.data.unityweb`). The browser decompresses natively; startup is fastest.
2. **Fallback — do nothing.** The build has Unity's *decompression fallback* enabled, so if those
   headers are missing the loader unpacks the files in JavaScript instead. Slower to start, but it
   means a plain static server with no configuration works.

So it will run wherever you put it; configuring the headers just makes it start quicker. Netlify,
Vercel and Cloudflare Pages can all do (1) with a headers rule.

**Caching:** browser caching of the build is left to you — Unity's own IndexedDB cache is
deliberately **off**, because it is keyed by URL and would serve a stale build to a returning
visitor after a redeploy to the same filenames. Cache-bust by path or query string when you
publish a new build.

## 5. Controlling it from the page

The build exposes a tiny control surface. Call it through the instance from §3:

```js
window.flock.SendMessage("Flock", "SetPaused", 1);           // 1 = freeze, 0 = resume
window.flock.SendMessage("Flock", "SetTargetFrameRate", 30); // 0 or less = browser default
window.flock.SendMessage("Flock", "SetLogging", 1);          // 1 = print perf to the console
```

`"Flock"` is the name of the GameObject the methods live on. It is fixed; don't change it on your
side. **Keep the instance somewhere reachable** — `window.flock = unityInstance` in the loader's
`.then()`, as in §3 — or you have no way to call any of this, including from the dev console.

- **`SetPaused`** freezes the simulation but leaves the flock drawn on screen — it holds still
  rather than disappearing.
- **`SetTargetFrameRate`** caps the frame rate. 30 roughly halves the cost and is genuinely hard
  to notice on a flock that drifts this slowly. A good default on a content page.

- **`SetLogging`** turns on two console probes so you can measure on a real device without a
  rebuild: `[FlockTimings] sim=… draw=… @ N planes` (milliseconds of work behind each frame) and
  `[FpsProbe] … fps` (frames actually delivered). Read both — a browser caps delivered frames at
  the display refresh, so fps alone can't tell you how much headroom is left.

  It also prints `[FlockDiagnostics] burst=ON`. If that ever says `OFF`, the simulation is running
  un-compiled and about three times slower — report it rather than working around it, because it
  means something regressed in how the build was made, not in your page.

  To show those numbers in your own page (the only practical way to read them on a phone), wrap
  `console.log` and parse the lines. Unity's loader **ignores `print`/`printErr` passed in its
  config** — it installs its own handler that writes to the console — so hooking the console is
  the only thing that works. `test-page.html` in this directory does exactly that; lift the
  twelve lines from it.

**You should pause when the box is off screen.** A hidden browser tab stops getting animation
frames on its own, but a canvas that has merely scrolled out of view does not, and it will keep
burning battery on a flock nobody can see:

```js
new IntersectionObserver(([entry]) => {
  window.flock?.SendMessage("Flock", "SetPaused", entry.isIntersecting ? 0 : 1);
}).observe(document.querySelector("#flock-box"));
```

## 6. Input behaviour

The planes shy away from the pointer — a cone under the cursor that the flock parts around. It
works with mouse and with touch (touch requires a press, so a lifted finger stops repelling).

The canvas handles input **only while the pointer is over it**; the rest of the page behaves
normally. But note:

- **The canvas WILL trap your page's scroll, and you must fix it.** This is confirmed, not a
  theoretical risk: with the pointer over the flock, the page stops scrolling entirely. The app
  never reads the wheel — Unity's canvas swallows it regardless. One line on the container fixes
  it, and the page scrolls normally again:

  ```js
  box.addEventListener("wheel", e => e.stopPropagation(), { capture: true, passive: true });
  ```

  Capture phase, so it runs before Unity's listener on the canvas; no `preventDefault`, so the
  browser still scrolls. Verified working in `test-page.html`.
- **Keyboard is unused.** Nothing reads keys, but if focus lands in the canvas some keys may not
  reach the page. If that matters, keep the canvas out of the tab order.

## 7. Fallbacks and accessibility

- **No WebGL2:** the loader will fail. Detect up front
  (`document.createElement("canvas").getContext("webgl2")`) and render a static image instead of
  attempting to load ~10 MB that cannot run.
- **`prefers-reduced-motion`:** this is a large, permanently moving animation. Respect the media
  query — show a still image, or load it paused, for readers who ask for reduced motion.
- **Slow connections / data saver:** consider gating the load behind a click ("Show the flock")
  rather than downloading it automatically.
- It is decorative: give the container `aria-hidden="true"` unless you present it as content, in
  which case describe it in adjacent text.

## 8. Measured cost — read this before sizing anything

The shipped scene runs **1000 planes at a steady 60 fps** on a desktop browser — confirmed by
watching it, and the reason the count is 1000 rather than lower.

The nearest full instrumented reading was taken at 850 planes on the same build settings:

```
[FlockTimings] sim=3.6–7.6 ms (median ~6.5)   draw=0.04 ms   @ 850 planes
[FpsProbe]     60 fps                          canvas 1233×694
```

Simulation cost scales worse than linearly with plane count — more planes means more neighbours
*each* — so expect roughly 9 ms at 1000, still inside the 16.7 ms budget for 60 fps. That is an
extrapolation; `test-page.html` will give you the real figure on your hardware in ten seconds.

**Re-measure on your target devices.** These are desktop numbers and a phone will be slower. The
test page discards samples taken while the tab is hidden or throttled, so what it shows you is
trustworthy in a way raw console lines are not.

**It is CPU-bound on the flocking simulation, not on pixels.** Drawing costs 0.05 ms — about one
five-hundredth of the simulation. Two consequences for the host page:

- **Box size and `devicePixelRatio` barely matter for speed.** Halving either will not buy you
  frames. Choose them for how the thing looks, not for performance.
- **There is headroom now, but phones have less of it.** WebGL builds have no worker threads, so
  the whole flock is stepped on the main thread. Roughly 9 ms of a 16.7 ms budget holds 60 fps on a
  desktop with room to spare; a phone has less, so keep `SetTargetFrameRate(30)` in
  reach.

What actually helps, in order: **fewer planes** (the dominant lever — cost grows faster than
linearly with count), then **capping the frame rate** (`SetTargetFrameRate(30)` gives a 33 ms
budget, useful headroom on weaker devices), then a smaller perception radius. Pausing off-screen
(§5) is worth doing regardless, since this is main-thread time taken from the rest of your page.
budget, which the current 22 ms fits comfortably, and turns a fluctuating 32–42 fps into a steady
30); then **fewer planes or a smaller perception radius**, both of which need a new build from the
Unity project. Pausing off-screen (§5) is worth doing regardless, since this is 22 ms of main
thread per frame taken from the rest of your page.

## 9. Known limits

- **Plane count, colours and flight behaviour are baked in at build time.** There is no runtime
  API for them beyond pause and frame rate. If you need a different look, a lower plane count for
  mobile, or a different palette, that is a change in the Unity project and a new build — ask for
  one rather than trying to patch it from the page.
- **No mobile-specific build.** The same payload runs everywhere. If it proves heavy on phones,
  the answer is a second build with a lower plane count, chosen by the page.
- **The camera framing is automatic but bounded** — see the aspect table in §3.

## 10. Provenance

- Packaged **2026-09-04**. 1000 planes, ShiftSpace palette (amber planes on deep indigo).
- Unity **6000.4.0f1**, Universal Render Pipeline, IL2CPP → WebAssembly. ~11 MB compressed.
- Managed stripping **High**, IL2CPP code generation **size**, Brotli + decompression fallback,
  **WebAssembly 2023 on** (required — see §2, and the Burst note in §5).
- Verified in a browser after building: flock renders, pointer avoidance works, `SetPaused` and
  `SetTargetFrameRate` both take effect. Console is clean apart from URP's usual "shader not
  supported" notices for unused internal shaders (`HDRDebugView`, FSR upscaling), which appear
  in any build of this project and do not affect it.
- Built from the `Planes` project; rebuild with `Build ▸ Build Web` in the Editor, or headless:
  `unity build <project> --target WebGL --execute-method WebBuilder.PerformBuild`.
- Report problems against that project — this directory is generated output and hand-editing it
  will be overwritten by the next build.
