"use client";

import { AppProviders } from "@ezzi/ui";
import type { ReactNode } from "react";

export function ConsoleProviders({ children }: { children: ReactNode }) {
  return <AppProviders>{children}</AppProviders>;
}
