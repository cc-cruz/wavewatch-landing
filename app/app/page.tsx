import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ConsumerAppShell } from "@/components/consumer-app-shell";
import { pendingPlanCookieName } from "@/lib/billing/pending-plan";

export default async function AppPage() {
  const cookieStore = await cookies();
  const pendingPlan = cookieStore.get(pendingPlanCookieName)?.value;

  if (pendingPlan) {
    redirect("/api/billing/checkout?resume=1");
  }

  return <ConsumerAppShell />;
}
