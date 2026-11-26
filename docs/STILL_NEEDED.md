# Still needed from Adams

Fill these before treating the public site as complete. Until then, missing
pieces stay hidden (no placeholders).

1. **Portrait** — square photo → `public/portrait.webp`, then set `portrait: "/portrait.webp"` in `src/content.js`
2. **Instagram profile URL** (+ approved follower count if you want it shown)
3. **TikTok profile URL** (+ approved follower count if you want it shown)
4. **YouTube channel URL** (+ approved follower count if you want it shown)
5. **Facebook profile/page URL** (+ approved follower count if you want it shown)
6. **Cal.com booking URL** for “Book a creator strategy call”
7. **Up to 3 featured videos** — optimized vertical cover (`public/covers/…`) + original post URL; optional verified views or campaign name
8. **Optional:** replace `public/og.png` with a share image that includes the real portrait after it exists
9. **Cloudflare** redeploy from `main`: build `npm run build`, deploy `npx wrangler deploy` (output dir is in `wrangler.jsonc`)
10. **After any DNS cutover:** send a test to `adams@entermyuniverse.com` from another account and confirm it still hits Gmail

Already configured:

- Brand inquiries → `mailto:adams@entermyuniverse.com`
- Spaceship email forwarding for that address (MX + SPF live)
- ScoutViral card → `https://scoutviral.com`
