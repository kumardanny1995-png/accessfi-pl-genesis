# LockScore

Mobile-first social sports prediction app for rivalry-led sports challenges.

## AccessFi Add-On

This workspace now also includes `AccessFi`, a walletless premium-access MVP under `/accessfi`.

- Focused docs: [`ACCESSFI_README.md`](./ACCESSFI_README.md)
- AccessFi migration: [`supabase/migrations/202603260001_accessfi.sql`](./supabase/migrations/202603260001_accessfi.sql)
- Demo brief: [`ACCESSFI_SUBMISSION_NOTES.md`](./ACCESSFI_SUBMISSION_NOTES.md)

Users lock five picks before a match, share one clean link into WhatsApp or Telegram, friends counter-pick, the app compares every call side-by-side, then an admin settles outcomes and the group gets a final leaderboard plus a shareable results card.

V2 foundation is now additive on top of V1:

- IPL-first cricket discovery and sport-specific hubs
- multi-sport foundations for cricket, football, Formula 1, and basketball
- recurring groups / leagues / creator rooms
- season standings
- profile stats, badges, and reputation score
- in-app notifications
- cricket-first provider sync and auto-settlement
- live mini-picks for in-match social prediction moments
- AI recap, rivalry, and trash-talk generation with safe local fallback
- browser push subscriptions for rivalry/result alerts
- polling-based live refresh on match and notification surfaces

## Product Architecture Summary

- Frontend: Next.js App Router, TypeScript, Tailwind CSS, server components by default.
- Data layer: Supabase Postgres with a normalized schema and SQL migrations in [`supabase/migrations`](./supabase/migrations).
- Mutation layer: Next server actions for challenge creation, join flow, admin match ops, and settlement.
- Participation model: guest-first via `guest_profiles` plus cookie-backed guest persistence.
- Admin model: env-backed passcode gate for MVP speed, without blocking future Supabase Auth layering.
- Sports model: normalized `sports`, `competitions`, `seasons`, and sport-aware match templates.
- Community model: `groups`, `group_members`, `group_challenges`, and `season_standings` for recurring leagues and creator rooms.
- Engagement model: `profile_stats`, `badges`, `profile_badges`, and `notifications`.
- Live play model: `mini_pick_templates`, `mini_pick_windows`, `mini_pick_options`, and `mini_pick_entries`.
- Automation-ready ops model: `event_sync_state` for provider sync / auto-settlement and `ai_generations` for optional recap pipelines.
- Device delivery model: `web_push_subscriptions` for browser-level push delivery per guest.
- Sharing: native share API, WhatsApp link, Telegram link, copy-link fallback, and `share_events` tracking.
- Social cards: dynamic OG image routes for pre-match and results states.
- PWA: manifest, icon routes, and a small service worker for installability plus offline shell fallback.

## Recommended Folder Structure

```text
lockscore/
├── public/
│   └── sw.js
├── scripts/
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── admin/
│   │   ├── api/
│   │   ├── c/
│   │   ├── groups/
│   │   ├── matches/
│   │   ├── offline/
│   │   ├── notifications/
│   │   ├── profile/
│   │   ├── sports/
│   │   ├── apple-icon.tsx
│   │   ├── globals.css
│   │   ├── icon.tsx
│   │   ├── layout.tsx
│   │   ├── manifest.ts
│   │   └── page.tsx
│   ├── components/
│   │   ├── admin/
│   │   ├── challenge/
│   │   ├── group/
│   │   ├── home/
│   │   ├── layout/
│   │   ├── match/
│   │   ├── notifications/
│   │   ├── profile/
│   │   ├── pwa/
│   │   ├── sports/
│   │   └── shared/
│   └── lib/
│       ├── actions/
│       ├── data/
│       ├── db/
│       ├── services/
│       ├── utils/
│       └── validation/
├── supabase/
│   └── migrations/
├── .env.example
├── next.config.ts
├── package.json
└── README.md
```

## Database Schema

