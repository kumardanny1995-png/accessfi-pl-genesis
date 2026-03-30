# AccessFi

Deposit-backed premium access for research rooms, paid communities, private tools, and operator vaults.

## Core hook

Instead of paying a dead one-time fee for private content, users fund a reserve balance that powers recurring access. The balance can be topped up, monitored, rewarded with referrals, and partially reclaimed when the seat ends.

That makes the product understandable as both:

- digital-rights infrastructure
- consumer crypto commerce

## Why it fits the PL Genesis tracks

### Infrastructure & Digital Rights

- creators upload encrypted assets into vault namespaces
- Storacha handles the hot upload path
- Filecoin provides the persistence and proof narrative
- Lit Protocol controls decryption based on active seat rules
- the proof console shows CID, policy, and access event together

### Crypto

- members join through walletless onboarding
- Flow powers the consumer-grade payment and reserve experience
- recurring access debits come from an active reserve balance
- NEAR abstraction can route value from other assets into the vault join path
- membership becomes a reusable financial relationship, not a static checkout

## The shipped MVP surfaces

- `/accessfi`
  - flagship marketing page
- `/accessfi/creator`
  - creator-side studio narrative
- `/accessfi/vaults/frontier-alpha-room`
  - buyer vault / join flow
- `/accessfi/dashboard`
  - active member dashboard
- `/accessfi/proof`
  - judge-facing proof console

## Three-minute demo flow

1. Open `/accessfi` and explain the problem: private communities still run on ugly Telegram + Notion + manual billing stacks.
2. Open `/accessfi/creator` and show how a creator sets reserve model, assets, and access policies.
3. Open `/accessfi/vaults/frontier-alpha-room` and explain the seat plans and what unlocks.
4. Open `/accessfi/dashboard` and show reserve balance, recurring debit, unlocked assets, and referral credits.
5. Open `/accessfi/proof` and close on the sponsor stack plus access event trail.

## What to build next after the prototype

- actual Flow walletless checkout
- Lit encryption/decryption plus policy evaluation
- Storacha upload pipeline and CID persistence
- Filecoin storage status mirror
- NEAR intent path for cross-asset funding
- simple creator auth plus real member state
