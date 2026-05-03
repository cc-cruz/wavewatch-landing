import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";

import {
  getBillingCustomerId,
  getOrCreateUserProfile,
  upsertBillingCustomer,
} from "@/lib/billing/profiles";
import {
  pendingBillingCookieOptions,
  pendingCadenceCookieName,
  pendingPlanCookieName,
} from "@/lib/billing/pending-plan";
import { getStripe, resolveStripePrice } from "@/lib/billing/stripe";
import { getAuth } from "@/lib/auth/server";
import {
  normalizeBillingCadence,
  normalizePlanKey,
  type BillingCadence,
  type PlanKey,
} from "@/lib/pricing";

export const dynamic = "force-dynamic";

async function getRequestOrigin(request: Request) {
  const headerStore = await headers();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (appUrl) {
    return appUrl.replace(/\/$/, "");
  }

  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") ?? "http";

  if (host) {
    return `${proto}://${host}`;
  }

  return new URL(request.url).origin;
}

async function getRequestedPlan(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (request.method === "POST" && contentType.includes("application/json")) {
    const body = (await request.json().catch(() => null)) as {
      planKey?: string;
      plan?: string;
      cadence?: string;
    } | null;
    const planKey = normalizePlanKey(body?.planKey ?? body?.plan);
    const cadence = normalizeBillingCadence(planKey, body?.cadence);

    return { planKey, cadence };
  }

  if (request.method === "POST") {
    const formData = await request.formData();
    const planKey = normalizePlanKey(String(formData.get("planKey") ?? ""));
    const cadence = normalizeBillingCadence(
      planKey,
      String(formData.get("cadence") ?? ""),
    );

    return { planKey, cadence };
  }

  const url = new URL(request.url);
  const cookieStore = await cookies();
  const planKey = normalizePlanKey(
    url.searchParams.get("planKey") ??
      url.searchParams.get("plan") ??
      cookieStore.get(pendingPlanCookieName)?.value,
  );
  const cadence = normalizeBillingCadence(
    planKey,
    url.searchParams.get("cadence") ??
      cookieStore.get(pendingCadenceCookieName)?.value,
  );

  return { planKey, cadence };
}

function redirectToSignUp({
  request,
  planKey,
  cadence,
}: {
  request: Request;
  planKey: PlanKey;
  cadence: BillingCadence;
}) {
  const url = new URL("/auth/sign-up", request.url);
  url.searchParams.set("plan", planKey);
  url.searchParams.set("cadence", cadence);
  const response = NextResponse.redirect(url, { status: 303 });

  response.cookies.set(pendingPlanCookieName, planKey, pendingBillingCookieOptions);
  response.cookies.set(
    pendingCadenceCookieName,
    cadence,
    pendingBillingCookieOptions,
  );

  return response;
}

async function getOrCreateStripeCustomer({
  user,
  userProfileId,
}: {
  user: { id: string; email?: string | null; name?: string | null };
  userProfileId: string;
}) {
  const existingCustomerId = await getBillingCustomerId(userProfileId);

  if (existingCustomerId) {
    return existingCustomerId;
  }

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email: user.email ?? undefined,
    name: user.name ?? undefined,
    metadata: {
      auth_user_id: user.id,
      user_profile_id: userProfileId,
      app: "wavewatch",
    },
  });

  await upsertBillingCustomer({
    userProfileId,
    stripeCustomerId: customer.id,
  });

  return customer.id;
}

async function createCheckoutRedirect({
  request,
  planKey,
  cadence,
}: {
  request: Request;
  planKey: PlanKey;
  cadence: BillingCadence;
}) {
  const { data: session } = await getAuth().getSession();
  const user = session?.user;

  if (!user) {
    return redirectToSignUp({ request, planKey, cadence });
  }

  const userProfile = await getOrCreateUserProfile(user);
  const stripeCustomerId = await getOrCreateStripeCustomer({
    user,
    userProfileId: userProfile.id,
  });
  const { priceId, lookupKey } = await resolveStripePrice({ planKey, cadence });
  const stripe = getStripe();
  const origin = await getRequestOrigin(request);
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: stripeCustomerId,
    client_reference_id: userProfile.id,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    allow_promotion_codes: true,
    success_url: `${origin}/onboarding?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing?checkout=cancelled&plan=${planKey}`,
    metadata: {
      auth_user_id: user.id,
      user_profile_id: userProfile.id,
      plan_key: planKey,
      cadence,
      lookup_key: lookupKey,
    },
    subscription_data: {
      metadata: {
        auth_user_id: user.id,
        user_profile_id: userProfile.id,
        plan_key: planKey,
        cadence,
        lookup_key: lookupKey,
      },
    },
  });

  if (!checkoutSession.url) {
    throw new Error("Stripe Checkout did not return a redirect URL.");
  }

  const response = NextResponse.redirect(checkoutSession.url, { status: 303 });
  response.cookies.delete(pendingPlanCookieName);
  response.cookies.delete(pendingCadenceCookieName);

  return response;
}

export async function GET(request: Request) {
  const { planKey, cadence } = await getRequestedPlan(request);

  return createCheckoutRedirect({ request, planKey, cadence });
}

export async function POST(request: Request) {
  const { planKey, cadence } = await getRequestedPlan(request);

  return createCheckoutRedirect({ request, planKey, cadence });
}
