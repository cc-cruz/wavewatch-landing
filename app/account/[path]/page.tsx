import { AccountView } from "@neondatabase/auth/react";

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
      </div>
    </main>
  );
}

