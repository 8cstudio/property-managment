import "server-only";
import { newId } from "./crypto";
import { badRequest, forbidden, notFound } from "./http";
import {
  appendMessageCached,
  ensureHeavyDbLoaded,
  loadDb,
  mutate,
  patchMessageReceiptsCached,
} from "./store";
import type {
  ChatMessage,
  Conversation,
  ConversationWithMessages,
  MessageReceipt,
} from "./types";

function norm(email: string): string {
  return email.trim().toLowerCase();
}

function sameMembers(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((x) => setB.has(x));
}

function receiptListForMembers(
  memberEmails: string[],
  senderEmail: string,
): MessageReceipt[] {
  const sender = norm(senderEmail);
  return memberEmails
    .map(norm)
    .filter((email) => email && email !== sender)
    .map((email) => ({ email }));
}

function touchReceipt(
  receipts: MessageReceipt[],
  viewerEmail: string,
  patch: { delivered?: boolean; read?: boolean },
): MessageReceipt[] {
  const me = norm(viewerEmail);
  const now = new Date().toISOString();
  let found = false;
  const next = receipts.map((row) => {
    if (norm(row.email) !== me) return row;
    found = true;
    return {
      ...row,
      ...(patch.delivered && !row.deliveredAt ? { deliveredAt: now } : {}),
      ...(patch.read
        ? {
            deliveredAt: row.deliveredAt ?? now,
            readAt: row.readAt ?? now,
          }
        : {}),
    };
  });
  if (!found) {
    next.push({
      email: me,
      ...(patch.delivered ? { deliveredAt: now } : {}),
      ...(patch.read ? { deliveredAt: now, readAt: now } : {}),
    });
  }
  return next;
}

function ensureMessageReceipts(
  message: ChatMessage,
  memberEmails: string[],
): ChatMessage {
  const expected = receiptListForMembers(memberEmails, message.senderEmail);
  if (expected.length === 0) return message;
  if (!message.receipts?.length) {
    return { ...message, receipts: expected };
  }
  const have = new Set(message.receipts.map((r) => norm(r.email)));
  const missing = expected.filter((e) => !have.has(norm(e.email)));
  if (missing.length === 0) return message;
  return { ...message, receipts: [...message.receipts, ...missing] };
}

