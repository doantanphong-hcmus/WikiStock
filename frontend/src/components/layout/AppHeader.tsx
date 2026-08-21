"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCurrentUser, type AuthUser } from "@/features/auth/api";
import { clearAccessToken, getAccessToken } from "@/lib/api";

const navLinks = [
  { href: "/", label: "Trang chủ" },
  { href: "/about", label: "Giới thiệu" },
  { href: "/pricing", label: "Bảng giá" },
  { href: "/ai", label: "Chat với AI" },
];

const fontSans = "'Roboto', 'Open Sans', 'Noto Sans', 'Segoe UI', sans-serif";
const fontBody = "'Poppins', 'Open Sans', 'Roboto', 'Segoe UI', sans-serif";

export function AppHeader() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarClosing, setIsSidebarClosing] = useState(false);

  const handleCloseSidebar = () => {
    setIsSidebarClosing(true);
    setTimeout(() => {
      setIsSidebarOpen(false);
      setIsSidebarClosing(false);
    }, 300);
  };

  useEffect(() => {
    let isMounted = true;

    if (getAccessToken()) {
      void getCurrentUser()
        .then((currentUser) => {
          if (isMounted) setUser(currentUser);
        })
        .catch(() => {
          if (isMounted) setUser(null);
        });
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = () => {
    clearAccessToken();
    setUser(null);
    setIsMenuOpen(false);
    router.replace("/login");
  };

  return (
    <>
      <header className="w-full px-6 py-5" style={{ background: "#0F172A" }}>
        <div
          className="mx-auto flex items-center justify-between"
          style={{ maxWidth: 1440 }}
        >
          <div className="flex items-center gap-4 pl-2">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="flex items-center justify-center"
              style={{ width: 24, height: 24 }}
              aria-label="Menu"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#94A3B8"
                strokeWidth="2"
                strokeLinecap="round"
              >
                {isSidebarOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </>
                )}
              </svg>
            </button>

            <Link href="/">
              <div
                className="rounded-lg px-4 py-2"
                style={{ background: "#1E293B" }}
              >
                <span
                  className="text-2xl font-bold"
                  style={{
                    fontFamily: fontSans,
                    color: "#FFFFFF",
                    letterSpacing: "0.5px",
                  }}
                >
                  WikiStock
                </span>
              </div>
            </Link>

            <span
              className="hidden xl:block"
              style={{
                fontFamily: fontBody,
                color: "#94A3B8",
                marginLeft: 16,
                fontWeight: 400,
                fontSize: "104%",
              }}
            >
              Nền tảng tra cứu sức khỏe doanh nghiệp niêm yết
            </span>
          </div>

          <nav className="hidden items-center gap-8 md:flex pr-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-normal transition-colors hover:text-cyan-400"
                style={{
                  fontFamily: fontBody,
                  color: "#CBD5E1",
                  fontSize: "104%",
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3 pr-2">
            {user ? (
              // User is logged in
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2 rounded-xl px-4 py-2 transition-all hover:bg-slate-800"
                  style={{ fontFamily: fontBody }}
                >
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold"
                    style={{ background: "#FFFFFF", color: "#0F172A" }}
                  >
                    {user.fullName
                      ? user.fullName.charAt(0).toUpperCase()
                      : user.email.charAt(0).toUpperCase()}
                  </div>
                  <span
                    className="hidden text-sm md:block"
                    style={{ color: "#CBD5E1" }}
                  >
                    {user.fullName || user.email.split("@")[0]}
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#94A3B8"
                    strokeWidth="2"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {isMenuOpen && (
                  <div
                    className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl py-2 shadow-lg"
                    style={{
                      background: "#1E293B",
                      border: "1px solid #334155",
                    }}
                  >
                    <div className="border-b border-slate-700 px-4 py-2">
                      <p
                        className="text-xs"
                        style={{ color: "#64748B", fontFamily: fontBody }}
                      >
                        Đã đăng nhập
                      </p>
                      <p
                        className="text-sm truncate"
                        style={{ color: "#CBD5E1", fontFamily: fontBody }}
                      >
                        {user.email}
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors hover:bg-slate-700"
                      style={{ fontFamily: fontBody, color: "#94A3B8" }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // User is not logged in
              <>
                <Link
                  href="/login"
                  className="rounded-xl border-2 border-cyan-500 px-5 py-2.5 text-sm font-normal transition-all hover:bg-cyan-500/10"
                  style={{ fontFamily: fontBody, color: "#06B6D4" }}
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/signup"
                  className="rounded-xl px-5 py-2.5 text-sm font-normal transition-all hover:opacity-90"
                  style={{
                    fontFamily: fontBody,
                    background: "#FFFFFF",
                    color: "#0F172A",
                  }}
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 flex" style={{ top: 72 }}>
          <div
            className={`absolute inset-0 ${isSidebarClosing ? "animate-fadeOut" : "animate-fadeIn"}`}
            style={{ background: "rgba(0, 0, 0, 0.5)" }}
            onClick={handleCloseSidebar}
          />
          <div
            className={`relative flex flex-col gap-2 p-4 ${isSidebarClosing ? "animate-slideOut" : "animate-slideIn"}`}
            style={{ width: 280, background: "#1E293B" }}
          >
            <Link
              href="/"
              className="rounded-lg px-4 py-3 text-lg font-medium transition-colors hover:bg-slate-700"
              style={{ fontFamily: fontBody, color: "#CBD5E1" }}
              onClick={handleCloseSidebar}
            >
              Trang chủ
            </Link>
            <Link
              href="/about"
              className="rounded-lg px-4 py-3 text-lg font-medium transition-colors hover:bg-slate-700"
              style={{ fontFamily: fontBody, color: "#CBD5E1" }}
              onClick={handleCloseSidebar}
            >
              Giới thiệu
            </Link>
            <Link
              href="/pricing"
              className="rounded-lg px-4 py-3 text-lg font-medium transition-colors hover:bg-slate-700"
              style={{ fontFamily: fontBody, color: "#CBD5E1" }}
              onClick={handleCloseSidebar}
            >
              Bảng giá
            </Link>
            <Link
              href="/ai"
              className="rounded-lg px-4 py-3 text-lg font-medium transition-colors hover:bg-slate-700"
              style={{ fontFamily: fontBody, color: "#CBD5E1" }}
              onClick={handleCloseSidebar}
            >
              Chat với AI
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
