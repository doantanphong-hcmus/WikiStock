"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const navLinks = [
  { href: "/", label: "Trang chủ" },
  { href: "/about", label: "Giới thiệu" },
  { href: "/pricing", label: "Bảng giá" },
  { href: "/ai", label: "Chat với AI" },
];

const fontSans = "'Roboto', 'Open Sans', 'Noto Sans', 'Segoe UI', sans-serif";
const fontBody = "'Poppins', 'Open Sans', 'Roboto', 'Segoe UI', sans-serif";

interface User {
  email: string;
  name?: string;
  loggedIn: boolean;
}

export function AppHeader() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    // Check for logged in user
    if (typeof window !== "undefined") {
      const storedUser = sessionStorage.getItem("wikistock_user");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          setUser(null);
        }
      }
    }
  }, []);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("wikistock_user");
    }
    setUser(null);
    setIsMenuOpen(false);
    router.push("/");
  };

  return (
    <header className="w-full px-6 py-5" style={{ background: "#0F172A" }}>
      <div className="mx-auto flex items-center justify-between" style={{ maxWidth: 1440 }}>
        <div className="flex items-center gap-4">
          <button className="flex items-center justify-center" style={{ width: 24, height: 24 }} aria-label="Menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <Link href="/">
            <div className="rounded-lg px-4 py-2" style={{ background: "#1E293B" }}>
              <span className="text-2xl font-bold" style={{ fontFamily: fontSans, color: "#FFFFFF", letterSpacing: "0.5px" }}>
                WikiStock
              </span>
            </div>
          </Link>

          <span className="hidden text-sm xl:block" style={{ fontFamily: fontBody, color: "#94A3B8", marginLeft: 16, fontWeight: 400 }}>
            Nền tảng tra cứu sức khỏe doanh nghiệp niêm yết
          </span>
        </div>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-normal transition-colors hover:text-cyan-400"
              style={{ fontFamily: fontBody, color: "#CBD5E1" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {user?.loggedIn ? (
            // User is logged in
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-2 rounded-xl px-4 py-2 transition-all hover:bg-slate-800"
                style={{ fontFamily: fontBody }}
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold"
                  style={{ background: "linear-gradient(135deg, #1CD8D2 0%, #93EDC7 100%)", color: "#0F172A" }}
                >
                  {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                </div>
                <span className="hidden text-sm md:block" style={{ color: "#CBD5E1" }}>
                  {user.name || user.email.split("@")[0]}
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {isMenuOpen && (
                <div
                  className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl py-2 shadow-lg"
                  style={{ background: "#1E293B", border: "1px solid #334155" }}
                >
                  <div className="border-b border-slate-700 px-4 py-2">
                    <p className="text-xs" style={{ color: "#64748B", fontFamily: fontBody }}>Đã đăng nhập</p>
                    <p className="text-sm truncate" style={{ color: "#CBD5E1", fontFamily: fontBody }}>{user.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors hover:bg-slate-700"
                    style={{ fontFamily: fontBody, color: "#94A3B8" }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                style={{ fontFamily: fontBody, background: "linear-gradient(135deg, #1CD8D2 0%, #93EDC7 100%)", color: "#0F172A" }}
              >
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
