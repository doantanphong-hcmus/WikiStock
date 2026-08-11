"use client";

import { useState, useEffect } from "react";

const fontSans = "'Inter', 'Roboto', 'Open Sans', 'Segoe UI', sans-serif";
const fontBody = "'Inter', 'Roboto', 'Open Sans', 'Segoe UI', sans-serif";

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
  const [user, setUser] = useState<{ name?: string; email: string; plan?: string } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = sessionStorage.getItem("wikistock_user");
      if (storedUser) {
        try {
          setUser({ ...JSON.parse(storedUser), plan: "Free" });
        } catch {
          setUser(null);
        }
      }
    }
  }, []);

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

  const handleNewChat = () => {
    setMessages([]);
    setInput("");
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(" ").map(n => n.charAt(0)).join("").toUpperCase().slice(0, 2);
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return "U";
  };

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "#F3F3F3" }}>
      {/* Header */}
      <header className="w-full px-6 py-4" style={{ background: "#FFFFFF", borderBottom: "1px solid #E5E7EB" }}>
        <div className="mx-auto flex items-center justify-between" style={{ maxWidth: 1440 }}>
          <div className="flex items-center gap-4">
            <div className="rounded-lg px-4 py-2" style={{ background: "#101828" }}>
              <span className="text-xl font-semibold" style={{ fontFamily: fontSans, color: "#FFFFFF", letterSpacing: "0.3px" }}>
                WikiStock
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm" style={{ fontFamily: fontBody, color: "#6B7280" }}>
              Nền tảng tra cứu sức khỏe doanh nghiệp niêm yết
            </span>
          </div>
        </div>
      </header>

      <main className="flex flex-1">
        {/* Sidebar - Light gray background */}
        <aside
          className="flex w-80 flex-col"
          style={{ background: "#EFEFEF" }}
        >
          {/* Sidebar Header with Logo */}
          <div className="border-b p-4" style={{ borderColor: "#D1D5DB" }}>
            {/* WikiStock Logo */}
            <div className="mb-4 flex items-center gap-2">
              <div className="rounded-lg px-4 py-2" style={{ background: "#101828" }}>
                <span
                  className="text-xl font-semibold"
                  style={{ fontFamily: fontSans, color: "#FFFFFF", letterSpacing: "0.3px" }}
                >
                  WikiStock
                </span>
              </div>
            </div>

            <button
              onClick={handleNewChat}
              className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all hover:bg-gray-200"
              style={{ fontFamily: fontBody, color: "#1F2937", background: "#FFFFFF", border: "1px solid #D1D5DB" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New chat
            </button>
          </div>

          {/* User Info - Bottom section */}
          <div className="mt-auto border-t p-4" style={{ borderColor: "#D1D5DB" }}>
            {user ? (
              <div className="flex items-center gap-3">
                {/* Purple avatar */}
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold"
                  style={{
                    background: "#581C87",
                    color: "#FFFFFF",
                    fontFamily: fontSans,
                  }}
                >
                  {getInitials(user.name, user.email)}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ fontFamily: fontBody, color: "#111827" }}>
                    {user.name || user.email.split("@")[0]}
                  </p>
                  <span
                    className="text-xs"
                    style={{ fontFamily: fontBody, color: "#6B7280" }}
                  >
                    {user.plan}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold"
                  style={{
                    background: "#581C87",
                    color: "#FFFFFF",
                    fontFamily: fontSans,
                  }}
                >
                  U
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ fontFamily: fontBody, color: "#111827" }}>
                    Guest User
                  </p>
                  <span className="text-xs" style={{ fontFamily: fontBody, color: "#6B7280" }}>
                    Not signed in
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Search */}
          <div className="border-b p-4" style={{ borderColor: "#D1D5DB" }}>
            <div
              className="flex items-center gap-3 rounded-full px-4 py-2.5"
              style={{ background: "#FFFFFF", border: "1px solid #D1D5DB" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search"
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ fontFamily: fontBody, color: "#374151" }}
              />
            </div>
          </div>

          {/* Recent Chats */}
          <div className="flex-1 overflow-y-auto p-4">
            <h3
              className="mb-3 text-xs font-medium uppercase tracking-wide"
              style={{ color: "#6B7280", fontFamily: fontBody }}
            >
              Recent
            </h3>
            <div className="space-y-1">
              {recentChats.map((chat) => (
                <button
                  key={chat.id}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-all hover:bg-gray-200"
                  style={{ fontFamily: fontBody, color: "#374151" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span className="truncate">{chat.title}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Chat Area - Light background */}
        <div className="flex flex-1 flex-col" style={{ background: "#F3F3F3" }}>
          <div className="flex-1 overflow-y-auto p-6">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center">
                <h1
                  className="mb-8 text-center text-4xl font-medium"
                  style={{ fontFamily: fontSans, color: "#111827" }}
                >
                  Let&apos;s start with today&apos;s topic!
                </h1>

                <div className="grid w-full max-w-2xl grid-cols-3 gap-4">
                  {suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => setInput(question)}
                      className="rounded-xl p-4 text-left transition-all hover:shadow-md"
                      style={{
                        background: "#FFFFFF",
                        border: "1px solid #E5E7EB",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                      }}
                    >
                      <p className="text-sm leading-relaxed" style={{ fontFamily: fontBody, color: "#111827" }}>
                        {question}
                      </p>
                    </button>
                  ))}
                </div>

                <div className="mt-12 flex items-center gap-4">
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-full"
                    style={{ background: "#101828" }}
                  >
                    <span
                      className="text-2xl font-semibold"
                      style={{ fontFamily: fontSans, color: "#FFFFFF" }}
                    >
                      AI
                    </span>
                  </div>
                  <div>
                    <p
                      className="text-base font-medium"
                      style={{ color: "#111827", fontFamily: fontSans }}
                    >
                      WikiStock AI Assistant
                    </p>
                    <p className="text-sm" style={{ color: "#6B7280", fontFamily: fontBody }}>
                      Powered by advanced RAG technology
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-3xl space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-5 py-4 ${
                        message.role === "user" ? "rounded-br-md" : "rounded-bl-md"
                      }`}
                      style={
                        message.role === "user"
                          ? {
                              background: "#FFFFFF",
                              color: "#111827",
                              border: "1px solid #E5E7EB",
                              boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                            }
                          : {
                              background: "#FFFFFF",
                              color: "#111827",
                              border: "1px solid #E5E7EB",
                            }
                      }
                    >
                      <p className="text-base leading-relaxed" style={{ fontFamily: fontBody }}>
                        {message.content}
                      </p>
                      {message.role === "assistant" && (
                        <p className="mt-2 text-xs" style={{ fontFamily: fontBody, color: "#2563EB" }}>
                          Nguồn: VietstockFinance, Nguoiquansat.vn
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div
                      className="flex items-center gap-2 rounded-2xl rounded-bl-md px-5 py-4"
                      style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}
                    >
                      <div className="h-2 w-2 animate-pulse rounded-full" style={{ background: "#101828" }} />
                      <div className="h-2 w-2 animate-pulse rounded-full" style={{ background: "#101828", animationDelay: "0.2s" }} />
                      <div className="h-2 w-2 animate-pulse rounded-full" style={{ background: "#101828", animationDelay: "0.4s" }} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input Area - Pill shaped */}
          <div className="border-t p-4" style={{ borderColor: "#E5E7EB", background: "#F3F3F3" }}>
            <div
              className="mx-auto flex max-w-4xl items-center gap-4 rounded-full px-6 py-4"
              style={{ background: "#FFFFFF", border: "1px solid #D1D5DB" }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search for...."
                className="flex-1 bg-transparent text-base outline-none"
                style={{ fontFamily: fontBody, color: "#374151" }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="flex items-center justify-center rounded-full p-3 transition-all disabled:opacity-50"
                style={{ background: "#101828" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
            <p className="mt-3 text-center text-xs" style={{ color: "#9CA3AF", fontFamily: fontBody }}>
              AI can make mistakes. Consider checking important information.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
