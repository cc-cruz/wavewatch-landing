# WaveWatch Product Source Of Truth

## Thesis

WaveWatch is an elite ocean-briefing agent in your texts.

The core product is the number. The web app exists to onboard the user, calibrate the relationship, and make the daily briefing loop feel personal without exposing the machinery behind it.

## Positioning

WaveWatch is not a generic forecast dashboard and it is not a user-configurable agent builder.

It is OpenClaw/Poke narrowed to ocean people:

- One expert number that knows your water.
- Proactive briefings on your schedule.
- Natural follow-up questions in the same thread.
- Saved spots, activities, risk tolerance, and delivery preferences.
- Expert calls by default, personalized in timing and tone.

The user teaches WaveWatch their ocean life. WaveWatch owns the judgment.

## Product Principle

Elite by default, personal in delivery.

Users configure:

- Where they care about.
- What they do on the water.
- When they want to hear from WaveWatch.
- How cautious the call should be.
- How concise or detailed the briefing should feel.
- Which number receives the texts.

WaveWatch owns:

- Forecast interpretation.
- Source blending.
- Go, maybe, skip, or watch calls.
- Hazard escalation.
- Message suppression when nothing meaningful changed.
- Expert briefing structure.

## Pricing Principle

Sell the calibrated relationship, not raw credits.

The buyer should understand plans as "how much of my ocean life can WaveWatch
watch for me?" rather than "how many tokens do I get?" Internally, usage should
still be metered so delivery cost, worker cost, and abuse controls stay real.

Launch packaging:

- Founder Annual: $99 first year for early access.
- Core: $15/month for one person's basic water ritual.
- Pro: $50/month for serious personal use.
- Operator: $99/month for guides, charters, crews, and client-facing planning.

## Core User Loop

1. User signs up.
2. User adds phone number.
3. User saves spots and activities.
4. User chooses text rituals.
5. WaveWatch sends a daily or event-based briefing.
6. User asks follow-up questions by text or in the app.
7. WaveWatch remembers preferences and improves future calls.

## Primary Product Surfaces

### Today

The main answer. It should lead with a call, not charts.

Required content:

- Call: Go, Maybe, Skip, or Watch.
- Best window.
- Why.
- What breaks the call.
- Confidence.
- Next scheduled text.

### My Water

The user's saved coastline, spots, activities, and constraints.

Examples:

- Home surf break.
- Harbor or launch.
- Fishing grounds.
- Dive zone.
- Boat size or comfort limits.
- Favorite tide/wind setup.

### Text Rituals

User-facing version of cron and automation.

Examples:

- Dawn patrol text.
- Weekend lookahead.
- Big swell alert.
- Harbor safety watch.
- Fishing window.
- Dive viz watch.

### Ask WaveWatch

The in-app version of the same expert number.

This should feel like a conversation with the briefing agent, not a generic chatbot. The user can ask about a plan, trip, timing window, or saved spot.

### Memory

What WaveWatch knows and uses.

Examples:

- "You prefer clean wind over size."
- "You usually surf before work."
- "You do not want marginal-condition texts."
- "You fish offshore only when the return window is stable."

## Internal Surface

`/console` remains the internal ops cockpit.

It can expose:

- Runtime health.
- Delivery health.
- Queue and send state.
- Prompt/playbook internals.
- Manual review.
- Debug logs.

End users should not see this model of the product.
