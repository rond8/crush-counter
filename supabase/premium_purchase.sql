-- ---------------------------------------------------------
-- Premium via in-app purchase (RevenueCat)
--
-- Run this in the Supabase SQL Editor (SQL Editor > New query),
-- alongside the existing supabase/schema.sql.
--
-- Called from the client after a RevenueCat purchase or restore
-- confirms the "premium" entitlement is active (see
-- src/lib/purchases.js -> syncPremiumToProfile()).
--
-- This trusts the caller's report that a real purchase happened. For
-- stronger protection against a tampered client, the more robust
-- setup is a RevenueCat webhook (Project Settings -> Integrations ->
-- Webhooks) POSTing to a Supabase Edge Function that verifies the
-- event and updates profiles using the service role key instead of
-- relying on the app to call this function honestly.
-- ---------------------------------------------------------

create or replace function mark_premium_purchased()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  update profiles set premium_unlocked = true where id = me;
end;
$$;

grant execute on function mark_premium_purchased() to authenticated;
