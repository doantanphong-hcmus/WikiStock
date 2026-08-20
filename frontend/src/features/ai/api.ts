"use client";

import { apiFetch, apiGet, apiPost } from "@/lib/api";
import type { Citation } from "@/lib/types";
import { extractSseEvents, type ParsedSseEvent } from "./sse";

export interface ChatConversation {
  conversationId: number;
  title: string;
  startedAt: string;
  updatedAt: string;
  messageCount: number;
}

export interface ChatMessage {
  messageId: number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  citations: Citation[];
}

export interface ChatCompletion {
  assistantMessageId: number;
  citations: Citation[];
  isConfident: boolean;
  limitations?: string;
}

export interface ChatStreamCallbacks {
  onStarted(userMessageId: number): void;
  onDelta(text: string): void;
}

export class ChatStreamError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ChatStreamError";
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCitation(value: unknown): value is Citation {
  return (
    isObject(value) &&
    Number.isInteger(value.citationId) &&
    Number.isInteger(value.documentId) &&
    typeof value.docTitle === "string" &&
    typeof value.sourceUrl === "string"
  );
}

function handleStreamEvent(
  event: ParsedSseEvent,
  callbacks: ChatStreamCallbacks,
): ChatCompletion | null {
  if (!isObject(event.data)) return null;

  if (event.event === "started" && Number.isInteger(event.data.userMessageId)) {
    callbacks.onStarted(Number(event.data.userMessageId));
  }

  if (event.event === "delta" && typeof event.data.text === "string") {
    callbacks.onDelta(event.data.text);
  }

  if (event.event === "error") {
    throw new ChatStreamError(
      typeof event.data.code === "string"
        ? event.data.code
        : "CHAT_STREAM_FAILED",
      typeof event.data.message === "string"
        ? event.data.message
        : "Không thể hoàn tất câu trả lời.",
    );
  }

  if (
    event.event === "completed" &&
    Number.isInteger(event.data.assistantMessageId) &&
    Array.isArray(event.data.citations) &&
    event.data.citations.every(isCitation) &&
    typeof event.data.isConfident === "boolean"
  ) {
    return {
      assistantMessageId: Number(event.data.assistantMessageId),
      citations: event.data.citations,
      isConfident: event.data.isConfident,
      limitations:
        typeof event.data.limitations === "string"
          ? event.data.limitations
          : undefined,
    };
  }

  return null;
}

export function listConversations() {
  return apiGet<ChatConversation[]>("/chat/conversations");
}

export function createConversation() {
  return apiPost<ChatConversation, Record<string, never>>(
    "/chat/conversations",
    {},
  );
}

export function listMessages(conversationId: number) {
  return apiGet<ChatMessage[]>(
    `/chat/conversations/${conversationId}/messages`,
  );
}

export async function streamChatMessage(
  conversationId: number,
  content: string,
  clientRequestId: string,
  signal: AbortSignal,
  callbacks: ChatStreamCallbacks,
): Promise<ChatCompletion> {
  const response = await apiFetch(
    `/chat/conversations/${conversationId}/messages/stream`,
    {
      method: "POST",
      body: JSON.stringify({ content, clientRequestId }),
      signal,
    },
  );

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string;
      error?: { code?: string; details?: string };
    } | null;
    throw new ChatStreamError(
      body?.error?.code ?? `HTTP_${response.status}`,
      body?.message ?? "Backend từ chối yêu cầu chat.",
    );
  }

  if (!response.body) {
    throw new ChatStreamError(
      "CHAT_CONNECTION_LOST",
      "Trình duyệt không nhận được luồng trả lời.",
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let completed: ChatCompletion | null = null;

  const consume = (flush = false) => {
    const parsed = extractSseEvents(buffer, flush);
    buffer = parsed.remainder;
    for (const event of parsed.events) {
      completed = handleStreamEvent(event, callbacks) ?? completed;
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    consume();
  }
  buffer += decoder.decode();
  consume(true);

  if (!completed) {
    throw new ChatStreamError(
      "CHAT_CONNECTION_LOST",
      "Kết nối bị gián đoạn trước khi câu trả lời hoàn tất.",
    );
  }

  return completed;
}
