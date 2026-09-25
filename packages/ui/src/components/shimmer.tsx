import { cn } from "../lib/cn";

export function Shimmer({ size = "md" }: { size?: "md" | "lg" }) {
  return <div className={cn("shimmer", size === "lg" && "lg")} />;
}
