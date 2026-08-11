"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppFooter } from "@/components/layout/AppFooter";

const fontSans = "'Roboto', 'Open Sans', 'Noto Sans', 'Segoe UI', sans-serif";
const fontBody = "'Poppins', 'Open Sans', 'Roboto', 'Segoe UI', sans-serif";

// Mock credentials for demo
const DEMO_ACCOUNTS = [
  { email: "demo@wikistock.com", password: "demo123" },
  { email: "admin@wikistock.com", password: "admin123" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate inputs
    if (!email || !password) {
      setError("Vui lòng điền đầy đủ thông tin.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Email không hợp lệ.");
      return;
    }

    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Check against demo accounts or allow any valid format
    const isValid = DEMO_ACCOUNTS.some(
      (acc) => acc.email === email && acc.password === password
    ) || (email.includes("@") && password.length >= 6);

    if (isValid) {
      // Store mock session
      if (typeof window !== "undefined") {
        sessionStorage.setItem("wikistock_user", JSON.stringify({ email, loggedIn: true }));
      }
      router.push("/");
    } else {
      setError("Email hoặc mật khẩu không đúng.");
    }

    setIsLoading(false);
  };

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ background: "linear-gradient(180deg, #0F172A 0%, #1E293B 100%)" }}
    >
      <header className="w-full px-6 py-6">
        <div className="mx-auto" style={{ maxWidth: 1440 }}>
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span
                className="text-3xl font-bold"
                style={{
                  fontFamily: fontSans,
                  color: "#FFFFFF",
                  letterSpacing: "0.5px",
                }}
              >
                WikiStock
              </span>
            </Link>
            <Link
              href="/"
              className="text-sm transition-colors hover:text-cyan-400"
              style={{ fontFamily: fontBody, color: "#94A3B8" }}
            >
              ← Quay về trang chủ
            </Link>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div
          className="w-full max-w-md rounded-3xl p-10"
          style={{
            background: "#FFFFFF",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          }}
        >
          <div className="mb-8 text-center">
            <h1
              className="mb-3 text-3xl font-bold"
              style={{ fontFamily: fontSans, color: "#0F172A", letterSpacing: "0.5px" }}
            >
              Đăng nhập
            </h1>
            <p style={{ fontFamily: fontBody, color: "#64748B" }}>
              Vui lòng đăng nhập để tiếp tục.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium" style={{ fontFamily: fontBody, color: "#374151" }}>
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="abc@gmail.com"
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                style={{ fontFamily: fontBody, color: "#1F2937", background: "#F9FAFB" }}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium" style={{ fontFamily: fontBody, color: "#374151" }}>
                Mật khẩu
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                required
                minLength={6}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                style={{ fontFamily: fontBody, color: "#1F2937", background: "#F9FAFB" }}
              />
            </div>

            {error && (
              <div
                className="rounded-lg p-3 text-sm"
                style={{ background: "#fee2e2", color: "#dc2626", fontFamily: fontBody }}
              >
                {error}
              </div>
            )}

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" name="remember" className="h-4 w-4 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500" />
                <span className="text-sm" style={{ fontFamily: fontBody, color: "#64748B" }}>
                  Ghi nhớ đăng nhập
                </span>
              </label>
              <Link href="#" className="text-sm transition-colors hover:text-cyan-600" style={{ fontFamily: fontBody, color: "#06B6D4" }}>
                Quên mật khẩu?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl py-3.5 text-base font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ fontFamily: fontBody, background: "linear-gradient(135deg, #1CD8D2 0%, #93EDC7 100%)" }}
            >
              {isLoading ? "Đang xử lý..." : "Đăng nhập"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ fontFamily: fontBody, color: "#64748B" }}>
            Chưa có tài khoản?{" "}
            <Link href="/signup" className="font-medium transition-colors hover:text-cyan-600" style={{ color: "#06B6D4" }}>
              Đăng ký
            </Link>
          </p>

          <div className="mt-6 rounded-lg p-4" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <p className="text-xs" style={{ fontFamily: fontBody, color: "#166534" }}>
              <strong>Demo:</strong> Sử dụng email bất kỳ có @ và mật khẩu từ 6 ký tự trở lên để đăng nhập.
            </p>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
