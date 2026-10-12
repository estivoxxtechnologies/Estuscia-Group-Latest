# Estuscia Group — investment-themed panel site (React + TS + Vite + Three.js + GSAP)

    npm install && npm run dev      # local
    npm run build                   # static output in /dist (host on any static host; set SPA fallback not needed — single page)

Navigation: pull the handle (top-left), mouse wheel, ↑/↓/PageUp/PageDown, swipe, or the nav bar (7 panels; Menu button on mobile).
Each move zooms INTO the 3D background and back OUT onto the next panel (src/hooks/usePanels.ts).

TO FINISH (things the brief did not contain):
- src/site.ts: `formEndpoint` (contact form is validated but NOT sent until set), business `hours`, social + legal links.
- src/data.ts: replace condensed descriptions / drafted FAQ answers with the exact original text; add article reading times + real article URLs;
  add leadership `photo` paths (initial monograms are used until then); brand logos/links are not included (no verified URLs).

## Logo & team photos
- Logo: `public/images/logo.png` (path set in `src/site.ts` → `logo`). Used in the navbar and footer; text fallback if missing.
- Team photos: `public/images/team/` → shahzeen-khalid.jpg, akshay-m-a.jpg, riza-mathiyam.jpg, anirudh-menon.jpg (paths in `src/data.ts`). Initials fallback if missing.

## URL & favicon
- The address bar stays on the main URL (no #home / #leadership); panels change without touching the URL.
- Favicon: `public/favicon.png` (currently generated from the logo's bird mark). Replace it with your own file of the same name,
  or if yours is .ico/.svg, change the two `<link rel="icon">` lines in index.html.