Core tables:

- `sports`: base sport registry across cricket, football, Formula 1, basketball.
- `teams`: reusable competitors with `entity_type` so the same model can represent teams, clubs, franchises, and drivers.
- `users`: future Supabase Auth-backed full accounts.
- `guest_profiles`: MVP guest identities for frictionless participation.
- `competitions`: tournaments / leagues such as IPL or Premier League.
- `seasons`: competition seasons and current-season markers.
- `matches`: scheduled fixtures with lock time, settlement state, competition links, and provider metadata.
- `match_teams`: maps two teams onto a match with stable roles.
- `prediction_questions`: the per-match 5-pick challenge variables.
- `prediction_options`: allowed answers for each question.
- `challenges`: shareable challenge instances tied to a match.
- `challenge_participants`: guest/user entries for a challenge with public share codes and score snapshots.
- `participant_predictions`: one locked prediction per participant per question.
- `match_outcomes`: settlement envelope per match.
- `match_outcome_answers`: resolved ground truth answers per question.
- `challenge_scores`: leaderboard snapshot per participant.
- `groups`: recurring leagues, office tables, creator rooms, and community ladders.
- `group_members`: group membership plus roles.
- `group_challenges`: mapping between a challenge and one or more groups.
- `season_standings`: recurring-table standings for a group season.
- `profile_stats`: aggregate profile metrics including win rate, accuracy, contrarian hits, and reputation.
- `badges`: contrarian / sweep / table-topper badge definitions.
- `profile_badges`: awarded badge records for guest or user profiles.
- `notifications`: in-app alert feed for rivalry and lifecycle events.
- `event_sync_state`: provider sync state and auto-settlement support flags.
- `mini_pick_templates`: sport-level live-pick templates such as next over runs or next scoring team.
- `mini_pick_windows`: active live mini-pick prompts bound to a match.
- `mini_pick_options`: answer options for each mini-pick window.
- `mini_pick_entries`: guest/user submissions for a live mini-pick.
- `ai_generations`: storage for optional AI recap / storyline outputs.
- `web_push_subscriptions`: browser push endpoints, keys, activity state, and delivery failure tracking.
- `share_events`: native/copy/WhatsApp/Telegram/card share tracking.

Schema notes:

- Match questions are modeled per match so admins can tune copy or options without changing code.
- `guest_profiles` and `users` coexist so the MVP can stay guest-first while remaining extensible.
- `challenge_participants.public_code` keeps public compare links cleaner than exposing raw UUIDs.
- Settlement is normalized into `match_outcomes` plus `match_outcome_answers`, not hardcoded onto `matches`.
- V2 stays additive: V1 challenge flows still run on the same normalized tables, while standings / badges / groups layer on top.

## SQL Migrations

- Initial schema: [`supabase/migrations/202603210001_init_lockscore.sql`](./supabase/migrations/202603210001_init_lockscore.sql)
- V2 foundation: [`supabase/migrations/202603210002_v2_foundations.sql`](./supabase/migrations/202603210002_v2_foundations.sql)
- Phase 3 ops: [`supabase/migrations/202603220003_phase3_ops.sql`](./supabase/migrations/202603220003_phase3_ops.sql)
- Phase 4 live + AI: [`supabase/migrations/202603220004_phase4_live_ai.sql`](./supabase/migrations/202603220004_phase4_live_ai.sql)
- V2.1 push + realtime: [`supabase/migrations/202603230005_v21_push_realtime.sql`](./supabase/migrations/202603230005_v21_push_realtime.sql)

This migration includes:

- enum types
- normalized tables
- indexes
- `updated_at` trigger function
- row-level security enablement
- public read policies for public challenge data
- V2 group / standings / badge / profile / notification foundations
- provider sync tables and indexes
- mini-pick tables, indexes, RLS, and notification enums
- AI recap storage and generation support
- browser push subscription storage

## UI Route Map

