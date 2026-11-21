# Press Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Press page (Swedish + English) that lists press releases, plus the first release page (HÄR AR launch), in the approved style C.

**Architecture:** Plain static HTML pages on the existing `assets/site.css`, with new press styles appended to it and one small script `assets/press.js` that assembles the hidden email and phone. No build system; verification runs in the browser preview (`site` config, http://localhost:8123) with JavaScript assertions.

**Tech Stack:** HTML, CSS, vanilla JS, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-11-20-press-page-design.md`. Visual reference: `drafts/press/index-c.html`, `drafts/press/release-c.html` (approved release design and text), `drafts/press/contact-reveal.js` (local, untracked, never committed).

## Global Constraints

- Branch `feat/2026-11-20-press-page` from `origin/main`. Leave the user's uncommitted `CLAUDE.md` edit and untracked `docs/`, `HANDOVER-*` files alone; stage only files this plan names.
- Swedish at root, English under `en/`; every page has `hreflang` sv/en/x-default links and the head block (favicons, fonts, `js` class script, `assets/nav.js`) exactly as `about.html` has it.
- Releases are Swedish only. `en/press.html` lists them with the label "In Swedish".
- Colors only from existing tokens in `site.css` (`--ss-amber #ECB200`, `--ss-navy`, `--ss-offwhite`, `--ss-black`, `--ss-hairline`, ink/paper opacities). Add `--ss-offwhite-50: #F7F8F9` to `:root`.
- Design-system rules: no box shadows, cards = off-white-50 fill + 1px `--ss-hairline` border + 16px radius; buttons radius 10px; Space Mono uppercase labels instead of icons; container max 1180px; section padding `clamp(72px, 9vw, 128px)`; motion 120–200ms `var(--ease-standard)`.
- Press contact: "Markus Eriksson", "Grundare, ShiftSpace", phone shown in national format with a `tel:` link in international format; email is the press alias. Neither the phone digits nor the email may appear in any HTML file or Markdown file: the phone is stored reversed in a data attribute and the email split into user and domain data attributes (see the page source). No-JS text: "Visa telefonnummer" / "Visa e-postadress" (EN: "Show phone number" / "Show email address").
- Release URL: `press/2026-11-har-ar-lansering.html`. Never rename after merge.
- Nav order on every main page, both languages: Projekt, Om oss, Press, Kontakt (EN: Work, About, Press, Contact).
- No dead links: media-bank items and the press-kit button whose files are not supplied yet render as non-links with meta "Kommer" / "Coming soon" (button disabled-styled, `aria-disabled="true"`).
- Do not push or merge without Markus's yes.

## Review Focus

1. JavaScript off: contact cells show the no-JS text and the page still has a working contact route (the "Kontakt" nav link). → Task 1 check.
2. Phone or email leaking into raw HTML (e.g. in a `<noscript>`, comment, `title` or meta). → grep check in Task 4.
3. Phone width (375px): contact panel stacks without horizontal scroll; full-width release card stacks image above text. → Task 2 and 3 checks.
4. Second release added later: two cards sit side by side, the `:only-child` full-width rule no longer applies. → Task 2 check (temporary clone in the console).
5. Mobile menu: the new "Press" link appears in the hamburger panel on every page, and the amber hero keeps the panel readable. → Task 4 check.

---

### Task 1: Press styles and contact script

**Files:**
- Create: `assets/press.js`
- Modify: `assets/site.css` (append a `/* ---------- Press ---------- */` section; add `--ss-offwhite-50` to `:root`)

**Interfaces:**
- Produces CSS classes (names fixed, used by Tasks 2–3): `.press-hero`, `.press-hero__inner`, `.press-hero__title`, `.press-hero__lead`, `.btn-primary`, `.btn-primary[aria-disabled="true"]`, `.press-contact`, `.press-contact__cell`, `.press-contact__label`, `.press-contact__value`, `.press-contact__sub`, `.press-news`, `.press-news__grid`, `.release-card` (+ `__img`, `__body`, `__date`, `__title`, `__lede`, `__more`), `.press-band`, `.press-dl` (+ `--soon`), `.wrap`, `.release` (article page: `__col`, `__back`, `__lede`, `__hero`, `__dateline`, `__quote`, `__imgs`, `__h2`).
- Produces `assets/press.js`: on load, every `[data-mail-user][data-mail-domain]` gets `href="mailto:<user>@<domain>"` and its `[data-mail-text]` child (or itself) the address; every `[data-tel-r]` gets `href="tel:<reversed value>"` and its `[data-tel-text]` child (or itself) the Swedish display form `0XX-XXX XX XX`. Behaviour identical to `drafts/press/contact-reveal.js`.

- [ ] **Step 1:** Port the styles from the `<style>` block of `drafts/press/index-c.html` and the release rules from `drafts/press/draft.css` into `site.css` under the class names above. The hero's nav colours are scoped to `.press-hero .site-nav`. Drop the release page's `blockquote` left border in favour of an amber 2px top rule (design system forbids left-border cards).
- [ ] **Step 2:** Create `assets/press.js` from `drafts/press/contact-reveal.js`, loaded with `defer`.
- [ ] **Step 3: Verify** (after Task 2 exists): in the preview run
  `[...document.querySelectorAll('[data-tel-r],[data-mail-user]')].map(e=>e.getAttribute('href'))`
  Expected: a `tel:` link with the international number and a `mailto:` link with the press alias. Then disable JS (devtools or `navigate` to the page with scripts blocked via `fetch(location.href).then(r=>r.text())`) and confirm the raw HTML contains "Visa telefonnummer" and neither the phone number in any format nor the email address.
- [ ] **Step 4: Commit** `assets/site.css assets/press.js` — "Add press page styles and contact reveal script".

### Task 2: Swedish Press page

**Files:**
- Create: `press.html`

**Interfaces:**
- Consumes: Task 1 classes and `assets/press.js`.
- Produces: `press.html`, linked as `press.html` from the nav (Task 4) and as `../press.html` from release pages.

- [ ] **Step 1:** Build `press.html` from `drafts/press/index-c.html` with real site paths (`assets/...`), `body.theme-light`, the real header (with `nav-toggle` button, `id="site-nav"`, `aria-current="page"` on Press, EN switch to `en/press.html`), the hreflang trio, title "Press — ShiftSpace", meta description "Pressmeddelanden, bilder och kontakt för media från ShiftSpace." No draft bar.
- [ ] **Step 2:** Content: kicker "Pressrum", h1 "Press.", lead "Pressmeddelanden, bilder och kontakt för media. Allt material får användas fritt i redaktionellt syfte.", press-kit button (Kommer state until a file exists), contact panel (Mediakontakt / Telefon / E-post per Global Constraints), "Senaste nytt." with one release card linking `press/2026-11-har-ar-lansering.html` (image `assets/harar-hero-1280.{avif,webp}` / `harar-hero-1920.jpg` in a `<picture>`, date "24 nov 2026 · Pressmeddelande" — confirm the date with Markus, headline and lede as in the draft), navy band with "Om ShiftSpace" text from the draft and media bank (Logotyper, Pressbilder HÄR AR) in the Kommer state.
- [ ] **Step 3: Verify:** preview `http://localhost:8123/press.html` at desktop and `resize_window` mobile: no console errors, `document.documentElement.scrollWidth <= innerWidth`, release card is full width; then in the console clone the card into the grid and confirm two columns side by side (`getComputedStyle(grid).gridTemplateColumns` has 2+ tracks and the first card's `grid-column` is not `1 / -1`). Screenshot both widths.
- [ ] **Step 4: Commit** `press.html` — "Add Swedish press page".

### Task 3: First release page

**Files:**
- Create: `press/2026-11-har-ar-lansering.html`

**Interfaces:**
- Consumes: Task 1 `.release*` classes and `assets/press.js` (paths `../assets/...`).

Sources (handed over 2026-11-20 by the "HÄR AR press release on shiftspace.se" session): `HANDOVER-harar-pressmeddelande.md` (repo root, untracked, never commit), its sections 3–7; text from `C:\Unity\ARCalendar_Graf-press\docs\press\00-pressmeddelande.md` under `## Pressmeddelande` (lines starting `>` are image slots, not text); approved look `drafts/harar-press/preview.html` tab "Pressmeddelande D1" (untracked, never commit).

- [ ] **Step 1:** Build from `drafts/press/release-c.html` (layout and text exactly as approved; drop the draft bar, the `contenteditable` attributes and the yellow `.ph` styling, but keep remaining placeholders visible as a publishing gate): `body.theme-light`, real header (Press `aria-current`), hreflang sv/x-default pointing to this page and en to `en/press.html` (no English release), canonical link, EN switch to `../en/press.html`. "← Alla pressmeddelanden" to `../press.html`. Headline, lede, hero image, dateline with the **actual publish date**, body, three app screens, Om HÄR Handel & Möten, Om ShiftSpace, sidebar panels Fakta (incl. Om HÄR AR) / Material (PDF, images, campaign page `../harar/`) / Presskontakt with the hidden phone and email. **No quote** (decision 2026-11-17). **No B3 portrait.**
- [ ] **Step 2:** Images: hero = B1 render (`C:\Unity\ARCalendar_Graf\Marketing\PressKit\04-bilder\04-bred-vy.jpg`; reuse `assets/harar/hero-wide-*` if identical), to be swapped for a Graf photo later; B5 screens `C:\Unity\ARCalendar_Graf\Marketing\AppStore\iPhone-6.9\{01_ComingSoon,03_Gift,04_DeerCorner}.png` converted to web sizes under `assets/harar/press/`; App Store / Google Play badges (`assets/harar/appstore-badge-sv.svg`, `googleplay-badge-sv.svg`) linking https://apps.apple.com/se/app/h%C3%A4r-ar/id6822637033 and https://play.google.com/store/apps/details?id=com.shiftspace.harar.
- [ ] **Step 3:** Facts: Graf-gallerian, Storgatan 31, Härnösand; hours weekdays 10–18, Sat 10–16, Sun 12–16, julafton 10–13. Always write "Graf", never "GRAF" (Markus 2026-11-20). Never claim "no data collected" (keep "camera images are not stored or sent"). No new tracking or third-party scripts.
- [ ] **Step 4:** Print stylesheet (`@media print` in `site.css`, scoped to `.release`): one A4 page, header/nav/footer/back link hidden. Save the PDF from the browser as `press/2026-11-har-ar-lansering.pdf`, commit it beside the page, and link it from the PDF row.
- [ ] **Step 5: Publishing gate.** The page may be built and committed with placeholders, but not merged until each has real text: Dag X closing scene and how long the scene stays (press kit says 1 March, unconfirmed), the marker's exact spot in Graf, juldagen/annandagen/nyår hours, the "Om HÄR" line HÄR confirms, image captions. Until then the Press page card for it stays out of `main`.
- [ ] **Step 6:** Add `press.html` and the release to the sitemap if the repo has one (create none otherwise).
- [ ] **Step 7: Verify:** preview the page at 375px and 1280px: no console errors, no horizontal scroll, back link resolves, phone/email links as in Task 1 Step 3; print preview fits one A4 page. Screenshot.
- [ ] **Step 4: Commit** — "Add HÄR AR launch press release page".

### Task 4: English Press page, nav links, campaign link, docs

**Files:**
- Create: `en/press.html`
- Modify: nav in `index.html`, `work.html`, `about.html`, `contact.html`, `work/*.html` (5 files), and the same in `en/` (`index.html`, `work.html`, `about.html`, `contact.html`, `en/work/*.html`); `harar/index.html` (the "Senaste pressmeddelande" slot links to `../press/2026-11-har-ar-lansering.html`); `CLAUDE.md` (only the lines below, without touching Markus's uncommitted edit — stage with `git add -p`).

- [ ] **Step 1:** `en/press.html`: English mirror of `press.html` (kicker "Press room", h1 "Press.", lead "Press releases, images and media contact. All material may be used freely for editorial purposes.", "Latest news.", card meta "24 Nov 2026 · Press release · In Swedish", button "Download press kit", band "About ShiftSpace" / "Media bank"), card links to `../press/2026-11-har-ar-lansering.html`, SV switch to `../press.html`.
- [ ] **Step 2:** Insert the Press nav link between Om oss/About and Kontakt/Contact on every listed page (relative paths per folder depth).
- [ ] **Step 3:** CLAUDE.md: add the Press pages to Main pages, `assets/press.js` to the Project Overview script list, and change "The site deliberately prints no email address" to say the Press pages are the one exception (the press email alias, assembled by `assets/press.js`).
- [ ] **Step 4: Verify:** grepping the whole tree for the phone number (any format) and the email address returns nothing outside `drafts/` and the press data attributes. Open every changed page in the preview, confirm the Press link resolves and is in the mobile menu panel (mobile preset, open the hamburger on `press.html` and one other page). Screenshot.
- [ ] **Step 5: Commit** — "Link the press page from the nav and campaign page".

### Task 5: Finish

- [ ] Run the Review Focus checks once more on `press.html`, then ask Markus before pushing and opening a PR to `main`. Tasker card "Press page with separate press release pages" stays in In progress until merged (Done when: merged).
