# Deploy Enter My Universe (Cloudflare Workers)

## DNS / email (Spaceship forwarding)

| Record | Value |
| --- | --- |
| MX | `mx1.efwd.spaceship.net`, `mx2.efwd.spaceship.net` |
| TXT (SPF) | `v=spf1 include:spf.efwd.spaceship.net ~all` |

Brand email: `adams@entermyuniverse.com` (Spaceship → Gmail; never publish Gmail).

Preserve MX + SPF on every DNS change. See [`docs/GO_LIVE.md`](GO_LIVE.md).

---

## Production branch

`main` is the static Vite portfolio.

```bash
cd ~/Desktop/entermyuniverse
git checkout main
git pull
```

Repo: https://github.com/braimahadams/entermyuniverse

---

## Cloudflare Workers build settings

Output dir is in [`wrangler.jsonc`](../wrangler.jsonc) (`assets.directory` = `./dist`).

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Preview command | `npx wrangler preview` |
| Root directory | `/` |
| Env vars | none |

Workers preview URL:

https://entermyuniverse.braimahadams01.workers.dev

Domain cutover: [`docs/GO_LIVE.md`](GO_LIVE.md).

---

## Brand email checklist

1. From a different account, email `adams@entermyuniverse.com`
2. Confirm it arrives in Gmail

---

## Cutover checklist

- [ ] Cloudflare zone **Active** (nameservers updated at Spaceship)
- [ ] Worker custom domains attached for apex + www
- [ ] HTTPS active
- [ ] www redirects to apex
- [ ] Spaceship MX + SPF still present (DNS only)
- [ ] Test mail received
