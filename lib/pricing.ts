export type PlanKey = "founder" | "core" | "pro" | "operator";
export type BillingCadence = "monthly" | "annual" | "launch";

export type PricingTier = {
  key: Exclude<PlanKey, "founder">;
  name: string;
  eyebrow: string;
  price: string;
  cadence: string;
  summary: string;
  cta: string;
  href: string;
  featured?: boolean;
  lookupKeys: {
    monthly: string;
    annual: string;
  };
  allowances: {
    savedSpots: string;
    textRituals: string;
    proactiveTexts: string;
    asks: string;
    nowcasts: string;
  };
  features: string[];
};

export const founderOffer = {
  key: "founder" as const,
  name: "Founder Annual",
  price: "$99",
  cadence: "first year",
  billingCadence: "launch" as const,
  lookupKey: "wavewatch_founder_annual_v1",
  priceEnv: "STRIPE_PRICE_WAVEWATCH_FOUNDER_ANNUAL",
  summary:
    "Limited launch access for early ocean people who want the number now and are willing to help shape the rituals.",
};

export const pricingTiers: PricingTier[] = [
  {
    key: "core",
    name: "Core",
    eyebrow: "Personal water ritual",
    price: "$15",
    cadence: "per month",
    summary:
      "For one person who wants WaveWatch to watch their usual spots and text the useful windows.",
    cta: "Start Core",
    href: "/auth/sign-up?plan=core",
    lookupKeys: {
      monthly: "wavewatch_core_monthly_v1",
      annual: "wavewatch_core_annual_v1",
    },
    allowances: {
      savedSpots: "3 spots",
      textRituals: "2 rituals",
      proactiveTexts: "45/month",
      asks: "40/month",
      nowcasts: "10/month",
    },
    features: [
      "One verified phone number",
      "Daily or weekend text briefings",
      "Surf, fish, dive, or boat mode",
      "Concise expert calls with best window and risk",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    eyebrow: "Serious ocean life",
    price: "$50",
    cadence: "per month",
    summary:
      "For high-frequency users who want more spots, more rituals, and priority event watching.",
    cta: "Go Pro",
    href: "/auth/sign-up?plan=pro",
    featured: true,
    lookupKeys: {
      monthly: "wavewatch_pro_monthly_v1",
      annual: "wavewatch_pro_annual_v1",
    },
    allowances: {
      savedSpots: "15 spots",
      textRituals: "8 rituals",
      proactiveTexts: "200/month",
      asks: "200/month",
      nowcasts: "60/month",
    },
    features: [
      "Multi-activity memory across your water",
      "Big swell, hazard, and worth-it alerts",
      "Detailed reasoning when you need the why",
      "Higher fair-use ceiling for follow-up texts",
    ],
  },
  {
    key: "operator",
    name: "Operator",
    eyebrow: "Guides, charters, crews",
    price: "$99",
    cadence: "per month",
    summary:
      "For people making client, crew, or trip decisions around a repeatable coastal operation.",
    cta: "Talk Operator",
    href: "/auth/sign-up?plan=operator",
    lookupKeys: {
      monthly: "wavewatch_operator_monthly_v1",
      annual: "wavewatch_operator_annual_v1",
    },
    allowances: {
      savedSpots: "50 spots",
      textRituals: "25 rituals",
      proactiveTexts: "1,000/month",
      asks: "750/month",
      nowcasts: "200/month",
    },
    features: [
      "Operator-grade saved water and audiences",
      "Trip viability, reschedule, and safety-margin calls",
      "Manual override and review hooks",
      "Private deployment path as the product matures",
    ],
  },
];

export type BillingPriceConfig = {
  planKey: PlanKey;
  cadence: BillingCadence;
  lookupKey: string;
  priceEnv: string;
};

export const billingPriceConfig: BillingPriceConfig[] = [
  {
    planKey: "founder",
    cadence: "launch",
    lookupKey: founderOffer.lookupKey,
    priceEnv: founderOffer.priceEnv,
  },
  {
    planKey: "core",
    cadence: "monthly",
    lookupKey: "wavewatch_core_monthly_v1",
    priceEnv: "STRIPE_PRICE_WAVEWATCH_CORE_MONTHLY",
  },
  {
    planKey: "core",
    cadence: "annual",
    lookupKey: "wavewatch_core_annual_v1",
    priceEnv: "STRIPE_PRICE_WAVEWATCH_CORE_ANNUAL",
  },
  {
    planKey: "pro",
    cadence: "monthly",
    lookupKey: "wavewatch_pro_monthly_v1",
    priceEnv: "STRIPE_PRICE_WAVEWATCH_PRO_MONTHLY",
  },
  {
    planKey: "pro",
    cadence: "annual",
    lookupKey: "wavewatch_pro_annual_v1",
    priceEnv: "STRIPE_PRICE_WAVEWATCH_PRO_ANNUAL",
  },
  {
    planKey: "operator",
    cadence: "monthly",
    lookupKey: "wavewatch_operator_monthly_v1",
    priceEnv: "STRIPE_PRICE_WAVEWATCH_OPERATOR_MONTHLY",
  },
  {
    planKey: "operator",
    cadence: "annual",
    lookupKey: "wavewatch_operator_annual_v1",
    priceEnv: "STRIPE_PRICE_WAVEWATCH_OPERATOR_ANNUAL",
  },
];

export function normalizePlanKey(value: string | null | undefined): PlanKey {
  if (
    value === "founder" ||
    value === "core" ||
    value === "pro" ||
    value === "operator"
  ) {
    return value;
  }

  return "pro";
}

export function normalizeBillingCadence(
  planKey: PlanKey,
  value: string | null | undefined,
): BillingCadence {
  if (planKey === "founder") {
    return "launch";
  }

  if (value === "annual") {
    return "annual";
  }

  return "monthly";
}

export function getBillingPriceConfig(
  planKey: PlanKey,
  cadence: BillingCadence,
) {
  const normalizedCadence = planKey === "founder" ? "launch" : cadence;
  const config = billingPriceConfig.find(
    (priceConfig) =>
      priceConfig.planKey === planKey &&
      priceConfig.cadence === normalizedCadence,
  );

  if (!config) {
    throw new Error(`Unsupported billing plan: ${planKey}/${cadence}`);
  }

  return config;
}

export function getPlanKeyForPrice({
  priceId,
  lookupKey,
}: {
  priceId?: string | null;
  lookupKey?: string | null;
}): PlanKey | null {
  const config = billingPriceConfig.find(
    (priceConfig) =>
      priceConfig.lookupKey === lookupKey ||
      Boolean(priceId && process.env[priceConfig.priceEnv] === priceId),
  );

  return config?.planKey ?? null;
}

export const gatingRows = [
  {
    feature: "Saved spots",
    core: "3",
    pro: "15",
    operator: "50",
  },
  {
    feature: "Text rituals",
    core: "2",
    pro: "8",
    operator: "25",
  },
  {
    feature: "Proactive texts",
    core: "45/mo",
    pro: "200/mo",
    operator: "1,000/mo",
  },
  {
    feature: "Ask WaveWatch",
    core: "40/mo",
    pro: "200/mo",
    operator: "750/mo",
  },
  {
    feature: "Text me now",
    core: "10/mo",
    pro: "60/mo",
    operator: "200/mo",
  },
  {
    feature: "Hazard watch",
    core: "Fair use",
    pro: "Priority",
    operator: "Priority + review",
  },
];
