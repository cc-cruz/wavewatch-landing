import { headers } from "next/headers";
import { NextResponse } from "next/server";

import {
  getBillingCustomerId,
  getOrCreateUserProfile,
} from "@/lib/billing/profiles";
import { getStripe } from "@/lib/billing/stripe";
import { getAuth } from "@/lib/auth/server";

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

export async function POST(request: Request) {
  const { data: session } = await getAuth().getSession();
  const user = session?.user;

  if (!user) {
    return NextResponse.redirect(new URL("/auth/sign-in", request.url), {
      status: 303,
    });
  }

  const userProfile = await getOrCreateUserProfile(user);
  const stripeCustomerId = await getBillingCustomerId(userProfile.id);

  if (!stripeCustomerId) {
    return NextResponse.redirect(new URL("/pricing", request.url), {
      status: 303,
    });
  }

  const origin = await getRequestOrigin(request);
  const portalSession = await getStripe().billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${origin}/account/settings`,
  });

  return NextResponse.redirect(portalSession.url, { status: 303 });
}
