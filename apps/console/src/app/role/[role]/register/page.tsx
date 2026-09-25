"use client";

import { useParams } from "next/navigation";
import { AuthPanel } from "@/features/workspace/auth";
import { canRegister } from "@/features/workspace/roles";

export default function RegisterPage() {
  const params = useParams<{ role: string }>();
  if (!canRegister(params.role)) {
    return <AuthPanel role={params.role} mode="sign-in" />;
  }
  return <AuthPanel role={params.role} mode="register" />;
}
