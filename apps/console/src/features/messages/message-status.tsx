"use client";

import { Check, CheckCheck, Clock3 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { OutboundMessageStatus } from "./data";

export function MessageStatusIcon({
  status,
}: {
  status: OutboundMessageStatus;
}) {
  const tm = useTranslations("messages");

  const label =
    status === "pending"
      ? tm("statusPending")
      : status === "sent"
        ? tm("statusSent")
        : status === "delivered"
          ? tm("statusDelivered")
          : tm("statusRead");

  const className =
    status === "read"
      ? "messenger-status messenger-status--read"
      : "messenger-status";

  if (status === "pending") {
    return (
      <span className={className} aria-label={label} title={label}>
        <Clock3 size={14} strokeWidth={2} aria-hidden="true" />
      </span>
    );
  }
  if (status === "sent") {
    return (
      <span className={className} aria-label={label} title={label}>
        <Check size={14} strokeWidth={2.5} aria-hidden="true" />
      </span>
    );
  }
  return (
    <span className={className} aria-label={label} title={label}>
      <CheckCheck size={14} strokeWidth={2.5} aria-hidden="true" />
    </span>
  );
}
