# WaveWatch Architecture Notes

## Product Boundary

The app layer owns the relationship with the user. The worker layer owns heavy forecast reasoning.

The user should experience WaveWatch as one expert number and one clean app. They should not see cron, queues, runtime health, Sendblue internals, or prompt operations.

## Layers

| Layer | Responsibility |
| --- | --- |
| Public site | Explain the product and route users into signup/app |
| Consumer app | Today, My Water, Text Rituals, Ask, Memory |
| Auth | Identity, session, protected routes |
| Billing | Stripe checkout, subscription sync, entitlements, usage gating |
| Profile store | User water context and delivery preferences |
| Briefing orchestrator | Builds user-specific forecast requests |
| Forecast worker | OpenClaw/Pickaxe marine reasoning |
| Delivery layer | SMS/iMessage send, reply, retry, opt-out |
| Ops console | Internal observability and manual control |

## Suggested Data Model

Auth itself lives in Neon's managed `neon_auth` schema. WaveWatch-owned profile and briefing tables live in the `wavewatch` schema, with `auth_user_id` linking a WaveWatch profile back to the Neon Auth user.

### UserProfile

- `id`
- `authUserId`
- `displayName`
- `phoneNumber`
- `phoneVerifiedAt`
- `homeRegionId`
- `riskTolerance`
- `briefingTone`
- `briefingLength`
- `quietHoursStart`
- `quietHoursEnd`
- `createdAt`
- `updatedAt`

### BillingCustomer

- `id`
- `userId`
- `stripeCustomerId`
- `createdAt`
- `updatedAt`

### Subscription

- `id`
- `userId`
- `stripeCustomerId`
- `stripeSubscriptionId`
- `stripePriceId`
- `stripeProductId`
- `planKey`
- `status`
- `currentPeriodStart`
- `currentPeriodEnd`
- `cancelAtPeriodEnd`
- `createdAt`
- `updatedAt`

### UsageEvent

- `id`
- `userId`
- `subscriptionId`
- `eventType`
- `quantity`
- `usageMonth`
- `idempotencyKey`
- `status`
- `metadata`
- `createdAt`

### SavedSpot

- `id`
- `userId`
- `activity`
- `label`
- `regionId`
- `latitude`
- `longitude`
- `notes`
- `isPrimary`
- `createdAt`
- `updatedAt`

### BriefingRitual

- `id`
- `userId`
- `type`
- `label`
- `schedule`
- `timezone`
- `deliveryChannel`
- `onlyIfWorthIt`
- `enabled`
- `createdAt`
- `updatedAt`

### ForecastRun

- `id`
- `userId`
- `ritualId`
- `spotId`
- `activity`
- `status`
- `call`
- `briefingWindow`
- `risk`
- `confidence`
- `why`
- `sourceFamilies`
- `workerRequestId`
- `createdAt`

### MessageDelivery

- `id`
- `userId`
- `forecastRunId`
- `channel`
- `to`
- `body`
- `status`
- `providerMessageId`
- `sentAt`
- `deliveredAt`
- `failedAt`
- `failureReason`

## Current Repo Mapping

| Current Code | Future Role |
| --- | --- |
| `app/page.tsx` | Public marketing and demo |
| `app/pricing/page.tsx` | Public pricing and plan limits |
| `app/app/page.tsx` | Consumer app home |
| `app/auth/[path]/page.tsx` | Neon Auth UI flows |
| `app/account/[path]/page.tsx` | Neon Auth account settings |
| `app/api/auth/[...path]/route.ts` | Neon Auth API proxy |
| `app/api/billing/checkout/route.ts` | Stripe Checkout Session creation |
| `app/api/billing/portal/route.ts` | Stripe Customer Portal redirect |
| `app/api/billing/webhook/route.ts` | Stripe webhook verification and subscription sync |
| `app/console/page.tsx` | Internal ops console |
| `app/api/pickaxe/route.ts` | Forecast worker proxy, later auth/context aware |
| `app/api/location/route.ts` | Region helper for onboarding/defaults |
| `db/schema.sql` | Initial WaveWatch-owned product tables |
| `lib/db.ts` | Lazy Neon serverless SQL client |
| `lib/marine-regions.ts` | Seed regions/spots until user data exists |
| `lib/pricing.ts` | Public plan copy and internal lookup keys |

## Environment

Tracked files should only contain placeholders. Runtime secrets belong in `.env.local` and Vercel project env vars.

- `NEON_AUTH_BASE_URL`: Neon Auth URL from the Neon branch configuration.
- `NEON_AUTH_COOKIE_SECRET`: at least 32 characters, generated with `openssl rand -base64 32`.
- `NEON_AUTH_JWKS_URL`: Neon Auth JWKS URL for RLS/Data API integration.
- `DATABASE_URL`: pooled Neon Postgres connection string.
- `PICKAXE_DEPLOYMENT_TOKEN`: forecast worker token.
- `STRIPE_SECRET_KEY`: Stripe server API key for checkout, portal, and webhook lookups.
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook signing secret.
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: publishable Stripe key for future client-side billing surfaces.
- `NEXT_PUBLIC_APP_URL`: canonical deployed app URL for checkout redirect URLs.
