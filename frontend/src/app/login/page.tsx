"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppFooter } from "@/components/layout/AppFooter";
import { login } from "@/features/auth/api";
import { ApiError, setAccessToken } from "@/lib/api";

const fontSans = "'Roboto', 'Open Sans', 'Noto Sans', 'Segoe UI', sans-serif";
const fontBody = "'Poppins', 'Open Sans', 'Roboto', 'Segoe UI', sans-serif";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Vui lòng điền đầy đủ thông tin.");
      return;
    }

    setIsLoading(true);
    try {
      const session = await login({ email, password });
      setAccessToken(session.accessToken);
      const nextPath = new URLSearchParams(window.location.search).get("next");
      router.replace(nextPath === "/ai" ? nextPath : "/");
    } catch (requestError) {
      setError(
        requestError instanceof ApiError && requestError.statusCode === 401
          ? "Email hoặc mật khẩu không đúng."
          : "Không thể đăng nhập lúc này. Vui lòng thử lại.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "#0F172A" }}>
      <header className="w-full px-6 py-6">
        <div className="mx-auto flex items-center justify-between" style={{ maxWidth: 1440 }}>
          <Link href="/" className="text-3xl font-bold text-white" style={{ fontFamily: fontSans }}>
            WikiStock
          </Link>
          <Link href="/" className="text-sm text-slate-400 transition-colors hover:text-cyan-400" style={{ fontFamily: fontBody }}>
            ← Quay về trang chủ
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-3xl bg-white p-10 shadow-2xl">
          <div className="mb-8 text-center">
            <h1 className="mb-3 text-3xl font-bold text-slate-900" style={{ fontFamily: fontSans }}>
              Đăng nhập
            </h1>
            <p className="text-slate-500" style={{ fontFamily: fontBody }}>
              Đăng nhập bằng tài khoản WikiStock của bạn.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-slate-700" style={{ fontFamily: fontBody }}>
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="abc@gmail.com"
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-slate-800 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700" style={{ fontFamily: fontBody }}>
                Mật khẩu
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Nhập mật khẩu"
                required
                minLength={8}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-slate-800 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>

            {error && (
              <div role="alert" className="rounded-lg bg-red-100 p-3 text-sm text-red-700" style={{ fontFamily: fontBody }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-slate-900 py-3.5 font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ fontFamily: fontBody }}
            >
              {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500" style={{ fontFamily: fontBody }}>
            Chưa có tài khoản?{" "}
            <Link href="/signup" className="font-medium text-cyan-600 hover:text-cyan-700">
              Đăng ký
            </Link>
          </p>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
