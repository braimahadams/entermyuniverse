# Deploy Enter My Universe (Cloudflare Pages)

## Current DNS inventory (before cutover)

Captured while nameservers still pointed at Vercel:

| Record | Value |
| --- | --- |
| NS | `ns1.vercel-dns.com`, `ns2.vercel-dns.com` |
| Apex A | `216.198.79.65`, `216.198.79.1` |
| www A | `64.29.17.1`, `64.29.17.65` |
| MX | none |
| TXT | none |

There is **no email** on this domain yet. Setting up `adams@entermyuniverse.com`
requires DNS after Cloudflare is authoritative.

Do **not** change nameservers until the Pages preview is approved.

---

## 1. Push the preview branch

```bash
cd ~/Desktop/entermyuniverse
git push -u origin portfolio-static
```

If `gh` is not logged in: `gh auth login` (GitHub.com → HTTPS → login).

---

## 2. Create a Cloudflare Pages project (preview)

1. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Select `braimahadams/entermyuniverse`.
3. Project name: `entermyuniverse` (or similar).
4. Production branch: leave as `main` for later; for now deploy **`portfolio-static`**.
5. Build settings:
   - Framework preset: **None** / Vite
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `/`
6. Environment variables: **none** (site has zero secrets).
7. Save and deploy.

Cloudflare will print a preview URL similar to:

`https://portfolio-static.entermyuniverse.pages.dev`

or

`https://<hash>.entermyuniverse.pages.dev`

Share that URL for review. No custom domain yet.

---

## 3. After preview approval — connect the root domain

1. Merge `portfolio-static` → `main` (only when you approve).
2. In Pages → **Custom domains** → add `entermyuniverse.com` and `www.entermyuniverse.com`.
3. Cloudflare will ask to change nameservers at the registrar from Vercel NS to Cloudflare NS. Copy the two Cloudflare nameservers Cloudflare shows for this zone.

### Preserve records during NS move

Before switching NS:

1. Add the domain as a Cloudflare zone (if Pages did not already).
2. Import / recreate needed records. Today there are no MX/TXT to preserve, but if any verification records appear later (Google, domain verify), copy them first.
3. Pages custom domain usually creates the correct proxied records for the site.
4. Add a **www → apex** redirect:
   - Pages: both hostnames attached, or
   - Bulk Redirect / Redirect Rule: `www.entermyuniverse.com/*` → `https://entermyuniverse.com/$1` (301).

### HTTPS

Cloudflare provisions Universal SSL automatically for proxied hostnames. Confirm:

- `https://entermyuniverse.com` loads
- `http://` redirects to `https://`
- Certificate status is **Active**

---

## 4. Brand email → Gmail (Cloudflare Email Routing)

Goal: `adams@entermyuniverse.com` forwards to your Gmail. Gmail never appears on the website or in GitHub.

1. Cloudflare → zone → **Email** → **Email Routing** → enable.
2. Add destination address = your Gmail → confirm the verification email from Cloudflare.
3. Create a custom address:
   - Address: `adams@entermyuniverse.com`
   - Action: Forward to your verified Gmail
4. Cloudflare will add MX + TXT records for Email Routing automatically when the zone is on Cloudflare NS. Do not delete those.
5. **Before launch:** from a different account (not Gmail itself), send a test message to `adams@entermyuniverse.com` and confirm it arrives in Gmail.

Website button stays:

`mailto:adams@entermyuniverse.com`

---

## 5. Cutover checklist

- [ ] Preview approved
- [ ] `portfolio-static` merged to `main`
- [ ] Pages production deploy from `main` is green
- [ ] Custom domains attached; HTTPS active
- [ ] www redirects to apex
- [ ] Email Routing verified; test mail received
- [ ] Portrait / socials / Cal.com / featured covers filled in `src/content.js`
- [ ] Old Vercel project left idle or removed after traffic moves

---

## Rollback note

DNS NS change is the slow part (hours). Keep the Cloudflare Pages deployment and this Git branch even if you delay the registrar NS update. The static site has no database to migrate.
