-- =========================================================
-- Crush Counter — Supabase schema
-- Run this in the Supabase SQL Editor (SQL Editor > New query)
-- =========================================================

-- ---------------------------------------------------------
-- Tables
-- ---------------------------------------------------------

create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null check (username = lower(username)),
  display_name text,
  avatar_url text,
  gender text,
  relationship_status text,
  age integer check (age is null or (age >= 18 and age <= 120)),
  location text,
  bio text check (bio is null or char_length(bio) <= 300),
  created_at timestamptz not null default now()
);

-- If you're running this on a project that already has a profiles
-- table from an earlier version of this schema, these fill in the gaps:
alter table profiles add column if not exists avatar_url text;
alter table profiles add column if not exists gender text;
alter table profiles add column if not exists relationship_status text;
alter table profiles add column if not exists age integer;
alter table profiles add column if not exists location text;
alter table profiles add column if not exists bio text;
alter table profiles add column if not exists last_seen timestamptz;
alter table profiles add column if not exists coins integer not null default 0;
alter table profiles add column if not exists fame integer not null default 0;
alter table profiles add column if not exists last_daily_reward date;
alter table profiles add column if not exists last_seen_admirer_count integer not null default 0;
alter table profiles add column if not exists leaderboard_opt_in boolean;

create table if not exists crushes (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references auth.users (id) on delete cascade not null unique,
  target_username text not null check (target_username = lower(target_username)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  priority_until timestamptz
);

alter table crushes add column if not exists priority_until timestamptz;

create index if not exists crushes_target_username_idx on crushes (target_username);
create index if not exists crushes_sender_id_idx on crushes (sender_id);

-- ---------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------
-- profiles: usernames are public (needed to check if a username exists
-- and to show display names on matches). Only the owner can write.
alter table profiles enable row level security;

create policy "Profiles are publicly readable"
  on profiles for select
  using (true);

create policy "Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- ---------------------------------------------------------
-- Storage: avatars bucket for profile pictures
-- ---------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update their own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- crushes: nobody can read this table directly except their own sent
-- rows. All anonymity-preserving reads (admirer count, matches) go
-- through SECURITY DEFINER functions below, which never leak an
-- unmatched sender's identity to the client.
alter table crushes enable row level security;

create policy "Users can view hearts they personally sent"
  on crushes for select
  using (auth.uid() = sender_id);

-- No insert/update/delete policies are defined on purpose — all writes
-- go through the send_heart() function so business rules (self-heart
-- blocking, normalization) are always enforced.
revoke insert, update, delete on crushes from authenticated, anon;
revoke insert, update, delete on profiles from anon;

-- ---------------------------------------------------------
-- Base table grants
-- ---------------------------------------------------------
-- RLS policies only decide which ROWS a role can see/change — the role
-- also needs a baseline GRANT on the table itself, or every query fails
-- with "permission denied for table X" before RLS is even evaluated.
grant usage on schema public to anon, authenticated;

grant select on profiles to anon, authenticated;
grant insert, update on profiles to authenticated;

grant select on crushes to authenticated;

-- ---------------------------------------------------------
-- Announcements (creator/admin posts, visible to everyone)
-- ---------------------------------------------------------

alter table profiles add column if not exists is_admin boolean not null default false;

create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  author_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table announcements enable row level security;

create policy "Announcements are publicly readable"
  on announcements for select
  using (true);

-- No insert policy on purpose — posting always goes through
-- post_announcement() below, so @mentions are reliably detected and
-- notifications sent. No update/delete policy either — edit by
-- deleting via the SQL editor directly if you ever need to correct a
-- post.
revoke insert, update, delete on announcements from authenticated, anon;
grant select on announcements to anon, authenticated;

-- After creating your account, make yourself admin by running:
--   update profiles set is_admin = true where username = 'your_username';

-- ---------------------------------------------------------
-- Functions (SECURITY DEFINER — bypass RLS deliberately, but
-- each one filters strictly by auth.uid() internally)
-- ---------------------------------------------------------

-- Set (or change) the caller's single crush. Calling this again with a
-- new username replaces the previous one outright — there is only ever
-- one active crush per account, but it's freely changeable.
create or replace function set_crush(p_target_username text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  my_username text;
  clean_target text := lower(trim(p_target_username));
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  select p.username into my_username from profiles p where p.id = me;
  if my_username is null then
    raise exception 'Profile not found for current user';
  end if;

  if clean_target = '' then
    raise exception 'Username required';
  end if;

  if clean_target = my_username then
    raise exception 'You cannot send a heart to yourself';
  end if;

  insert into crushes (sender_id, target_username, updated_at)
  values (me, clean_target, now())
  on conflict (sender_id)
  do update set target_username = excluded.target_username, updated_at = now();
end;
$$;

-- The caller's current crush (0 or 1 row) with computed status:
--   'yellow'  -> target username isn't registered yet
--   'purple'  -> mutual match (target's crush is also the caller)
--   'green'   -> someone else's current crush is also this target
--   'pending' -> set, no match/competition signal yet
create or replace function get_my_crush()
returns table(target_username text, status text, updated_at timestamptz, target_last_seen timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  my_username text;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;
  select p.username into my_username from profiles p where p.id = me;

  return query
  select
    c.target_username,
    case
      when target_profile.id is null then 'yellow'
      when exists (
        select 1 from crushes back
        where back.sender_id = target_profile.id
          and back.target_username = my_username
      ) then 'purple'
      when exists (
        select 1 from crushes other
        where other.target_username = c.target_username
          and other.sender_id <> me
      ) then 'green'
      else 'pending'
    end as status,
    c.updated_at,
    target_profile.last_seen as target_last_seen
  from crushes c
  left join profiles target_profile on target_profile.username = c.target_username
  where c.sender_id = me;
end;
$$;

-- Total number of accounts whose current crush is the caller — the
-- headline stat for the profile page. Reveals a count only, never who.
create or replace function get_my_received_count()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  my_username text;
  cnt integer;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;
  select p.username into my_username from profiles p where p.id = me;

  select count(*) into cnt from crushes where target_username = my_username;
  return coalesce(cnt, 0);
end;
$$;

-- Anonymous count of people who have sent the current user a heart,
-- excluding senders who are already revealed via a mutual match.
create or replace function get_my_admirer_status()
returns table(has_admirer boolean, admirer_count int)
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  my_username text;
  cnt int;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;
  select username into my_username from profiles where id = me;

  select count(*) into cnt
  from crushes received
  join profiles sender on sender.id = received.sender_id
  where received.target_username = my_username
    and received.sender_id <> me
    and not exists (
      select 1 from crushes mine
      where mine.sender_id = me
        and mine.target_username = sender.username
    );

  return query select (cnt > 0), cnt;
end;
$$;

-- Compares the caller's current (non-matched) admirer count against
-- the count last time they checked, so the app can show a "new
-- admirer" notification. Always updates the stored count as a side
-- effect, so each increase is only ever flagged once. Never flags a
-- decrease (e.g. someone changed their crush away) as "new".
create or replace function check_new_admirers()
returns table(has_new boolean, new_count integer, current_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  my_username text;
  previous_count integer;
  cnt integer;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;
  select username, last_seen_admirer_count into my_username, previous_count from profiles where id = me;

  select count(*) into cnt
  from crushes received
  join profiles sender on sender.id = received.sender_id
  where received.target_username = my_username
    and received.sender_id <> me
    and not exists (
      select 1 from crushes mine
      where mine.sender_id = me
        and mine.target_username = sender.username
    );

  update profiles set last_seen_admirer_count = cnt where id = me;

  if cnt > coalesce(previous_count, 0) then
    insert into notifications (recipient_id, type, title, link)
    values (
      me,
      'admirer',
      case
        when (cnt - coalesce(previous_count, 0)) = 1 then 'Someone new has a crush on you'
        else (cnt - coalesce(previous_count, 0))::text || ' new people have a crush on you'
      end,
      '/dashboard'
    );
  end if;

  return query select (cnt > coalesce(previous_count, 0)), greatest(cnt - coalesce(previous_count, 0), 0), cnt;
end;
$$;

-- Anonymized clues about each secret admirer, so the app stays fun to
-- check back on without ever fully identifying anyone. Excludes
-- already-revealed mutual matches (handled by get_my_matches instead).
-- masked_username always shows exactly the first letter + 3 dots, so
-- the true username length is never leaked either.
create or replace function get_my_admirer_hints()
returns table(
  masked_username text,
  gender text,
  age integer,
  location text,
  set_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  my_username text;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;
  select p.username into my_username from profiles p where p.id = me;

  return query
  select
    left(sender.username, 1) || '•••' as masked_username,
    sender.gender,
    sender.age,
    sender.location,
    received.updated_at as set_at
  from crushes received
  join profiles sender on sender.id = received.sender_id
  where received.target_username = my_username
    and received.sender_id <> me
    and not exists (
      select 1 from crushes mine
      where mine.sender_id = me
        and mine.target_username = sender.username
    )
  order by received.updated_at desc;
end;
$$;

-- Usernames of mutual matches. This is the ONLY place a sender's
-- identity is ever revealed, and only once both sides have sent
-- a heart to each other.
-- Dropped first: return columns changed (gained last_seen) since an
-- earlier version of this function.
drop function if exists get_my_matches();
create or replace function get_my_matches()
returns table(username text, last_seen timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  my_username text;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;
  select p.username into my_username from profiles p where p.id = me;

  return query
  select distinct sender.username, sender.last_seen
  from crushes received
  join profiles sender on sender.id = received.sender_id
  where received.target_username = my_username
    and exists (
      select 1 from crushes mine
      where mine.sender_id = me
        and mine.target_username = sender.username
    );
end;
$$;

grant execute on function set_crush(text) to authenticated;
grant execute on function get_my_crush() to authenticated;
grant execute on function get_my_received_count() to authenticated;
grant execute on function get_my_admirer_status() to authenticated;
grant execute on function check_new_admirers() to authenticated;
grant execute on function get_my_admirer_hints() to authenticated;
grant execute on function get_my_matches() to authenticated;

-- ---------------------------------------------------------
-- Messages: an admirer can message their current crush.
-- Anonymous to the recipient unless it's a mutual match — same rule
-- as everywhere else in the app.
-- ---------------------------------------------------------

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references auth.users (id) on delete cascade not null,
  target_username text not null check (target_username = lower(target_username)),
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists messages_target_username_idx on messages (target_username);
create index if not exists messages_sender_id_idx on messages (sender_id);

alter table messages enable row level security;

-- Senders can see their own sent messages directly (no anonymity
-- concern there — they know who they sent them to).
create policy "Users can view messages they personally sent"
  on messages for select
  using (auth.uid() = sender_id);

-- No insert policy — sending always goes through send_message() so it
-- can enforce "you can only message your current crush".
revoke insert, update, delete on messages from authenticated, anon;

grant select on messages to authenticated;

-- Send a message to the caller's current crush. Fails if the caller
-- hasn't set a crush yet.
create or replace function send_message(p_body text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  my_username text;
  my_target text;
  clean_body text := trim(p_body);
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  select p.username into my_username from profiles p where p.id = me;
  if my_username is null then
    raise exception 'Profile not found for current user';
  end if;

  if clean_body = '' then
    raise exception 'Message cannot be empty';
  end if;
  if char_length(clean_body) > 500 then
    raise exception 'Message is too long (max 500 characters)';
  end if;

  select target_username into my_target from crushes where sender_id = me;
  if my_target is null then
    raise exception 'Set a crush before sending them a message';
  end if;

  insert into messages (sender_id, target_username, body)
  values (me, my_target, clean_body);
end;
$$;

-- Messages received by the caller. from_username is only populated
-- when it's a current mutual match — otherwise the sender stays
-- anonymous, same as the heart-sending logic above. is_priority
-- reflects whether the sender currently has an active "sword" boost
-- (crushes.priority_until) on their crush pointed at the caller —
-- computed live, not stamped at send time, since it's just a display
-- ordering hint, not a permanent property of the message.
--
-- Dropped first: Postgres won't let CREATE OR REPLACE change a
-- function's return columns (this one gained is_priority).
drop function if exists get_my_messages();
create or replace function get_my_messages()
returns table(id uuid, body text, created_at timestamptz, from_username text, is_priority boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  my_username text;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;
  select p.username into my_username from profiles p where p.id = me;

  return query
  select
    m.id,
    m.body,
    m.created_at,
    case
      when
        exists (
          select 1 from crushes their_crush
          where their_crush.sender_id = m.sender_id
            and their_crush.target_username = my_username
        )
        and exists (
          select 1 from crushes my_crush
          where my_crush.sender_id = me
            and my_crush.target_username = sender_p.username
        )
      then sender_p.username
      else null
    end as from_username,
    exists (
      select 1 from crushes sender_crush
      where sender_crush.sender_id = m.sender_id
        and sender_crush.target_username = my_username
        and sender_crush.priority_until is not null
        and sender_crush.priority_until > now()
    ) as is_priority
  from messages m
  join profiles sender_p on sender_p.id = m.sender_id
  where m.target_username = my_username
  order by is_priority desc, m.created_at desc;
end;
$$;

grant execute on function send_message(text) to authenticated;
grant execute on function get_my_messages() to authenticated;

-- ---------------------------------------------------------
-- Item spin game: coins, fame, and inventory items.
--
--  - Everyone earns coins once per day just for opening the app
--    (claim_daily_coins).
--  - Coins can be spent on a spin (spin_wheel) for a random item:
--      fire    -> boosts your own fame when used
--      lighter -> boosts someone else's fame when used (a gift)
--      sword   -> for 24h, your messages to your current crush are
--                 shown as "priority" at the top of their inbox.
--                 It never blocks or hides anyone else's messages —
--                 only elevates yours.
-- ---------------------------------------------------------

create table if not exists inventory_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users (id) on delete cascade not null,
  item_type text not null check (item_type in ('fire', 'lighter', 'sword')),
  acquired_at timestamptz not null default now(),
  used_at timestamptz
);

create index if not exists inventory_items_owner_idx on inventory_items (owner_id);

alter table inventory_items enable row level security;

create policy "Users can view their own inventory"
  on inventory_items for select
  using (auth.uid() = owner_id);

-- No direct insert/update — everything goes through spin_wheel() and
-- the use_* functions below, so coin/fame accounting can't be bypassed.
revoke insert, update, delete on inventory_items from authenticated, anon;
grant select on inventory_items to authenticated;

-- Tunable constants, inlined directly in each function below:
--   daily coin reward   = 10
--   spin cost           = 5 coins
--   fame boost per item = 5

-- Grant the once-per-day coin reward. Safe to call every time the app
-- opens — it's a no-op if already claimed today (UTC).
create or replace function claim_daily_coins()
returns table(awarded boolean, amount integer, new_balance integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  reward_amount constant integer := 10;
  last_reward date;
  balance integer;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  select p.last_daily_reward, p.coins into last_reward, balance from profiles p where p.id = me;

  if last_reward is not null and last_reward >= current_date then
    return query select false, 0, balance;
    return;
  end if;

  update profiles
  set coins = coins + reward_amount, last_daily_reward = current_date
  where id = me
  returning coins into balance;

  return query select true, reward_amount, balance;
end;
$$;

-- Spend coins on a spin. Returns a random item and adds it to the
-- caller's inventory, unused.
create or replace function spin_wheel()
returns table(item_type text, new_balance integer, inventory_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  spin_cost constant integer := 5;
  coin_prize constant integer := 3;
  balance integer;
  won_item text;
  new_id uuid;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  select coins into balance from profiles where id = me;
  if balance is null or balance < spin_cost then
    raise exception 'Not enough coins to spin';
  end if;

  won_item := (array['fire', 'lighter', 'sword', 'coins'])[floor(random() * 4 + 1)];

  update profiles set coins = coins - spin_cost where id = me returning coins into balance;

  if won_item = 'coins' then
    -- Applied instantly, not an inventory item to use later.
    update profiles set coins = coins + coin_prize where id = me returning coins into balance;
    new_id := null;
  else
    insert into inventory_items (owner_id, item_type)
    values (me, won_item)
    returning id into new_id;
  end if;

  return query select won_item, balance, new_id;
end;
$$;

-- Unused items in the caller's inventory.
create or replace function get_my_inventory()
returns table(id uuid, item_type text, acquired_at timestamptz)
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

  return query
  select i.id, i.item_type, i.acquired_at
  from inventory_items i
  where i.owner_id = me and i.used_at is null
  order by i.acquired_at asc;
end;
$$;

-- Use a 'fire' item: boosts the caller's own fame.
create or replace function use_fire(p_item_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  fame_boost constant integer := 5;
  new_fame integer;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  update inventory_items
  set used_at = now()
  where id = p_item_id and owner_id = me and item_type = 'fire' and used_at is null;

  if not found then
    raise exception 'Item not found or already used';
  end if;

  update profiles set fame = fame + fame_boost where id = me returning fame into new_fame;
  return new_fame;
end;
$$;

-- Use a 'lighter' item: boosts someone else's fame (a gift).
create or replace function use_lighter(p_item_id uuid, p_target_username text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  fame_boost constant integer := 5;
  clean_target text := lower(trim(p_target_username));
  my_username text;
  target_id uuid;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;
  select username into my_username from profiles where id = me;

  if clean_target = '' then
    raise exception 'Username required';
  end if;
  if clean_target = my_username then
    raise exception 'You cannot gift fame to yourself';
  end if;

  select id into target_id from profiles where username = clean_target;
  if target_id is null then
    raise exception 'That username does not exist';
  end if;

  update inventory_items
  set used_at = now()
  where id = p_item_id and owner_id = me and item_type = 'lighter' and used_at is null;

  if not found then
    raise exception 'Item not found or already used';
  end if;

  update profiles set fame = fame + fame_boost where id = target_id;

  -- Anonymous, like everything else in this app — the gift itself is
  -- announced, not who sent it.
  insert into notifications (recipient_id, type, title, body, link)
  values (target_id, 'fame_gift', '🕯️ Someone gifted you +5 fame!', null, '/profile');
end;
$$;

-- Use a 'sword' item: for 24h, the caller's messages to their current
-- crush are marked priority. Requires a crush to already be set —
-- never affects anyone else's messages.
create or replace function use_sword(p_item_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  my_target_username text;
  target_id uuid;
  new_expiry timestamptz;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  select target_username into my_target_username from crushes where sender_id = me;
  if my_target_username is null then
    raise exception 'Set a crush before using this item';
  end if;

  update inventory_items
  set used_at = now()
  where id = p_item_id and owner_id = me and item_type = 'sword' and used_at is null;

  if not found then
    raise exception 'Item not found or already used';
  end if;

  new_expiry := now() + interval '1 day';
  update crushes set priority_until = new_expiry where sender_id = me;

  -- Anonymous, same as the rest of the app — the recipient learns
  -- something changed, not who did it.
  select id into target_id from profiles where username = my_target_username;
  if target_id is not null then
    insert into notifications (recipient_id, type, title, body, link)
    values (target_id, 'priority', '⚔️ One of your admirers just got a priority boost', 'Check your messages.', '/messages');
  end if;

  return new_expiry;
end;
$$;

grant execute on function claim_daily_coins() to authenticated;
grant execute on function spin_wheel() to authenticated;
grant execute on function get_my_inventory() to authenticated;
grant execute on function use_fire(uuid) to authenticated;
grant execute on function use_lighter(uuid, text) to authenticated;
grant execute on function use_sword(uuid) to authenticated;

-- ---------------------------------------------------------
-- Scheduled cleanup (pg_cron)
--
-- Free-tier Supabase projects have a 500MB database cap. This app is
-- mostly small text rows, so it would take a very large user base to
-- hit that — but a few tables grow unboundedly over time with no
-- real reason to keep old rows forever. This job prunes them
-- automatically, once a day, entirely on Supabase's side — no app
-- code or manual maintenance needed.
--
-- What it deletes:
--   - inventory_items already used more than 30 days ago (no reason
--     to keep a permanent log of consumed spin items)
--   - messages older than 90 days
--
-- What it does NOT touch: profiles, crushes, matches, announcements,
-- or anything that represents current app state rather than history.
-- ---------------------------------------------------------

create or replace function cleanup_old_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from inventory_items
  where used_at is not null
    and used_at < now() - interval '30 days';

  delete from messages
  where created_at < now() - interval '90 days';

  delete from direct_messages
  where created_at < now() - interval '90 days';
end;
$$;

-- Enabling pg_cron: on Supabase, this usually needs to be turned on
-- via the dashboard rather than plain SQL — go to
-- Database -> Extensions -> search "pg_cron" -> Enable, THEN run the
-- two statements below. If your SQL editor role already has
-- permission, the "create extension" line below will just succeed
-- directly.
create extension if not exists pg_cron with schema extensions;

select cron.schedule(
  'cleanup-old-data-daily',
  '0 3 * * *', -- 3:00 AM UTC, daily
  $$ select cleanup_old_data(); $$
);

-- ---------------------------------------------------------
-- Reports: users can report a profile or a specific message.
-- Reporting a message never reveals the sender's identity back to
-- the reporter (even for anonymous admirer messages) — the sender is
-- resolved server-side purely for moderation review.
-- ---------------------------------------------------------

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users (id) on delete cascade not null,
  reported_user_id uuid references auth.users (id) on delete cascade not null,
  message_id uuid references messages (id) on delete set null,
  reason text not null,
  details text,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now()
);

create index if not exists reports_reported_user_idx on reports (reported_user_id);

alter table reports enable row level security;

create policy "Users can view their own submitted reports"
  on reports for select
  using (auth.uid() = reporter_id);

create policy "Admins can view all reports"
  on reports for select
  using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- No direct insert — always goes through the functions below so the
-- reported_user_id can't be spoofed and message ownership is verified.
revoke insert, update, delete on reports from authenticated, anon;
grant select on reports to authenticated;

-- Report a specific message. Resolves the sender internally without
-- ever exposing their identity to the (possibly anonymous-admirer)
-- reporter.
create or replace function report_message(p_message_id uuid, p_reason text, p_details text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  my_username text;
  msg_sender uuid;
  msg_target text;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;
  select username into my_username from profiles where id = me;

  select sender_id, target_username into msg_sender, msg_target
  from messages where id = p_message_id;

  if msg_sender is null then
    raise exception 'Message not found';
  end if;
  if msg_target <> my_username then
    raise exception 'You can only report messages sent to you';
  end if;
  if trim(coalesce(p_reason, '')) = '' then
    raise exception 'A reason is required';
  end if;

  insert into reports (reporter_id, reported_user_id, message_id, reason, details)
  values (me, msg_sender, p_message_id, p_reason, p_details);
end;
$$;

-- Report a user's profile directly (e.g. inappropriate bio/photo).
create or replace function report_user(p_username text, p_reason text, p_details text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  clean_target text := lower(trim(p_username));
  target_id uuid;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;
  if trim(coalesce(p_reason, '')) = '' then
    raise exception 'A reason is required';
  end if;

  select id into target_id from profiles where username = clean_target;
  if target_id is null then
    raise exception 'That username does not exist';
  end if;
  if target_id = me then
    raise exception 'You cannot report yourself';
  end if;

  insert into reports (reporter_id, reported_user_id, reason, details)
  values (me, target_id, p_reason, p_details);
end;
$$;

grant execute on function report_message(uuid, text, text) to authenticated;
grant execute on function report_user(text, text) to authenticated;

-- ---------------------------------------------------------
-- Direct messages: open, two-way conversation — but only unlocked
-- between mutual matches. The anonymous crush-messaging system above
-- is untouched; this is a separate, identified chat layer.
-- ---------------------------------------------------------

create table if not exists direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references auth.users (id) on delete cascade not null,
  recipient_id uuid references auth.users (id) on delete cascade not null,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists direct_messages_conversation_idx
  on direct_messages (least(sender_id, recipient_id), greatest(sender_id, recipient_id), created_at);

alter table direct_messages enable row level security;

create policy "Users can view direct messages they sent or received"
  on direct_messages for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

-- No direct insert — always goes through send_direct_message() so the
-- mutual-match requirement can't be bypassed.
revoke insert, update, delete on direct_messages from authenticated, anon;
grant select on direct_messages to authenticated;

-- Checks whether the caller and the given username are a current
-- mutual match (both directions).
create or replace function is_mutual_match(p_other_username text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  my_username text;
  clean_other text := lower(trim(p_other_username));
  other_id uuid;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;
  select username into my_username from profiles where id = me;
  select id into other_id from profiles where username = clean_other;
  if other_id is null then
    return false;
  end if;

  return
    exists (select 1 from crushes where sender_id = me and target_username = clean_other)
    and exists (select 1 from crushes where sender_id = other_id and target_username = my_username);
end;
$$;

create or replace function send_direct_message(p_recipient_username text, p_body text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  clean_recipient text := lower(trim(p_recipient_username));
  recipient_id uuid;
  clean_body text := trim(p_body);
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;
  if clean_body = '' then
    raise exception 'Message cannot be empty';
  end if;
  if char_length(clean_body) > 1000 then
    raise exception 'Message is too long (max 1000 characters)';
  end if;

  select id into recipient_id from profiles where username = clean_recipient;
  if recipient_id is null then
    raise exception 'That username does not exist';
  end if;
  if recipient_id = me then
    raise exception 'You cannot message yourself';
  end if;

  if not is_mutual_match(clean_recipient) then
    raise exception 'You can only chat with mutual matches';
  end if;

  insert into direct_messages (sender_id, recipient_id, body)
  values (me, recipient_id, clean_body);
end;
$$;

-- Full conversation between the caller and the given matched username,
-- oldest first.
create or replace function get_conversation(p_other_username text)
returns table(id uuid, body text, created_at timestamptz, is_mine boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  clean_other text := lower(trim(p_other_username));
  other_id uuid;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  select id into other_id from profiles where username = clean_other;
  if other_id is null then
    raise exception 'That username does not exist';
  end if;

  return query
  select dm.id, dm.body, dm.created_at, (dm.sender_id = me) as is_mine
  from direct_messages dm
  where (dm.sender_id = me and dm.recipient_id = other_id)
     or (dm.sender_id = other_id and dm.recipient_id = me)
  order by dm.created_at asc;
end;
$$;

grant execute on function is_mutual_match(text) to authenticated;
grant execute on function send_direct_message(text, text) to authenticated;
grant execute on function get_conversation(text) to authenticated;

-- ---------------------------------------------------------
-- Notifications: a persistent history, backing a Notifications page.
--
--   'admirer'       -> someone new has the recipient as their crush
--                      (inserted alongside the existing toast check;
--                      the toast itself is unchanged)
--   'admin_message' -> a developer-sent personal notification to one
--                      specific user
--   'mention'       -> the recipient was @mentioned in an announcement
-- ---------------------------------------------------------

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid references auth.users (id) on delete cascade not null,
  type text not null check (type in ('admirer', 'admin_message', 'mention', 'fame_gift', 'priority')),
  title text not null,
  body text,
  link text,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists notifications_recipient_idx on notifications (recipient_id, created_at desc);

alter table notifications enable row level security;

create policy "Users can view their own notifications"
  on notifications for select
  using (auth.uid() = recipient_id);

-- No direct insert/update — always goes through the functions below,
-- so admin-only sends can't be spoofed and mark-as-read can't touch
-- anyone else's notifications.
revoke insert, update, delete on notifications from authenticated, anon;
grant select on notifications to authenticated;

create or replace function get_my_notifications()
returns table(id uuid, type text, title text, body text, link text, created_at timestamptz, read_at timestamptz)
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

  return query
  select n.id, n.type, n.title, n.body, n.link, n.created_at, n.read_at
  from notifications n
  where n.recipient_id = me
  order by n.created_at desc
  limit 100;
end;
$$;

create or replace function get_unread_notification_count()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  cnt integer;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  select count(*) into cnt from notifications where recipient_id = me and read_at is null;
  return coalesce(cnt, 0);
end;
$$;

create or replace function mark_notification_read(p_id uuid)
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

  update notifications set read_at = now()
  where id = p_id and recipient_id = me and read_at is null;
end;
$$;

create or replace function mark_all_notifications_read()
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

  update notifications set read_at = now()
  where recipient_id = me and read_at is null;
end;
$$;

-- Admin-only: send a personal notification to one specific user.
create or replace function send_personal_notification(p_target_username text, p_title text, p_body text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  am_admin boolean;
  clean_target text := lower(trim(p_target_username));
  target_id uuid;
  clean_title text := trim(p_title);
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  select is_admin into am_admin from profiles where id = me;
  if not coalesce(am_admin, false) then
    raise exception 'Only admins can send personal notifications';
  end if;

  if clean_title = '' then
    raise exception 'Title is required';
  end if;

  select id into target_id from profiles where username = clean_target;
  if target_id is null then
    raise exception 'That username does not exist';
  end if;

  insert into notifications (recipient_id, type, title, body)
  values (target_id, 'admin_message', clean_title, nullif(trim(coalesce(p_body, '')), ''));
end;
$$;

-- Admin-only: post an announcement. Any @username mentions in the
-- body that match a real, registered account get a 'mention'
-- notification pointing back to the announcements page.
create or replace function post_announcement(p_title text, p_body text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  am_admin boolean;
  clean_title text := trim(p_title);
  clean_body text := trim(p_body);
  new_id uuid;
  mention text;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  select is_admin into am_admin from profiles where id = me;
  if not coalesce(am_admin, false) then
    raise exception 'Only admins can post announcements';
  end if;

  if clean_title = '' or clean_body = '' then
    raise exception 'Title and body are required';
  end if;

  insert into announcements (title, body, author_id)
  values (clean_title, clean_body, me)
  returning id into new_id;

  for mention in
    select distinct lower(m[1])
    from regexp_matches(clean_body, '@([a-zA-Z0-9_]{3,20})', 'g') as m
  loop
    insert into notifications (recipient_id, type, title, body, link)
    select p.id, 'mention', 'You were mentioned in an announcement', clean_title, '/announcements'
    from profiles p
    where p.username = mention;
  end loop;

  return new_id;
end;
$$;

grant execute on function get_my_notifications() to authenticated;
grant execute on function get_unread_notification_count() to authenticated;
grant execute on function mark_notification_read(uuid) to authenticated;
grant execute on function mark_all_notifications_read() to authenticated;
grant execute on function send_personal_notification(text, text, text) to authenticated;
grant execute on function post_announcement(text, text) to authenticated;

-- ---------------------------------------------------------
-- Account deletion. Deletes the auth.users row directly — every
-- table in this schema references auth.users(id) with
-- "on delete cascade", so profiles, crushes, messages,
-- direct_messages, inventory_items, notifications, and reports
-- (as reporter) are all removed automatically. Runs as the function
-- owner (created via the SQL Editor, so effectively the project's
-- postgres role), which is why it's allowed to touch auth.users
-- directly — this is the standard Supabase pattern for self-service
-- account deletion.
--
-- Note: this does NOT clean up their uploaded avatar file in Storage.
-- Supabase blocks direct SQL deletes on storage.objects even for
-- privileged roles — that has to go through the Storage API instead,
-- so the frontend calls supabase.storage.from('avatars').remove(...)
-- itself right before calling this function.
-- ---------------------------------------------------------

create or replace function delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  delete from auth.users where id = me;
end;
$$;

grant execute on function delete_my_account() to authenticated;

-- ---------------------------------------------------------
-- Thoughts page
--
--  - daily_topics: one admin-posted prompt per day ("Today's thought")
--  - thoughts: one editable/deletable thought slot per account, same
--    single-slot pattern as crushes
--  - thought_likes: liking costs the liker 1 coin and gives the
--    thought's author +1 fame; can't like your own thought or the
--    same thought twice
-- ---------------------------------------------------------

create table if not exists daily_topics (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  posted_by uuid references auth.users (id) on delete set null,
  active_date date not null unique default current_date,
  created_at timestamptz not null default now()
);

alter table daily_topics enable row level security;

create policy "Daily topics are publicly readable"
  on daily_topics for select
  using (true);

-- No direct insert — always goes through post_daily_topic() so only
-- admins can set it.
revoke insert, update, delete on daily_topics from authenticated, anon;
grant select on daily_topics to anon, authenticated;

create table if not exists thoughts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references auth.users (id) on delete cascade not null unique,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table thoughts enable row level security;

create policy "Thoughts are publicly readable"
  on thoughts for select
  using (true);

-- No direct insert/update/delete — always goes through set_thought()
-- and delete_my_thought() below.
revoke insert, update, delete on thoughts from authenticated, anon;
grant select on thoughts to anon, authenticated;

create table if not exists thought_likes (
  id uuid primary key default gen_random_uuid(),
  thought_id uuid references thoughts (id) on delete cascade not null,
  liker_id uuid references auth.users (id) on delete cascade not null,
  created_at timestamptz not null default now(),
  unique (thought_id, liker_id)
);

create index if not exists thought_likes_thought_idx on thought_likes (thought_id);

alter table thought_likes enable row level security;

create policy "Thought likes are publicly readable"
  on thought_likes for select
  using (true);

-- No direct insert/delete — always goes through like_thought() below,
-- so the coin/fame accounting can't be bypassed.
revoke insert, update, delete on thought_likes from authenticated, anon;
grant select on thought_likes to anon, authenticated;

-- Admin-only: set (or update) today's featured topic.
create or replace function post_daily_topic(p_topic text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  am_admin boolean;
  clean_topic text := trim(p_topic);
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  select is_admin into am_admin from profiles where id = me;
  if not coalesce(am_admin, false) then
    raise exception 'Only admins can post the daily topic';
  end if;

  if clean_topic = '' then
    raise exception 'Topic cannot be empty';
  end if;

  insert into daily_topics (topic, posted_by, active_date)
  values (clean_topic, me, current_date)
  on conflict (active_date)
  do update set topic = excluded.topic, posted_by = excluded.posted_by, created_at = now();
end;
$$;

-- Today's topic, computed from the database's own clock (avoids any
-- timezone mismatch with the client's idea of "today").
create or replace function get_todays_topic()
returns table(topic text, active_date date)
language sql
security definer
set search_path = public
as $$
  select topic, active_date from daily_topics where active_date = current_date;
$$;

-- Set (or change) the caller's single thought. Same single-slot,
-- freely-changeable pattern as crushes.
create or replace function set_thought(p_body text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  clean_body text := trim(p_body);
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;
  if clean_body = '' then
    raise exception 'Thought cannot be empty';
  end if;
  if char_length(clean_body) > 500 then
    raise exception 'Thought is too long (max 500 characters)';
  end if;

  insert into thoughts (author_id, body, updated_at)
  values (me, clean_body, now())
  on conflict (author_id)
  do update set body = excluded.body, updated_at = now();
end;
$$;

create or replace function delete_my_thought()
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
  delete from thoughts where author_id = me;
end;
$$;

-- Public feed of everyone's thoughts, newest-updated first, with like
-- counts and whether the caller has liked / owns each one. Works for
-- logged-out viewers too (me may be null) so the page can stay public.
create or replace function get_thoughts_feed()
returns table(
  id uuid,
  author_username text,
  author_avatar_url text,
  body text,
  like_count integer,
  liked_by_me boolean,
  is_mine boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
begin
  return query
  select
    t.id,
    p.username,
    p.avatar_url,
    t.body,
    (select count(*) from thought_likes tl where tl.thought_id = t.id)::integer as like_count,
    (me is not null and exists (
      select 1 from thought_likes tl2 where tl2.thought_id = t.id and tl2.liker_id = me
    )) as liked_by_me,
    (me is not null and t.author_id = me) as is_mine,
    t.created_at,
    t.updated_at
  from thoughts t
  join profiles p on p.id = t.author_id
  order by t.updated_at desc
  limit 100;
end;
$$;

-- Like a thought: costs the liker 1 coin, gives the thought's author
-- +1 fame. Can't like your own thought or the same thought twice.
create or replace function like_thought(p_thought_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  thought_author uuid;
  balance integer;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  select author_id into thought_author from thoughts where id = p_thought_id;
  if thought_author is null then
    raise exception 'Thought not found';
  end if;
  if thought_author = me then
    raise exception 'You cannot like your own thought';
  end if;
  if exists (select 1 from thought_likes where thought_id = p_thought_id and liker_id = me) then
    raise exception 'You already liked this thought';
  end if;

  select coins into balance from profiles where id = me;
  if balance is null or balance < 1 then
    raise exception 'Not enough coins to like';
  end if;

  update profiles set coins = coins - 1 where id = me;
  update profiles set fame = fame + 1 where id = thought_author;

  insert into thought_likes (thought_id, liker_id) values (p_thought_id, me);

  insert into notifications (recipient_id, type, title, link)
  values (thought_author, 'fame_gift', '💭 Someone liked your thought! +1 fame', '/thoughts');
end;
$$;

grant execute on function post_daily_topic(text) to authenticated;
grant execute on function get_todays_topic() to anon, authenticated;
grant execute on function set_thought(text) to authenticated;
grant execute on function delete_my_thought() to authenticated;
grant execute on function get_thoughts_feed() to anon, authenticated;
grant execute on function like_thought(uuid) to authenticated;

-- ---------------------------------------------------------
-- Fame leaderboard: gated behind a minimum user count, and only
-- shows accounts that explicitly opted in.
-- ---------------------------------------------------------

-- Record the caller's answer to "do you want to be featured on the
-- leaderboard if you rank in the top 10?" — null means not asked yet.
create or replace function set_leaderboard_opt_in(p_opt_in boolean)
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
  update profiles set leaderboard_opt_in = p_opt_in where id = me;
end;
$$;

-- Total registered accounts, for the "not enough users yet" gate.
create or replace function get_total_user_count()
returns integer
language sql
security definer
set search_path = public
as $$
  select count(*)::integer from profiles;
$$;

-- Top 10 by fame, opted-in accounts only, and only once at least 25
-- accounts exist overall (returns empty before that point).
create or replace function get_leaderboard()
returns table(username text, avatar_url text, fame integer, gender text, relationship_status text)
language sql
security definer
set search_path = public
as $$
  select p.username, p.avatar_url, p.fame, p.gender, p.relationship_status
  from profiles p
  where p.leaderboard_opt_in = true
    and (select count(*) from profiles) >= 25
  order by p.fame desc, p.username asc
  limit 10;
$$;

grant execute on function set_leaderboard_opt_in(boolean) to authenticated;
grant execute on function get_total_user_count() to anon, authenticated;
grant execute on function get_leaderboard() to anon, authenticated;

-- ---------------------------------------------------------
-- Polls: admin-created, one vote per account per poll.
-- ---------------------------------------------------------

create table if not exists polls (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create table if not exists poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid references polls (id) on delete cascade not null,
  label text not null,
  position integer not null default 0
);

create table if not exists poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid references polls (id) on delete cascade not null,
  option_id uuid references poll_options (id) on delete cascade not null,
  voter_id uuid references auth.users (id) on delete cascade not null,
  created_at timestamptz not null default now(),
  unique (poll_id, voter_id)
);

create index if not exists poll_options_poll_idx on poll_options (poll_id);
create index if not exists poll_votes_poll_idx on poll_votes (poll_id);

alter table polls enable row level security;
create policy "Polls are publicly readable" on polls for select using (true);
revoke insert, update, delete on polls from authenticated, anon;
grant select on polls to anon, authenticated;

alter table poll_options enable row level security;
create policy "Poll options are publicly readable" on poll_options for select using (true);
revoke insert, update, delete on poll_options from authenticated, anon;
grant select on poll_options to anon, authenticated;

alter table poll_votes enable row level security;
create policy "Users can view their own votes" on poll_votes for select using (auth.uid() = voter_id);
revoke insert, update, delete on poll_votes from authenticated, anon;
grant select on poll_votes to authenticated;

-- Admin-only: create a poll with 2+ options in one call.
create or replace function create_poll(p_question text, p_options text[])
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  am_admin boolean;
  clean_question text := trim(p_question);
  new_poll_id uuid;
  opt text;
  idx integer := 0;
  valid_count integer := 0;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;
  select is_admin into am_admin from profiles where id = me;
  if not coalesce(am_admin, false) then
    raise exception 'Only admins can create polls';
  end if;
  if clean_question = '' then
    raise exception 'Question is required';
  end if;

  foreach opt in array p_options loop
    if trim(coalesce(opt, '')) <> '' then
      valid_count := valid_count + 1;
    end if;
  end loop;
  if valid_count < 2 then
    raise exception 'A poll needs at least 2 options';
  end if;

  insert into polls (question, created_by) values (clean_question, me) returning id into new_poll_id;

  foreach opt in array p_options loop
    if trim(coalesce(opt, '')) <> '' then
      insert into poll_options (poll_id, label, position) values (new_poll_id, trim(opt), idx);
      idx := idx + 1;
    end if;
  end loop;

  return new_poll_id;
end;
$$;

-- Admin-only: close a poll so it stops accepting votes.
create or replace function close_poll(p_poll_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  am_admin boolean;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;
  select is_admin into am_admin from profiles where id = me;
  if not coalesce(am_admin, false) then
    raise exception 'Only admins can close polls';
  end if;
  update polls set closed_at = now() where id = p_poll_id and closed_at is null;
end;
$$;

-- Cast a vote. One vote per poll per account — no changing it once cast.
create or replace function vote_poll(p_option_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  target_poll uuid;
  is_closed boolean;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  select poll_id into target_poll from poll_options where id = p_option_id;
  if target_poll is null then
    raise exception 'Option not found';
  end if;

  select (closed_at is not null) into is_closed from polls where id = target_poll;
  if is_closed then
    raise exception 'This poll is closed';
  end if;

  if exists (select 1 from poll_votes where poll_id = target_poll and voter_id = me) then
    raise exception 'You already voted on this poll';
  end if;

  insert into poll_votes (poll_id, option_id, voter_id) values (target_poll, p_option_id, me);
end;
$$;

-- All polls with their options, live vote counts, and which option
-- (if any) the caller voted for. Works for logged-out viewers too.
create or replace function get_polls()
returns table(
  poll_id uuid,
  question text,
  created_at timestamptz,
  closed_at timestamptz,
  option_id uuid,
  option_label text,
  vote_count integer,
  my_option_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
begin
  return query
  select
    p.id,
    p.question,
    p.created_at,
    p.closed_at,
    o.id,
    o.label,
    (select count(*) from poll_votes v where v.option_id = o.id)::integer,
    case when me is null then null else
      (select v2.option_id from poll_votes v2 where v2.poll_id = p.id and v2.voter_id = me)
    end
  from polls p
  join poll_options o on o.poll_id = p.id
  order by p.created_at desc, o.position asc;
end;
$$;

grant execute on function create_poll(text, text[]) to authenticated;
grant execute on function close_poll(uuid) to authenticated;
grant execute on function vote_poll(uuid) to authenticated;
grant execute on function get_polls() to anon, authenticated;

-- ---------------------------------------------------------
-- Profile likes: unlike thought_likes, repeatable — a person can
-- like the same profile as many times as they want. Each like costs
-- the liker 1 coin and gives the profile owner +1 fame.
-- ---------------------------------------------------------

create table if not exists profile_likes (
  id uuid primary key default gen_random_uuid(),
  target_id uuid references auth.users (id) on delete cascade not null,
  liker_id uuid references auth.users (id) on delete cascade not null,
  is_anonymous boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists profile_likes_target_idx on profile_likes (target_id);

alter table profile_likes enable row level security;

create policy "Profile likes are publicly readable"
  on profile_likes for select
  using (true);

-- No direct insert — always goes through like_profile() below, so
-- the coin/fame accounting can't be bypassed.
revoke insert, update, delete on profile_likes from authenticated, anon;
grant select on profile_likes to anon, authenticated;

-- Like a profile: costs the liker 1 coin, gives the profile owner +1
-- fame. Repeatable — no limit on how many times the same person can
-- like the same profile. The liker chooses per-like whether to stay
-- anonymous or be named in the resulting notification.
--
-- Dropped first: adding p_anonymous is a signature change, and
-- CREATE OR REPLACE can't add a parameter to an existing function.
drop function if exists like_profile(text);
create or replace function like_profile(p_username text, p_anonymous boolean default true)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  my_username text;
  clean_target text := lower(trim(p_username));
  target_id uuid;
  balance integer;
  notif_title text;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;
  select username into my_username from profiles where id = me;

  select id into target_id from profiles where username = clean_target;
  if target_id is null then
    raise exception 'That username does not exist';
  end if;
  if target_id = me then
    raise exception 'You cannot like your own profile';
  end if;

  select coins into balance from profiles where id = me;
  if balance is null or balance < 1 then
    raise exception 'Not enough coins to like';
  end if;

  update profiles set coins = coins - 1 where id = me;
  update profiles set fame = fame + 1 where id = target_id;

  insert into profile_likes (target_id, liker_id, is_anonymous) values (target_id, me, p_anonymous);

  if p_anonymous then
    notif_title := '🧡 Someone liked your profile! +1 fame';
  else
    notif_title := '🧡 @' || my_username || ' liked your profile! +1 fame';
  end if;

  insert into notifications (recipient_id, type, title, link)
  values (target_id, 'fame_gift', notif_title, '/profile');
end;
$$;

-- Total like count for a profile.
create or replace function get_profile_like_count(p_username text)
returns integer
language sql
security definer
set search_path = public
as $$
  select count(*)::integer
  from profile_likes pl
  join profiles p on p.id = pl.target_id
  where p.username = lower(trim(p_username));
$$;

grant execute on function like_profile(text, boolean) to authenticated;
grant execute on function get_profile_like_count(text) to anon, authenticated;

-- ---------------------------------------------------------
-- Premium page: unlocked by reaching 500 fame, OR by a one-time
-- coin purchase. Once purchased, permanent — doesn't get revoked if
-- fame later matters some other way.
-- ---------------------------------------------------------

alter table profiles add column if not exists premium_unlocked boolean not null default false;

create or replace function unlock_premium()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  unlock_cost constant integer := 50;
  balance integer;
  already boolean;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  select premium_unlocked, coins into already, balance from profiles where id = me;
  if already then
    raise exception 'Already unlocked';
  end if;
  if balance is null or balance < unlock_cost then
    raise exception 'Not enough coins';
  end if;

  update profiles set coins = coins - unlock_cost, premium_unlocked = true
  where id = me
  returning coins into balance;

  return balance;
end;
$$;

grant execute on function unlock_premium() to authenticated;

-- ---------------------------------------------------------
-- Rewarded ads: watching one grants either coins or a free spin
-- (the person's choice per watch). Rate-limited since there's no
-- server-side ad verification — a determined client could call this
-- without truly watching, so the daily cap keeps the blast radius
-- small either way.
-- ---------------------------------------------------------

alter table profiles add column if not exists ad_free_spins integer not null default 0;
alter table profiles add column if not exists ad_rewards_today integer not null default 0;
alter table profiles add column if not exists ad_rewards_date date;

create or replace function claim_ad_reward(p_reward_type text)
returns table(new_coins integer, new_free_spins integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  daily_cap constant integer := 5;
  coin_reward constant integer := 5;
  today_count integer;
  last_date date;
  coins_out integer;
  spins_out integer;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;
  if p_reward_type not in ('coins', 'spin') then
    raise exception 'Invalid reward type';
  end if;

  select ad_rewards_today, ad_rewards_date into today_count, last_date from profiles where id = me;
  if last_date is null or last_date < current_date then
    today_count := 0;
  end if;
  if today_count >= daily_cap then
    raise exception 'Daily ad reward limit reached — try again tomorrow';
  end if;

  if p_reward_type = 'coins' then
    update profiles
    set coins = coins + coin_reward,
        ad_rewards_today = today_count + 1,
        ad_rewards_date = current_date
    where id = me
    returning coins, ad_free_spins into coins_out, spins_out;
  else
    update profiles
    set ad_free_spins = ad_free_spins + 1,
        ad_rewards_today = today_count + 1,
        ad_rewards_date = current_date
    where id = me
    returning coins, ad_free_spins into coins_out, spins_out;
  end if;

  return query select coins_out, spins_out;
end;
$$;

grant execute on function claim_ad_reward(text) to authenticated;

-- Update spin_wheel to consume a free spin (from watching a rewarded
-- ad) before falling back to spending coins.
create or replace function spin_wheel()
returns table(item_type text, new_balance integer, inventory_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  spin_cost constant integer := 5;
  coin_prize constant integer := 3;
  balance integer;
  free_spins integer;
  won_item text;
  new_id uuid;
  used_free_spin boolean := false;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  select coins, ad_free_spins into balance, free_spins from profiles where id = me;

  if free_spins is not null and free_spins > 0 then
    update profiles set ad_free_spins = ad_free_spins - 1 where id = me;
    used_free_spin := true;
  else
    if balance is null or balance < spin_cost then
      raise exception 'Not enough coins to spin';
    end if;
    update profiles set coins = coins - spin_cost where id = me returning coins into balance;
  end if;

  won_item := (array['fire', 'lighter', 'sword', 'coins'])[floor(random() * 4 + 1)];

  if won_item = 'coins' then
    update profiles set coins = coins + coin_prize where id = me returning coins into balance;
    new_id := null;
  else
    insert into inventory_items (owner_id, item_type)
    values (me, won_item)
    returning id into new_id;
  end if;

  return query select won_item, balance, new_id;
end;
$$;
