import { NextResponse } from "next/server";
import type Stripe from "stripe";

import {
  upsertBillingCustomer,
} from "@/lib/billing/profiles";
import {
  markSubscriptionStatus,
  upsertSubscriptionFromStripe,
} from "@/lib/billing/subscriptions";
import { getStripe } from "@/lib/billing/stripe";
import { getSql } from "@/lib/db";

export const dynamic = "force-dynamic";

function getStripeId(value: string | { id: string } | null | undefined) {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : value.id;
}

async function recordWebhookEvent(event: Stripe.Event) {
  const sql = getSql();
  const rows = (await sql`
    insert into wavewatch.stripe_webhook_events (
      stripe_event_id,
      event_type,
      payload
    )
    values (
      ${event.id},
      ${event.type},
      ${JSON.stringify(event)}::jsonb
    )
    on conflict (stripe_event_id) do nothing
    returning stripe_event_id
  `) as { stripe_event_id: string }[];

  return rows.length > 0;
}

async function forgetWebhookEvent(event: Stripe.Event) {
  const sql = getSql();

  await sql`
    delete from wavewatch.stripe_webhook_events
    where stripe_event_id = ${event.id}
  `;
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const stripe = getStripe();
  const customerId = getStripeId(session.customer);
  const subscriptionId = getStripeId(session.subscription);
  const userProfileId = session.metadata?.user_profile_id;

  if (customerId && userProfileId) {
    await upsertBillingCustomer({
      userProfileId,
      stripeCustomerId: customerId,
    });
  }

  if (!subscriptionId) {
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await upsertSubscriptionFromStripe(subscription);
}

function getInvoiceSubscriptionId(invoice: Stripe.Invoice) {
  const directSubscription = (invoice as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null;
  }).subscription;
  const parentSubscription = (
    invoice as Stripe.Invoice & {
      parent?: {
        subscription_details?: {
          subscription?: string | Stripe.Subscription | null;
        } | null;
      } | null;
    }
  ).parent?.subscription_details?.subscription;

  return getStripeId(directSubscription) ?? getStripeId(parentSubscription);
}

async function syncSubscriptionFromInvoice(invoice: Stripe.Invoice) {
  const subscriptionId = getInvoiceSubscriptionId(invoice);

  if (!subscriptionId) {
    return;
  }

  const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
  await upsertSubscriptionFromStripe(subscription);
}

async function handleWebhookEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object);
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await upsertSubscriptionFromStripe(event.data.object);
      break;
    case "invoice.paid":
      await syncSubscriptionFromInvoice(event.data.object);
      break;
    case "invoice.payment_failed": {
      const invoice = event.data.object;
      const subscriptionId = getInvoiceSubscriptionId(invoice);

      if (subscriptionId) {
        await markSubscriptionStatus({
          stripeSubscriptionId: subscriptionId,
          status: "past_due",
        });
      }

      await syncSubscriptionFromInvoice(invoice);
      break;
    }
    default:
      break;
  }
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Missing STRIPE_WEBHOOK_SECRET." },
      { status: 500 },
    );
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature." },
      { status: 400 },
    );
  }

  const payload = await request.text();
  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      payload,
      signature,
      webhookSecret,
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid Stripe signature." },
      { status: 400 },
    );
  }

  const shouldProcess = await recordWebhookEvent(event);

  if (!shouldProcess) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    await handleWebhookEvent(event);
  } catch (error) {
    await forgetWebhookEvent(event);
    throw error;
  }

  return NextResponse.json({ received: true });
}
