import Link from "next/link";

const footerLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/pricing", label: "Pricing" },
  { href: "#", label: "Blog" },
  { href: "#", label: "Contact" },
];

const socialIcons = [
  { href: "#", label: "Facebook", path: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" },
  { href: "#", label: "Twitter", path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
  { href: "#", label: "Instagram", path: "M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" },
  { href: "#", label: "LinkedIn", path: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" },
];

export function AppFooter() {
  return (
    <footer className="w-full px-6 py-10" style={{ background: "#0F172A" }}>
      <div className="mx-auto" style={{ maxWidth: 1440 }}>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="rounded-lg px-4 py-2" style={{ background: "#1E293B" }}>
              <span className="text-2xl font-bold" style={{ fontFamily: "var(--font-sans)", color: "#FFFFFF", letterSpacing: "0.5px" }}>
                WikiStock
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-8">
            {footerLinks.map((link) => (
              <Link
                key={link.href + link.label}
                href={link.href}
                className="text-sm font-medium transition-colors hover:text-cyan-400"
                style={{ fontFamily: "var(--font-body)", color: "#94A3B8" }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {socialIcons.map((social) => (
              <a
                key={social.label}
                href={social.href}
                className="flex items-center justify-center transition-colors hover:text-cyan-400"
                style={{ width: 36, height: 36, color: "#94A3B8" }}
                aria-label={social.label}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d={social.path} />
                </svg>
              </a>
            ))}
          </div>
        </div>

        <div className="mb-6 h-px w-full" style={{ background: "#1E293B" }} />

        <div className="text-center">
          <p className="text-sm" style={{ fontFamily: "var(--font-body)", color: "#64748B" }}>
            © 2026 wikistock.com | All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
