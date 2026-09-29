import { normalizeMessage, type ChatMessage } from "./data";
import { sendMessageApi } from "./messages-client";

export type OutboundSendHandlers = {
  appendMessage: (conversationId: string, message: ChatMessage) => void;
  replaceMessage: (
    conversationId: string,
    tempId: string,
    message: ChatMessage,
  ) => void;
  dropMessage: (conversationId: string, tempId: string) => void;
};

type UiUpdate =
  | {
      kind: "replace";
      conversationId: string;
      tempId: string;
      message: ChatMessage;
    }
  | { kind: "drop"; conversationId: string; tempId: string };

let handlers: OutboundSendHandlers | null = null;
const pendingUi: UiUpdate[] = [];

type Job = {
  conversationId: string;
  body: string;
  tempId: string;
  viewerEmail: string;
};

const queue: Job[] = [];
let draining = false;

function flushPendingUi() {
  if (!handlers || pendingUi.length === 0) return;
  for (const update of pendingUi) {
    if (update.kind === "replace") {
      handlers.replaceMessage(
        update.conversationId,
        update.tempId,
        update.message,
      );
    } else {
      handlers.dropMessage(update.conversationId, update.tempId);
    }
  }
  pendingUi.length = 0;
}

export function registerOutboundSendHandlers(next: OutboundSendHandlers | null) {
  handlers = next;
  flushPendingUi();
}

function applyReplace(
  conversationId: string,
  tempId: string,
  message: ChatMessage,
) {
  if (handlers) handlers.replaceMessage(conversationId, tempId, message);
  else pendingUi.push({ kind: "replace", conversationId, tempId, message });
}

function applyDrop(conversationId: string, tempId: string) {
  if (handlers) handlers.dropMessage(conversationId, tempId);
  else pendingUi.push({ kind: "drop", conversationId, tempId });
}

async function drainQueue() {
  if (draining) return;
  draining = true;
  try {
    while (queue.length > 0) {
      const job = queue[0]!;
      try {
        const message = normalizeMessage(
          await sendMessageApi(job.conversationId, job.body),
        );
        applyReplace(job.conversationId, job.tempId, message);
      } catch {
        applyDrop(job.conversationId, job.tempId);
      } finally {
        queue.shift();
      }
    }
  } finally {
    draining = false;
    if (queue.length > 0) void drainQueue();
  }
}

/** Serial outbound sends; keeps running if the Messages screen unmounts. */
export function enqueueOutboundMessage(input: {
  conversationId: string;
  body: string;
  viewerEmail: string;
}) {
  const text = input.body.trim();
  const viewerEmail = input.viewerEmail.trim().toLowerCase();
  if (!text || !viewerEmail) return;

  const tempId = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const optimistic: ChatMessage = {
    id: tempId,
    conversationId: input.conversationId,
    senderEmail: viewerEmail,
    body: text,
    sentAt: new Date().toISOString(),
  };

  handlers?.appendMessage(input.conversationId, optimistic);

  queue.push({
    conversationId: input.conversationId,
    body: text,
    tempId,
    viewerEmail,
  });
  void drainQueue();
}
