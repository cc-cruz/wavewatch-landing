import Stripe from "stripe";

import {
  getBillingPriceConfig,
  getPlanKeyForPrice,
  type BillingCadence,
  type PlanKey,
} from "@/lib/pricing";

let stripeInstance: Stripe | null = null;

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY.");
  }

  if (!stripeInstance) {
    stripeInstance = new Stripe(secretKey, {
      apiVersion: "2026-04-22.dahlia",
      appInfo: {
        name: "WaveWatch",
        version: "0.1.0",
      },
    });
  }

  return stripeInstance;
}

export async function resolveStripePrice({
  planKey,
  cadence,
}: {
  planKey: PlanKey;
  cadence: BillingCadence;
}) {
  const stripe = getStripe();
  const config = getBillingPriceConfig(planKey, cadence);
  const configuredPriceId = process.env[config.priceEnv];

  if (configuredPriceId && configuredPriceId !== "price_replace_me") {
    const price = await stripe.prices.retrieve(configuredPriceId);

    return {
      price,
      priceId: price.id,
      lookupKey: price.lookup_key ?? config.lookupKey,
      planKey,
    };
  }

  const prices = await stripe.prices.list({
    active: true,
    lookup_keys: [config.lookupKey],
    limit: 1,
  });
  const price = prices.data[0];

  if (!price) {
    throw new Error(`Missing Stripe price for ${config.lookupKey}.`);
  }

  return {
    price,
    priceId: price.id,
    lookupKey: price.lookup_key ?? config.lookupKey,
    planKey,
  };
}

export function getProductIdFromPrice(price: Stripe.Price) {
  return typeof price.product === "string" ? price.product : price.product.id;
}

export function inferPlanKeyFromPrice(price: Stripe.Price): PlanKey | null {
  const metadataPlanKey = price.metadata.plan_key;

  if (
    metadataPlanKey === "founder" ||
    metadataPlanKey === "core" ||
    metadataPlanKey === "pro" ||
    metadataPlanKey === "operator"
  ) {
    return metadataPlanKey;
  }

  return getPlanKeyForPrice({
    priceId: price.id,
    lookupKey: price.lookup_key,
  });
}
