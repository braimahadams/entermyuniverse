# Enter My Universe

Personal creator portfolio and link-in-bio for **Adams Braimah**.

Domain: [entermyuniverse.com](https://entermyuniverse.com)

Static Vite creator portfolio. The old Next.js / Prisma / Stripe platform was
removed from `main` and only exists in earlier Git history.

## Local

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # writes dist/
npm run preview  # serve dist/
```

## Edit content

All public copy and links live in one file:

[`src/content.js`](src/content.js)

- Social rows appear only when `url` is set
- Follower counts appear only when `followers` is a positive number
- Featured videos appear only when both `cover` and `url` are set
- Book CTA appears only when `bookCallUrl` is set
- Brand inquiries always uses `mailto:adams@entermyuniverse.com`
- ScoutViral card always links to `https://scoutviral.com`

Never put a personal Gmail address in the repo.

## Assets

| File | Purpose |
| --- | --- |
| `public/portrait.webp` | Hero portrait (set `portrait: "/portrait.webp"` in content) |
| `public/covers/*.webp` | Featured video covers |
| `public/favicon.svg` | Favicon |
| `public/og.png` | Share image |
| `public/apple-touch-icon.png` | iOS home-screen icon |

## Hosting

Target: **Cloudflare Pages Free**

- Build command: `npm run build`
- Output directory: `dist`
- Root branch for production later: `main` (after merge)
- Preview branch: `portfolio-static`

See [`docs/DEPLOY.md`](docs/DEPLOY.md) for preview setup, DNS cutover, email
routing, and www → apex redirect. Do not change production DNS until the
preview is approved.
