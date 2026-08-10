/**
 * Every switch in the app, read once, in one place.
 *
 * The rule this file exists to enforce: upgrading from a free tool to a
 * paid one is an environment variable change and a redeploy. Never a
 * refactor. Adapters read from here; nothing else touches process.env.
 */

function env(key: string, fallback = ""): string {
  return process.env[key]?.trim() || fallback;
}

export const config = {
  siteUrl: env("NEXT_PUBLIC_SITE_URL", "http://localhost:3000").replace(
    /\/$/,
    "",
  ),

  platform: {
    /**
     * Default cut of each booking, in basis points. 1500 = 15%.
     * Stored per-user on signup so changing this never rewrites the terms
     * of anyone already on the platform.
     */
    feeBps: Number(env("PLATFORM_FEE_BPS", "1500")) || 0,
  },

  meeting: {
    provider: env("MEETING_PROVIDER", "jitsi") as
      | "jitsi"
      | "daily"
      | "manual",
    dailyApiKey: env("DAILY_API_KEY"),
    manualUrl: env("MANUAL_MEETING_URL"),
  },

  email: {
    provider: env("EMAIL_PROVIDER", "console") as "console" | "resend",
    resendApiKey: env("RESEND_API_KEY"),
    from: env("EMAIL_FROM", "One Talk <onboarding@resend.dev>"),
    owner: env("OWNER_EMAIL"),
  },

  stripe: {
    secretKey: env("STRIPE_SECRET_KEY"),
    webhookSecret: env("STRIPE_WEBHOOK_SECRET"),
    currency: env("CURRENCY", "eur"),
  },

  /** Only used by `npm run setup` to seed the first admin account. */
  owner: {
    handle: env("OWNER_HANDLE", "admin"),
    name: env("OWNER_NAME", "Admin"),
    email: env("OWNER_EMAIL", "you@example.com"),
    password: env("OWNER_PASSWORD"),
  },

  /**
   * Whose site this is.
   *
   * Set to a handle and the whole thing becomes one person's place: the
   * root redirects to their page, public signup is closed, and every
   * "join us" affordance disappears. Clear it and the same codebase is a
   * multi-creator platform again — the data model never changed, only what
   * the front door admits.
   */
  primaryHandle: env("PRIMARY_HANDLE").toLowerCase().replace(/^@/, ""),
} as const;

/**
 * True when the site belongs to one person rather than a platform.
 * Gates signup, the discovery feed, and all recruiting copy.
 */
export const soloMode = Boolean(config.primaryHandle);

/**
 * True when Stripe is wired up. When false the app runs in "free mode":
 * the entire booking flow works end to end, it just skips the payment
 * step. Lets you demo and test the product before you have a Stripe
 * account, and lets you offer a free session without a code change.
 */
export const paymentsEnabled = Boolean(config.stripe.secretKey);
