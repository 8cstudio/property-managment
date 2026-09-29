"use client";

import type { ReactNode } from "react";
import { VisitHeader } from "@/features/visit/visit-header";

export default function VisitLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <VisitHeader />
      {children}
    </>
  );
}
