"use client";

import type { ReactNode } from "react";
import { DeskProvider } from "@/features/workspace/store";
import { VisitHeader } from "@/features/visit/visit-header";

const visitorDesk = "visit";

export default function VisitLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <VisitHeader />
      <DeskProvider role={visitorDesk}>{children}</DeskProvider>
    </>
  );
}
