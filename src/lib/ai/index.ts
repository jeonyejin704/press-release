import type { AIProvider } from "./types";
import { MockAIProvider } from "./mock";
import { AnthropicProvider } from "./anthropic";

export * from "./types";

// Factory that reads AI_PROVIDER from the environment and returns the
// configured provider. Falls back to the offline Mock provider so the app
// always works, even without an API key.
export function getAIProvider(): AIProvider {
  const provider = (process.env.AI_PROVIDER ?? "mock").toLowerCase();

  if (provider === "anthropic") {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) {
      console.warn("[ai] AI_PROVIDER=anthropic but ANTHROPIC_API_KEY missing; using mock.");
      return new MockAIProvider();
    }
    return new AnthropicProvider(key, process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5");
  }

  // TODO: implement OpenAI / Azure OpenAI providers behind the same interface.
  return new MockAIProvider();
}