- `/` landing page
- `/sports` sport directory
- `/sports/[sportKey]` sport-specific discovery hub
- `/matches` upcoming matches
- `/matches/[matchSlug]` match details
- `/matches/[matchSlug]/create` create challenge flow
- `/c/[challengeSlug]` join/shared challenge view
- `/c/[challengeSlug]/compare` comparison + opinion split
- `/c/[challengeSlug]/results` settled results + leaderboard
- `/groups` recurring groups / leagues directory
- `/groups/[groupSlug]` group table, linked boards, suggested fixtures
- `/groups/new` create private group / league / creator room
- `/groups/join` invite-code join flow
- `/leagues` league directory
- `/rooms` creator room directory
- `/profile` profile stats, badges, rivals, history
- `/notifications` in-app notification feed
- `/admin/login` admin passcode login
- `/admin` admin dashboard
- `/admin/matches/new` create match
- `/admin/matches/[matchId]/edit` edit match and question config
- `/admin/matches/[matchId]/settle` settle outcomes and calculate scores
- `/api/share` share tracking
- `/api/push/subscribe` browser push subscribe/unsubscribe
- `/api/system/provider-sync` provider sync / auto-settlement trigger
- `/api/system/notifications` notification sweep trigger
- `/api/og/challenge/[challengeSlug]` pre-match card image
- `/api/og/results/[challengeSlug]` results card image

## Component List

Shared UI:

- `Button`
- `Panel`
- `Input`
- `Textarea`
- `Select`
- `SubmitButton`
- `StatusPill`
- `EmptyState`
- `SectionHeading`
- `ShareActions`

Feature components:

- `Hero`
- `MatchCard`
- `SportCard`
- `GroupCard`
- `CreateChallengeForm`
- `JoinChallengeForm`
- `ComparisonTable`
- `OpinionBoard`
- `LiveMiniPicks`
- `MiniPickSubmitForm`
- `Leaderboard`
- `ResultsBreakdown`
- `AiCopyStack`
- `HistoryList`
- `StandingsTable`
- `ProfileOverview`
- `BadgeGrid`
- `TopRivals`
- `NotificationList`
- `PushOptInCard`
- `AutoRefresh`
- `AdminLoginForm`
- `CreateMatchForm`
- `EditMatchForm`
- `SettlementForm`
- `MatchSyncPanel`
- `MiniPickOpsPanel`

## Local Setup

1. Install Node.js 20+.
2. Copy `.env.example` to `.env.local`.
3. Set:
   - `NEXT_PUBLIC_APP_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_PASSCODE`
   - `THESPORTSDB_API_KEY` for cricket-first provider sync
   - `THESPORTSDB_BASE_URL` if you want to override the default provider endpoint
   - `SYSTEM_TASK_SECRET` for protected provider/notification system routes
   - `AI_GENERATION_ENABLED`
   - `AI_PROVIDER`
   - `OPENAI_API_KEY` if using the OpenAI provider
   - `OPENAI_MODEL`
   - `NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY`
   - `WEB_PUSH_PRIVATE_KEY`
   - `WEB_PUSH_SUBJECT`
4. Install dependencies:

```bash
npm install
```

5. Apply the SQL migration to your Supabase database.
6. Seed sample data:

```bash
npm run seed
```

7. Start the app:

```bash
npm run dev
```

## Seed Data

[`scripts/seed.ts`](./scripts/seed.ts) creates:

- multi-sport fixtures for cricket, football, Formula 1, and basketball
- IPL-focused cricket fixtures and groups
- default sport-specific 5-question templates
- cricket live mini-pick templates and seeded live windows
- football live mini-pick demo data
- open and settled challenge examples
- office league, creator room, college league, and community group seeds
- season standings
- badges, profile stats, and notifications
- provider-ready cricket match data for auto-settlement

The seed is intended to be idempotent.

## Admin Flows

### Create Match

- Login through `/admin/login` with `ADMIN_PASSCODE`.
- Open `/admin/matches/new`.
- Create the fixture with both team names, short codes, start time, and lock time.
- The app auto-generates the default cricket 5-pick question set.

