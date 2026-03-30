import type { AiGenerationKind, ChallengePageData, ChallengeAiCopy } from "@/lib/db/types";

export type ChallengeAiProviderContext = {
  data: ChallengePageData;
  punishmentLine: string | null;
};

export type ChallengeAiProvider = {
  key: string;
  generate(args: {
    kind: AiGenerationKind;
    context: ChallengeAiProviderContext;
  }): Promise<Pick<ChallengeAiCopy, "title" | "body" | "shareLine">>;
};
