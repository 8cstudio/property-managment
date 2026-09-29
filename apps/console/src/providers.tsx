"use client";

import { AppProviders } from "@ezzi/ui";
import type { ReactNode } from "react";
import { PlatformBrandProvider } from "@/features/platform-brand/brand-provider";

export function ConsoleProviders({ children }: { children: ReactNode }) {
  return (
    <AppProviders>
      <PlatformBrandProvider>{children}</PlatformBrandProvider>
    </AppProviders>
  );
}
