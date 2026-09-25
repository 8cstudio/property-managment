export { cn } from "./lib/cn";
export { toast } from "sonner";
export { useDebouncedValue } from "./hooks/use-debounced-value";
export { usePendingAction } from "./hooks/use-pending-action";
export * from "./components";
export { DonutChart, RadialGauge, type DonutSegment } from "./charts";

/** Visual tones for status badges. Modules supply labels; they do not invent new tones. */
export const statusTones = [
  "neutral",
  "info",
  "success",
  "warning",
  "danger",
] as const;

export type StatusTone = (typeof statusTones)[number];
