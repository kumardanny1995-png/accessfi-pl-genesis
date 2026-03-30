# AccessFi

Deposit-backed premium access vaults for crypto-native communities, research clubs, private cohorts, and gated digital products.

## Hackathon Submission

- Project: `AccessFi`
- Submission type: `Existing Code`
- Tracks: `Protocol Labs: Infrastructure & Digital Rights`, `Protocol Labs: Crypto`
- Sponsor integrations: `Flow`, `Lit Protocol`, `Storacha / Filecoin`, `NEAR`
- Repo focus: the hackathon work lives in the AccessFi routes, components, services, and SQL migration listed below

This repository contains the AccessFi submission built inside an existing product codebase. For hackathon review, the relevant product surface is the AccessFi app under `/accessfi`, not the older legacy routes in the rest of the repository.

## What AccessFi Does

AccessFi turns premium access into a programmable financial primitive.

Creators can:

- create a vault
- upload premium assets
- choose an access model such as deposit-to-unlock, subscription, token gate, or allowlist
- publish a public vault page

Members can:

- browse a public vault
- sign in with a low-friction account flow
- unlock access
- download gated assets
- see joined vaults, reserve state, and proof links in one library

Judges and operators can:

- open a proof console
- inspect storage refs, encrypted asset metadata, policy state, membership state, and unlock history

## Demo Routes

- `/accessfi`
- `/accessfi/vaults/[vaultSlug]`
- `/accessfi/create`
- `/accessfi/dashboard`
- `/accessfi/proof`
- `/accessfi/proof/[vaultSlug]`

## Sponsor Stack

- `Flow`
  Consumer-facing wallet and payment rail wiring for the unlock flow.
- `Lit Protocol`
  Encrypted access-control path with runtime fallback for demo continuity.
- `Storacha / Filecoin`
  Decentralized storage path for protected assets and proof-linked storage refs.
- `NEAR`
  Intent-style abstraction and future settlement rail scaffolding.

## Existing Code Changelog

This submission is entered under the hackathon `Existing Code` path. The substantial hackathon work added during the event is the AccessFi product surface and its sponsor integration architecture.

New app routes:

- `src/app/accessfi/page.tsx`
- `src/app/accessfi/vaults/[vaultSlug]/page.tsx`
- `src/app/accessfi/create/page.tsx`
- `src/app/accessfi/creator/page.tsx`
- `src/app/accessfi/dashboard/page.tsx`
- `src/app/accessfi/proof/page.tsx`
- `src/app/accessfi/proof/[vaultSlug]/page.tsx`
- `src/app/accessfi/assets/[assetId]/route.ts`

New AccessFi UI and app logic:

- `src/components/accessfi/*`
- `src/lib/accessfi/*`
- `src/lib/validation/accessfi-schemas.ts`

New database layer:

- `supabase/migrations/202603260001_accessfi.sql`

New submission docs:

- `ACCESSFI_README.md`
- `ACCESSFI_SUBMISSION_NOTES.md`

## Repo Guide For Judges

If you only want the hackathon implementation, start here:

- `ACCESSFI_README.md`
- `ACCESSFI_SUBMISSION_NOTES.md`
- `src/app/accessfi`
- `src/components/accessfi`
- `src/lib/accessfi`
- `supabase/migrations/202603260001_accessfi.sql`

## Local Run

```bash
npm install
npm run dev -- --port 3010
```

Then open:

```text
http://127.0.0.1:3010/accessfi
```

## Notes

- This repository remains open-source and public for hackathon review.
- Legacy non-AccessFi routes remain because this is an `Existing Code` submission, not a fresh repo built from zero.
- The hackathon-specific product story, demo path, and sponsor integrations are all centered on AccessFi.
