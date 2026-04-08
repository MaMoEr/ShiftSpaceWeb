# Mobile Responsive Layout — Design Spec

**Date:** 2026-04-08  
**Status:** Approved

## Goal

Make the ShiftSpace landing page responsive for mobile devices in portrait orientation. On phones held portrait, the brand lockup should stack vertically instead of horizontally.

## Current Layout

Horizontal flex row, left-aligned at 10vw from the left edge:

```
[logo 80×80] | [vertical gold bar] | ShiftSpace
```

## Target Layout (mobile portrait)

Vertical flex column, same left-aligned position. Logo retains its original aspect ratio and size.

```
[logo 80×80]
[── gold rule ──]
ShiftSpace
```

## Implementation

**Breakpoint:** `@media (max-width: 600px) and (orientation: portrait)`

### `.brand`
- `flex-direction: column`
- `align-items: flex-start`
- `gap: 16px`

### `.brand__logo`
- No changes — stays 80×80, aspect ratio preserved

### `.brand__divider`
- Override `width: 2px; height: 64px` → `width: 64px; height: 2px` (horizontal rule, same length)

## No changes to

- Desktop layout (untouched above 600px or in landscape)
- Logo size or aspect ratio
- Font sizes
- Brand colours or typography
- Body padding (10vw still applies on mobile)
