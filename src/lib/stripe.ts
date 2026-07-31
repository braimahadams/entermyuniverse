import Stripe from "stripe";
import { config } from "@/lib/config";

/**
 * Stripe client, created lazily.
 *
 * The app is designed to boot and run fully without Stripe keys (free
 * mode), so constructing this at module load would break every route that
 * merely imports something nearby.
 */
let client: Stripe | null = null;

export function stripe(): Stripe {
  if (!config.stripe.secretKey) {
    throw new Error("Stripe is not configured — STRIPE_SECRET_KEY is unset.");
  }
  client ??= new Stripe(config.stripe.secretKey, {
    // Pin the version. Stripe ships breaking changes behind dates, and an
    // unpinned integration can start failing on a day you didn't deploy.
    apiVersion: "2025-01-27.acacia" as Stripe.LatestApiVersion,
    typescript: true,
  });
  return client;
}
