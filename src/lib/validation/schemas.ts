import { z } from "zod";

export const adminLoginSchema = z.object({
  passcode: z.string().min(4, "Passcode is required.")
});

export const createChallengeSchema = z.object({
  matchId: z.string().uuid("Match is required."),
  groupId: z.string().uuid().optional().or(z.literal("")),
  creatorName: z.string().trim().min(2, "Enter your name.").max(30, "Keep it short."),
  challengeTitle: z.string().trim().min(3, "Add a challenge title.").max(80, "Keep it under 80 chars."),
  stakeText: z.string().trim().max(80, "Keep it punchy.").optional().or(z.literal("")),
  shareMessage: z.string().trim().max(180, "Keep the share text concise.").optional().or(z.literal(""))
});

export const joinChallengeSchema = z.object({
  challengeSlug: z.string().min(3, "Invalid challenge."),
  participantName: z.string().trim().min(2, "Enter your name.").max(30, "Keep it short.")
});

export const submitMiniPickSchema = z.object({
  windowId: z.string().uuid("Mini-pick window is invalid."),
  displayName: z.string().trim().min(2, "Enter your name.").max(30, "Keep it short.")
});

export const createMatchSchema = z.object({
  sportKey: z.enum(["cricket", "football", "formula1", "basketball"]),
  predictionTemplateKey: z.enum(["classic_social", "provider_ready"]).default("classic_social"),
  providerKey: z.enum(["manual", "thesportsdb"]).default("manual"),
  externalEventId: z.string().trim().max(80).optional().or(z.literal("")),
  competitionName: z.string().trim().min(2, "Competition is required."),
  venue: z.string().trim().min(2, "Venue is required."),
  teamAName: z.string().trim().min(2, "Team A is required."),
  teamBName: z.string().trim().min(2, "Team B is required."),
  teamAShortName: z.string().trim().min(2, "Team A short name is required.").max(6, "Use a short code."),
  teamBShortName: z.string().trim().min(2, "Team B short name is required.").max(6, "Use a short code."),
  startTime: z.string().min(1, "Start time is required."),
  lockTime: z.string().min(1, "Lock time is required.")
});

export const updateMatchSchema = z.object({
  matchId: z.string().uuid(),
  title: z.string().trim().min(4, "Title is required."),
  predictionTemplateKey: z.enum(["classic_social", "provider_ready"]).default("classic_social"),
  providerKey: z.enum(["manual", "thesportsdb"]).default("manual"),
  externalEventId: z.string().trim().max(80).optional().or(z.literal("")),
  autoSettleSupported: z.union([z.literal("on"), z.literal("true"), z.literal("false")]).optional(),
  competitionName: z.string().trim().min(2, "Competition is required."),
  venue: z.string().trim().min(2, "Venue is required."),
  startTime: z.string().min(1, "Start time is required."),
  lockTime: z.string().min(1, "Lock time is required."),
  status: z.enum(["scheduled", "locked", "live", "completed", "cancelled"])
});

export const predictionUpdateSchema = z.object({
  questionId: z.string().uuid(),
  prompt: z.string().trim().min(3).max(120),
  description: z.string().trim().max(120).optional().or(z.literal("")),
  options: z
    .array(
      z.object({
        optionId: z.string().uuid(),
        label: z.string().trim().min(1).max(40),
        value: z.string().trim().min(1).max(40)
      })
    )
    .min(2)
});

export const settlementSchema = z.object({
  matchId: z.string().uuid(),
  notes: z.string().trim().max(240).optional().or(z.literal(""))
});

export const syncMatchSchema = z.object({
  matchId: z.string().uuid()
});

export const createMiniPickWindowSchema = z.object({
  matchId: z.string().uuid(),
  templateKey: z.enum([
    "next_over_runs",
    "wicket_next_over",
    "next_boundary_side",
    "powerplay_score_range",
    "next_goal_team",
    "next_corner_team",
    "next_booking_team",
    "safety_car_window",
    "next_pit_team",
    "podium_shakeup",
    "next_scoring_team",
    "next_scoring_play",
    "next_three_team"
  ]),
  opensAt: z.string().min(1, "Open time is required."),
  lockAt: z.string().min(1, "Lock time is required."),
  stakeText: z.string().trim().max(80, "Keep it short.").optional().or(z.literal(""))
});

export const pushSubscriptionSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url("Push endpoint is invalid."),
    expirationTime: z.number().nullable().optional(),
    keys: z.object({
      p256dh: z.string().min(1, "Push key is required."),
      auth: z.string().min(1, "Auth key is required.")
    })
  })
});

export const deletePushSubscriptionSchema = z.object({
  endpoint: z.string().url("Push endpoint is invalid.")
});

export const settleMiniPickWindowSchema = z.object({
  windowId: z.string().uuid(),
  resolutionNote: z.string().trim().max(180, "Keep it concise.").optional().or(z.literal(""))
});

export const createGroupSchema = z.object({
  name: z.string().trim().min(3, "Group name is required.").max(60, "Keep it under 60 chars."),
  groupType: z.enum(["private", "office", "college", "community", "creator"]),
  visibility: z.enum(["private", "invite_only", "public"]),
  sportKey: z.enum(["cricket", "football", "formula1", "basketball"]),
  headline: z.string().trim().max(120, "Keep it punchy.").optional().or(z.literal("")),
  description: z.string().trim().max(240, "Keep it concise.").optional().or(z.literal("")),
  stakeTemplate: z.string().trim().max(80, "Keep it short.").optional().or(z.literal("")),
  punishmentTemplate: z.string().trim().max(80, "Keep it short.").optional().or(z.literal("")),
  displayName: z.string().trim().min(2, "Enter your name.").max(30, "Keep it short.")
});

export const joinGroupSchema = z.object({
  inviteCode: z
    .string()
    .trim()
    .min(6, "Invite code is required.")
    .max(16, "Invite code looks invalid.")
    .transform((value) => value.toLowerCase()),
  displayName: z.string().trim().min(2, "Enter your name.").max(30, "Keep it short.")
});
