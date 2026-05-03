import { ArrowRight, Check, Radio, Waves } from "lucide-react";

import { Button } from "@/components/ui/button";
import { founderOffer, gatingRows, pricingTiers } from "@/lib/pricing";
import { cn } from "@/lib/utils";

type PricingSectionProps = {
  compact?: boolean;
};

export function PricingSection({ compact = false }: PricingSectionProps) {
  return (
    <section id="pricing" className={cn("border-b border-border", compact && "bg-muted/20")}>
      <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <div className="mb-12 grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-end">
          <div>
            <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
              Pricing
            </p>
            <h2 className="mb-4 text-2xl font-semibold md:text-3xl">
              Pay for the relationship, not a pile of credits.
            </h2>
            <p className="max-w-2xl text-muted-foreground">
              WaveWatch is one expert ocean number, calibrated to your water.
              Plans scale by spots, rituals, proactive texts, and serious-use
              limits without making the product feel like a meter.
            </p>
          </div>

          <div className="border border-border bg-background p-5">
            <div className="mb-3 flex items-center gap-2">
              <Radio className="h-4 w-4" aria-hidden="true" />
              <p className="text-sm font-medium">{founderOffer.name}</p>
            </div>
            <div className="mb-2 flex items-baseline gap-2">
              <span className="text-3xl font-semibold">{founderOffer.price}</span>
              <span className="text-sm text-muted-foreground">
                {founderOffer.cadence}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{founderOffer.summary}</p>
            <CheckoutForm
              planKey={founderOffer.key}
              cadence={founderOffer.billingCadence}
              label="Join Founder"
              variant="outline"
              className="mt-5"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {pricingTiers.map((tier) => (
            <div
              key={tier.key}
              className={cn(
                "flex min-h-full flex-col border border-border bg-card p-6",
                tier.featured && "border-foreground shadow-sm",
              )}
            >
              <div className="mb-6">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    {tier.eyebrow}
                  </p>
                  {tier.featured ? (
                    <span className="border border-foreground px-2 py-1 text-[11px] uppercase tracking-wider">
                      Best fit
                    </span>
                  ) : null}
                </div>
                <h3 className="mb-3 text-xl font-semibold">{tier.name}</h3>
                <div className="mb-3 flex items-baseline gap-2">
                  <span className="text-4xl font-semibold">{tier.price}</span>
                  <span className="text-sm text-muted-foreground">{tier.cadence}</span>
                </div>
                <p className="text-sm text-muted-foreground">{tier.summary}</p>
              </div>

              <div className="mb-6 grid grid-cols-2 gap-2 text-sm">
                <Allowance label="Spots" value={tier.allowances.savedSpots} />
                <Allowance label="Rituals" value={tier.allowances.textRituals} />
                <Allowance label="Texts" value={tier.allowances.proactiveTexts} />
                <Allowance label="Asks" value={tier.allowances.asks} />
              </div>

              <ul className="mb-8 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <CheckoutForm
                planKey={tier.key}
                cadence="monthly"
                label={tier.cta}
                variant={tier.featured ? "default" : "outline"}
                className="mt-auto"
              />
            </div>
          ))}
        </div>

        {!compact ? (
          <div className="mt-12 border border-border">
            <div className="border-b border-border p-5">
              <div className="mb-2 flex items-center gap-2">
                <Waves className="h-4 w-4" aria-hidden="true" />
                <h3 className="font-medium">Use and gating plan</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                The UI should talk about plans. The backend should count usage
                units so SMS delivery, forecast runs, and assistant calls can
                be gated cleanly.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-5 py-3 font-medium">Limit</th>
                    <th className="px-5 py-3 font-medium">Core</th>
                    <th className="px-5 py-3 font-medium">Pro</th>
                    <th className="px-5 py-3 font-medium">Operator</th>
                  </tr>
                </thead>
                <tbody>
                  {gatingRows.map((row) => (
                    <tr key={row.feature} className="border-b border-border last:border-b-0">
                      <td className="px-5 py-3 text-muted-foreground">{row.feature}</td>
                      <td className="px-5 py-3">{row.core}</td>
                      <td className="px-5 py-3">{row.pro}</td>
                      <td className="px-5 py-3">{row.operator}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function CheckoutForm({
  planKey,
  cadence,
  label,
  variant,
  className,
}: {
  planKey: string;
  cadence: string;
  label: string;
  variant: "default" | "outline";
  className?: string;
}) {
  return (
    <form action="/api/billing/checkout" method="post" className={className}>
      <input type="hidden" name="planKey" value={planKey} />
      <input type="hidden" name="cadence" value={cadence} />
      <Button type="submit" variant={variant} className="w-full">
        {label}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Button>
    </form>
  );
}

function Allowance({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border p-3">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
