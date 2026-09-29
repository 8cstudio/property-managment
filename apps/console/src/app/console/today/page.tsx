"use client";

import { Dashboard } from "@/features/dashboard/dashboard";
import { DeskProvider } from "@/features/workspace/store";

export default function TodayPage() {
  const today = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
    timeZone: "Europe/London",
  }).format(new Date());

  return (
    <DeskProvider role="operations">
      <Dashboard today={today} />
    </DeskProvider>
  );
}
