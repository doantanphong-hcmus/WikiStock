import Link from "next/link";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/pricing", label: "Pricing" },
  { href: "/ai", label: "Chatbot with AI" },
];

export function AppHeader() {
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
              <span className="text-2xl font-bold" style={{ fontFamily: "var(--font-sans)", color: "#FFFFFF", letterSpacing: "0.5px" }}>
                WikiStock
              </span>
            </div>
          </Link>

          <span className="hidden text-sm xl:block" style={{ fontFamily: "var(--font-body)", color: "#94A3B8", marginLeft: 16 }}>
            Nền tảng tra cứu sức khỏe doanh nghiệp niêm yết
          </span>
        </div>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium transition-colors hover:text-cyan-400"
              style={{ fontFamily: "var(--font-body)", color: "#CBD5E1" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-xl border-2 border-cyan-500 px-5 py-2.5 text-sm font-medium transition-all hover:bg-cyan-500/10"
            style={{ fontFamily: "var(--font-body)", color: "#06B6D4" }}
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-xl px-5 py-2.5 text-sm font-medium transition-all hover:opacity-90"
            style={{ fontFamily: "var(--font-body)", background: "linear-gradient(135deg, #1CD8D2 0%, #93EDC7 100%)", color: "#0F172A" }}
          >
            Join now
          </Link>
        </div>
      </div>
    </header>
  );
}
