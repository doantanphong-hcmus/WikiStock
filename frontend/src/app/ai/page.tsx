"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import {
  ChatStreamError,
  createConversation,
  listConversations,
  listMessages,
  streamChatMessage,
  type ChatConversation,
  type ChatMessage,
} from "@/features/ai/api";
import { getCurrentUser, type AuthUser } from "@/features/auth/api";
import { ApiError, getAccessToken } from "@/lib/api";
import { API_BASE_URL } from "@/lib/env";
import type { Citation } from "@/lib/types";

const fontSans = "'Inter', 'Roboto', 'Open Sans', 'Segoe UI', sans-serif";
const fontBody = "'Lexend', 'Poppins', sans-serif";

type MessageStatus = "complete" | "sending" | "streaming" | "error" | "stopped";

interface UiMessage {
  id: string;
  messageId?: number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  citations: Citation[];
  status: MessageStatus;
  isConfident?: boolean;
  limitations?: string;
  errorMessage?: string;
}

interface FailedRequest {
  content: string;
  clientRequestId: string;
  assistantId: string;
}

const suggestedQuestions = [
  "Doanh thu quý 3 của FPT là bao nhiêu?",
  "Lợi nhuận của FPT thay đổi thế nào so với cùng kỳ?",
  "Tóm tắt tình hình tài sản và nợ phải trả của FPT.",
];

function toUiMessage(message: ChatMessage): UiMessage {
  return {
    id: `message-${message.messageId}`,
    messageId: message.messageId,
    role: message.role,
    content: message.content,
    createdAt: message.createdAt,
    citations: message.citations,
    status: "complete",
  };
}

