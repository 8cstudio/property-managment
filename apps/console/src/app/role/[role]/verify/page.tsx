"use client";

import { useParams } from "next/navigation";
import { AuthPanel } from "@/features/workspace/auth";
import { needsVerify } from "@/features/workspace/roles";

export default function VerifyPage() {
  const params = useParams<{ role: string }>();
  if (!needsVerify(params.role)) {
    return <AuthPanel role={params.role} mode="sign-in" />;
  }
  return <AuthPanel role={params.role} mode="verify" />;
}
