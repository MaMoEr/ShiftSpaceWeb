# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ShiftSpace is a static brand landing page hosted on GitHub Pages at `www.shiftspace.se`. There is no build system, package manager, or JavaScript — just a single `index.html` file with inline CSS.

## Development

Open `index.html` directly in a browser. No server, build step, or install required.

## Architecture

Everything lives in `index.html`. All styles are inline `<style>` in the `<head>`. There are two logo assets (`logo.png`, `logo-yellow.png`).

**Brand tokens (CSS custom properties):**
- `--color-main`: `#282E45` (dark navy)
- `--color-accent`: `#ECB200` (gold)
- `--color-black`: `#090D16` (near-black background)
- `--color-white`: `#EEF0F3` (off-white text)

**Typography:** Inter 600 (via Google Fonts) for the brand name; system font stack for everything else. Font size uses `clamp(2rem, 5vw, 3.5rem)` for responsiveness.

**Layout:** Full-viewport flexbox body, left-aligned (10vw horizontal padding). Brand lockup = logo + gold divider bar + brand name.

## Deployment

Push to `main` — GitHub Pages serves it automatically. The `CNAME` file sets the custom domain.