/** Everyone except the viewer, for the "new message" directory. */
export async function listPeople(
  viewerEmail: string,
): Promise<{ email: string; name: string }[]> {
  const db = await ensureHeavyDbLoaded();
  const me = norm(viewerEmail);
  return db.users
    .filter((u) => u.email !== me)
    .map((u) => ({ email: u.email, name: u.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Conversations the viewer belongs to, with messages embedded. */
export async function listConversations(
  viewerEmail: string,
): Promise<ConversationWithMessages[]> {
  const db = await ensureHeavyDbLoaded();
  const me = norm(viewerEmail);
  return db.conversations
    .filter((c) => c.memberEmails.includes(me))
    .map((c) => ({
      ...c,
      messages: db.messages
        .filter((m) => m.conversationId === c.id)
        .map((m) => ensureMessageReceipts(m, c.memberEmails))
        .sort(
          (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
        ),
    }))
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
}

export async function getOrCreateDirect(
  viewerEmail: string,
  otherEmail: string,
): Promise<Conversation> {
  const me = norm(viewerEmail);
  const other = norm(otherEmail);
  if (!other || other === me) throw badRequest("Pick someone else to message.");

  await ensureHeavyDbLoaded();
  const db = await loadDb();
  const otherUser = db.users.find((u) => u.email === other);
  if (!otherUser) throw notFound("That person is not on EZZI.");

  const existing = db.conversations.find(
    (c) => c.kind === "direct" && sameMembers(c.memberEmails, [me, other]),
  );
  if (existing) return existing;

  const now = new Date().toISOString();
  const conversation: Conversation = {
    id: newId("chat"),
    kind: "direct",
    title: otherUser.name,
    memberEmails: [me, other],
    createdBy: me,
    createdAt: now,
    updatedAt: now,
  };
  await mutate((d) => {
    d.conversations.push(conversation);
  });
  return conversation;
}

export async function createGroup(
  viewerEmail: string,
  title: string,
  emails: string[],
): Promise<Conversation> {
  const me = norm(viewerEmail);
  const name = title.trim();
  if (!name) throw badRequest("Give the group a name.");
  const members = Array.from(
    new Set([me, ...emails.map(norm).filter(Boolean)]),
  );
  if (members.length < 2) throw badRequest("Add at least one other person.");

  const now = new Date().toISOString();
  const conversation: Conversation = {
    id: newId("chat"),
    kind: "group",
    title: name,
    memberEmails: members,
    createdBy: me,
    createdAt: now,
    updatedAt: now,
  };
  await mutate((d) => {
    d.conversations.push(conversation);
  });
  return conversation;
}

export async function addMessage(
  viewerEmail: string,
  conversationId: string,
  body: string,
): Promise<ChatMessage> {
  const me = norm(viewerEmail);
  const text = body.trim();
  if (!text) throw badRequest("Message cannot be empty.");

  await ensureHeavyDbLoaded();
  return appendMessageCached((d) => {
    const conversation = d.conversations.find((c) => c.id === conversationId);
    if (!conversation) throw notFound("Conversation not found.");
    if (!conversation.memberEmails.includes(me)) {
      throw forbidden("You are not part of this conversation.");
    }
    const now = new Date().toISOString();
    const message: ChatMessage = {
      id: newId("msg"),
      conversationId,
      senderEmail: me,
      body: text,
      sentAt: now,
      receipts: receiptListForMembers(conversation.memberEmails, me),
    };
    d.messages.push(message);
    conversation.updatedAt = now;
    return message;
  });
}

/** Mark incoming messages as delivered on this device (not the sender). */
export async function ackDelivered(
  viewerEmail: string,
  conversationId: string,
  messageIds: string[],
): Promise<ChatMessage[]> {
  const me = norm(viewerEmail);
  const ids = new Set(messageIds.filter(Boolean));
  if (ids.size === 0) return [];

  await ensureHeavyDbLoaded();
  return patchMessageReceiptsCached((d) => {
    const conversation = d.conversations.find((c) => c.id === conversationId);
    if (!conversation) throw notFound("Conversation not found.");
    if (!conversation.memberEmails.map(norm).includes(me)) {
      throw forbidden("You are not part of this conversation.");
    }

    const updated: ChatMessage[] = [];
    for (const message of d.messages) {
      if (message.conversationId !== conversationId) continue;
      if (!ids.has(message.id)) continue;
      if (norm(message.senderEmail) === me) continue;
      const receipts = touchReceipt(message.receipts ?? [], me, {
        delivered: true,
      });
      message.receipts = receipts;
      updated.push({ ...message });
    }
    return updated;
  });
}

/** Mark all messages from others in this chat as read (viewer opened the thread). */
export async function markConversationRead(
  viewerEmail: string,
  conversationId: string,
): Promise<ChatMessage[]> {
  const me = norm(viewerEmail);

  await ensureHeavyDbLoaded();
  return patchMessageReceiptsCached((d) => {
    const conversation = d.conversations.find((c) => c.id === conversationId);
    if (!conversation) throw notFound("Conversation not found.");
    if (!conversation.memberEmails.map(norm).includes(me)) {
      throw forbidden("You are not part of this conversation.");
    }

    const updated: ChatMessage[] = [];
    for (const message of d.messages) {
      if (message.conversationId !== conversationId) continue;
      if (norm(message.senderEmail) === me) continue;
      const receipts = touchReceipt(message.receipts ?? [], me, {
        delivered: true,
        read: true,
      });
      if (JSON.stringify(receipts) === JSON.stringify(message.receipts ?? [])) {
        continue;
      }
      message.receipts = receipts;
      updated.push({ ...message });
    }
    return updated;
  });
}
