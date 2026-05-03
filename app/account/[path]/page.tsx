import { AccountView } from "@neondatabase/auth/react";

import { Button } from "@/components/ui/button";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = await params;

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto max-w-4xl">
        <AccountView path={path} />
        <section className="mt-6 border border-border bg-card p-5">
          <p className="text-sm font-medium">Billing</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage your WaveWatch subscription, payment method, and invoices in
            Stripe.
          </p>
          <form action="/api/billing/portal" method="post" className="mt-4">
            <Button type="submit" variant="outline">
              Manage billing
            </Button>
          </form>
        </section>
      </div>
    </main>
  );
}
