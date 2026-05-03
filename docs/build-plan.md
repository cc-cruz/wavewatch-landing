# WaveWatch Build Plan

## Product Direction

Start consumer/prosumer.

The first real product is for one ocean person who wants an expert number to text them useful calls about their spots. Team and operator workflows can come later, but the initial product loop needs to feel complete for an individual.

## Route Split

| Route | Audience | Role |
| --- | --- | --- |
| `/` | Public | Marketing and live demo entry |
| `/app` | End user | Today, spots, rituals, memory, ask |
| `/auth/sign-in` | End user | Neon Auth sign-in |
| `/auth/sign-up` | End user | Neon Auth account creation |
| `/sign-in` | End user | Redirect to `/auth/sign-in` |
| `/sign-up` | End user | Redirect to `/auth/sign-up` |
| `/account/settings` | End user | Neon Auth account management |
| `/pricing` | Public | Pricing, launch tiers, plan limits |
| `/onboarding` | End user | Phone, water, rituals, risk |
| `/console` | Internal | Ops cockpit around workers, delivery, prompts |

## MVP Slice

### Phase 1 - Product Shell

- Add `/app` consumer surface.
- Keep `/console` internal.
- Update public CTAs away from `/console`.
- Document product model and implementation boundary.

### Phase 2 - Auth

- Install and configure Neon Auth.
- Add Neon Auth API proxy at `/api/auth/[...path]`.
- Add auth UI routes at `/auth/sign-in` and `/auth/sign-up`.
- Protect `/app`, `/onboarding`, and future user APIs.
- Keep `/` public.
- Decide whether `/console` is protected by Neon Auth admin role or left behind a separate internal gate.

Required production env:

- `NEON_AUTH_BASE_URL`
- `NEON_AUTH_COOKIE_SECRET`
- `NEON_AUTH_JWKS_URL`
- `DATABASE_URL`

### Phase 3 - User Profile And Onboarding

Create persistent user settings:

- Phone number and verification state.
- Home region.
- Saved spots.
- Activities.
- Risk tolerance.
- Briefing tone/length.
- Quiet hours.

### Phase 3.5 - Pricing And Billing

Use Stripe Billing, Checkout Sessions, and the Customer Portal.

Product decision:

- Sell relationship tiers, not visible credits.
- Keep internal usage units for asks, forecast runs, proactive texts, and hazard scans.
- Launch with Founder Annual, Core, Pro, then Operator once real usage data supports the workflow.

Required billing env:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_APP_URL`

Implementation:

- Create Stripe Products and Prices with stable lookup keys.
- Add billing customer, subscription, usage, and webhook-event tables.
- Add checkout, webhook, and billing portal routes.
- Preserve selected plan through sign-up.
- Gate onboarding, saved spots, rituals, asks, nowcasts, and proactive sends by active plan.

### Phase 4 - Briefing Engine Boundary

Use the app layer to assemble the user's context and call the forecast worker.

Inputs:

- User profile.
- Saved spots.
- Requested activity.
- Briefing ritual.
- Delivery channel.
- Current forecast context.

Output:

- Structured briefing with call, window, risk, confidence, why, and source families.

### Phase 5 - Delivery

Turn text delivery into the main product loop:

- Text me now.
- Scheduled sends.
- Hazard/event sends.
- Delivery audit.
- Reply threading.
- Opt-out and quiet-hour handling.

## Near-Term Work Queue

1. Build `/app` as the end-user product home.
2. Add Neon Auth routes, provider, and middleware.
3. Add onboarding screens for phone, water, rituals, and risk.
4. Add pricing and billing plan, public pricing UI, and Stripe product setup.
5. Add a simple profile persistence layer.
6. Wire `Text me now` to the existing forecast worker.
7. Move dev-tool language out of public surfaces.
