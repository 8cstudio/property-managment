"use client";

import { Button } from "@ezzi/ui";
import { MessageCircle, Search, Users, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDesk } from "@/features/workspace/store";
import {
  conversationTitle,
  dedupeMessagesById,
  lastMessage,
  outboundMessageStatus,
} from "./data";
import { MessageStatusIcon } from "./message-status";
import { MessagesProvider, useMessages } from "./store";

export function Messenger({ role }: { role: string }) {
  const { viewer } = useDesk();
  return (
    <MessagesProvider role={role} initialViewer={viewer}>
      <MessengerView />
    </MessagesProvider>
  );
}

function MessengerView() {
  const tm = useTranslations("messages");
  const { state, viewerEmail, nameFor } = useMessages();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [panel, setPanel] = useState<"none" | "dm" | "group">("none");

  const conversations = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...state.conversations]
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
      .filter((row) => {
        if (!q) return true;
        const title = conversationTitle(row, viewerEmail, nameFor).toLowerCase();
        const preview = lastMessage(row)?.body.toLowerCase() ?? "";
        return title.includes(q) || preview.includes(q);
      });
  }, [nameFor, query, state.conversations, viewerEmail]);

  useEffect(() => {
    if (!activeId && conversations[0]) setActiveId(conversations[0].id);
  }, [activeId, conversations]);

  const active = conversations.find((row) => row.id === activeId) ?? null;

  return (
    <div className="messenger">
      <aside className="messenger-inbox">
        <header className="messenger-inbox__head">
          <h1>{tm("title")}</h1>
          <div className="messenger-inbox__actions">
            <button
              type="button"
              aria-label={tm("newMessage")}
              title={tm("newMessage")}
              onClick={() => setPanel("dm")}
            >
              <UserPlus size={18} />
            </button>
            <button
              type="button"
              aria-label={tm("newGroup")}
              title={tm("newGroup")}
              onClick={() => setPanel("group")}
            >
              <Users size={18} />
            </button>
          </div>
        </header>
        <label className="messenger-search">
          <Search size={16} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={tm("searchChats")}
          />
        </label>
        <ul className="messenger-threads">
          {conversations.length === 0 ? (
            <li className="messenger-threads__empty">{tm("noChatsYet")}</li>
          ) : (
            conversations.map((row) => {
              const title = conversationTitle(row, viewerEmail, nameFor);
              const last = lastMessage(row);
              const preview = last
                ? last.senderEmail === viewerEmail
                  ? `${tm("you")}: ${last.body}`
                  : last.body
                : tm("noMessagesYet");
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    className={
                      row.id === activeId
                        ? "messenger-thread is-active"
                        : "messenger-thread"
                    }
                    onClick={() => {
                      setActiveId(row.id);
                      setPanel("none");
                    }}
                  >
                    <span className="messenger-avatar" aria-hidden="true">
                      {initials(title)}
                    </span>
                    <span className="messenger-thread__body">
                      <span className="messenger-thread__top">
                        <strong>{title}</strong>
                        {last ? (
                          <time dateTime={last.sentAt}>
                            {formatWhen(last.sentAt)}
                          </time>
                        ) : null}
                      </span>
                      <span className="messenger-thread__preview">{preview}</span>
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </aside>
      <section className="messenger-pane">
        {panel === "dm" ? (
          <NewDirectPanel onClose={() => setPanel("none")} onOpen={setActiveId} />
        ) : panel === "group" ? (
          <NewGroupPanel onClose={() => setPanel("none")} onOpen={setActiveId} />
        ) : active ? (
          <ThreadView conversationId={active.id} />
        ) : (
          <div className="messenger-empty">
            <MessageCircle size={48} strokeWidth={1.25} aria-hidden="true" />
            <p>{tm("selectChat")}</p>
          </div>
        )}
      </section>
    </div>
  );
}

function ThreadView({ conversationId }: { conversationId: string }) {
  const tm = useTranslations("messages");
  const { state, api, viewerEmail, nameFor } = useMessages();
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const conversation = state.conversations.find((row) => row.id === conversationId);

  useEffect(() => {
    setDraft("");
  }, [conversationId]);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [conversation?.messages?.length, conversationId]);

  useEffect(() => {
    void api.markConversationRead(conversationId);
  }, [api, conversation?.messages?.length, conversationId]);

  const threadMessages = useMemo(
    () => dedupeMessagesById(conversation?.messages ?? []),
    [conversation?.messages],
  );

  if (!conversation) return null;

  const title = conversationTitle(conversation, viewerEmail, nameFor);
  const subtitle =
    conversation.kind === "group"
      ? tm("membersCount", { count: conversation.memberEmails.length })
      : nameFor(
          conversation.memberEmails.find(
            (email) => email.toLowerCase() !== viewerEmail.toLowerCase(),
          ) ?? "",
        );

  function send(event: FormEvent) {
    event.preventDefault();
    if (!draft.trim()) return;
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    void api.sendMessage(conversationId, text);
  }

  return (
    <>
      <header className="messenger-pane__head">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </header>
      <div className="messenger-feed" ref={scrollRef}>
        {threadMessages.length === 0 ? (
          <p className="messenger-feed__empty">{tm("sayHello")}</p>
        ) : (
          threadMessages.map((message) => {
            const mine =
              message.senderEmail.toLowerCase() === viewerEmail.toLowerCase();
            return (
              <div
                key={message.id}
                className={mine ? "messenger-row is-mine" : "messenger-row"}
              >
                {!mine ? (
                  <span className="messenger-avatar messenger-avatar--sm">
                    {initials(nameFor(message.senderEmail))}
                  </span>
                ) : null}
                <div className={mine ? "messenger-bubble is-mine" : "messenger-bubble"}>
                  {conversation.kind === "group" && !mine ? (
                    <span className="messenger-bubble__author">
                      {nameFor(message.senderEmail)}
                    </span>
                  ) : null}
                  <p>{message.body}</p>
                  <span className="messenger-bubble__meta">
                    <time dateTime={message.sentAt}>{formatWhen(message.sentAt)}</time>
                    {mine ? (
                      (() => {
                        const status = outboundMessageStatus(
                          message,
                          viewerEmail,
                          conversation.memberEmails,
                        );
                        return status ? (
                          <MessageStatusIcon status={status} />
                        ) : null;
                      })()
                    ) : null}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
      <form className="messenger-compose" onSubmit={send}>
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={tm("writeMessage")}
          aria-label={tm("writeMessage")}
        />
        <Button type="submit" disabled={!draft.trim()}>
          {tm("send")}
        </Button>
      </form>
    </>
  );
}

function NewDirectPanel({
  onClose,
  onOpen,
}: {
  onClose: () => void;
  onOpen: (id: string) => void;
}) {
  const tm = useTranslations("messages");
  const { api, people } = useMessages();

  return (
    <div className="messenger-compose-panel">
      <header>
        <h2>{tm("newMessage")}</h2>
        <button type="button" onClick={onClose}>
          {tm("cancel")}
        </button>
      </header>
      {people.length === 0 ? (
        <p className="hint">{tm("noPeople")}</p>
      ) : (
        <ul className="messenger-people">
          {people.map((person) => (
            <li key={person.email}>
              <button
                type="button"
                onClick={async () => {
                  const id = await api.createDirect(person.email);
                  onOpen(id);
                  onClose();
                }}
              >
                <span className="messenger-avatar messenger-avatar--sm">
                  {initials(person.name)}
                </span>
                <span>
                  <strong>{person.name}</strong>
                  <span>{person.email}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NewGroupPanel({
  onClose,
  onOpen,
}: {
  onClose: () => void;
  onOpen: (id: string) => void;
}) {
  const tm = useTranslations("messages");
  const { api, people } = useMessages();
  const [title, setTitle] = useState("");
  const [picked, setPicked] = useState<string[]>([]);

  function toggle(email: string) {
    setPicked((current) =>
      current.includes(email)
        ? current.filter((row) => row !== email)
        : [...current, email],
    );
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || picked.length === 0) return;
    const id = await api.createGroup(title, picked);
    onOpen(id);
    onClose();
  }

  return (
    <form className="messenger-compose-panel" onSubmit={submit}>
      <header>
        <h2>{tm("newGroup")}</h2>
        <button type="button" onClick={onClose}>
          {tm("cancel")}
        </button>
      </header>
      <label>
        {tm("groupName")}
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />
      </label>
      <p className="kicker">{tm("addMembers")}</p>
      {people.length === 0 ? (
        <p className="hint">{tm("noPeople")}</p>
      ) : (
        <ul className="messenger-people messenger-people--pick">
          {people.map((person) => (
            <li key={person.email}>
              <label>
                <input
                  type="checkbox"
                  checked={picked.includes(person.email)}
                  onChange={() => toggle(person.email)}
                />
                <span className="messenger-avatar messenger-avatar--sm">
                  {initials(person.name)}
                </span>
                <span>
                  <strong>{person.name}</strong>
                  <span>{person.email}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
      <Button type="submit" disabled={!title.trim() || picked.length === 0}>
        {tm("createGroup")}
      </Button>
    </form>
  );
}

function initials(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0] ?? "";
  if (parts.length === 1) return first.slice(0, 2).toUpperCase();
  const second = parts[1] ?? "";
  return `${first.charAt(0)}${second.charAt(0)}`.toUpperCase();
}

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) {
    return date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
