# Crush Counter 💌

Send an anonymous heart to someone's username. Depending on what happens next, you'll
see one of four heart colors:

| Heart | Meaning |
|---|---|
| 💜 Purple | **Mutual match** — you like them, and they like you back. |
| 💚 Green | **Competition** — someone else has also sent a heart to your crush. |
| ❤️ Red | **Secret admirer** — someone has sent a heart to you. |
| 💛 Yellow | **Invite needed** — you sent a heart to a username that isn't registered yet. |

Nobody's identity is ever revealed to another user **unless it's a mutual match** — that
logic is enforced in the database itself (see below), not just hidden in the UI.

## Stack

- **Frontend:** React + Vite
- **Styling:** Tailwind CSS
- **Database & Auth:** Supabase (Postgres + Auth)

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In your project, open **SQL Editor → New query**, paste the contents of
   `supabase/schema.sql`, and run it. This creates:
   - `profiles` and `crushes` tables
   - Row Level Security policies (users can only ever read their *own* sent hearts directly)
   - Four RPC functions (`send_heart`, `get_my_sent_hearts`, `get_my_admirer_status`,
     `get_my_matches`) that compute heart colors and admirer counts **without leaking a
     sender's identity** unless there's a mutual match.
3. Go to **Project Settings → API** and copy your **Project URL** and **anon public key**.

> By default Supabase requires email confirmation for new signups. You can turn this off
> for local testing under **Authentication → Providers → Email → Confirm email**.

## 2. Configure the frontend

```bash
cp .env.example .env
```

Fill in `.env`:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

## 3. Install and run

```bash
npm install
npm run dev
```

Open the printed local URL (usually `http://localhost:5173`).

## How the anonymity logic works

All of the interesting logic lives in Postgres functions (`supabase/schema.sql`), not the
client, so it can't be bypassed by someone poking at the frontend:

- `send_heart(username)` — inserts a heart, blocks self-hearts, is idempotent (sending
  twice to the same person does nothing extra).
- `get_my_sent_hearts()` — for each heart you've sent, returns `yellow` if the target
  isn't registered, `purple` if they've also sent you one, `green` if someone else has
  also sent *them* a heart, otherwise `pending`.
- `get_my_admirer_status()` — tells you *how many* people have sent you a heart, without
  saying who, and excludes anyone already revealed via a match.
- `get_my_matches()` — the only function that ever returns another user's username, and
  only for mutual matches.

## Project structure

```
src/
  pages/        Login, Register, Dashboard
  components/   Navbar, HeartCard, FloatingHearts, ProtectedRoute
  context/      AuthContext (Supabase session + profile)
  lib/crush.js  Wrappers around the Supabase RPC calls
supabase/
  schema.sql    Tables, RLS policies, and RPC functions
```

## Notes / next steps

- Usernames are lowercase-only (`a-z0-9_`, 3–20 chars) to keep matching simple.
- There's no push/email notification when someone sends you a heart yet — the app is
  pull-based (check the dashboard). Adding a Supabase Edge Function + `pg_net`/webhook on
  insert into `crushes` would be a natural next step.
- Consider rate-limiting `send_heart` (e.g. via a Postgres trigger) if you open this up
  publicly, to prevent spam-hearting.
