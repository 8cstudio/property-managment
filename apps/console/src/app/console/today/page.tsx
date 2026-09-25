import { Dashboard } from "@/features/dashboard/dashboard";

export default function TodayPage() {
  const today = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
    timeZone: "Europe/London",
  }).format(new Date());

  return <Dashboard today={today} />;
}
