# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ShiftSpace is a static marketing site hosted on GitHub Pages at `www.shiftspace.se`. There is no build system or package manager: plain HTML pages, one shared stylesheet (`assets/site.css`), a script for the mobile menu (`assets/nav.js`: a hamburger menu below 720px, active only when an inline script in the head adds a `js` class), a script for the contact form (`assets/contact.js`), and a script for the Press pages (`assets/press.js`: assembles the press email and phone number so they never appear in the HTML).

## Development

Run the `site` config in `.claude/launch.json` (`npx http-server . -p 8123`), or open the HTML files directly in a browser.

## Architecture

**Languages:** Swedish is the default, at the root. English lives under `en/`, with the same file names. Each page has `hreflang` alternate links and an SV/EN switch in the nav that goes to the same page in the other language. Changes to one language must be mirrored in the other. The privacy policy is the exception: `privacy.html` (English) and `privacy-sv.html` (Swedish) both sit at the root and link to each other.

**Main pages** (in both languages) all use `assets/site.css`:
- `index.html`: front page with a full-bleed hero (`assets/hero-smoke-ribbon-*.{avif,webp,jpg}`)
- `work.html`: 2-column project grid. Projects (ARView, HÄR-torget, HÄR AR) come first; experiments (Planes, Agentic OS) sit in an ink-wash cell (`section.work-exp`) in the free grid slot after them. One experiment fills the cell at full size; two stack inside it as half-height cards (`.card--small`), as Planes and Agentic OS do now. An agreed but not yet built next step: more experiments go in an ink-wash band below, joined to the cell as one L-shaped background, using the same half-height wide cards two per row. All cards share the same markup (image, scrim, index, `h3.card__name`, arrow); experiment cards say "Experiment" after the index number, and numbers run on across projects and experiments. Section headings are visually hidden `h2`s. Cards link to the project pages.
- `work/<slug>.html`: project pages (`arview`, `planes`, `hartorget`, `harar`, `agentic-os`). Each has a full-bleed image hero, a description (final copy, in both languages) and an optional links list: ARView links to Google Play, HÄR AR to Google Play and the App Store, HÄR-torget to its three Snapchat lenses, Planes to `paper/`. Agentic OS (`theme-dark`, no links) has the site's video block (`section.project-media` with `video.project-video`): a muted, looping, autoplaying MP4 (H.264) with a WebM fallback and a poster. `assets/video.js` must load synchronously right after the video; it pauses it and shows controls when the visitor prefers reduced motion. Loop videos must keep every frame of the master when encoded, or the loop hitches. HÄR AR also links to `work/harar-markers.html`, a sub-page (compact hero) listing downloadable AR image markers from `assets/harar/` for testers and app reviewers. Each marker has an image plus a print PDF (A4, image exactly 20 cm wide, print scaling off); the PDFs were generated with sharp/pdf-lib and must be regenerated if a marker image changes. The hero sets dark `--page-bg`/`--page-fg` so the mobile menu panel is dark even though the page body is `theme-light`.
- `about.html`: mission text
- `contact.html`: contact form. The logic is in `assets/contact.js`; each page supplies its own error and success messages as `data-*` attributes on the form. It posts to Formspree (form ID `xqpqwwla` in the form `action`, on both language pages).
- `press.html` (and `en/press.html`): press room with the media contact, a card per release (a `.press-news__empty` note when none is published), and the boilerplate. The phone number and email come from data attributes read by `assets/press.js` and must never be written into HTML. `press/<yyyy-mm>-<slug>.html`: one page per press release, Swedish only (the English Press page links to them, labelled "In Swedish"). Placeholders are marked `class="ph"` (release pages) or with `TODO` comments (the card dates on the press pages), and are a publishing gate: grep both `class="ph"` and `TODO` in `press.html`, `en/press.html` and `press/*.html`, and none may remain when it goes live. Never rename a release URL after publishing.

**Older standalone pages** have their own inline styles (Inter font) and should be kept: `privacy.html` and `privacy-sv.html` (their URLs must not change; they cover the website and the AR View and HÄR AR apps), `ar-view.html`, `skojar.html`, `paper/` (Unity WebGL Paper Planes build).

**Indexing:** every indexable page has a self-referencing `<link rel="canonical" href="https://www.shiftspace.se/<path>" />` in its head, on the line above its `hreflang` links, and an entry in `sitemap.xml` (listed in `robots.txt`). Directory pages use the directory URL (`/`, `/en/`, `/paper/`, `/harar/`), never `index.html`. A new page needs both its canonical and its sitemap entry, in both languages. A page with `noindex` gets neither; don't block it in `robots.txt`, or Google can't read the `noindex`.

**Theme:** each page sets a body class (`theme-dark`, `theme-navy` or `theme-light`), which sets the page colors. The header logo matches the theme: `assets/lockup-{white,amber,navy}.png` (white on imagery, amber on dark, navy on light).

**Brand tokens** (in `assets/site.css`): navy `#282E45`, amber `#ECB200`, near-black `#090D16`, off-white `#EEF0F3`. Muted text uses ink opacity, not new greys.

**Typography:** Montserrat (300–700) for all text, and Space Mono for small uppercase labels. Both load from Google Fonts.

**Design source:** a design handoff (hi-fi HTML references plus README). Page gutters are `clamp(24px, 6vw, 96px)`. Motion is limited to color transitions of 120–200ms. The site deliberately prints no email address; the contact form is the only contact channel. The one exception is the Press pages (a press email alias and a press contact phone number), which `assets/press.js` builds at runtime.

## Deployment

Push to `main` and GitHub Pages serves it automatically. The `CNAME` file sets the custom domain.
