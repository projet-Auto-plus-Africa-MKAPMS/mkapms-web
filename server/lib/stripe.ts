import Stripe from "stripe";
import { env } from "../env.js";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (!env.STRIPE_SECRET_KEY) return null;
  if (!_stripe) {
    _stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-10-28.acacia" as Stripe.LatestApiVersion,
    });
  }
  return _stripe;
}

export const stripeConfigured = () => !!env.STRIPE_SECRET_KEY;
