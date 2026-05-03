export type BillingCadence = "monthly" | "annual" | "launch";

export type PricingTier = {
  key: "core" | "pro" | "operator";
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
  name: "Founder Annual",
  price: "$99",
  cadence: "first year",
  lookupKey: "wavewatch_founder_annual_v1",
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
