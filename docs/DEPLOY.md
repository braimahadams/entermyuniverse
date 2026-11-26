# Deploy Enter My Universe (Cloudflare Pages)

## Current DNS inventory (as of 26 Nov 2026)

| Record | Value |
| --- | --- |
| NS | `launch1.spaceship.net`, `launch2.spaceship.net` |
| Apex A | `216.198.79.1` (still pointing at old Vercel-era hosting) |
| MX | `mx1.efwd.spaceship.net`, `mx2.efwd.spaceship.net` |
| TXT (SPF) | `v=spf1 include:spf.efwd.spaceship.net ~all` |

**Brand email is already live** via Spaceship email forwarding:

`adams@entermyuniverse.com` → Adams’ Gmail (destination stays private)

Website CTA already uses `mailto:adams@entermyuniverse.com`. Never publish the Gmail address in the repo.

Do **not** change nameservers until the Pages preview is approved. When you do cut over, **preserve the Spaceship MX + SPF TXT** or mail will break.

---

## 1. Production branch

`main` is the static portfolio (Vite). Redeploy from **`main`** only.

```bash
cd ~/Desktop/entermyuniverse
git checkout main
git pull
```

Repo: https://github.com/braimahadams/entermyuniverse

---

## 2. Cloudflare Workers & Pages build settings

The new dashboard often hides “Build output directory” and requires a
**Deploy command**. Output dir is set in repo file [`wrangler.jsonc`](../wrangler.jsonc)
(`assets.directory` = `./dist`).

In **entermyuniverse** → **Settings** → **Builds**:

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Preview command | `npx wrangler preview` |
| Root directory | `/` |
| Env vars | none |

You do **not** need a separate output-directory field in the UI.

Then **Retry deployment** from `main`. A green build should publish to
`entermyuniverse.<workers/pages host>` / your project’s `*.workers.dev` or
`*.pages.dev` URL shown on the Overview tab.

---

## 3. After preview approval — connect the root domain

1. Confirm Pages production deploy from `main` is green.
2. In Pages → **Custom domains** → add `entermyuniverse.com` and `www.entermyuniverse.com`.
3. If Cloudflare asks for a nameserver change at Spaceship, copy the Cloudflare NS pair it shows.

### Preserve email during NS / DNS moves

Before switching NS or rewriting apex records:

1. Add the domain as a Cloudflare zone (if Pages did not already).
2. **Recreate these Spaceship email records first** (DNS only, orange-cloud / DNS-only, not proxied for MX):
   - MX `@` → `mx1.efwd.spaceship.net` (priority 0)
   - MX `@` → `mx2.efwd.spaceship.net` (priority 0)
   - TXT `@` → `v=spf1 include:spf.efwd.spaceship.net ~all`
3. Then attach Pages custom domains (proxied A/AAAA or CNAME as Cloudflare instructs).
4. Add a **www → apex** redirect:
   - Pages: both hostnames attached, or
   - Redirect Rule: `www.entermyuniverse.com/*` → `https://entermyuniverse.com/$1` (301).

Do **not** enable Cloudflare Email Routing unless you intentionally migrate off Spaceship forwarding. Mixing both MX sets will break mail.

### HTTPS

Cloudflare provisions Universal SSL automatically for proxied hostnames. Confirm:

- `https://entermyuniverse.com` loads
- `http://` redirects to `https://`
- Certificate status is **Active**

---

## 4. Brand email checklist

Already configured outside the website:

- Address: `adams@entermyuniverse.com`
- Forwarding: Spaceship → Gmail
- Site button: `mailto:adams@entermyuniverse.com`

Before launch (and again after any DNS cutover):

1. From a different account (not Gmail itself), send a test to `adams@entermyuniverse.com`.
2. Confirm it arrives in Gmail.

---

## 5. Cutover checklist

- [ ] Pages production deploy from `main` is green
- [ ] Custom domains attached; HTTPS active
- [ ] www redirects to apex
- [ ] Spaceship MX + SPF preserved (or intentionally migrated)
- [ ] Test mail to `adams@entermyuniverse.com` still arrives
- [ ] Portrait / socials / Cal.com / featured covers filled in `src/content.js`
- [ ] Old Vercel project left idle or removed after traffic moves

---

## Rollback note

DNS NS change is the slow part (hours). Keep the Cloudflare Pages deployment and this Git branch even if you delay the registrar NS update. The static site has no database to migrate. Email depends on MX — restore the Spaceship MX/SPF records first if mail stops.
