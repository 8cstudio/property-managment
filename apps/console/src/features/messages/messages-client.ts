"use client";

import {
  type ChatMessage,
  type Conversation,
  normalizeConversation,
} from "./data";

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { detail?: string; title?: string };
    return body.detail || body.title || "Something went wrong.";
  } catch {
    return "Something went wrong.";
  }
}

export async function fetchConversations(): Promise<Conversation[]> {
  const res = await fetch("/api/v1/messages", { cache: "no-store" });
  if (!res.ok) throw new Error(await readError(res));
  const body = (await res.json()) as { conversations: Conversation[] };
  return body.conversations.map((row) => normalizeConversation(row));
}

export async function fetchPeople(): Promise<{ email: string; name: string }[]> {
  const res = await fetch("/api/v1/messages/people", { cache: "no-store" });
  if (!res.ok) throw new Error(await readError(res));
  const body = (await res.json()) as {
    people: { email: string; name: string }[];
  };
  return body.people;
}

export async function createDirectApi(email: string): Promise<Conversation> {
  const res = await fetch("/api/v1/messages/direct", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error(await readError(res));
  const body = (await res.json()) as { conversation: Conversation };
  return normalizeConversation(body.conversation);
}

export async function createGroupApi(
  title: string,
  emails: string[],
): Promise<Conversation> {
  const res = await fetch("/api/v1/messages/group", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title, emails }),
  });
  if (!res.ok) throw new Error(await readError(res));
  const body = (await res.json()) as { conversation: Conversation };
  return normalizeConversation(body.conversation);
}

export async function sendMessageApi(
  conversationId: string,
  body: string,
): Promise<ChatMessage> {
  const res = await fetch(
    `/api/v1/messages/${encodeURIComponent(conversationId)}/messages`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body }),
    },
  );
  if (!res.ok) throw new Error(await readError(res));
  const payload = (await res.json()) as { message: ChatMessage };
  return payload.message;
}

export async function postReceiptsApi(
  conversationId: string,
  body: { deliver?: string[]; read?: boolean },
): Promise<ChatMessage[]> {
  const res = await fetch(
    `/api/v1/messages/${encodeURIComponent(conversationId)}/receipts`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) return [];
  const payload = (await res.json()) as { messages?: ChatMessage[] };
  return Array.isArray(payload.messages) ? payload.messages : [];
}
