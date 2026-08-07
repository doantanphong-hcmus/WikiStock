import Link from "next/link";
import { AppFooter } from "@/components/layout/AppFooter";

export default function SignupPage() {
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
                style={{ fontFamily: "var(--font-sans)", color: "#FFFFFF", letterSpacing: "0.5px" }}
              >
                WikiStock
              </span>
            </Link>
            <Link href="/" className="text-sm transition-colors hover:text-cyan-400" style={{ fontFamily: "var(--font-body)", color: "#94A3B8" }}>
              ← Back to home
            </Link>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div
          className="w-full max-w-md rounded-3xl p-10"
          style={{ background: "#FFFFFF", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
        >
          <div className="mb-6 text-center">
            <h1 className="mb-2 text-3xl font-bold" style={{ fontFamily: "var(--font-sans)", color: "#0F172A", letterSpacing: "0.5px" }}>
              Sign up
            </h1>
            <p style={{ fontFamily: "var(--font-body)", color: "#64748B" }}>
              Sign up to enjoy the feature of WikiStock
            </p>
          </div>

          <form className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium" style={{ fontFamily: "var(--font-body)", color: "#374151" }}>
                Your Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Baro Tran"
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                style={{ fontFamily: "var(--font-body)", color: "#1F2937", background: "#F9FAFB" }}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="dob" className="block text-sm font-medium" style={{ fontFamily: "var(--font-body)", color: "#374151" }}>
                Date of Birth
              </label>
              <input
                id="dob"
                name="dob"
                type="text"
                placeholder="1 January 2007"
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                style={{ fontFamily: "var(--font-body)", color: "#1F2937", background: "#F9FAFB" }}
              />
            </div>

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
                placeholder="Create a password"
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                style={{ fontFamily: "var(--font-body)", color: "#1F2937", background: "#F9FAFB" }}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium" style={{ fontFamily: "var(--font-body)", color: "#374151" }}>
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                style={{ fontFamily: "var(--font-body)", color: "#1F2937", background: "#F9FAFB" }}
              />
            </div>

            <p className="text-xs" style={{ fontFamily: "var(--font-body)", color: "#94A3B8" }}>
              By creating an account, you agree to our Terms of Service and Privacy Policy
            </p>

            <button
              type="submit"
              className="w-full rounded-xl py-3.5 text-base font-semibold text-white transition-all hover:opacity-90"
              style={{ fontFamily: "var(--font-body)", background: "linear-gradient(135deg, #1CD8D2 0%, #93EDC7 100%)" }}
            >
              Sign up
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ fontFamily: "var(--font-body)", color: "#64748B" }}>
            Already have an account?{" "}
            <Link href="/login" className="font-medium transition-colors hover:text-cyan-600" style={{ color: "#06B6D4" }}>
              Sign in
            </Link>
          </p>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
