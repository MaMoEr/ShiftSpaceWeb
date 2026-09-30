# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ShiftSpace is a static marketing site hosted on GitHub Pages at `www.shiftspace.se`. There is no build system or package manager: plain HTML pages, one shared stylesheet (`assets/site.css`), a script for the mobile menu (`assets/nav.js`: a hamburger menu below 720px, active only when an inline script in the head adds a `js` class), and a script for the contact form (`assets/contact.js`).

## Development

Run the `site` config in `.claude/launch.json` (`npx http-server . -p 8123`), or open the HTML files directly in a browser.

## Architecture

**Languages:** Swedish is the default, at the root. English lives under `en/`, with the same file names. Each page has `hreflang` alternate links and an SV/EN switch in the nav that goes to the same page in the other language. Changes to one language must be mirrored in the other. The privacy policy exists only in English.

**Main pages** (in both languages) all use `assets/site.css`:
- `index.html`: front page with a full-bleed hero (`assets/hero-smoke-ribbon-*.{avif,webp,jpg}`)
- `work.html`: project grid. The cards link to `ar-view.html` and `paper/`. HärnösandTorget and JulkalenderGraf have no pages yet.
- `about.html`: mission text
- `contact.html`: contact form. The logic is in `assets/contact.js`; each page supplies its own error and success messages as `data-*` attributes on the form. It posts to Formspree (placeholder `YOUR_FORM_ID` in the form `action`, on both language pages).

**Older standalone pages** have their own inline styles (Inter font) and should be kept: `privacy.html` (its URL must not change), `ar-view.html`, `skojar.html`, `paper/` (Unity WebGL Paper Planes build).

**Theme:** each page sets a body class (`theme-dark`, `theme-navy` or `theme-light`), which sets the page colors. The header logo matches the theme: `assets/lockup-{white,amber,navy}.png` (white on imagery, amber on dark, navy on light).

**Brand tokens** (in `assets/site.css`): navy `#282E45`, amber `#ECB200`, near-black `#090D16`, off-white `#EEF0F3`. Muted text uses ink opacity, not new greys.

**Typography:** Montserrat (300–700) for all text, and Space Mono for small uppercase labels. Both load from Google Fonts.

**Design source:** a design handoff (hi-fi HTML references plus README). Page gutters are `clamp(24px, 6vw, 96px)`. Motion is limited to color transitions of 120–200ms. The site deliberately prints no email address; the contact form is the only contact channel.

## Deployment

Push to `main` and GitHub Pages serves it automatically. The `CNAME` file sets the custom domain.
