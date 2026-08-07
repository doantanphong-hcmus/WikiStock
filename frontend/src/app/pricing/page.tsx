import { AppHeader } from "@/components/layout/AppHeader";
import { AppFooter } from "@/components/layout/AppFooter";

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Basic access for individual investors",
    features: [
      "Access to company overview",
      "Basic financial data",
      "5 AI queries per day",
      "Email support",
    ],
    cta: "Get started",
    popular: false,
  },
  {
    name: "Basic",
    price: "$99",
    period: "/month",
    description: "For serious investors who need more",
    features: [
      "Everything in Free",
      "Advanced financial metrics",
      "50 AI queries per day",
      "Export data to Excel",
      "Priority email support",
    ],
    cta: "Extend",
    popular: true,
  },
  {
    name: "Standard",
    price: "$199",
    period: "/month",
    description: "For professional traders and analysts",
    features: [
      "Everything in Basic",
      "Real-time market data",
      "Unlimited AI queries",
      "API access",
      "Custom alerts",
      "Dedicated support",
    ],
    cta: "Extend",
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col" style={{ background: "#0F172A" }}>
      <AppHeader />

      <section className="relative py-20">
        <div className="mx-auto px-[110px]" style={{ maxWidth: 1440 }}>
          <div className="text-center">
            <h1 className="mb-6 text-5xl font-bold" style={{ fontFamily: "var(--font-sans)", color: "#FFFFFF" }}>
              Pricing
            </h1>
            <p className="mx-auto max-w-2xl text-xl" style={{ fontFamily: "var(--font-body)", color: "#94A3B8", lineHeight: 1.6 }}>
              Các gói dịch vụ. Mang đến những trải nghiệm khác biệt,
              tiện ích, mở khóa các chức năng đặc biệt.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full px-[110px] pb-20" style={{ maxWidth: 1440 }}>
        <div className="grid grid-cols-3 gap-8">
          {pricingPlans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-3xl p-8 transition-all hover:scale-[1.02] ${plan.popular ? "scale-105" : ""}`}
              style={{
                background: plan.popular ? "#1E293B" : "#0F172A",
                border: plan.popular ? "2px solid #1CD8D2" : "1px solid #334155",
              }}
            >
              {plan.popular && (
                <div
                  className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-sm font-semibold"
                  style={{ background: "linear-gradient(135deg, #1CD8D2 0%, #93EDC7 100%)", color: "#0F172A", fontFamily: "var(--font-body)" }}
                >
                  Most Popular
                </div>
              )}

              <h3 className="mb-2 text-2xl font-bold" style={{ fontFamily: "var(--font-sans)", color: "#FFFFFF" }}>
                {plan.name}
              </h3>

              <div className="mb-4 flex items-baseline gap-1">
                <span
                  className="text-5xl font-bold"
                  style={{ fontFamily: "var(--font-sans)", color: plan.popular ? "#1CD8D2" : "#FFFFFF" }}
                >
                  {plan.price}
                </span>
                <span className="text-base" style={{ fontFamily: "var(--font-body)", color: "#64748B" }}>
                  {plan.period}
                </span>
              </div>

              <p className="mb-6 text-sm" style={{ fontFamily: "var(--font-body)", color: "#94A3B8" }}>
                {plan.description}
              </p>

              <div className="mb-6 h-px w-full" style={{ background: "#334155" }} />

              <ul className="mb-8 space-y-3">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center gap-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={plan.popular ? "#1CD8D2" : "#94A3B8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="text-sm" style={{ fontFamily: "var(--font-body)", color: "#CBD5E1" }}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                className="w-full rounded-xl py-3.5 text-base font-semibold transition-all hover:opacity-90"
                style={{
                  fontFamily: "var(--font-body)",
                  background: plan.popular ? "linear-gradient(135deg, #1CD8D2 0%, #93EDC7 100%)" : "#334155",
                  color: plan.popular ? "#0F172A" : "#FFFFFF",
                }}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      <AppFooter />
    </div>
  );
}
