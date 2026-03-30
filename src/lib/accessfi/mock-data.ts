export type AccessFiMetric = {
  label: string;
  value: string;
  note: string;
};

export type AccessPlan = {
  id: string;
  label: string;
  deposit: string;
  recurringFee: string;
  cadence: string;
  seatType: string;
  note: string;
  rails: string[];
};

export type VaultAsset = {
  title: string;
  format: string;
  unlock: string;
  summary: string;
  cid: string;
  size: string;
};

export type ProofEvent = {
  time: string;
  title: string;
  detail: string;
  protocol: string;
};

export type SponsorIntegration = {
  protocol: string;
  role: string;
  demoMoment: string;
  track: string;
};

export type VaultRecord = {
  slug: string;
  name: string;
  creator: string;
  tagline: string;
  teaser: string;
  audience: string;
  launchStatus: string;
  memberCount: string;
  referralRate: string;
  reservedBalance: string;
  plans: AccessPlan[];
  assets: VaultAsset[];
  policyRules: string[];
  viralityLoops: string[];
  buyerMoments: string[];
  proofEvents: ProofEvent[];
  sponsorIntegrations: SponsorIntegration[];
};

export const landingMetrics: AccessFiMetric[] = [
  {
    label: "Time To Unlock",
    value: "4 clicks",
    note: "Email or passkey to paid access without forcing a wallet install."
  },
  {
    label: "Member Risk",
    value: "Deposit-backed",
    note: "Users keep reclaimable balance instead of lighting the full spend on fire."
  },
  {
    label: "Rights Layer",
    value: "Programmable",
    note: "Encryption, expiry, team seats, and gated automations all resolve from policy."
  },
  {
    label: "Distribution",
    value: "Built-in",
    note: "Teaser pages, invites, referrals, guest passes, and branded sub-vaults."
  }
];

export const painPoints = [
  "Telegram roles, Discord channels, Google Drive folders, and private Notion pages do not behave like an actual product.",
  "Creators charge upfront but cannot offer flexible access, reclaimable balance, or team-seat economics without custom ops.",
  "Buyers do not want crypto-native friction just to read a memo, unlock a dashboard, or join a premium room.",
  "Judges want a product they understand instantly, not a raw storage or wallet primitive with no wedge."
];

export const trackNarratives = [
  {
    track: "Infrastructure & Digital Rights",
    headline: "Vaults become programmable rights containers.",
    body:
      "Every asset is encrypted before upload, stored on Storacha/Filecoin, and unlocked only when Lit policies resolve true for the active seat, invited identity, team scope, or time window."
  },
  {
    track: "Crypto",
    headline: "Membership behaves like a financial product, not a static paywall.",
    body:
      "Users join with walletless onboarding, keep a reserved balance, pay recurring access from that balance, and can route value from whatever asset path is easiest with Flow plus NEAR abstraction."
  }
];

export const creatorWedges = [
  "Crypto research memberships that want premium notes, dashboards, and call archives behind a real paywall.",
  "Operator communities that sell access to deal rooms, templates, and cohort sessions but need team seats and audit logs.",
  "Education cohorts that want members to join instantly, unlock week-by-week modules, and share guest passes.",
  "AI tool clubs that distribute prompt packs, private APIs, and evaluation datasets without leaking everything in one download."
];

export const demoSteps = [
  {
    title: "Creator launches a vault",
    description: "Upload encrypted assets, define deposit and billing terms, publish a public teaser page, and configure policy rules."
  },
  {
    title: "Buyer joins walletlessly",
    description: "Passkey or email onboarding creates the user session, then Flow-friendly payment rails and NEAR abstraction handle the membership top-up path."
  },
  {
    title: "Proof console explains why access exists",
    description: "The app shows the encrypted CID, the policy that evaluated true, the payment event, and the access grant trail in one panel."
  }
];

