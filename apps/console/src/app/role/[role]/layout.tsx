import type { ReactNode } from "react";
import { RoleFrame } from "@/features/workspace/frame";

export default async function RoleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;
  return <RoleFrame role={role}>{children}</RoleFrame>;
}
