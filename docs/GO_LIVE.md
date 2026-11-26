# Go live on entermyuniverse.com

Worker (already built):

https://entermyuniverse.braimahadams01.workers.dev

The Worker lives under **Workers & Pages**, not under the domain zone until
you connect it. The domain zone stays **Pending** until Spaceship nameservers
point at Cloudflare.

## Right now (your Cloudflare screens)

DNS records look correct for email:

- MX → Spaceship forwarding (DNS only) — keep
- TXT SPF — keep
- `www` CNAME → apex — keep
- Old apex **A** `216.198.79.1` — delete it (blank site during cutover is fine)

### Why you don’t see the Worker on the domain page

**No Workers connected** is normal while the zone is Pending.

Your Worker `entermyuniverse` is still here:

**Workers & Pages** → **entermyuniverse**

Connect it only after the zone is **Active** (step 3).

---

## 1. Finish nameservers at Spaceship (required)

Cloudflare assigned:

- `addyson.ns.cloudflare.com`
- `miles.ns.cloudflare.com`

At Spaceship → Domains → `entermyuniverse.com` → Nameservers:

1. Turn **DNSSEC off** if it is on
2. Replace Spaceship NS (`launch1` / `launch2`) with the two Cloudflare NS above
3. Save

Wait until Cloudflare Overview says **Active** (minutes to a few hours).

---

## 2. Clean apex DNS in Cloudflare (optional now, required before attach)

In the zone → **DNS → Records**:

1. **Delete** the A record `entermyuniverse.com` → `216.198.79.1`
2. Keep both MX + TXT
3. Keep `www` CNAME

---

## 3. Connect the existing Worker (after Active)

Either path works:

**A — From the Worker**

1. **Workers & Pages** → **entermyuniverse**
2. **Domains** / **Triggers** → **Add Custom Domain**
3. Add `entermyuniverse.com`
4. Add `www.entermyuniverse.com`

**B — From the domain Overview**

1. Domain Overview → **Connect Worker**
2. Choose **entermyuniverse**
3. Confirm apex + www

Cloudflare creates the DNS + SSL for the Worker.

---

## 4. www → apex redirect

**Rules** → **Redirect Rules** → Create:

- If hostname equals `www.entermyuniverse.com`
- Then 301 to `https://entermyuniverse.com`

---

## 5. Verify

- [ ] https://entermyuniverse.com shows the portfolio
- [ ] www redirects to apex
- [ ] Test email to `adams@entermyuniverse.com` from a non-Gmail account

Do **not** enable Cloudflare Email Routing while Spaceship MX is in use.
