# WaveWatch Pricing And Billing Plan

## Decision

Do not sell consumer-facing credits.

WaveWatch should feel like a personal expert number, not a metered developer
tool. The user buys a relationship tier. Internally, the app still meters usage
units so SMS delivery, forecast runs, assistant asks, and expensive hazard
checks can be gated predictably.

Do not promise unlimited during the launch period. Use generous fair-use
language where needed, but keep hard internal ceilings in the entitlement layer.

## Launch Pricing

| Stage | Offer | Price | Buyer | Purpose |
| --- | --- | --- | --- | --- |
| Stage 0 | Founder Annual | $99/year | Early ocean people | Validate willingness to pay and collect usage data |
| Stage 1 | Core | $15/month | Personal casual/weekly user | Daily or weekend ritual for a few spots |
| Stage 1 | Pro | $50/month | Serious frequent user | More spots, more rituals, more follow-ups, priority watches |
| Stage 2 | Operator | $99/month | Guides, charters, crews | Client/trip planning and operational workflows |

Annual pricing can launch after monthly conversion is understood:

| Plan | Monthly lookup key | Annual lookup key | Suggested annual price |
| --- | --- | --- | --- |
| Founder | n/a | `wavewatch_founder_annual_v1` | $99 first year |
| Core | `wavewatch_core_monthly_v1` | `wavewatch_core_annual_v1` | $120/year |
| Pro | `wavewatch_pro_monthly_v1` | `wavewatch_pro_annual_v1` | $480/year |
| Operator | `wavewatch_operator_monthly_v1` | `wavewatch_operator_annual_v1` | $948/year |

## Entitlements

| Capability | Core | Pro | Operator |
| --- | --- | --- | --- |
| Verified phone numbers | 1 | 1 | 1 operator number |
| Saved spots | 3 | 15 | 50 |
| Text rituals | 2 | 8 | 25 |
| Proactive text sends | 45/month | 200/month | 1,000/month |
| Ask WaveWatch | 40/month | 200/month | 750/month |
| Text me now | 10/month | 60/month | 200/month |
| Hazard/event watch | Fair use | Priority | Priority plus review hooks |
| Activities | 1 primary | Multi-activity | Multi-activity plus audiences |
| Manual review/override | No | No | Yes |

## Internal Usage Units

Expose plan limits in human terms. Store usage as events.

| Event | Unit | Notes |
| --- | --- | --- |
| `assistant_ask` | 1 per completed answer | App asks and text replies |
| `forecast_run` | 1 per worker call | Includes scheduled and manual runs |
| `proactive_text` | 1 per outbound user-visible text | Suppressed messages do not count |
| `hazard_scan` | 1 per scan window | Can be bundled or discounted by plan |
| `operator_review` | 1 per manual review action | Operator only |

Gating should happen before expensive work:

1. Resolve signed-in user.
2. Load active subscription and plan key.
3. Load current-period usage.
4. Check the requested action against entitlement.
5. Write a pending usage event or idempotency key.
6. Run the expensive action.
7. Mark usage as completed or failed.

## Stripe Setup

Use Stripe Billing with Checkout Sessions for subscription starts. Use Prices,
not deprecated Plans. Store Stripe IDs in the database, but drive app behavior
from stable lookup keys and internal plan keys.

Required products:

| Product | Product key | Prices |
| --- | --- | --- |
| WaveWatch Founder | `wavewatch_founder` | `wavewatch_founder_annual_v1` |
| WaveWatch Core | `wavewatch_core` | `wavewatch_core_monthly_v1`, `wavewatch_core_annual_v1` |
| WaveWatch Pro | `wavewatch_pro` | `wavewatch_pro_monthly_v1`, `wavewatch_pro_annual_v1` |
| WaveWatch Operator | `wavewatch_operator` | `wavewatch_operator_monthly_v1`, `wavewatch_operator_annual_v1` |

Example Stripe CLI creation flow:

```sh
stripe products create \
  --name "WaveWatch Core" \
  --metadata[plan_key]=core

stripe prices create \
  --product prod_REPLACE_ME \
  --currency usd \
  --unit-amount 1500 \
  --recurring[interval]=month \
  --lookup-key wavewatch_core_monthly_v1 \
  --metadata[plan_key]=core
```

Repeat for each price. After creation, copy the real product and price IDs into
Stripe metadata records and the database. Do not hard-code live `price_...` IDs
inside UI components.

## Checkout Flow

Route:

- `POST /api/billing/checkout`

Input:

- `planKey`: `founder`, `core`, `pro`, or `operator`
- `cadence`: `monthly`, `annual`, or `launch`

Server behavior:

