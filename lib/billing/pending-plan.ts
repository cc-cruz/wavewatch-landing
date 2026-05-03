export const pendingPlanCookieName = "wavewatch_pending_plan";
export const pendingCadenceCookieName = "wavewatch_pending_cadence";

export const pendingBillingCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 20,
} as const;
