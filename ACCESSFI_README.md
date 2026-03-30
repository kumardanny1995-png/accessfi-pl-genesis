# AccessFi

Deposit-backed premium access vaults for paid communities, research clubs, private data rooms, and gated digital products.

## What ships now

- `/accessfi` landing page backed by live vault records
- `/accessfi/vaults/[vaultSlug]` public vault page with real join flow
- `/accessfi/creator` creator dashboard
- `/accessfi/create` create-vault form and upload flow
- `/accessfi/dashboard` member library with asset downloads
- `/accessfi/proof` global proof console
- `/accessfi/proof/[vaultSlug]` vault-specific proof detail
- `/accessfi/assets/[assetId]` gated download route

## Product flow

### Creator

1. Sign in with the existing Supabase auth flow.
2. Open `/accessfi/create`.
3. Upload one premium asset.
4. Choose `deposit`, `subscription`, `token gate`, `allowlist`, or `time-based`.
5. Publish the vault.

### Member

1. Open a public vault page.
2. Sign in if needed.
3. Pick a checkout rail.
4. Unlock access.
5. Open `/accessfi/dashboard` and download the gated asset.

### Judge / Admin

1. Open `/accessfi/proof`.
2. Pick a vault proof detail.
3. Show storage refs, encryption refs, membership state, and unlock events together.

## Tech stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase auth + optional Supabase persistence
- Local JSON persistence fallback for demo continuity
- Flow client wallet rail via `@onflow/fcl`
- Lit encryption envelope via `@lit-protocol/lit-node-client` + `@lit-protocol/encryption`
- Storacha/Filecoin upload path via `@storacha/client`
- NEAR intent/signer scaffolding via `near-api-js`

## Persistence model

AccessFi uses a dual-mode repository:

- `supabase`
  Uses the AccessFi SQL migration and stores vaults, assets, policies, memberships, events, and checkout sessions in Postgres.
- `file`
  Falls back to `tmp/accessfi-demo-store.json` when the AccessFi tables are not present yet.

This keeps the demo runnable before the migration is applied.

## Database migration

Apply:

- `supabase/migrations/202603260001_accessfi.sql`

This adds:

- `accessfi_vaults`
- `accessfi_assets`
- `accessfi_access_policies`
- `accessfi_memberships`
- `accessfi_unlock_events`
- `accessfi_allowlist_entries`
- `accessfi_checkout_sessions`

## Sponsor integrations

### Live by default

- `Flow`
  Client-side wallet rail config is live on testnet defaults.
- `Lit`
  AccessFi attempts a real Lit encryption envelope at runtime and falls back to local AES if unavailable.
- `NEAR`
  Intent/signer configuration is wired with testnet RPC defaults.

### Credential-gated

- `Storacha/Filecoin`
  Real encrypted upload requires a Storacha principal, proof, and space DID.

## AccessFi env vars

### Required for auth / optional Supabase persistence

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Flow

- `NEXT_PUBLIC_FLOW_NETWORK`
- `NEXT_PUBLIC_FLOW_ACCESS_NODE`
- `NEXT_PUBLIC_FLOW_WALLET_DISCOVERY`
- `NEXT_PUBLIC_FLOW_APP_TITLE`

### Lit

- `ACCESSFI_LIT_ENABLED`
- `ACCESSFI_LIT_NETWORK`

### Storacha

- `ACCESSFI_STORACHA_SPACE_DID`
- `ACCESSFI_STORACHA_PROOF`
- `ACCESSFI_STORACHA_PRINCIPAL`
- `ACCESSFI_STORACHA_GATEWAY`

### NEAR

- `ACCESSFI_NEAR_NETWORK`
- `ACCESSFI_NEAR_RPC_URL`
- `ACCESSFI_NEAR_SIGNER_ACCOUNT_ID`
- `ACCESSFI_NEAR_SIGNER_SECRET_KEY`

## What is real vs fallback

### Real now

- Supabase auth
- End-to-end create/join/library/proof/download routes
- Flow client rail configuration
- Lit SDK wiring and runtime encryption attempt
- NEAR SDK wiring and intent quote scaffolding
- Storacha client wiring

### Fallback behavior

- If AccessFi tables are missing, the app uses a local JSON store.
- If Lit encryption fails, the app falls back to local AES while preserving proof metadata.
- If Storacha credentials are missing, encrypted payloads stay in demo-local storage refs.
- Flow and NEAR create real rail metadata, but the final onchain checkout still needs sponsor-specific contract or signer rollout.

## Local run

```bash
npm install
npm run dev
```

Optional verification:

```bash
npm run typecheck
npm run build
```

## Next steps

- Apply the AccessFi migration to Supabase so the app exits file-fallback mode.
- Replace demo checkout refs with a real Flow checkout contract or sponsored transaction path.
- Replace local key backup usage with full Lit session-signature decryption in the client.
- Add a credentialed Storacha proof export/import flow for production upload.
- Upgrade NEAR intent quotes into a real execution path with chain signatures or relayer logic.
