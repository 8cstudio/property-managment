/** Model output is a suggestion. Callers store it as a suggestion, never as the record of truth. */
export type AiSuggestion = {
  text: string;
};

export type AiPort = {
  suggest(prompt: string): Promise<AiSuggestion>;
};
