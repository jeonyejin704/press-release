export type GeneratedPressRelease = {
  title: string;
  subtitle: string;
  body: string;
  summary: string;
  easyExplanation: string;
  imageCaption: string;
  raw: string; // full markdown as returned by the provider
};

export interface AIProvider {
  readonly name: string;
  generateResearchDraft(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<GeneratedPressRelease>;
}