function getInitials(name?: string | null, email?: string) {
  if (name) {
    return name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return email?.charAt(0).toUpperCase() || "U";
}

function citationHref(sourceUrl: string) {
  try {
    const url = new URL(sourceUrl, API_BASE_URL);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
}

function streamErrorMessage(error: unknown) {
  if (error instanceof ChatStreamError) {
    if (error.code === "AI_SERVICE_TIMEOUT") {
      return "AI phản hồi quá thời gian cho phép. Bạn có thể thử lại.";
    }
    if (error.code === "CHAT_CONNECTION_LOST") {
      return "Kết nối bị gián đoạn trước khi câu trả lời hoàn tất.";
    }
    if (error.code === "AI_INVALID_EVIDENCE") {
      return "Nguồn dữ liệu chưa vượt qua bước kiểm chứng. Câu trả lời không được hiển thị.";
    }
    return error.message;
  }
  return "Không thể kết nối tới hệ thống AI. Vui lòng thử lại.";
}

export default function AIChatPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(
    null,
  );
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [pageError, setPageError] = useState("");
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [failedRequest, setFailedRequest] = useState<FailedRequest | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const activeRequestRef = useRef<string | null>(null);
  const selectedConversationRef = useRef<number | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);

  const filteredConversations = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("vi");
    return term
      ? conversations.filter((conversation) =>
          conversation.title.toLocaleLowerCase("vi").includes(term),
        )
      : conversations;
  }, [conversations, search]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (!getAccessToken()) {
        router.replace("/login?next=%2Fai");
        return;
      }

      try {
        const [currentUser, recentConversations] = await Promise.all([
          getCurrentUser(),
          listConversations(),
        ]);
        if (cancelled) return;

        setUser(currentUser);
        setConversations(recentConversations);

        const firstConversation = recentConversations[0];
        if (firstConversation) {
          selectedConversationRef.current = firstConversation.conversationId;
          setActiveConversationId(firstConversation.conversationId);
          setIsLoadingHistory(true);
          const history = await listMessages(firstConversation.conversationId);
          if (!cancelled) setMessages(history.map(toUiMessage));
        }
      } catch (error) {
        if (!cancelled && !(error instanceof ApiError && error.statusCode === 401)) {
          setPageError("Không thể tải lịch sử trò chuyện từ Backend.");
        }
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false);
          setIsLoadingHistory(false);
        }
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
      abortControllerRef.current?.abort();
    };
  }, [router]);

  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      const container = messagesRef.current;
      container?.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  function cancelForNavigation() {
    activeRequestRef.current = null;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsStreaming(false);
    setFailedRequest(null);
  }

  async function refreshConversations() {
    try {
      setConversations(await listConversations());
    } catch {
      // Tin nhắn vẫn an toàn trong Backend; lần tải trang sau sẽ đồng bộ lại danh sách.
    }
  }

  async function openConversation(conversationId: number) {
    if (conversationId === selectedConversationRef.current) return;
    cancelForNavigation();
    selectedConversationRef.current = conversationId;
    setActiveConversationId(conversationId);
    setMessages([]);
    setPageError("");
    setIsLoadingHistory(true);
    shouldAutoScrollRef.current = true;

    try {
      const history = await listMessages(conversationId);
      if (selectedConversationRef.current === conversationId) {
        setMessages(history.map(toUiMessage));
      }
    } catch {
      if (selectedConversationRef.current === conversationId) {
        setPageError("Không thể tải nội dung cuộc trò chuyện này.");
      }
    } finally {
      if (selectedConversationRef.current === conversationId) {
        setIsLoadingHistory(false);
      }
    }
  }

  async function handleNewChat() {
    cancelForNavigation();
    setPageError("");
    setIsPreparing(true);

    try {
      const conversation = await createConversation();
      selectedConversationRef.current = conversation.conversationId;
      setActiveConversationId(conversation.conversationId);
      setConversations((current) => [conversation, ...current]);
      setMessages([]);
      setInput("");
    } catch {
      setPageError("Không thể tạo cuộc trò chuyện mới.");
    } finally {
      setIsPreparing(false);
    }
  }

  async function sendQuestion(
    rawContent: string,
    clientRequestId = crypto.randomUUID(),
    retryAssistantId?: string,
  ) {
    const content = rawContent.trim();
    if (!content || isPreparing || isStreaming) return;

    setPageError("");
    setIsPreparing(true);
    let conversationId = selectedConversationRef.current;

    try {
      if (!conversationId) {
        const conversation = await createConversation();
        conversationId = conversation.conversationId;
        selectedConversationRef.current = conversationId;
        setActiveConversationId(conversationId);
        setConversations((current) => [conversation, ...current]);
      }
    } catch {
      setPageError("Không thể tạo cuộc trò chuyện để gửi câu hỏi.");
      setIsPreparing(false);
      return;
    }

    const userId = `user-${clientRequestId}`;
    const assistantId = retryAssistantId ?? `assistant-${clientRequestId}`;
    const now = new Date().toISOString();

    if (retryAssistantId) {
      setMessages((current) =>
        current.map((message) =>
          message.id === retryAssistantId
            ? {
                ...message,
                content: "",
                citations: [],
                status: "sending",
                errorMessage: undefined,
                limitations: undefined,
              }
            : message,
        ),
      );
    } else {
      setMessages((current) => [
        ...current,
        {
          id: userId,
          role: "user",
          content,
          createdAt: now,
          citations: [],
          status: "complete",
        },
        {
          id: assistantId,
          role: "assistant",
          content: "",
          createdAt: now,
          citations: [],
          status: "sending",
        },
      ]);
      setInput("");
    }

    setFailedRequest(null);
    setIsPreparing(false);
    setIsStreaming(true);
    shouldAutoScrollRef.current = true;
    activeRequestRef.current = clientRequestId;
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const completed = await streamChatMessage(
        conversationId,
        content,
        clientRequestId,
        controller.signal,
        {
          onStarted(userMessageId) {
            if (activeRequestRef.current !== clientRequestId) return;
            setMessages((current) =>
              current.map((message) =>
                message.id === userId
                  ? { ...message, messageId: userMessageId }
                  : message,
              ),
            );
          },
          onDelta(text) {
            if (activeRequestRef.current !== clientRequestId) return;
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantId
                  ? {
                      ...message,
                      content: message.content + text,
                      status: "streaming",
                    }
                  : message,
              ),
            );
          },
        },
      );

      if (activeRequestRef.current !== clientRequestId) return;
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                messageId: completed.assistantMessageId,
                citations: completed.citations,
                status: "complete",
                isConfident: completed.isConfident,
                limitations: completed.limitations,
              }
            : message,
        ),
      );
    } catch (error) {
      if (activeRequestRef.current !== clientRequestId) return;
      const stopped = controller.signal.aborted;
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                status: stopped ? "stopped" : "error",
                errorMessage: stopped
                  ? "Bạn đã dừng câu trả lời."
                  : streamErrorMessage(error),
              }
            : message,
        ),
      );
      setFailedRequest({ content, clientRequestId, assistantId });
    } finally {
      if (activeRequestRef.current === clientRequestId) {
        activeRequestRef.current = null;
        abortControllerRef.current = null;
        setIsStreaming(false);
        void refreshConversations();
      }
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendQuestion(input);
    }
  }

  const isBusy = isPreparing || isStreaming;

  return (
    <div className="flex min-h-screen flex-col bg-[#F3F3F3]">
      <header className="w-full border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between">
          <Link href="/" className="rounded-lg bg-[#101828] px-4 py-2">
            <span className="text-xl font-semibold text-white" style={{ fontFamily: fontSans }}>
              WikiStock
            </span>
          </Link>
          <span className="hidden text-sm text-gray-500 sm:block" style={{ fontFamily: fontBody }}>
            Nền tảng tra cứu sức khỏe doanh nghiệp niêm yết
          </span>
        </div>
      </header>

      <main className="flex min-h-0 flex-1">
        <aside className="hidden w-80 shrink-0 flex-col bg-[#EFEFEF] md:flex">
          <div className="border-b border-gray-300 p-4">
            <button
              type="button"
              onClick={() => void handleNewChat()}
              disabled={isPreparing}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white py-2.5 text-sm font-medium text-gray-800 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ fontFamily: fontBody }}
            >
              <span aria-hidden="true" className="text-lg leading-none">+</span>
              Cuộc trò chuyện mới
            </button>
          </div>

          <div className="border-b border-gray-300 p-4">
            <label className="flex items-center gap-3 rounded-full border border-gray-300 bg-white px-4 py-2.5">
              <span aria-hidden="true" className="text-gray-500">⌕</span>
              <span className="sr-only">Tìm cuộc trò chuyện</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm cuộc trò chuyện"
                className="min-w-0 flex-1 bg-transparent text-sm text-gray-700 outline-none"
              />
            </label>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">
              Gần đây
            </h2>
            {isBootstrapping ? (
              <p className="text-sm text-gray-500">Đang tải lịch sử...</p>
            ) : filteredConversations.length ? (
              <div className="space-y-1">
                {filteredConversations.map((conversation) => (
                  <button
                    type="button"
                    key={conversation.conversationId}
                    onClick={() => void openConversation(conversation.conversationId)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                      activeConversationId === conversation.conversationId
                        ? "bg-white font-medium text-gray-950"
                        : "text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <span aria-hidden="true">◱</span>
                    <span className="truncate">{conversation.title}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                {search ? "Không tìm thấy cuộc trò chuyện." : "Chưa có cuộc trò chuyện nào."}
              </p>
            )}
          </div>

          {user ? (
            <div className="border-t border-gray-300 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-900 text-sm font-semibold text-white">
                  {getInitials(user.fullName, user.email)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {user.fullName || user.email.split("@")[0]}
                  </p>
                  <p className="truncate text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
            </div>
          ) : null}
        </aside>

        <section className="flex min-w-0 flex-1 flex-col bg-[#F3F3F3]">
          <div
            ref={messagesRef}
            onScroll={(event) => {
              const element = event.currentTarget;
              shouldAutoScrollRef.current =
                element.scrollHeight - element.scrollTop - element.clientHeight < 100;
            }}
            className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6"
          >
            {pageError ? (
              <div role="alert" className="mx-auto mb-4 max-w-3xl rounded-xl bg-red-50 p-4 text-sm text-red-700">
                {pageError}
              </div>
            ) : null}

            {isBootstrapping || isLoadingHistory ? (
              <div className="flex h-full items-center justify-center text-gray-500">
                Đang tải lịch sử trò chuyện...
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center py-10">
                <h1 className="mb-3 text-center text-3xl font-medium text-gray-950 sm:text-4xl" style={{ fontFamily: fontBody }}>
                  Bạn muốn tìm hiểu doanh nghiệp nào?
                </h1>
                <p className="mb-8 max-w-xl text-center text-sm text-gray-500">
                  Hỏi về báo cáo tài chính và kiểm tra nguồn dẫn chứng ngay trong câu trả lời.
                </p>
                <div className="grid w-full max-w-3xl gap-3 md:grid-cols-3">
                  {suggestedQuestions.map((question) => (
                    <button
                      type="button"
                      key={question}
                      onClick={() => setInput(question)}
                      className="rounded-xl border border-gray-200 bg-white p-4 text-left text-sm leading-relaxed text-gray-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      {question}
                    </button>
                  ))}
                </div>
                <div className="mt-10 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#101828] font-semibold text-white">
                    AI
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">WikiStock AI</p>
                    <p className="text-xs text-gray-500">Trả lời bằng dữ liệu RAG có dẫn nguồn</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-3xl space-y-5">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <article
                      className={`max-w-[88%] rounded-2xl border border-gray-200 bg-white px-5 py-4 text-gray-900 ${
                        message.role === "user" ? "rounded-br-md shadow-sm" : "rounded-bl-md"
                      }`}
                    >
                      {message.content ? (
                        <p className="whitespace-pre-wrap break-words text-base leading-7" style={{ fontFamily: fontBody }}>
                          {message.content}
                          {message.status === "streaming" ? (
                            <span className="ml-1 inline-block h-4 w-1 animate-pulse bg-gray-700" aria-label="Đang trả lời" />
                          ) : null}
                        </p>
                      ) : message.role === "assistant" && message.status === "sending" ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500" role="status">
                          <span className="h-2 w-2 animate-pulse rounded-full bg-gray-800" />
                          Đang phân tích dữ liệu và kiểm tra nguồn...
                        </div>
                      ) : null}

                      {message.errorMessage ? (
                        <div className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900" role="alert">
                          <p>{message.errorMessage}</p>
                          {failedRequest?.assistantId === message.id ? (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                void sendQuestion(
                                  failedRequest.content,
                                  failedRequest.clientRequestId,
                                  failedRequest.assistantId,
                                )
                              }
                              className="mt-2 font-semibold text-blue-700 hover:underline disabled:opacity-50"
                            >
                              Thử lại
                            </button>
                          ) : null}
                        </div>
                      ) : null}

                      {message.status === "complete" && message.isConfident === false ? (
                        <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                          {message.limitations || "Câu trả lời này chưa có đủ nguồn dữ liệu để xác nhận."}
                        </p>
                      ) : null}

                      {message.role === "assistant" && message.citations.length ? (
                        <div className="mt-4 border-t border-gray-100 pt-3">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Nguồn đã kiểm chứng</p>
                          <ul className="space-y-2">
                            {message.citations.map((citation) => {
                              const href = citationHref(citation.sourceUrl);
                              return (
                                <li key={citation.citationId} className="text-sm">
                                  {href ? (
                                    <a href={href} target="_blank" rel="noreferrer" className="font-medium text-blue-700 hover:underline">
                                      {citation.docTitle}
                                    </a>
                                  ) : (
                                    <span className="font-medium text-gray-700">{citation.docTitle}</span>
                                  )}
                                  {citation.locationRef ? (
                                    <span className="ml-2 text-xs text-gray-500">{citation.locationRef}</span>
                                  ) : null}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      ) : null}

                      <time className="mt-2 block text-right text-[11px] text-gray-400" dateTime={message.createdAt}>
                        {new Date(message.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                      </time>
                    </article>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 bg-[#F3F3F3] p-3 sm:p-4">
            <div className="mx-auto flex max-w-4xl items-end gap-3 rounded-3xl border border-gray-300 bg-white px-5 py-3">
              <label htmlFor="chat-input" className="sr-only">Nhập câu hỏi</label>
              <textarea
                id="chat-input"
                rows={1}
                maxLength={4000}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isBootstrapping || isLoadingHistory}
                placeholder="Hỏi WikiStock về một doanh nghiệp..."
                className="max-h-36 min-h-7 flex-1 resize-none bg-transparent py-1 text-base text-gray-800 outline-none disabled:cursor-not-allowed"
              />
              {isStreaming ? (
                <button
                  type="button"
                  onClick={() => abortControllerRef.current?.abort()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-600 text-white transition hover:bg-red-700"
                  aria-label="Dừng câu trả lời"
                  title="Dừng câu trả lời"
                >
                  <span className="h-3 w-3 rounded-sm bg-white" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void sendQuestion(input)}
                  disabled={!input.trim() || isBusy || isBootstrapping || isLoadingHistory}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#101828] text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Gửi câu hỏi"
                  title="Gửi câu hỏi"
                >
                  <span aria-hidden="true">↑</span>
                </button>
              )}
            </div>
            <p className="mt-2 text-center text-xs text-gray-500">
              Enter để gửi · Shift + Enter để xuống dòng · Luôn kiểm tra nguồn trước quyết định tài chính
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
