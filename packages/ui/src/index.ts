/** Visual tones for status badges. Modules supply labels; they do not invent new tones. */
export const statusTones = [
  "neutral",
  "info",
  "success",
  "warning",
  "danger",
] as const;

export type StatusTone = (typeof statusTones)[number];
