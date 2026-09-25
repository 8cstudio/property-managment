"use client";

import type { ReactNode } from "react";
import { DeskProvider } from "@/features/workspace/store";
import { AppBar } from "@/shell/app-bar";

const visitorDesk = "visit";

export default function VisitLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AppBar section="Visitor" />
      <DeskProvider role={visitorDesk}>{children}</DeskProvider>
    </>
  );
}
