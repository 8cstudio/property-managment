"use client";

import { useParams } from "next/navigation";
import { RoleBody } from "@/features/workspace/desk";

export default function RoleHomePage() {
  const params = useParams<{ role: string }>();
  return <RoleBody role={params.role} />;
}
