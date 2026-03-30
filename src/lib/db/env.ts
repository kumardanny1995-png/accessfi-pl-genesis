const publicRuntimeKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
] as const;

type RequiredEnvKey = (typeof publicRuntimeKeys)[number] | "SUPABASE_SERVICE_ROLE_KEY";

export function isSupabaseConfigured() {
  return publicRuntimeKeys.every((key) => Boolean(process.env[key]));
}

export function getRequiredEnv(key: RequiredEnvKey | "ADMIN_PASSCODE") {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

export function getOptionalEnv(key: string) {
  const value = process.env[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function getAppUrl() {
  const explicitUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (explicitUrl) {
    return explicitUrl;
  }

  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercelUrl) {
    return `https://${vercelUrl.replace(/^https?:\/\//, "")}`;
  }

  return "http://localhost:3000";
}

export function isAiGenerationEnabled() {
  return getOptionalEnv("AI_GENERATION_ENABLED") !== "false";
}

export function getAiProviderKey() {
  return getOptionalEnv("AI_PROVIDER") ?? "local";
}

export function getOpenAiApiKey() {
  return getOptionalEnv("OPENAI_API_KEY");
}

export function getOpenAiModel() {
  return getOptionalEnv("OPENAI_MODEL");
}

export function getWebPushPublicKey() {
  return getOptionalEnv("NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY");
}

export function getWebPushPrivateKey() {
  return getOptionalEnv("WEB_PUSH_PRIVATE_KEY");
}

export function getWebPushSubject() {
  return getOptionalEnv("WEB_PUSH_SUBJECT");
}

export function isWebPushConfigured() {
  return Boolean(getWebPushPublicKey() && getWebPushPrivateKey() && getWebPushSubject());
}
