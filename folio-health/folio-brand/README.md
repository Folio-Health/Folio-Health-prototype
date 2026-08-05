# Folio — Brand & Icon Assets

*The record that follows the patient.*

## The mark

The Folio mark is a **letter "F" whose middle arm is a heartbeat (ECG) line**, ending in a coral **"live signal" dot**. It reads instantly as an *F* while signalling *healthcare* and a *living, moving record* — directly echoing the product promise that a patient's record travels with them. It stays legible all the way down to 16 px.

## Colours

| Token | Hex | Use |
|---|---|---|
| Folio Deep | `#0E443B` | Primary tile, wordmark on light, theme colour |
| Folio Deep (low) | `#0C3E36` | Gradient bottom / dark backgrounds |
| Folio Teal | `#11534A` | Gradient top / accents |
| Signal Coral | `#E65A4F` | The pulse dot — accent only, never large areas |
| Mint | `#7FC9BC` | Secondary text on dark |
| Surface | `#FFFFFF` | Light backgrounds, mark counter |

Wordmark typeface: **Poppins** (Medium for the wordmark). The wordmark in the SVG/PNG logos is already converted to vector outlines, so no font install is required to display them.

## Source (vector — edit these)

| File | What it is |
|---|---|
| `folio-mark.svg` | Primary app/tile mark (rounded corners) |
| `folio-mark-square.svg` | Full-bleed square mark (for OS-masked icons) |
| `folio-mark-mono.svg` | Single-colour (deep teal) mark, transparent bg |
| `folio-mark-mono-white.svg` | Single-colour white mark, for dark surfaces |
| `folio-logo-light.svg` | Horizontal logo, dark wordmark (light backgrounds) |
| `folio-logo-dark.svg` | Horizontal logo on dark teal panel |
| `folio-logo-stacked.svg` | Mark over wordmark (square-ish layouts) |
| `folio-og.svg` | Social card source |

## Exports (drop-in for the web app — in `/assets`)

| File | Purpose |
|---|---|
| `favicon.svg` | Modern scalable favicon |
| `favicon.ico` | Multi-res (16/32/48) legacy favicon |
| `favicon-16x16.png` `favicon-32x32.png` `favicon-48.png` `favicon-64.png` `favicon-128.png` `favicon-256.png` | PNG favicons |
| `apple-touch-icon.png` | 180×180, full-bleed (iOS home screen) |
| `icon-192.png` `icon-512.png` | PWA icons, `purpose: any` |
| `icon-192-maskable.png` `icon-512-maskable.png` | PWA icons, `purpose: maskable` (content sits inside the 80% safe zone) |
| `folio-og.png` | 1200×630 social/link-preview card |
| `folio-logo-light.png` `folio-logo-dark.png` | Raster logos |
| `folio-mark.png` | 1024×1024 mark (app stores, etc.) |
| `site.webmanifest` | PWA manifest (icons + theme/background colour) |
| `head-snippet.html` | Copy these tags into your `<head>` |

## Wiring it up

1. Copy everything in `/assets` to your site's `/assets` folder.
2. Paste the contents of `head-snippet.html` into your `<head>`.
3. Done — favicon, iOS icon, PWA install icon, and social previews all resolve.

## Clear space & don't

- Keep clear space around the logo of at least the height of the coral dot.
- Don't recolour the dot, stretch the mark, add shadows, or place the mark on a busy photo without the tile behind it.
- On dark backgrounds use `folio-logo-dark.svg` or `folio-mark-mono-white.svg`.