### Edit Match

- Open `/admin/matches/[matchId]/edit`.
- Update fixture copy, status, question prompt copy, or option labels.

### Settle Match

- Open `/admin/matches/[matchId]/settle`.
- Pick the actual answer for each prediction variable.
- Submit settlement to:
  - create/update `match_outcomes`
  - update `match_outcome_answers`
  - mark each participant prediction correct/incorrect
  - compute leaderboard rows
  - mark the challenge as settled

### Provider Sync And Live Mini-Picks

- Open `/admin/matches/[matchId]/edit` or `/admin/matches/[matchId]/settle`.
- Trigger provider sync for provider-ready cricket matches when you want automated result pulls.
- Create a mini-pick window from the built-in sport templates.
- Settle the mini-pick window when the live moment resolves.
- The app records live entries, scores the correct calls, and creates in-app notifications.

## Sharing Integration

Implemented share surfaces:

- Native share API where available
- WhatsApp deep link
- Telegram share URL
- Copy-link fallback
- Dynamic share-card image routes
- AI-generated share lines for pre-match and post-match boards when enabled
- Browser push delivery for newly inserted notifications when configured

Tracked in `share_events`:

- `share_surface`
- `share_stage`
- `target_url`
- `message_template`

## Deployment Instructions

### Supabase

- Create a Supabase project.
- Run the migration in [`supabase/migrations`](./supabase/migrations).
- Add the required environment variables.

### Provider And AI Setup

- `THESPORTSDB_API_KEY=123` works for basic TheSportsDB development access.
- Set `SYSTEM_TASK_SECRET` before calling `/api/system/provider-sync` or `/api/system/notifications`.
- Keep `AI_PROVIDER=local` for deterministic built-in copy with no external API dependency.
- To use OpenAI instead, set `AI_GENERATION_ENABLED=true`, `AI_PROVIDER=openai`, `OPENAI_API_KEY`, and optionally `OPENAI_MODEL`.
- Generate web-push VAPID keys, then set `NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY`, `WEB_PUSH_PRIVATE_KEY`, and `WEB_PUSH_SUBJECT`.

### Vercel

- Import the `lockscore` folder as a Next.js project.
- Set the same environment variables in Vercel.
- Deploy with the default Next.js build pipeline.
- Wire scheduled jobs or an external cron to hit `/api/system/provider-sync` and `/api/system/notifications`.

Recommended production settings:

- Use preview deployments for copy/UI iterations.
- Keep the service role key server-only.
- Keep admin passcode private and rotate when needed.

## Known Limitations

- Auto-settlement is cricket-first and works best for provider-ready boards; classic social-only questions like toss winner still need manual settlement.
- Notifications are in-app plus browser push; native mobile push is still pending.
- Creator rooms currently reuse the recurring group model; a dedicated creator analytics surface is still pending.
- AI recap is live with local or OpenAI-backed generation, but there is no moderation/review queue yet.
- Live mini-picks are implemented for cricket first; other sports only have template scaffolding right now.
- Auth is still guest-first plus admin passcode; full account UX remains a later layer.
- Live surfaces use lightweight polling refresh, not websocket subscriptions yet.
- No image/logo asset pipeline yet; the sport hubs currently use theme-led visuals instead of uploaded team art.

## V2 Suggestions

- Add provider adapters for live cricket auto-settlement first, then football / Formula 1 / basketball fallback support.
- Extend browser push into native mobile push delivery where the platform supports it.
- Upgrade polling refresh to Supabase realtime or websocket fanout for faster live boards.
- Add creator-room moderation, featured creators, and creator leaderboard slices.
- Deepen live mini-picks for football, Formula 1, and basketball with sport-specific settlement adapters.
- Add moderation review, tone controls, and experiment flags for AI recap copy.
- Add Supabase OTP or magic-link auth for persistent identities while preserving guest joins.
