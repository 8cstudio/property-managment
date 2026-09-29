"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslations } from "next-intl";
import { MessagesLoading } from "./messages-loading";
import {
  apiGetSession,
  type Viewer,
} from "@/features/workspace/session-client";
import {
  type ChatMessage,
  type Conversation,
  emptyMessagesState,
  isPendingMessage,
  dedupeMessagesById,
  mergeConversationFromServer,
  normalizeConversation,
  normalizeMessage,
  type MessagesState,
} from "./data";
import {
  createDirectApi,
  createGroupApi,
  fetchConversations,
  fetchPeople,
  postReceiptsApi,
} from "./messages-client";
import {
  enqueueOutboundMessage,
  registerOutboundSendHandlers,
} from "./outbound-send-queue";

/** Background refresh while the Messages screen is open (not WebSocket realtime). */
const POLL_MS = 12_000;

type MessagesApi = {
  createDirect: (otherEmail: string) => Promise<string>;
  createGroup: (title: string, memberEmails: string[]) => Promise<string>;
  sendMessage: (conversationId: string, body: string) => Promise<void>;
  markConversationRead: (conversationId: string) => Promise<void>;
};

type Person = { email: string; name: string };

type MessagesContextValue = {
  state: MessagesState;
  api: MessagesApi;
  viewerEmail: string;
  nameFor: (email: string) => string;
  people: Person[];
  ready: boolean;
  inboxLoading: boolean;
};

const MessagesContext = createContext<MessagesContextValue | null>(null);

