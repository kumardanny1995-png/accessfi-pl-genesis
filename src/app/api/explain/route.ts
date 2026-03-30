import { NextResponse } from "next/server";

import { getOpenAiApiKey, getOpenAiModel, isAiGenerationEnabled } from "@/lib/db/env";
import type { DecisionRecord } from "@/lib/finance/types";

type ExplainResponse = {
  output_text?: string;
};

function fallbackExplanation(decision: DecisionRecord) {
  return decision.explanation;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { decision?: DecisionRecord };
    const decision = body.decision;

    if (!decision) {
      return NextResponse.json({ error: "Missing decision payload." }, { status: 400 });
    }

    if (!isAiGenerationEnabled()) {
      return NextResponse.json({ explanation: fallbackExplanation(decision), source: "template" });
    }

    const apiKey = getOpenAiApiKey();
    const model = getOpenAiModel();

    if (!apiKey || !model) {
      return NextResponse.json({ explanation: fallbackExplanation(decision), source: "template" });
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
                  "Rewrite deterministic personal-finance results for salaried users in India. Do not change numbers, do not invent new calculations, and keep the tone concise, clear, and non-judgmental. Output one short paragraph only."
              }
            ]
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: JSON.stringify({
                  title: decision.title,
                  verdict: decision.verdictLabel,
                  question: decision.question,
                  category: decision.category,
                  monthlyFreeCashBefore: Math.round(decision.computed.monthlyFreeCashBefore),
                  monthlyFreeCashAfter: Math.round(decision.computed.monthlyFreeCashAfter),
                  runwayMonthsBefore: Number(decision.computed.runwayMonthsBefore.toFixed(1)),
                  runwayMonthsAfter: Number(decision.computed.runwayMonthsAfter.toFixed(1)),
                  obligationsRatioAfter: Number((decision.computed.obligationsRatioAfter * 100).toFixed(1)),
                  goalShiftDays: decision.computed.goalShiftDays,
                  goalShiftDirection: decision.computed.goalShiftDirection,
                  primaryGoalTitle: decision.computed.primaryGoalTitle,
                  betterAlternative: decision.betterAlternative,
                  existingTemplate: decision.explanation
                })
              }
            ]
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "can_i_afford_explanation",
            strict: true,
            schema: {
              type: "object",
              properties: {
                explanation: {
                  type: "string"
                }
              },
              required: ["explanation"],
              additionalProperties: false
            }
          }
        }
      })
    });

    if (!response.ok) {
      return NextResponse.json({ explanation: fallbackExplanation(decision), source: "template" });
    }

    const payload = (await response.json()) as ExplainResponse;
    if (!payload.output_text) {
      return NextResponse.json({ explanation: fallbackExplanation(decision), source: "template" });
    }

    const parsed = JSON.parse(payload.output_text) as { explanation?: string };
    return NextResponse.json({
      explanation: parsed.explanation || fallbackExplanation(decision),
      source: parsed.explanation ? "ai" : "template"
    });
  } catch {
    return NextResponse.json({ error: "Unable to generate explanation." }, { status: 500 });
  }
}
