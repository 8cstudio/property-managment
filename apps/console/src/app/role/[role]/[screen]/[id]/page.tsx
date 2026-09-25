"use client";

import { useParams } from "next/navigation";
import { RoleBody } from "@/features/workspace/desk";

export default function RoleRecordPage() {
  const params = useParams<{ role: string; screen: string; id: string }>();
  return <RoleBody role={params.role} screen={params.screen} id={params.id} />;
}