function sortConversations(rows: Conversation[]): Conversation[] {
  return [...rows].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function MessagesProvider({
  role: _role,
  children,
  initialViewer = null,
}: {
  role: string;
  children: ReactNode;
  /** Reuse desk session so messages do not wait on a second /session round-trip. */
  initialViewer?: Viewer | null;
}) {
  const tm = useTranslations("messages");
  const [state, setState] = useState<MessagesState | null>(() =>
    initialViewer ? emptyMessagesState() : null,
  );
  const [inboxLoading, setInboxLoading] = useState(true);
  const [viewerEmail, setViewerEmail] = useState(
    () => initialViewer?.user.email.trim().toLowerCase() ?? "",
  );
  const [viewerName, setViewerName] = useState(
    () => initialViewer?.user.name ?? "",
  );
  const [people, setPeople] = useState<Person[]>([]);
  const refreshInFlightRef = useRef(false);
  const readInFlightRef = useRef<string | null>(null);

  const patchMessageReceipts = useCallback((patches: ChatMessage[]) => {
    if (patches.length === 0) return;
    const byId = new Map(patches.map((row) => [row.id, normalizeMessage(row)]));
    setState((current) => {
      const base = current ?? emptyMessagesState();
      const conversations = base.conversations.map((row) => ({
        ...row,
        messages: row.messages.map((message) => {
          const patch = byId.get(message.id);
          return patch ? normalizeMessage({ ...message, ...patch }) : message;
        }),
      }));
      return { conversations: sortConversations(conversations) };
    });
  }, []);

  const syncDeliveredForInbox = useCallback(
    async (email: string, conversations: Conversation[]) => {
      const me = email.trim().toLowerCase();
      if (!me) return;
      for (const conv of conversations) {
        const deliver = conv.messages
          .filter((m) => !isPendingMessage(m.id))
          .filter((m) => m.senderEmail.trim().toLowerCase() !== me)
          .filter((m) => {
            const receipt = (m.receipts ?? []).find(
              (r) => r.email.trim().toLowerCase() === me,
            );
            return !receipt?.deliveredAt;
          })
          .map((m) => m.id);
        if (deliver.length === 0) continue;
        const updated = await postReceiptsApi(conv.id, { deliver });
        patchMessageReceipts(updated);
      }
    },
    [patchMessageReceipts],
  );

  const refreshConversations = useCallback(async () => {
    if (refreshInFlightRef.current) return;
    refreshInFlightRef.current = true;
    try {
      const conversations = await fetchConversations();
      if (viewerEmail) {
        void syncDeliveredForInbox(viewerEmail, conversations);
      }
      setState((current) => {
        const prev = current ?? emptyMessagesState();
        const prevById = new Map(prev.conversations.map((row) => [row.id, row]));
        const merged = conversations.map((row) =>
          mergeConversationFromServer(
            prevById.get(row.id),
            normalizeConversation(row),
          ),
        );
        return { conversations: sortConversations(merged) };
      });
    } catch {
      /* keep last known state */
    } finally {
      refreshInFlightRef.current = false;
    }
  }, [syncDeliveredForInbox, viewerEmail]);

  const loadInbox = useCallback(async (email: string, alive: () => boolean) => {
    if (!email) {
      if (alive()) {
        setState(emptyMessagesState());
        setInboxLoading(false);
      }
      return;
    }
    if (alive()) setInboxLoading(true);
    try {
      const [people, conversations] = await Promise.all([
        fetchPeople(),
        fetchConversations(),
      ]);
      if (!alive()) return;
      setPeople(people);
      const normalized = sortConversations(
        conversations.map((row) => normalizeConversation(row)),
      );
      setState({ conversations: normalized });
      void syncDeliveredForInbox(email, normalized);
    } catch {
      if (alive()) setState(emptyMessagesState());
    } finally {
      if (alive()) setInboxLoading(false);
    }
  }, [syncDeliveredForInbox]);

  // Load session identity, people directory, and conversations, then poll.
  useEffect(() => {
    let active = true;
    const alive = () => active;

    void (async () => {
      let email = initialViewer?.user.email.trim().toLowerCase() ?? "";
      if (!email) {
        const viewer = await apiGetSession();
        if (!alive()) return;
        email = viewer?.user.email.trim().toLowerCase() ?? "";
        if (viewer) {
          setViewerEmail(email);
          setViewerName(viewer.user.name ?? "");
        }
      }
      if (!alive()) return;
      if (email) setViewerEmail(email);
      await loadInbox(email, alive);
    })();

    return () => {
      active = false;
    };
  }, [initialViewer?.user.email, loadInbox]);

  useEffect(() => {
    if (!viewerEmail) return;
    let timer: ReturnType<typeof setInterval> | null = null;

    const tick = () => {
      if (typeof document !== "undefined" && document.hidden) return;
      void refreshConversations();
    };

    const startPolling = () => {
      if (timer) clearInterval(timer);
      timer = setInterval(tick, POLL_MS);
    };

    const onVisibility = () => {
      if (document.hidden) {
        if (timer) clearInterval(timer);
        timer = null;
        return;
      }
      void refreshConversations();
      startPolling();
    };

    startPolling();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refreshConversations, viewerEmail]);

  const nameMap = useMemo(() => {
    const map = new Map<string, string>();
    if (viewerEmail) map.set(viewerEmail, viewerName || viewerEmail);
    for (const person of people) {
      map.set(person.email.trim().toLowerCase(), person.name);
    }
    return map;
  }, [people, viewerEmail, viewerName]);

  const nameFor = useCallback(
    (email: string) => {
      const key = email.trim().toLowerCase();
      const known = nameMap.get(key);
      if (known) return known;
      const local = key.split("@")[0] ?? key;
      return local.replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    },
    [nameMap],
  );

  const mergeConversation = useCallback((conversation: Conversation) => {
    const normalized = normalizeConversation(conversation);
    setState((current) => {
      const base = current ?? emptyMessagesState();
      const exists = base.conversations.some((row) => row.id === normalized.id);
      const conversations = exists
        ? base.conversations.map((row) =>
            row.id === normalized.id
              ? mergeConversationFromServer(row, normalized)
              : row,
          )
        : [normalized, ...base.conversations];
      return { conversations: sortConversations(conversations) };
    });
  }, []);

  const appendMessage = useCallback(
    (conversationId: string, message: ChatMessage) => {
      setState((current) => {
        const base = current ?? emptyMessagesState();
        const conversations = base.conversations.map((row) =>
          row.id === conversationId
            ? {
                ...row,
                updatedAt: message.sentAt,
                messages: dedupeMessagesById([...row.messages, message]),
              }
            : row,
        );
        return { conversations: sortConversations(conversations) };
      });
    },
    [],
  );

  const replaceMessage = useCallback(
    (conversationId: string, tempId: string, message: ChatMessage) => {
      setState((current) => {
        const base = current ?? emptyMessagesState();
        const conversations = base.conversations.map((row) => {
          if (row.id !== conversationId) return row;
          const messages = dedupeMessagesById(
            row.messages
              .filter((m) => m.id !== tempId && m.id !== message.id)
              .concat(message),
          );
          return { ...row, updatedAt: message.sentAt, messages };
        });
        return { conversations: sortConversations(conversations) };
      });
    },
    [],
  );

  const dropMessage = useCallback((conversationId: string, messageId: string) => {
    setState((current) => {
      const base = current ?? emptyMessagesState();
      const conversations = base.conversations.map((row) =>
        row.id === conversationId
          ? {
              ...row,
              messages: row.messages.filter((m) => m.id !== messageId),
            }
          : row,
      );
      return { conversations: sortConversations(conversations) };
    });
  }, []);

  useEffect(() => {
    registerOutboundSendHandlers({
      appendMessage,
      replaceMessage,
      dropMessage,
    });
    return () => registerOutboundSendHandlers(null);
  }, [appendMessage, dropMessage, replaceMessage]);

  const markConversationRead = useCallback(
    async (conversationId: string) => {
      if (readInFlightRef.current === conversationId) return;
      readInFlightRef.current = conversationId;
      try {
        const updated = await postReceiptsApi(conversationId, { read: true });
        patchMessageReceipts(updated);
      } finally {
        if (readInFlightRef.current === conversationId) {
          readInFlightRef.current = null;
        }
      }
    },
    [patchMessageReceipts],
  );

  const api = useMemo<MessagesApi>(
    () => ({
      createDirect: async (otherEmail) => {
        const conversation = await createDirectApi(otherEmail);
        mergeConversation(conversation);
        return conversation.id;
      },
      createGroup: async (title, memberEmails) => {
        const conversation = await createGroupApi(title, memberEmails);
        mergeConversation(conversation);
        return conversation.id;
      },
      sendMessage: async (conversationId, body) => {
        enqueueOutboundMessage({ conversationId, body, viewerEmail });
      },
      markConversationRead,
    }),
    [markConversationRead, mergeConversation, viewerEmail],
  );

  if (!state || !viewerEmail) {
    return <MessagesLoading />;
  }

  return (
    <MessagesContext.Provider
      value={{
        state,
        api,
        viewerEmail,
        nameFor,
        people,
        ready: !inboxLoading,
        inboxLoading,
      }}
    >
      {children}
      {inboxLoading ? (
        <div className="messenger-sync" role="status" aria-live="polite">
          {tm("loadingHint")}
        </div>
      ) : null}
    </MessagesContext.Provider>
  );
}

export function useMessages() {
  const value = useContext(MessagesContext);
  if (!value) {
    throw new Error("useMessages must be used within MessagesProvider");
  }
  return value;
}
