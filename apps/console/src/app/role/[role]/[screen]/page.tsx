"use client";

import { useParams } from "next/navigation";
import { RoleBody } from "@/features/workspace/desk";

export default function RoleScreenPage() {
  const params = useParams<{ role: string; screen: string }>();
  return <RoleBody role={params.role} screen={params.screen} />;
}
