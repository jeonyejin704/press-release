import type { AIProvider, GeneratedPressRelease } from "./types";
import { parseDraftMarkdown } from "./parse";

// Anthropic Claude provider. Uses fetch against the Messages API so we don't
// need an extra SDK dependency. Enabled by setting AI_PROVIDER=anthropic and
// ANTHROPIC_API_KEY in the environment.
export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic";
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey;
    this.model = model || "claude-sonnet-5";
  }

  async generateResearchDraft(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<GeneratedPressRelease> {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 3000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Anthropic API error ${res.status}: ${text}`);
    }

    const data = (await res.json()) as {
      content: Array<{ type: string; text?: string }>;
    };
    const raw = data.content
      .filter((c) => c.type === "text")
      .map((c) => c.text ?? "")
      .join("\n");

    return parseDraftMarkdown(raw);
  }
}
