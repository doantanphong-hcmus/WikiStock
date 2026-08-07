import Link from "next/link";
import { AppFooter } from "@/components/layout/AppFooter";

export default function LoginPage() {
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
                  fontFamily: "var(--font-sans)",
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
              style={{ fontFamily: "var(--font-body)", color: "#94A3B8" }}
            >
              ← Back to home
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
              style={{ fontFamily: "var(--font-sans)", color: "#0F172A", letterSpacing: "0.5px" }}
            >
              Sign in
            </h1>
            <p style={{ fontFamily: "var(--font-body)", color: "#64748B" }}>
              Please login to continue to your account.
            </p>
          </div>

          <form className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium" style={{ fontFamily: "var(--font-body)", color: "#374151" }}>
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="abc@gmail.com"
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                style={{ fontFamily: "var(--font-body)", color: "#1F2937", background: "#F9FAFB" }}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium" style={{ fontFamily: "var(--font-body)", color: "#374151" }}>
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                style={{ fontFamily: "var(--font-body)", color: "#1F2937", background: "#F9FAFB" }}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" name="remember" className="h-4 w-4 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500" />
                <span className="text-sm" style={{ fontFamily: "var(--font-body)", color: "#64748B" }}>
                  Keep me logged in
                </span>
              </label>
              <a href="#" className="text-sm transition-colors hover:text-cyan-600" style={{ fontFamily: "var(--font-body)", color: "#06B6D4" }}>
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl py-3.5 text-base font-semibold text-white transition-all hover:opacity-90"
              style={{ fontFamily: "var(--font-body)", background: "linear-gradient(135deg, #1CD8D2 0%, #93EDC7 100%)" }}
            >
              Login
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ fontFamily: "var(--font-body)", color: "#64748B" }}>
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-medium transition-colors hover:text-cyan-600" style={{ color: "#06B6D4" }}>
              Sign up
            </Link>
          </p>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
