"use client";

import { useParams } from "next/navigation";
import { AuthPanel } from "@/features/workspace/auth";

export default function MfaPage() {
  const params = useParams<{ role: string }>();
  return <AuthPanel role={params.role} mode="mfa" />;
}
