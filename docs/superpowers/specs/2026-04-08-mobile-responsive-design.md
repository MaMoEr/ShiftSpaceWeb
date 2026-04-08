# Mobile Responsive Layout — Design Spec

**Date:** 2026-04-08  
**Status:** Approved

## Goal

Make the ShiftSpace landing page responsive for mobile devices in portrait orientation. On phones held portrait, the brand lockup should stack vertically instead of horizontally, with the logo and brand name at matching widths.

## Current Layout

Horizontal flex row, left-aligned at 10vw from the left edge:

```
[logo 80×80] | [vertical gold bar] | ShiftSpace
```

## Target Layout (mobile portrait)

Vertical flex column, same left-aligned position:

```
[   logo (stretches to text width)   ]
[──── horizontal gold rule ────]
[ ShiftSpace ]
```

## Implementation

**Breakpoint:** `@media (max-width: 600px) and (orientation: portrait)`

### `.brand`
- `flex-direction: column`
- `align-items: stretch` — causes children to fill the container's cross-axis (width)
- `gap: 16px`

### `.brand__logo`
- Override fixed `width: 80px` → `width: auto`
- Override fixed `height: 80px` → `height: auto`
- `object-fit: contain` stays, maintains aspect ratio as width grows

### `.brand__divider`
- Override `width: 2px; height: 64px` → `height: 2px` (horizontal rule)
- Width is controlled by `align-items: stretch` on parent

### Width matching mechanism

`.brand` is a flex item of `body`. Its width in column mode = `max-content` of its children. "ShiftSpace" in Inter 600 at `clamp(2rem, 5vw, 3.5rem)` is wider than 80px, so the text sets the container width. `align-items: stretch` then forces the logo and divider to that same width. No magic numbers required.

## No changes to

- Desktop layout (untouched above 600px or in landscape)
- Font sizes
- Brand colours or typography
- Body padding (10vw still applies on mobile)
