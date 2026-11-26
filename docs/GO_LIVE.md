# Go live on entermyuniverse.com

Worker is ready:

https://entermyuniverse.braimahadams01.workers.dev

Custom domains for Workers require the domain as a **Cloudflare zone**.
Today DNS is still on **Spaceship**. Email forwarding is live — preserve it.

## Do this in order

### 1. Add the domain in Cloudflare

1. Cloudflare Dashboard → **Account home** → **Add a domain** / **Websites** → **Add a site**
2. Enter `entermyuniverse.com` → Free plan
3. Let Cloudflare scan DNS
4. **Before changing nameservers**, open **DNS → Records** and confirm these exist (add if missing). Set MX/TXT to **DNS only** (grey cloud):

| Type | Name | Content | Proxy |
| --- | --- | --- | --- |
| MX | `@` | `mx1.efwd.spaceship.net` (priority 0) | DNS only |
| MX | `@` | `mx2.efwd.spaceship.net` (priority 0) | DNS only |
| TXT | `@` | `v=spf1 include:spf.efwd.spaceship.net ~all` | DNS only |

5. Cloudflare will show **two nameservers** (look like `*.ns.cloudflare.com`). Copy them.

### 2. Point Spaceship nameservers at Cloudflare

1. Spaceship → Domains → `entermyuniverse.com` → DNS / Nameservers
2. Turn **DNSSEC off** if it is on (turn it back on later via Cloudflare if you want)
3. Switch from Spaceship nameservers to **Custom**
4. Paste the two Cloudflare nameservers → Save
5. Wait until Cloudflare marks the zone **Active** (often minutes; can be longer)

Keep Spaceship as the **registrar**. Only DNS authority moves.

### 3. Attach the Worker to the domain

1. Cloudflare → **Workers & Pages** → **entermyuniverse**
2. **Domains** / **Triggers** → **Add** / **Custom Domain**
3. Add:
   - `entermyuniverse.com`
   - `www.entermyuniverse.com`
4. Cloudflare creates the DNS + SSL for the Worker automatically
5. Remove any leftover **Vercel** A/CNAME records for `@` / `www` if they still point at `216.198.79.x` or Vercel

### 4. www → apex redirect

In the Cloudflare zone for `entermyuniverse.com`:

**Rules** → **Redirect Rules** → Create rule

- If: Hostname equals `www.entermyuniverse.com`
- Then: Dynamic redirect to `https://entermyuniverse.com/${1}` (or Static `https://entermyuniverse.com`)
- Status: `301`

Or attach both hostnames to the Worker and add a redirect rule as above.

### 5. Verify

- [ ] https://entermyuniverse.com shows the new portfolio (portrait, 500K+, socials)
- [ ] https://www.entermyuniverse.com redirects to apex
- [ ] Certificate is valid (padlock)
- [ ] From a **non-Gmail** account, email `adams@entermyuniverse.com` and confirm it still hits Gmail
- [ ] Optional: disconnect the old Vercel Git project so it stops failing builds

### 6. Tell me when zone is Active

Paste:

1. The two Cloudflare nameservers you set, or  
2. “Zone active + domains attached”

I will re-check public DNS and the live site from here.

## Do not

- Do not enable **Cloudflare Email Routing** while Spaceship forwarding MX is in use
- Do not delete the Spaceship MX/SPF records
- Do not leave the old Vercel A record as the only apex record after the Worker domain is attached
