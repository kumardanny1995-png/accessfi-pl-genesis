import { getOpenAiApiKey, getOpenAiModel } from "@/lib/db/env";

import type { ChallengeAiProvider } from "./types";

type OpenAiResponse = {
  output_text?: string;
};

export const openAiChallengeProvider: ChallengeAiProvider = {
  key: "openai",
  async generate({ kind, context }) {
    const apiKey = getOpenAiApiKey();
    const model = getOpenAiModel();

    if (!apiKey || !model) {
      throw new Error("OpenAI is not fully configured.");
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text:
                  "You write concise, sharp, non-cringe sports-social copy for a rivalry prediction product. Keep it clean, fun, and shareable."
              }
            ]
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: JSON.stringify({
                  kind,
                  matchTitle: context.data.match.title,
                  sport: context.data.match.sport.name,
                  competitionName: context.data.match.competitionName,
                  stakeText: context.data.challenge.stakeText,
                  punishmentLine: context.punishmentLine,
                  participants: context.data.participants.map((participant) => ({
                    displayName: participant.displayName,
                    totalPoints: participant.totalPoints,
                    rank: participant.rank,
                    isCreator: participant.isCreator
                  })),
                  outcomes: context.data.outcomes.map((outcome) => outcome.optionLabel),
                  opinionBoard: context.data.opinionBoard.map((question) => ({
                    prompt: question.prompt,
                    options: question.options.map((option) => ({
                      label: option.label,
                      percentage: option.percentage,
                      contrarian: option.contrarian,
                      loneWolf: option.loneWolf
                    }))
                  })),
                  schema: {
                    title: "string, 3-10 words",
                    body: "string, max 2 sentences",
                    shareLine: "string or null, max 1 sentence"
                  }
                })
              }
            ]
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "lockscore_copy",
            strict: true,
            schema: {
              type: "object",
              properties: {
                title: { type: "string" },
                body: { type: "string" },
                shareLine: {
                  anyOf: [{ type: "string" }, { type: "null" }]
                }
              },
              required: ["title", "body", "shareLine"],
              additionalProperties: false
            }
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI returned ${response.status}.`);
    }

    const json = (await response.json()) as OpenAiResponse;
    if (!json.output_text) {
      throw new Error("OpenAI returned an empty response.");
    }

    const parsed = JSON.parse(json.output_text) as {
      title: string;
      body: string;
      shareLine: string | null;
    };

    return parsed;
  }
};
