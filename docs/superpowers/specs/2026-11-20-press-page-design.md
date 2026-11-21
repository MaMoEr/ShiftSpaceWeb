# Press page — design

Date: 2026-11-20 · Status: approved by Markus 2026-11-20 · Mockup: `drafts/press/index-c.html` (local, not committed)

## Why
ShiftSpace sends a press release now (HÄR AR launch, 1 Dec) and another in mid-December. Journalists need one stable place for releases, images and a press contact, and each release needs its own permanent link to send out and to put in the press kit.

## Goals / non-goals
- Goals: a Press page listing all releases, one page per release, press contact, downloadable logos and images.
- Non-goals: a distribution service (MyNewsdesk/Cision), English translations of the releases, an RSS feed, filtering or pagination.
- Anti-goal: a page that looks empty or unfinished with only one or two releases.

## Approaches considered
- **A: plain list** (date, headline, summary per row). Simple, scales well, but plain.
- **B: newest release featured, older ones listed below.** Looks thin when there are only two.
- **C: style of the Dribbble "Press page" concept, adapted to the ShiftSpace Design System.** Chosen by Markus.

## The design (C)
**Press page** (`press.html`):
1. Amber band (`#ECB200`), left-aligned: kicker "Pressrum", title "Press.", lead text, navy "Ladda ner presskit →" button (radius 10px).
2. Media contact panel overlapping the band's bottom edge: off-white-50 fill, 1px hairline border, no shadow; three cells: name and role, phone, email.
3. "Senaste nytt." with release cards (image, mono date, headline, summary, "Läs mer →"). One release: the card spans the full width, image left, text right. Two or more: cards side by side in a grid (2–3 across depending on width), newest first.
4. Navy band: "Om ShiftSpace" boilerplate and media bank downloads (logos, press images).
5. Near-black footer.
Design system rules followed: flat UI (no shadows), hairline-bordered cards, Space Mono labels instead of icons, 1180px container, section padding `clamp(72px, 9vw, 128px)`.

**Release page** (`press/<yyyy-mm>-<slug>.html`, e.g. `press/2026-11-har-ar-lansering.html`), approved 2026-11-20 as `drafts/press/release-c.html`: short amber band (← Press, mono meta line with date and project, full-width headline), 21:9 hero overlapping the band (render cropped at `object-position: 50% 88%`) with caption, then a main column (bold lede, body, three app screens, "Om HÄR Handel & Möten", "Om ShiftSpace", back link) beside a sticky sidebar of panels: Fakta (Om HÄR AR, Lansering, Plats, Öppet, Pris, Kräver, store badges), Material (PDF, press images, campaign page), Presskontakt (hidden phone and email). Sidebar drops below the text under 960px. No quote, no portrait. The approved text in that draft is the release copy; "Graf" is never written "GRAF".

## Decisions made
- Email: the press alias on the shiftspace.se domain, shown on the Press page and release pages only. Built by a small script so the full address is never in the HTML. This is a deliberate exception to "the site prints no email"; CLAUDE.md gets a note. Markus creates the alias/forward with the mail provider before launch.
- Press contact: Markus Eriksson, Grundare, press contact phone (no opening hours). The phone is hidden from harvesters the same way: the HTML holds the international number reversed in a data attribute (see the page source), and a small script (`assets/press.js`, prototype `drafts/press/contact-reveal.js`) builds the visible national-format number and the `tel:` link. Without JavaScript the cells read "Visa telefonnummer"/"Visa e-postadress" and the contact form remains the fallback. This stops bots that read raw HTML; crawlers that run JavaScript (e.g. Google) will still see both.
- Releases are Swedish only.
- Placeholder copy until the real release text, contact name, phone, and download files are supplied.

## My calls (correct me)
- English: an `en/press.html` mirror of the Press page (translated chrome), listing the same Swedish releases marked "In Swedish", so the SV/EN switch still works and the "both languages" rule holds for the page itself.
- Link "Press" in the top nav (both languages) and from the HÄR AR campaign page's "Senaste pressmeddelande" slot.
- Press-page styles go into `assets/site.css` (no inline styles), reusing existing tokens.
- Date-prefixed release URLs keep releases in order and never change.

## Left to the builder
Exact responsive breakpoints, image sizes/formats (avif/webp/jpg like the rest of the site), and ZIP packaging of the media bank.
