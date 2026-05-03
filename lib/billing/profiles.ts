import { getSql } from "@/lib/db";

export type AuthSessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
};

export type WaveWatchUserProfile = {
  id: string;
  auth_user_id: string;
  display_name: string | null;
};

export async function getOrCreateUserProfile(user: AuthSessionUser) {
  const sql = getSql();
  const displayName = user.name || user.email || null;
  const rows = (await sql`
    insert into wavewatch.user_profiles (auth_user_id, display_name)
    values (${user.id}, ${displayName})
    on conflict (auth_user_id) do update
      set
        display_name = coalesce(wavewatch.user_profiles.display_name, excluded.display_name),
        updated_at = now()
    returning id, auth_user_id, display_name
  `) as WaveWatchUserProfile[];

  return rows[0];
}

export async function getBillingCustomerId(userProfileId: string) {
  const sql = getSql();
  const rows = (await sql`
    select stripe_customer_id
    from wavewatch.billing_customers
    where user_profile_id = ${userProfileId}
    limit 1
  `) as { stripe_customer_id: string }[];

  return rows[0]?.stripe_customer_id ?? null;
}

export async function upsertBillingCustomer({
  userProfileId,
  stripeCustomerId,
}: {
  userProfileId: string;
  stripeCustomerId: string;
}) {
  const sql = getSql();

  await sql`
    insert into wavewatch.billing_customers (
      user_profile_id,
      stripe_customer_id
    )
    values (${userProfileId}, ${stripeCustomerId})
    on conflict (user_profile_id) do update
      set
        stripe_customer_id = excluded.stripe_customer_id,
        updated_at = now()
  `;
}

export async function getUserProfileIdForStripeCustomer(
  stripeCustomerId: string,
) {
  const sql = getSql();
  const rows = (await sql`
    select user_profile_id
    from wavewatch.billing_customers
    where stripe_customer_id = ${stripeCustomerId}
    limit 1
  `) as { user_profile_id: string }[];

  return rows[0]?.user_profile_id ?? null;
}