1. Require an authenticated Neon Auth session.
2. Ensure `wavewatch.user_profiles` exists.
3. Resolve or create a Stripe Customer for the profile.
4. Resolve Stripe Price by lookup key.
5. Create a Checkout Session with `mode: "subscription"`.
6. Include `client_reference_id` and metadata:
   - `auth_user_id`
   - `user_profile_id`
   - `plan_key`
7. Redirect the user to Stripe Checkout.

Success and cancel URLs:

- Success: `/onboarding?checkout=success`
- Cancel: `/pricing?checkout=cancelled&plan=PLAN_KEY`

## Webhooks

Route:

- `POST /api/billing/webhook`

Handle these events first:

| Event | Action |
| --- | --- |
| `checkout.session.completed` | Link customer, subscription, plan key, and user profile |
| `customer.subscription.created` | Upsert subscription record |
| `customer.subscription.updated` | Update status, price, plan, period, cancellation state |
| `customer.subscription.deleted` | Mark subscription cancelled |
| `invoice.payment_failed` | Mark payment issue and restrict new expensive actions |
| `invoice.paid` | Confirm active access and reset period usage if needed |

Webhook writes must be idempotent by Stripe event ID.

## Customer Portal

Route:

- `POST /api/billing/portal`

Behavior:

1. Require auth.
2. Load Stripe Customer ID.
3. Create a Stripe Billing Portal session.
4. Redirect to Stripe.

App placement:

- `/account/settings` should expose "Manage billing".
- Plan upgrade prompts should link to checkout.
- Cancellation and card changes should stay in the Stripe portal for the MVP.

## Onboarding Integration

Billing should happen before full onboarding once checkout is live.

Recommended flow:

1. User lands on `/pricing`.
2. User chooses a plan.
3. Anonymous users go to `/auth/sign-up?plan=PLAN_KEY`.
4. After auth, app resumes checkout with the selected plan.
5. Stripe success redirects to `/onboarding?checkout=success`.
6. Onboarding collects:
   - phone number
   - home water
   - saved spots
   - activity
   - first text ritual
   - tone and risk tolerance
7. The first ritual is constrained by the active plan entitlement.

Until checkout is wired, `/sign-up?plan=PLAN_KEY` is acceptable as a planning
handoff. The selected plan should eventually be preserved in auth return state
or a short-lived cookie.

## Database Shape

Add billing and usage tables to the `wavewatch` schema:

- `billing_customers`: one Stripe customer per user profile.
- `subscriptions`: active and historical Stripe subscriptions.
- `usage_events`: append-only usage ledger for asks, runs, sends, scans.
- `stripe_webhook_events`: idempotency table for processed webhook events.

The app should not infer entitlements from UI strings. Use `plan_key`.

## Gating Map

| Surface | Gate |
| --- | --- |
| Add saved spot | `saved_spots` count by active plan |
| Add text ritual | `briefing_rituals` count by active plan |
| Enable ritual | active subscription and ritual limit |
| Text me now | current-period `forecast_run` and `proactive_text` limits |
| Ask WaveWatch | current-period `assistant_ask` limit |
| Hazard watch | plan capability and scan usage |
| Operator workflows | `plan_key = operator` |

When a user hits a limit, the product response should be:

- Keep existing rituals running when possible.
- Block creating new expensive work.
- Explain which plan unlocks the next natural step.
- Offer checkout directly from the blocked action.

## Environment

Required Vercel env vars for billing:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_APP_URL`

Optional if lookup keys are not enough:

- `STRIPE_PRICE_WAVEWATCH_FOUNDER_ANNUAL`
- `STRIPE_PRICE_WAVEWATCH_CORE_MONTHLY`
- `STRIPE_PRICE_WAVEWATCH_CORE_ANNUAL`
- `STRIPE_PRICE_WAVEWATCH_PRO_MONTHLY`
- `STRIPE_PRICE_WAVEWATCH_PRO_ANNUAL`
- `STRIPE_PRICE_WAVEWATCH_OPERATOR_MONTHLY`
- `STRIPE_PRICE_WAVEWATCH_OPERATOR_ANNUAL`

Prefer lookup keys in code and database records. Use explicit price env vars
only as a safety fallback during early deploys.

## Implementation Order

1. Add `/pricing` and public pricing cards.
2. Create Stripe products and prices with lookup keys.
3. Add billing tables.
4. Add checkout route.
5. Add webhook route and idempotent subscription sync.
6. Add billing portal route.
7. Preserve selected plan through sign-up.
8. Wire onboarding to active plan entitlements.
9. Gate saved spots, rituals, asks, nowcasts, and proactive sends.
10. Add account billing status and upgrade prompts.
