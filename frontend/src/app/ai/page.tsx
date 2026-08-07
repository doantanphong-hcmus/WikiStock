"use client";

import { useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const suggestedQuestions = [
  "Giá chứng khoán của FPT hôm nay",
  "Tổng tài sản của VCB tại thời điểm cuối quý gần nhất là bao nhiêu?",
  "Hãy tóm tắt các sự kiện thay đổi nhân sự cấp cao của SSI trong năm qua.",
];

const recentChats = [
  { id: "1", title: "Giá chứng khoán của FPT hôm nay" },
  { id: "2", title: "Tổng tài sản của VCB..." },
  { id: "3", title: "Thay đổi nhân sự SSI..." },
];

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Theo dữ liệu cập nhật mới nhất, đây là thông tin về "${userMessage.content}". [AI response will be connected to backend]`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "#0F172A" }}>
      <AppHeader />

      <main className="flex flex-1">
        {/* Sidebar */}
        <aside className="flex w-80 flex-col border-r border-slate-700/50" style={{ background: "#0F172A" }}>
          <div className="border-b border-slate-700/50 p-4">
            <button
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-base font-medium transition-all hover:bg-slate-800"
              style={{ fontFamily: "var(--font-body)", color: "#94A3B8", background: "#1E293B" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New chat
            </button>
          </div>

          <div className="border-b border-slate-700/50 p-4">
            <div className="flex items-center gap-3 rounded-xl px-4 py-2.5" style={{ background: "#1E293B" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search"
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ fontFamily: "var(--font-body)", color: "#94A3B8" }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>
              Recent
            </h3>
            <div className="space-y-1">
              {recentChats.map((chat) => (
                <button
                  key={chat.id}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-all hover:bg-slate-800"
                  style={{ color: "#CBD5E1" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span className="truncate" style={{ fontFamily: "var(--font-body)" }}>{chat.title}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Chat Area */}
        <div className="flex flex-1 flex-col">
          <div className="flex-1 overflow-y-auto p-6">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center">
                <h1 className="mb-8 text-center text-4xl font-bold" style={{ fontFamily: "var(--font-sans)", color: "#FFFFFF" }}>
                  Let&apos;s start with today&apos;s topic!
                </h1>

                <div className="grid w-full max-w-2xl grid-cols-3 gap-4">
                  {suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => setInput(question)}
                      className="rounded-xl p-4 text-left transition-all hover:bg-slate-800"
                      style={{ background: "#1E293B", border: "1px solid #334155" }}
                    >
                      <p className="text-sm leading-relaxed" style={{ fontFamily: "var(--font-body)", color: "#CBD5E1" }}>
                        {question}
                      </p>
                    </button>
                  ))}
                </div>

                <div className="mt-12 flex items-center gap-4">
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-full"
                    style={{ background: "linear-gradient(135deg, #1CD8D2 0%, #93EDC7 100%)" }}
                  >
                    <span className="text-2xl font-bold" style={{ fontFamily: "var(--font-sans)", color: "#0F172A" }}>AI</span>
                  </div>
                  <div>
                    <p className="text-base font-medium" style={{ color: "#FFFFFF", fontFamily: "var(--font-sans)" }}>
                      WikiStock AI Assistant
                    </p>
                    <p className="text-sm" style={{ color: "#64748B", fontFamily: "var(--font-body)" }}>
                      Powered by advanced RAG technology
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-3xl space-y-6">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-5 py-4 ${message.role === "user" ? "rounded-br-md" : "rounded-bl-md"}`}
                      style={
                        message.role === "user"
                          ? { background: "linear-gradient(135deg, #1CD8D2 0%, #93EDC7 100%)", color: "#0F172A" }
                          : { background: "#1E293B", color: "#F1F5F9" }
                      }
                    >
                      <p className="text-base leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>
                        {message.content}
                      </p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-2xl rounded-bl-md px-5 py-4" style={{ background: "#1E293B" }}>
                      <div className="h-2 w-2 animate-pulse rounded-full" style={{ background: "#1CD8D2" }} />
                      <div className="h-2 w-2 animate-pulse rounded-full" style={{ background: "#1CD8D2", animationDelay: "0.2s" }} />
                      <div className="h-2 w-2 animate-pulse rounded-full" style={{ background: "#1CD8D2", animationDelay: "0.4s" }} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-slate-700/50 p-4">
            <div className="mx-auto flex max-w-4xl items-center gap-4 rounded-2xl px-6 py-4" style={{ background: "#1E293B" }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search for...."
                className="flex-1 bg-transparent text-base outline-none"
                style={{ fontFamily: "var(--font-body)", color: "#CBD5E1" }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="flex items-center justify-center rounded-full p-2 transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #1CD8D2 0%, #93EDC7 100%)" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
            <p className="mt-3 text-center text-xs" style={{ color: "#64748B", fontFamily: "var(--font-body)" }}>
              AI can make mistakes. Consider checking important information.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
