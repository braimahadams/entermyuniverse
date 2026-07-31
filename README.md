# Enter My Universe

A platform for people who think out loud.

Anyone can claim a handle and publish short films into their own universe at
`entermyuniverse.com/@handle`. Some creators open a further door: book them,
one to one, on video. The platform takes a cut of every booking.

---

## Run it

```bash
npm install
npm run setup            # database + your admin account + example content
npm run dev
```

- Feed → http://localhost:3000
- Your universe → http://localhost:3000/@braimaadams
- Studio → http://localhost:3000/studio
- Platform admin → http://localhost:3000/admin

Sign in with `OWNER_EMAIL` / `OWNER_PASSWORD` from `.env`. **Change that
password before you deploy anything.**

Works immediately with no accounts and no card. Stripe isn't configured, so
bookings confirm without payment — the entire flow is testable today.

---

## How it's shaped

**Everyone can publish. Selling is granted.**

`canSell` is false for every new account. Publishing films is open; taking
paid bookings is switched on per account from `/admin`. That's a deliberate
choice, not a limitation — it means you can grow an audience of creators
without inheriting a payments-compliance problem on day one, and you decide
who represents the platform commercially.

When you grant it, a draft offer is created automatically. The creator sets a
real price and hours in their studio, and only then can it go live — an
active offer with no hours behind it is a button onto an empty calendar.

**The open question is the product.**

Every film carries a question it raises and refuses to answer. It appears when
playback ends, and rides into the booking form as the pre-filled topic. It's
stored on the booking too, so the studio can show a creator *which film
actually produces bookings* rather than which one got likes.

If you change nothing else, keep writing good open questions.

---

## What costs money, and when

Nothing bills you until you have customers.

| Piece | Now (free) | When you have money |
|---|---|---|
| Hosting | Vercel free tier | Vercel Pro, $20/mo |
| Database | SQLite file | Neon / Supabase Postgres — free tier |
| Uploads | `/public/media` on disk | Vercel Blob — free tier |
| Video delivery | Direct from storage | Cloudflare Stream ($5/mo per 1,000 min) or Mux |
| Video call | Jitsi — free, unlimited | Daily.co (free to 10k min/mo) |
| Email | Printed to your terminal | Resend — free to 3,000/mo |
| Payments | — | Stripe — no monthly fee, per transaction |

Each is an environment variable, not a rewrite. See `src/lib/providers/` —
the app asks those modules for a video URL, a meeting room, an email send, a
place to put a file. It never knows who's behind them.

### Uploads: the one thing that will bite you

`STORAGE_PROVIDER=local` writes to `/public/media`. That works in development
and on a real VPS. **It does not work on Vercel** — the filesystem is
read-only and nothing survives between requests.

Set `STORAGE_PROVIDER=blob` and add Blob storage in the Vercel dashboard. The
browser then uploads *directly* to storage with a short-lived token, never
through the app. That isn't an optimisation: a serverless request body caps
out around 4.5 MB, which is a couple of seconds of phone video. Anything that
routes big files through the app is broken by design in production.

### Payments and the platform cut

1. Stripe account → `STRIPE_SECRET_KEY`.
2. Webhook at `https://yourdomain.com/api/webhooks/stripe` subscribed to
   `checkout.session.completed`, `checkout.session.expired`, `charge.refunded`.
3. Signing secret → `STRIPE_WEBHOOK_SECRET`.

Locally: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.

The cut is `PLATFORM_FEE_BPS` (1500 = 15%), written onto each account at
signup so changing the rate never alters the terms for people already here.
It's frozen again onto each booking, so history is never rewritten.

Once a creator has a Stripe Connect account (`stripeAccountId` +
`payoutsEnabled`), checkout splits the money automatically: they're paid
direct, your fee is taken atomically. Until then, payments land in the
platform account and you settle by hand. **Connect onboarding is the one
piece not yet built** — the payment path reads those fields and does the
right thing the moment they're populated.

The webhook confirms bookings, never the success page. Someone can close the
tab, or visit the success URL by hand. Money is only money when Stripe says
so, signed.

---

## Layout

```
src/
  app/
    page.tsx                 the cross-creator feed
    [handle]/                /@someone — their universe
    [handle]/book/           booking, scoped to that creator
    (auth)/                  signup, login
    studio/                  creator's own area: films, offers, hours, profile
    admin/                   platform moderation — grant selling, hide films
    api/                     availability, bookings, upload, follow, stripe
  components/
  lib/
    providers/               ← the swappable bits
    auth.ts                  scrypt + revocable sessions, no auth library
    scheduling.ts            slot generation, double-booking prevention
    time.ts                  timezone math (no date library)
    brand.ts                 ← all the copy, in one file
```

**Change the words in `src/lib/brand.ts`.**

---

## Deploying

1. Push to GitHub, import into Vercel.
2. Create a free Neon Postgres. In `prisma/schema.prisma` change
   `provider = "sqlite"` → `"postgresql"`, set `DATABASE_URL`.
3. Set `NEXT_PUBLIC_SITE_URL`, `STORAGE_PROVIDER=blob`, and a real
   `OWNER_PASSWORD`.
4. Run `npx prisma db push` against production once, then `npm run db:seed`.

SQLite will not work on Vercel. Postgres before you go live, not after.

---

## Things worth knowing

- **Handles are permanent.** They're the address people share; letting them
  move would break every link ever posted. Reserved names are in `auth.ts`.
- **Times are UTC in the database, always**, rendered per-person on the way
  out. DST transitions are handled and were tested against EU and US changes.
- **A slot is held 15 minutes** during checkout, then releases itself. No
  cleanup job to run or pay for.
- **Availability is scoped per creator** — two people busy at 3pm is not a
  conflict.
- **Guests cancel themselves** from their email link up to 12 hours before,
  refunded automatically. Nobody has to DM anyone to move a Tuesday.
- **Server actions re-check permissions.** They're reachable by anyone who
  can guess the generated id, so every mutation scopes its query by the
  signed-in user's id rather than trusting an id from the form.
- **Moderation is a flag, not a delete.** Hidden films stay in the creator's
  studio with the reason attached, so they can fix it.

### Not built yet

- Stripe Connect onboarding (the payment split reads the fields already)
- Email verification on signup, and password reset
- HLS playback needs `hls.js` outside Safari — see the note in
  `src/lib/providers/video.ts`. Only matters once you move to Mux/Stream.