export const proofArchitecture = [
  {
    label: "Identity",
    value: "Email or passkey session linked to a Lit-managed signing context"
  },
  {
    label: "Commerce",
    value: "Walletless Flow checkout with deposit reserve and scheduled membership debits"
  },
  {
    label: "Abstraction",
    value: "NEAR intent or chain-signature bridge path for non-native user assets"
  },
  {
    label: "Storage",
    value: "Encrypted uploads pinned through Storacha and persisted on Filecoin"
  },
  {
    label: "Policy",
    value: "Lit access conditions decide decryption for seat state, role, expiry, and invite scope"
  }
];

export const featuredVault: VaultRecord = {
  slug: "frontier-alpha-room",
  name: "Frontier Alpha Room",
  creator: "ARC/0 Research",
  tagline: "Deposit-backed access to premium macro memos, trade dashboards, and operator briefings.",
  teaser:
    "A private room for founder-operators and crypto researchers who want weekly strategy notes, market maps, and curated playbooks without the usual Telegram chaos.",
  audience: "Research creators, paid communities, operator circles, and DAO sub-groups.",
  launchStatus: "18 seats left in the founding cohort",
  memberCount: "142 active seats",
  referralRate: "37% of new seats arrive via member invite links",
  reservedBalance: "$24,860 reserved across active member balances",
  plans: [
    {
      id: "founding-pass",
      label: "Founding Pass",
      deposit: "$150 reserve",
      recurringFee: "$12",
      cadence: "weekly",
      seatType: "individual seat",
      note: "Reserved balance is reclaimable when the member exits, minus fees already consumed.",
      rails: ["Email or passkey join", "USDC checkout on Flow", "ETH or BTC routed via NEAR intent"]
    },
    {
      id: "team-seat",
      label: "Team Seat",
      deposit: "$480 reserve",
      recurringFee: "$34",
      cadence: "weekly",
      seatType: "3-seat workspace",
      note: "Includes one operator dashboard, one analyst seat, and one read-only guest reviewer.",
      rails: ["Branded invite link", "Flow scheduled debits", "Team policy scopes via Lit"]
    },
    {
      id: "flash-pass",
      label: "Flash Pass",
      deposit: "$30 reserve",
      recurringFee: "$0",
      cadence: "single event",
      seatType: "72-hour guest pass",
      note: "Good for launch week, conference drops, or sponsor bundles that spread virally on X.",
      rails: ["Link-first join", "One-time vault unlock", "Auto-expiry policy"]
    }
  ],
  assets: [
    {
      title: "Sunday Macro Memo",
      format: "Encrypted PDF",
      unlock: "Founding Pass + active balance",
      summary: "Weekly research note with conviction ladder, catalyst map, and 7-day scenario framing.",
      cid: "bafybeicollabmacro2026memo001",
      size: "4.8 MB"
    },
    {
      title: "Catalyst Radar",
      format: "Private dashboard",
      unlock: "Founding Pass or Team Seat",
      summary: "Signal dashboard with tagged narratives, watchlists, and linked market notes.",
      cid: "bafybeicatalystradarvault002",
      size: "Live query view"
    },
    {
      title: "Operator Briefing Pack",
      format: "CSV + Loom notes",
      unlock: "Team Seat only",
      summary: "Deal room package for go-to-market operators who need live templates and archived reviews.",
      cid: "bafybeioperatorpackteam003",
      size: "12 files"
    },
    {
      title: "Guest Trial Brief",
      format: "Teaser bundle",
      unlock: "Flash Pass",
      summary: "A time-boxed brief designed to convert referred guests into full reserve-backed members.",
      cid: "bafybeiguesttrialbrief004",
      size: "1.1 MB"
    }
  ],
  policyRules: [
    "Member reserve must stay above the next cycle fee before the weekly debit runs.",
    "The active session must be linked to the invited identity or delegated team seat scope.",
    "Guest passes expire automatically after 72 hours and revoke decryption access without manual ops.",
    "Creator can issue referral multipliers that top up member balance instead of handing out plain coupon codes."
  ],
  viralityLoops: [
    "Every vault has a public teaser page that can circulate on X, Telegram, WhatsApp, and Farcaster before the user ever creates an account.",
    "Members can gift a flash pass, and the gifted user lands in a branded vault with one-click onboarding.",
    "Creators can spin up sub-vaults for a launch, conference, or cohort without rebuilding payments, storage, and permissioning from scratch.",
    "Referral rewards accrue as reserve balance, so members are incentivized to invite peers who will actually stay."
  ],
  buyerMoments: [
    "Join without a wallet and still land on a real onchain payment and rights rail.",
    "Keep working capital in reserve instead of paying a dead upfront fee for every private room.",
    "See exactly which asset unlocked, why it unlocked, and when access will refresh or expire.",
    "Use the same seat to unlock files, dashboards, archives, and AI copilots gated behind the vault."
  ],
  proofEvents: [
    {
      time: "09:02",
      title: "Passkey session created",
      detail: "Buyer accepted an invite link and minted a vault session bound to the invited identity.",
      protocol: "Flow + Lit"
    },
    {
      time: "09:03",
      title: "Reserve funded",
      detail: "The member topped up a Founding Pass using a walletless checkout path and credited the reserve balance.",
      protocol: "Flow"
    },
    {
      time: "09:03",
      title: "Access conditions evaluated true",
      detail: "Lit checked active balance, seat scope, and vault expiry rules before releasing the decryption share.",
      protocol: "Lit Protocol"
    },
    {
      time: "09:04",
      title: "Encrypted bundle fetched",
      detail: "Vault assets were served through a Storacha upload root pinned to Filecoin-backed storage.",
      protocol: "Storacha + Filecoin"
    },
    {
      time: "09:05",
      title: "Cross-chain invite path recorded",
      detail: "The system stored the intended asset path for a follow-up referral payment using NEAR abstraction.",
      protocol: "NEAR"
    }
  ],
  sponsorIntegrations: [
    {
      protocol: "Flow",
      role: "Walletless onboarding, deposit reserve, and consumer-grade recurring seat payments.",
      demoMoment: "A member joins through passkey + reserve funding in one flow.",
      track: "Crypto"
    },
    {
      protocol: "Lit Protocol",
      role: "Programmable encryption, decryption, and seat-aware access rules.",
      demoMoment: "Access grant succeeds only when the member reserve and role conditions evaluate true.",
      track: "Infrastructure & Digital Rights"
    },
    {
      protocol: "Storacha",
      role: "Hot upload path and delegated storage pipeline for user assets.",
      demoMoment: "Creator uploads encrypted files into a vault namespace without exposing raw contents.",
      track: "Infrastructure & Digital Rights"
    },
    {
      protocol: "Filecoin",
      role: "Verifiable persistence and retrieval narrative for encrypted vault assets.",
      demoMoment: "Proof console displays CID-backed storage references for the gated bundle.",
      track: "Infrastructure & Digital Rights"
    },
    {
      protocol: "NEAR",
      role: "Intent and chain-abstraction path for users paying from non-native assets.",
      demoMoment: "A user can express 'join this vault with the cheapest route from my existing asset.'",
      track: "Crypto"
    }
  ]
};

export const dashboardMetrics: AccessFiMetric[] = [
  {
    label: "Reserve Balance",
    value: "$142",
    note: "Enough for 11 more weekly cycles before the seat needs a top-up."
  },
  {
    label: "Next Debit",
    value: "$12 on Friday",
    note: "Scheduled charge can route through the member's default Flow-backed payment path."
  },
  {
    label: "Unlocked Assets",
    value: "9 live items",
    note: "Research memos, operator packs, private dashboards, and archive bundles."
  },
  {
    label: "Invite Credits",
    value: "$28 earned",
    note: "Referral rewards show up as reserve balance instead of disposable coupon credits."
  }
];

export const proofConsoleHighlights = [
  "The same vault can govern files, dashboards, API keys, and AI tool outputs without changing the member model.",
  "Judge-facing proof screens remove the 'trust me, it worked' problem that most storage and access demos suffer from.",
  "The product is understandable to non-technical judges in under 30 seconds because the value exchange is obvious.",
  "The startup path is credible because premium communities already spend money to hack around this problem today."
];

export function getVaultBySlug(slug: string): VaultRecord | undefined {
  if (slug === featuredVault.slug) {
    return featuredVault;
  }

  return undefined;
}
