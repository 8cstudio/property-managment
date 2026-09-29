export type MessageReceipt = {
  email: string;
  deliveredAt?: string;
  readAt?: string;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderEmail: string;
  body: string;
  sentAt: string;
  receipts?: MessageReceipt[];
};

/** Outgoing bubble status (WhatsApp-style). */
export type OutboundMessageStatus = "pending" | "sent" | "delivered" | "read";

export function normalizeMessage(raw: ChatMessage): ChatMessage {
  return {
    ...raw,
    receipts: Array.isArray(raw.receipts) ? raw.receipts : [],
  };
}

export function outboundMessageStatus(
  message: ChatMessage,
  viewerEmail: string,
  memberEmails: string[],
): OutboundMessageStatus | null {
  const me = viewerEmail.trim().toLowerCase();
  if (message.senderEmail.trim().toLowerCase() !== me) return null;
  if (isPendingMessage(message.id)) return "pending";

  const others = memberEmails
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e && e !== me);
  if (others.length === 0) return "sent";

  const byEmail = new Map(
    (message.receipts ?? []).map((r) => [r.email.trim().toLowerCase(), r]),
  );
  const receipts = others.map((email) => byEmail.get(email));
  if (receipts.every((r) => r?.readAt)) return "read";
  if (receipts.every((r) => r?.deliveredAt)) return "delivered";
  return "sent";
}

export type Conversation = {
  id: string;
  kind: "direct" | "group";
  title: string;
  memberEmails: string[];
  messages: ChatMessage[];
  updatedAt: string;
};

/** API may omit messages on create; list always includes them. */
export function normalizeConversation(
  raw: Partial<Conversation> & Pick<Conversation, "id" | "kind" | "title" | "updatedAt">,
): Conversation {
  return {
    id: raw.id,
    kind: raw.kind,
    title: raw.title,
    updatedAt: raw.updatedAt,
    memberEmails: Array.isArray(raw.memberEmails) ? raw.memberEmails : [],
    messages: Array.isArray(raw.messages)
      ? raw.messages.map((m) => normalizeMessage(m))
      : [],
  };
}

export function lastMessage(conversation: Conversation): ChatMessage | undefined {
  const messages = conversation.messages ?? [];
  return messages.length > 0 ? messages[messages.length - 1] : undefined;
}

export function isPendingMessage(id: string): boolean {
  return id.startsWith("pending-");
}

/** Last occurrence wins; merges receipt arrays when the same id appears twice. */
export function dedupeMessagesById(messages: ChatMessage[]): ChatMessage[] {
  const byId = new Map<string, ChatMessage>();
  for (const raw of messages) {
    const message = normalizeMessage(raw);
    const prev = byId.get(message.id);
    if (!prev) {
      byId.set(message.id, message);
      continue;
    }
    const receipts = [...(prev.receipts ?? [])];
    for (const row of message.receipts ?? []) {
      const key = row.email.trim().toLowerCase();
      const idx = receipts.findIndex(
        (r) => r.email.trim().toLowerCase() === key,
      );
      if (idx >= 0) receipts[idx] = { ...receipts[idx], ...row };
      else receipts.push(row);
    }
    byId.set(message.id, normalizeMessage({ ...prev, ...message, receipts }));
  }
  return [...byId.values()].sort(
    (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
  );
}

/** Keep optimistic sends visible while polling catches up from the server. */
export function mergeConversationFromServer(
  local: Conversation | undefined,
  server: Conversation,
): Conversation {
  const base = normalizeConversation(server);
  if (!local) return base;
  const pending = local.messages.filter((m) => isPendingMessage(m.id));
  if (pending.length === 0) return base;
  const confirmed = new Set(
    base.messages.map((m) => `${m.senderEmail}\0${m.body.trim()}`),
  );
  const stillPending = pending.filter(
    (p) => !confirmed.has(`${p.senderEmail}\0${p.body.trim()}`),
  );
  const messages = dedupeMessagesById([...base.messages, ...stillPending]);
  return { ...base, messages };
}

export type MessagesState = {
  conversations: Conversation[];
};

export function emptyMessagesState(): MessagesState {
  return { conversations: [] };
}

export function dmMemberKey(emailA: string, emailB: string): string {
  return [emailA.trim().toLowerCase(), emailB.trim().toLowerCase()].sort().join("|");
}

export function conversationTitle(
  conversation: Conversation,
  viewerEmail: string,
  nameFor: (email: string) => string,
): string {
  if (conversation.kind === "group") return conversation.title;
  const other = conversation.memberEmails.find(
    (email) => email.toLowerCase() !== viewerEmail.toLowerCase(),
  );
  return other ? nameFor(other) : conversation.title;
}
