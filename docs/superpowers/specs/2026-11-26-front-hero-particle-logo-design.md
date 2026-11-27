# Front-page hero: the ShiftSpace mark as a 3D particle volume

Status: implemented · 2026-11-27 (see "Built differently" at the end)

## Intent

Replace the smoke-ribbon image in the front-page hero (`index.html`, `en/index.html`) with a live 3D scene. Visitors who aren't technical, and who mostly see ordinary big-brand sites, should come away with "this studio can build anything" and a "hey, come look at this" moment. The scene should show real depth, not a flat picture, and it should be something you can stand and watch: it reacts to the mouse, but it isn't a game.

The scene: the exact ShiftSpace mark (the S, from `logo-yellow.png`) built from tens of thousands of glowing amber particles. The core of the logo is a thin, sharp slab. Around it, particles spread in front of and behind it and fade with distance, so the mark reads as a glowing volume. Every few seconds the logo bursts into a drifting 3D cloud and pulls itself back together. The mouse pushes particles aside, and they flow back.

The prototype that Markus approved is in [2026-11-26-front-hero-particle-logo-prototype.html](2026-11-26-front-hero-particle-logo-prototype.html) (concept "03 Swarm"; the other three concepts in that file are parked). The parameters in this document come from that prototype.

## Goals

- The exact mark, recognizable at a glance, in brand amber on near-black (`#090D16`).
- Visible depth: a sharp logo core plus particles spread along the depth axis. The camera shifts with the mouse, so the layers move against each other.
- A loop worth watching: the logo holds about 8 seconds, scatters into a cloud for about 4.5 seconds, and re-forms.
- The mouse (or a finger dragged across the screen) pushes particles aside, and they flow back into shape.
- The page appears as fast as it does today. The 3D comes in on top of a still image, never in place of one.
- Both language pages behave the same.

## Non-goals

- The other concepts (Portal, Seam, Lifted Place) and the other Swarm shapes (Stortorget, Stockholm skyline, phone, fox, paper-plane flock). They are parked.
- A build system or package manager. The site stays plain HTML, CSS and JS.
- Sound, analytics, or any interaction beyond pushing particles.

## Anti-goals (failure even if it "works")

- The page appears later than today, or jumps when the 3D loads.
- The headline becomes hard to read.
- Phones get hot, drain their batteries or stutter.
- It looks like a generic particle screensaver. The exact mark is the point.

## Constraints

- Static site on GitHub Pages; no build step. Brand tokens, Montserrat, the header lockup and the headline stay as they are (CLAUDE.md).
- The hero and footer currently fit exactly one landscape screen, and the front page doesn't scroll (`.front` in `assets/site.css`).
- Changes to one language must be mirrored in the other.
- Motion on the rest of the site is limited to 120–200 ms color transitions. The hero is the deliberate exception and must respect `prefers-reduced-motion`.

## Approaches considered

1. **Particle simulation on the CPU, as in the prototype (chosen).** About 34k particles on desktop and 16k on small screens, with spring physics in plain JS and rendering as additive point sprites with bloom. It's simple and proven in the prototype, with no shader-based simulation. The cost is main-thread CPU, a few milliseconds per frame on desktop.
2. **Simulation on the GPU (GPGPU).** This allows 200k+ particles and a sharper, denser logo with an idle CPU. It's more complex: render-target ping-pong and harder debugging. It's a good later upgrade if the CPU version runs heavy on phones, and the shape and behavior stay the same.
3. **Pre-rendered video loop.** Light and safe, but the scene can't react to the mouse and has no real depth, which goes against the brief.

## Design

### Page structure

- Keep the existing `<picture>` hero, swapping the smoke images for a **poster**: a still frame rendered from the scene with the logo fully formed, at the current sizes (1280/1920/2912, AVIF + WebP + JPG). It stays the LCP image, so the first paint matches today's.
- Add a `<canvas class="hero__canvas">` inside `.hero`, layered over the poster and under the scrims, header and headline, with `aria-hidden="true"`. It starts at `opacity: 0` and fades in (about 600 ms) after the first frame has rendered.
- The scrims, header, headline and footer are unchanged.

### Script

- New module `assets/hero-particles.js`, loaded with `<script type="module">` on both front pages.
- three.js r160 is **self-hosted** under `assets/vendor/three/`: core `three.module.min.js` plus the post-processing files bloom needs (`EffectComposer`, `RenderPass`, `ShaderPass`, `MaskPass`, `Pass`, `UnrealBloomPass`, `OutputPass`, `CopyShader`, `LuminosityHighPassShader`, `OutputShader`). An import map in the page maps `three` and `three/addons/`. (My call: self-hosting avoids a third-party CDN request and pins the version.)
- The module starts only when all of these hold: WebGL is available, `prefers-reduced-motion` is not set, `navigator.connection.saveData` is not set, and the hero is on screen. Otherwise the poster stays and nothing else loads.

### The scene (parameters from the prototype)

