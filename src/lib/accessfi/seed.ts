import {
  type AccessFiAccessPolicy,
  type AccessFiAllowlistEntry,
  type AccessFiCheckoutSession,
  type AccessFiMembership,
  type AccessFiProfile,
  type AccessFiSnapshot,
  type AccessFiUnlockEvent,
  type AccessFiVault,
  type AccessFiAsset
} from "@/lib/accessfi/types";

const CREATED_AT = "2026-03-20T09:00:00.000Z";
const UPDATED_AT = "2026-03-26T09:00:00.000Z";

function encodeSeedPayload(value: string) {
  return Buffer.from(value, "utf8").toString("base64");
}

export function createAccessFiSeedSnapshot(): AccessFiSnapshot {
  const profiles: AccessFiProfile[] = [
    {
      userId: "11111111-1111-4111-8111-111111111111",
      email: "northstar@accessfi.demo",
      displayName: "Northstar Research",
      avatarUrl: null,
      flowAddress: "0x179b6b1cb6755e31",
      nearAccountId: "northstar.testnet",
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT
    },
    {
      userId: "22222222-2222-4222-8222-222222222222",
      email: "vector@accessfi.demo",
      displayName: "Vector DAO",
      avatarUrl: null,
      flowAddress: "0x01cf0e2f2f715450",
      nearAccountId: "vectordao.testnet",
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT
    },
    {
      userId: "33333333-3333-4333-8333-333333333333",
      email: "member@accessfi.demo",
      displayName: "Aarav Patel",
      avatarUrl: null,
      flowAddress: "0xf8d6e0586b0a20c7",
      nearAccountId: "aarav.testnet",
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT
    }
  ];

  const vaults: AccessFiVault[] = [
    {
      id: "aaaaaaaa-1111-4111-8111-aaaaaaaa1111",
      creatorUserId: profiles[0]?.userId ?? null,
      creatorName: "Northstar Research",
      creatorAvatarUrl: null,
      title: "BTC Research Club",
      slug: "btc-research-club",
      teaser: "Deposit-backed access to weekly BTC memos, macro dashboards, and conviction ladders.",
      description:
        "A research club for operators and active investors who want a clean member account, an encrypted memo archive, and a proof-linked trail for every unlock.",
      thumbnailUrl: null,
      previewUrl: null,
      accessType: "deposit_to_unlock",
      depositAmount: 150,
      subscriptionAmount: 12,
      currency: "USDC",
      published: true,
      metadata: {
        cadence: "weekly",
        seatsLeft: 18,
        useCase: "premium research membership"
      },
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT
    },
    {
      id: "bbbbbbbb-2222-4222-8222-bbbbbbbb2222",
      creatorUserId: profiles[1]?.userId ?? null,
      creatorName: "Vector DAO",
      creatorAvatarUrl: null,
      title: "Operator Room",
      slug: "operator-room",
      teaser: "Subscription access for deal memos, private GTM templates, and live operator reviews.",
      description:
        "A premium operator workspace where team seats unlock templates, archived reviews, and private market maps without relying on Discord roles.",
      thumbnailUrl: null,
      previewUrl: null,
      accessType: "subscription_access",
      depositAmount: null,
      subscriptionAmount: 29,
      currency: "USDC",
      published: true,
      metadata: {
        cadence: "monthly",
        seatType: "team",
        useCase: "operator cohort"
      },
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT
    },
    {
      id: "cccccccc-3333-4333-8333-cccccccc3333",
      creatorUserId: profiles[1]?.userId ?? null,
      creatorName: "Vector DAO",
      creatorAvatarUrl: null,
      title: "DAO Strategy Vault",
      slug: "dao-strategy-vault",
      teaser: "Invite-only memos, governance packets, and treasury playbooks for a private DAO cohort.",
      description:
        "An allowlist-first vault for invited operators who need a clean place to read strategy packs, policy notes, and treasury templates.",
      thumbnailUrl: null,
      previewUrl: null,
      accessType: "allowlist_access",
      depositAmount: null,
      subscriptionAmount: null,
      currency: "USDC",
      published: true,
      metadata: {
        cadence: "invite-only",
        seatType: "allowlist",
        useCase: "private DAO working group"
      },
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT
    },
    {
      id: "dddddddd-4444-4444-8444-dddddddd4444",
      creatorUserId: profiles[0]?.userId ?? null,
      creatorName: "Northstar Research",
      creatorAvatarUrl: null,
      title: "AI Market Intelligence Pack",
      slug: "ai-market-intelligence-pack",
      teaser: "Token-gated access to model prompts, sector watchlists, and private dataset drops.",
      description:
        "A token-gated vault for communities who want to distribute prompt packs and private market datasets with proof-linked storage and policy checks.",
      thumbnailUrl: null,
      previewUrl: null,
      accessType: "token_gated_access",
      depositAmount: null,
      subscriptionAmount: null,
      currency: "USDC",
      published: true,
      metadata: {
        tokenSymbol: "VECTOR",
        minimumTokenBalance: "250",
        useCase: "token community"
      },
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT
    }
  ];

  const assets: AccessFiAsset[] = [
    {
      id: "11111111-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
      vaultId: vaults[0]?.id ?? "",
      title: "Sunday Macro Memo",
      originalFileName: "sunday-macro-memo.md",
      mimeType: "text/markdown",
      sizeBytes: 1876,
      encrypted: true,
      storageProvider: "local_demo",
      storageRef: "local://btc-research-club/sunday-macro-memo",
      encryptionRef: JSON.stringify({ mode: "seed-plain", note: "Seeded demo payload" }),
      previewText: "Weekly note with conviction ladder, catalysts, and downside scenarios.",
      encryptedPayloadB64: encodeSeedPayload(
        "# Sunday Macro Memo\n\n- BTC market structure remains constructive above the weekly reclaim.\n- Catalyst stack: ETF flows, stablecoin supply, miner rotation.\n- Risk ladder: macro shock, ETF slowdown, gamma unwind."
      ),
      createdAt: CREATED_AT
    },
    {
      id: "22222222-bbbb-4bbb-8bbb-bbbbbbbbbbb2",
      vaultId: vaults[0]?.id ?? "",
      title: "Catalyst Radar",
      originalFileName: "catalyst-radar.csv",
      mimeType: "text/csv",
      sizeBytes: 932,
      encrypted: true,
      storageProvider: "local_demo",
      storageRef: "local://btc-research-club/catalyst-radar",
      encryptionRef: JSON.stringify({ mode: "seed-plain", note: "Seeded demo payload" }),
      previewText: "CSV watchlist of catalysts, dates, and priority tags for the next 30 days.",
      encryptedPayloadB64: encodeSeedPayload("date,catalyst,priority\n2026-03-29,ETF flow print,high\n2026-04-02,CPI release,high\n2026-04-05,miner treasury update,medium"),
      createdAt: CREATED_AT
    },
    {
      id: "33333333-cccc-4ccc-8ccc-ccccccccccc3",
      vaultId: vaults[1]?.id ?? "",
      title: "Operator Playbook",
      originalFileName: "operator-playbook.md",
      mimeType: "text/markdown",
      sizeBytes: 2024,
      encrypted: true,
      storageProvider: "local_demo",
      storageRef: "local://operator-room/operator-playbook",
      encryptionRef: JSON.stringify({ mode: "seed-plain", note: "Seeded demo payload" }),
      previewText: "Template set for GTM reviews, launch retros, and team-seat meeting packs.",
      encryptedPayloadB64: encodeSeedPayload(
        "# Operator Playbook\n\n1. Weekly review rubric\n2. Messaging teardown template\n3. GTM sprint checklist\n4. Demo room follow-up scorecard"
      ),
      createdAt: CREATED_AT
    },
    {
      id: "44444444-dddd-4ddd-8ddd-ddddddddddd4",
      vaultId: vaults[2]?.id ?? "",
      title: "Treasury Briefing",
      originalFileName: "treasury-briefing.md",
      mimeType: "text/markdown",
      sizeBytes: 1640,
      encrypted: true,
      storageProvider: "local_demo",
      storageRef: "local://dao-strategy-vault/treasury-briefing",
      encryptionRef: JSON.stringify({ mode: "seed-plain", note: "Seeded demo payload" }),
      previewText: "Private treasury memo and governance packet for the next DAO working session.",
      encryptedPayloadB64: encodeSeedPayload(
        "# Treasury Briefing\n\n- Stablecoin runway: 17 months\n- Risk budget: 12%\n- Proposed hedge bands: 0.35 / 0.50 / 0.65\n- Governance checkpoint: Friday"
      ),
      createdAt: CREATED_AT
    },
    {
      id: "55555555-eeee-4eee-8eee-eeeeeeeeeee5",
      vaultId: vaults[3]?.id ?? "",
      title: "Sector Prompt Pack",
      originalFileName: "sector-prompt-pack.md",
      mimeType: "text/markdown",
      sizeBytes: 1431,
      encrypted: true,
      storageProvider: "local_demo",
      storageRef: "local://ai-market-intelligence-pack/sector-prompt-pack",
      encryptionRef: JSON.stringify({ mode: "seed-plain", note: "Seeded demo payload" }),
      previewText: "Prompt pack and workflow notes for AI-assisted market mapping.",
      encryptedPayloadB64: encodeSeedPayload(
        "# Sector Prompt Pack\n\n- Build a 6-week catalyst map\n- Score narratives by liquidity, attention, and catalyst density\n- Draft a founder-facing briefing"
      ),
      createdAt: CREATED_AT
    }
  ];

  const policies: AccessFiAccessPolicy[] = [
    {
      id: "66666666-aaaa-4aaa-8aaa-aaaaaaaaaaa6",
      vaultId: vaults[0]?.id ?? "",
      policyType: "deposit_to_unlock",
      policyJson: {
        reserveRequired: 150,
        recurringCharge: 12,
        cadence: "weekly",
        rails: ["flow_wallet", "near_intent", "email_passkey"],
        litMirror: "wallet_presence"
      },
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT
    },
    {
      id: "77777777-bbbb-4bbb-8bbb-bbbbbbbbbbb7",
      vaultId: vaults[1]?.id ?? "",
      policyType: "subscription_access",
      policyJson: {
        recurringCharge: 29,
        cadence: "monthly",
        rails: ["flow_wallet", "near_intent", "email_passkey"],
        seatType: "team"
      },
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT
    },
    {
      id: "88888888-cccc-4ccc-8ccc-ccccccccccc8",
      vaultId: vaults[2]?.id ?? "",
      policyType: "allowlist_access",
      policyJson: {
        allowlistEnabled: true,
        allowlistHint: "Invited emails only",
        rails: ["email_passkey"]
      },
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT
    },
    {
      id: "99999999-dddd-4ddd-8ddd-ddddddddddd9",
      vaultId: vaults[3]?.id ?? "",
      policyType: "token_gated_access",
      policyJson: {
        chain: "ethereum",
        tokenSymbol: "VECTOR",
        tokenContract: "0x0000000000000000000000000000000000000001",
        minimumBalance: "250",
        rails: ["flow_wallet", "near_intent"]
      },
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT
    }
  ];

  const allowlistEntries: AccessFiAllowlistEntry[] = [
    {
      id: "aaaa1111-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
      vaultId: vaults[2]?.id ?? "",
      identifier: "member@accessfi.demo",
      type: "email",
      createdAt: CREATED_AT
    },
    {
      id: "bbbb2222-bbbb-4bbb-8bbb-bbbbbbbbbbb2",
      vaultId: vaults[2]?.id ?? "",
      identifier: "vector.fund",
      type: "domain",
      createdAt: CREATED_AT
    }
  ];

  const memberships: AccessFiMembership[] = [
    {
      id: "cccc3333-cccc-4ccc-8ccc-ccccccccccc3",
      vaultId: vaults[0]?.id ?? "",
      userId: profiles[2]?.userId ?? "",
      planType: "deposit_to_unlock",
      status: "active",
      depositAmount: 150,
      reservedBalance: 126,
      subscriptionAmount: 12,
      currency: "USDC",
      paymentProvider: "flow_wallet",
      externalAccountRef: profiles[2]?.flowAddress ?? null,
      metadata: {
        linkedRail: "flow_wallet"
      },
      createdAt: "2026-03-22T08:30:00.000Z",
      startAt: "2026-03-22T08:30:00.000Z",
      endAt: null,
      updatedAt: UPDATED_AT
    }
  ];

  const unlockEvents: AccessFiUnlockEvent[] = [
    {
      id: "dddd4444-dddd-4ddd-8ddd-ddddddddddd4",
      vaultId: vaults[0]?.id ?? "",
      userId: profiles[2]?.userId ?? "",
      membershipId: memberships[0]?.id ?? null,
      assetId: assets[0]?.id ?? null,
      accessType: "deposit_to_unlock",
      status: "granted",
      provider: "flow_wallet",
      txRef: "flow:testnet:session-demo-0001",
      message: "Reserve funded and access granted for the BTC Research Club.",
      metadata: {
        cid: assets[0]?.storageRef,
        policy: "active reserve + seat scope"
      },
      createdAt: "2026-03-22T08:31:00.000Z"
    },
    {
      id: "eeee5555-eeee-4eee-8eee-eeeeeeeeeee5",
      vaultId: vaults[0]?.id ?? "",
      userId: profiles[2]?.userId ?? "",
      membershipId: memberships[0]?.id ?? null,
      assetId: assets[1]?.id ?? null,
      accessType: "deposit_to_unlock",
      status: "granted",
      provider: "lit_policy",
      txRef: null,
      message: "Catalyst Radar unlocked because balance and invite scope resolved true.",
      metadata: {
        cid: assets[1]?.storageRef,
        policy: "lit-manifest mirror"
      },
      createdAt: "2026-03-22T08:32:00.000Z"
    }
  ];

  const checkoutSessions: AccessFiCheckoutSession[] = [
    {
      id: "ffff6666-ffff-4fff-8fff-fffffffffff6",
      vaultId: vaults[0]?.id ?? "",
      userId: profiles[2]?.userId ?? "",
      provider: "flow_wallet",
      status: "confirmed",
      amount: 150,
      currency: "USDC",
      txRef: "flow:testnet:session-demo-0001",
      quoteJson: {
        network: "testnet",
        rail: "flow_wallet",
        walletAddress: profiles[2]?.flowAddress ?? null
      },
      createdAt: "2026-03-22T08:30:00.000Z",
      updatedAt: "2026-03-22T08:31:00.000Z"
    }
  ];

  return {
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
    profiles,
    vaults,
    assets,
    policies,
    memberships,
    unlockEvents,
    allowlistEntries,
    checkoutSessions
  };
}
