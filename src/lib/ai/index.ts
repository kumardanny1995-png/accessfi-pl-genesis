import { getAiProviderKey, getOpenAiApiKey, getOpenAiModel } from "@/lib/db/env";

import { localAiProvider } from "./local";
import { openAiChallengeProvider } from "./openai";

export function getChallengeAiProvider() {
  if (getAiProviderKey() === "openai" && getOpenAiApiKey() && getOpenAiModel()) {
    return openAiChallengeProvider;
  }

  return localAiProvider;
}
