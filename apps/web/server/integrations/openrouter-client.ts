import { createOpenAI } from "@ai-sdk/openai";

const openRouterApiKey = process.env.OPENROUTER_API_KEY;

const provider =
  openRouterApiKey && openRouterApiKey.length > 0
    ? createOpenAI({
        apiKey: openRouterApiKey,
        baseURL: "https://openrouter.ai/api/v1"
      })
    : null;

export function hasOpenRouterApiKey(): boolean {
  return provider !== null;
}

export function getAnalyzeModelName(): string {
  return process.env.OPENROUTER_MODEL_ANALYZE ?? "openai/gpt-4o-mini";
}

export function getWriteModelName(): string {
  return process.env.OPENROUTER_MODEL_WRITE ?? "openai/gpt-4o";
}

export function getFallbackModelName(): string {
  return process.env.OPENROUTER_MODEL_FALLBACK ?? "anthropic/claude-3.5-haiku";
}

export function getModel(modelName: string) {
  if (!provider) {
    return null;
  }

  return provider(modelName);
}
