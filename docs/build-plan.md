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
4. Add a simple profile persistence layer.
5. Wire `Text me now` to the existing forecast worker.
6. Move dev-tool language out of public surfaces.