- **Shape source:** a small mark image, `assets/hero-mark.png`, scaled down from `logo-yellow.png` to about 420 px wide and sampled at runtime. Opaque pixels are collected; 30% of samples come from edge pixels for a crisp outline.
- **Particles:** 34k on desktop, 16k when the shorter screen side is under 700 px. Pixel ratio is capped at 1.75 on desktop and 1.5 on small screens.
  - 60% form the core: a slab 0.48 units deep (z ±0.24), in amber with about 8% off-white and 3% bright sparks.
  - 40% form the depth halo: z drawn from a normal distribution with σ = 1.3; xy jitter grows with |z| (σ = 0.18·|z|); brightness falls off as `exp(-0.75·|z|)`.
  - The logo is 7.6 units wide. Camera: FOV 45°, z = 13.5 (22 in portrait).
- **Motion:**
  - *Forming:* each particle springs toward its target with its own stiffness (0.014–0.04) and damping of 0.9 per frame.
  - *Scattering:* every particle gets an outward kick from the logo's center. It then drifts toward its own fixed spot in a cloud about 5.2 × 3.2 × 3.2 units, with gentle noise and a slow swirl. Damping is 0.95 and speed is capped.
  - *Cycle:* hold the logo 8 s, scatter 4.5 s, re-form, repeat. On load, particles start as a small cloud at the center and form the logo.
  - All motion is frame-rate independent, scaled by `dt` and clamped.
- **Mouse and touch:** pointer events, with `touch-action: pan-y` on the canvas so that vertical page scrolling still works on phones. The pointer is projected onto the logo plane. Particles within about 1.6 units are pushed away and flow back. The camera follows the pointer slightly (±2 units sideways, ±1.3 up and down), and the logo sways slowly, which shows the depth.
- **Look:** additive soft-dot sprites. Bloom (UnrealBloom) at strength 0.7, radius 0.5, threshold 0.35; ACES tone mapping; output via `OutputPass`. A faint layer of background dust adds depth.
- **Placement:** on landscape screens the logo sits right of center and slightly high, clear of the bottom-left headline. In portrait it's centered in the upper part of the screen, above the headline (which sits at 66.67%).

### Behavior and robustness

- Rendering pauses when the hero leaves the viewport (IntersectionObserver) or the tab is hidden.
- On resize, the canvas is resized and the camera updated; particle positions are not rebuilt.
- If anything fails (no WebGL, a module that won't load, an exception), the canvas stays hidden and the poster remains.

### Both languages

`index.html` and `en/index.html` get the same markup change. The module, the vendor files and the poster are shared, and the paths in `en/` are prefixed with `../`.

### Cleanup

The `hero-smoke-ribbon-*` images are removed, since git keeps them. The prototype file stays in `docs/` as the reference.

## Testing

- Desktop Chrome, Firefox and Safari, and a real phone (iOS and Android): the logo forms, scatters and re-forms; the pointer or finger pushes particles; the headline stays readable.
- `prefers-reduced-motion` on: poster only, no canvas, no three.js requests.
- WebGL disabled: poster only, no errors.
- Lighthouse on the front page before and after: LCP and CLS no worse than today.
- Both language pages.

## Left to the builder

- The exact poster composition: take it from a rendered frame at 1920×1080 with the logo formed.
- Minor tuning of brightness and bloom on real screens, staying within the look of the prototype.

## Decided by Markus

- Concept: the Swarm, cut to the logo only. No paper planes; the logo scatters into dots and re-forms.
- The mouse pushes particles aside.
- More depth around the flat logo.
- Real-world shapes (square, skyline, phone, fox) are parked; drawn and video-based versions weren't good enough.

## Open question for Markus

- **Scroll.** The prototype scatters the logo when you scroll, but the front page doesn't scroll today, since the hero and footer fit one screen. Either keep the page as it is, so the logo scatters on its own timer and the mouse pushes particles (my pick), or add scroll room below the hero so scrolling drives the scatter.

## Built differently (2026-11-27)

- **No scatter (Markus, 2026-11-27):** the logo never dissolves into a cloud. It always holds its shape, sways slowly, the camera follows the pointer, and the pointer pushes particles aside, after which they spring back. The hold/scatter cycle, the cloud and the scroll input from the prototype are gone, which also settles the open scroll question.
- **Start state:** the particles start on the formed logo, not as a small cloud at the centre. The canvas fades in over a poster of the same frame, so a cloud start would make the logo vanish and rebuild the moment the 3D loads. That is the "jumps when the 3D loads" anti-goal.
- **Portrait poster:** a separate 1:2 poster (`hero-poster-portrait-{720,1080,1440}`) for portrait screens. The landscape poster, cropped by `object-fit: cover`, would cut the off-centre logo in half on phones. It is rendered with the phone particle count (16k).
- **Framing matches the poster:** when the hero is wider than the poster, the camera's field of view narrows the way `object-fit: cover` crops. Poster and live frame then line up at any size.
- **Placement:** the logo sits slightly further right and up than in the prototype (landscape x 1.8, y 0.75; portrait y 2.0), so it stays clear of the headline.
- **Particle colours are fixed**, and the paper-plane shader path is removed (both were unused once the scope was cut to the logo).
