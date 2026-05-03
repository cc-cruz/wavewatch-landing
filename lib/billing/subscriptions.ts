import type Stripe from "stripe";

import {
  getProductIdFromPrice,
  getStripe,
  inferPlanKeyFromPrice,
} from "@/lib/billing/stripe";
import {
  getUserProfileIdForStripeCustomer,
  upsertBillingCustomer,
} from "@/lib/billing/profiles";
import { getSql } from "@/lib/db";
import type { PlanKey } from "@/lib/pricing";

type SubscriptionLike = Stripe.Subscription & {
  current_period_start?: number | null;
  current_period_end?: number | null;
};

function timestampToIso(timestamp: number | null | undefined) {
  return timestamp ? new Date(timestamp * 1000).toISOString() : null;
}

function getStripeId(value: string | { id: string } | null | undefined) {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : value.id;
}

export async function upsertSubscriptionFromStripe(
  subscription: Stripe.Subscription,
) {
  const sql = getSql();
  const stripe = getStripe();
  const subscriptionLike = subscription as SubscriptionLike;
  const customerId = getStripeId(subscription.customer);

  if (!customerId) {
    return null;
  }

  const firstItem = subscription.items.data[0];
  let price = firstItem?.price ?? null;

  if (!price) {
    return null;
  }

  if (!price.lookup_key && price.id) {
    price = await stripe.prices.retrieve(price.id);
  }

  const productId = getProductIdFromPrice(price);
  const metadataProfileId = subscription.metadata.user_profile_id;
  const userProfileId =
    metadataProfileId || (await getUserProfileIdForStripeCustomer(customerId));

  if (!userProfileId) {
    return null;
  }

  await upsertBillingCustomer({
    userProfileId,
    stripeCustomerId: customerId,
  });

  const metadataPlanKey = subscription.metadata.plan_key;
  const inferredPlanKey = inferPlanKeyFromPrice(price);
  const planKey = (
    metadataPlanKey === "founder" ||
    metadataPlanKey === "core" ||
    metadataPlanKey === "pro" ||
    metadataPlanKey === "operator"
      ? metadataPlanKey
      : inferredPlanKey
  ) satisfies PlanKey | null;

  if (!planKey) {
    return null;
  }

  await sql`
    insert into wavewatch.subscriptions (
      user_profile_id,
      stripe_customer_id,
      stripe_subscription_id,
      stripe_price_id,
      stripe_product_id,
      plan_key,
      status,
      current_period_start,
      current_period_end,
      cancel_at_period_end,
      metadata
    )
    values (
      ${userProfileId},
      ${customerId},
      ${subscription.id},
      ${price.id},
      ${productId},
      ${planKey},
      ${subscription.status},
      ${timestampToIso(subscriptionLike.current_period_start)},
      ${timestampToIso(subscriptionLike.current_period_end)},
      ${subscription.cancel_at_period_end},
      ${JSON.stringify(subscription.metadata)}::jsonb
    )
    on conflict (stripe_subscription_id) do update
      set
        user_profile_id = excluded.user_profile_id,
        stripe_customer_id = excluded.stripe_customer_id,
        stripe_price_id = excluded.stripe_price_id,
        stripe_product_id = excluded.stripe_product_id,
        plan_key = excluded.plan_key,
        status = excluded.status,
        current_period_start = excluded.current_period_start,
        current_period_end = excluded.current_period_end,
        cancel_at_period_end = excluded.cancel_at_period_end,
        metadata = excluded.metadata,
        updated_at = now()
  `;

  return {
    userProfileId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    planKey,
  };
}

export async function markSubscriptionStatus({
  stripeSubscriptionId,
  status,
}: {
  stripeSubscriptionId: string;
  status: Stripe.Subscription.Status;
}) {
  const sql = getSql();

  await sql`
    update wavewatch.subscriptions
    set status = ${status}, updated_at = now()
    where stripe_subscription_id = ${stripeSubscriptionId}
  `;
}
