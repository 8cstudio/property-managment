"use client";

import { TooltipProvider } from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";
import { Toaster } from "sonner";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider delayDuration={280}>
      {children}
      <Toaster closeButton position="top-center" theme="system" />
    </TooltipProvider>
  );
}
