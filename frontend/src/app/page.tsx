import Image from "next/image";
import Link from "next/link";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppFooter } from "@/components/layout/AppFooter";

const fontSans = "'Roboto', 'Open Sans', 'Noto Sans', 'Segoe UI', sans-serif";
const fontBody = "'Poppins', 'Open Sans', 'Roboto', 'Segoe UI', sans-serif";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col" style={{ background: "#D9D9D9" }}>
      <AppHeader />

      {/* Hero Section */}
      <section
        className="relative w-full"
        style={{ height: 320 }}
      >
        {/* Background image - right side */}
        <div
          className="absolute inset-0"
          style={{
            left: "45%",
            width: "55%",
          }}
        >
          <Image
            src="/images/landing/hero-office.jpg"
            alt="Office"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Dark overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to right, #0F172A 0%, #0F172A 45%, transparent 100%)",
          }}
        />

        {/* Hero content */}
        <div className="absolute inset-0 flex items-center">
          <div
            className="mx-auto flex w-full items-center justify-between px-[110px]"
            style={{ maxWidth: 1440 }}
          >
            {/* Left content */}
            <div className="flex flex-col gap-3">
              <h1
                className="text-[64px] font-bold leading-[72px]"
                style={{
                  fontFamily: fontSans,
                  color: "#FFFFFF",
                }}
              >
                WikiStock
              </h1>
              <p
                className="text-xl font-normal leading-7"
                style={{
                  fontFamily: fontBody,
                  color: "#94A3B8",
                  maxWidth: 520,
                }}
              >
                Nền tảng tra cứu sức khỏe và độ tin cậy doanh nghiệp niêm yết.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Search Bar Section */}
      <section className="relative" style={{ marginTop: -60 }}>
        <div className="mx-auto px-[110px]" style={{ maxWidth: 1440 }}>
          <div className="relative flex items-center gap-4">
            {/* Robot icon */}
            <div
              className="flex-shrink-0"
              style={{ width: 100, height: 100, zIndex: 20 }}
            >
              <Image
                src="/images/landing/robot-background.svg"
                alt=""
                width={100}
                height={100}
                className="absolute"
              />
              <Image
                src="/images/landing/robot.jpg"
                alt="AI Assistant"
                width={65}
                height={65}
                className="relative"
                style={{ top: 17, left: 17 }}
              />
            </div>

            {/* Search bar */}
            <form
              action="/search"
              className="flex flex-1 items-center rounded-full bg-white px-4 py-3"
              style={{
                boxShadow: "0 4px 24px rgba(0, 0, 0, 0.12)",
                height: 64,
              }}
            >
              <button type="button" className="flex items-center pr-4">
                <Image
                  src="/images/landing/filter.svg"
                  alt="Filter"
                  width={24}
                  height={24}
                />
              </button>
              <input
                name="q"
                placeholder="Tìm kiếm..."
                className="flex-1 bg-transparent text-lg outline-none"
                style={{
                  fontFamily: fontBody,
                  color: "#94A3B8",
                }}
              />
              <button
                type="submit"
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 48,
                  height: 48,
                  background: "linear-gradient(135deg, #1CD8D2 0%, #93EDC7 100%)",
                }}
              >
                <Image
                  src="/images/landing/search.svg"
                  alt="Search"
                  width={24}
                  height={24}
                />
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Trusted Resources Section */}
      <section className="w-full py-16" style={{ background: "#D9D9D9", marginTop: 40 }}>
        <div className="mx-auto px-[110px]" style={{ maxWidth: 1440 }}>
          <h2
            className="text-center text-xl font-bold"
            style={{
              fontFamily: fontSans,
              letterSpacing: "0.5px",
              color: "#000000",
            }}
          >
            NGUỒN TIN CẬY NHẬT
          </h2>

          <div
            className="mt-10 grid grid-cols-4 items-center justify-center gap-8"
            style={{ paddingLeft: 40, paddingRight: 40 }}
          >
            <div className="flex items-center justify-center">
              <Image
                src="/images/landing/resource-1.png"
                alt="SSC"
                width={180}
                height={180}
                className="max-h-[120px] w-auto object-contain"
              />
            </div>
            <div className="flex items-center justify-center">
              <Image
                src="/images/landing/resource-2.png"
                alt="NC"
                width={180}
                height={180}
                className="max-h-[120px] w-auto object-contain"
              />
            </div>
            <div className="flex items-center justify-center">
              <Image
                src="/images/landing/resource-3.png"
                alt="Vietstock"
                width={320}
                height={120}
                className="max-h-[120px] w-auto object-contain"
              />
            </div>
            <div className="flex items-center justify-center">
              <Image
                src="/images/landing/resource-4.png"
                alt="Resource 4"
                width={180}
                height={180}
                className="max-h-[120px] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="mx-auto w-full px-[110px] py-8" style={{ maxWidth: 1440 }}>
        <div className="grid grid-cols-3 gap-6">
          <Link
            href="/ai"
            className="flex flex-col items-start rounded-2xl p-6 transition-all hover:scale-[1.02]"
            style={{
              background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
              minHeight: 180,
            }}
          >
            <div
              className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ background: "linear-gradient(135deg, #1CD8D2 0%, #93EDC7 100%)" }}
            >
              <Image
                src="/images/landing/chat-icon.svg"
                alt="Chat"
                width={24}
                height={24}
              />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-white" style={{ fontFamily: fontSans }}>
              Trò chuyện với AI
            </h3>
            <p className="text-sm text-slate-400" style={{ fontFamily: fontBody }}>
              Đặt câu hỏi về doanh nghiệp và thông tin chứng khoán
            </p>
          </Link>

          <Link
            href="/companies"
            className="flex flex-col items-start rounded-2xl p-6 transition-all hover:scale-[1.02]"
            style={{
              background: "linear-gradient(135deg, #1E293B 0%, #334155 100%)",
              minHeight: 180,
            }}
          >
            <div
              className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ background: "linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)" }}
            >
              <Image
                src="/images/landing/company-icon.svg"
                alt="Companies"
                width={24}
                height={24}
              />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-white" style={{ fontFamily: fontSans }}>
              Danh sách doanh nghiệp
            </h3>
            <p className="text-sm text-slate-400" style={{ fontFamily: fontBody }}>
              Khám phá các doanh nghiệp niêm yết và chi tiết của chúng
            </p>
          </Link>

          <Link
            href="/market"
            className="flex flex-col items-start rounded-2xl p-6 transition-all hover:scale-[1.02]"
            style={{
              background: "linear-gradient(135deg, #334155 0%, #475569 100%)",
              minHeight: 180,
            }}
          >
            <div
              className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ background: "linear-gradient(135deg, #10B981 0%, #34D399 100%)" }}
            >
              <Image
                src="/images/landing/market-icon.svg"
                alt="Market"
                width={24}
                height={24}
              />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-white" style={{ fontFamily: fontSans }}>
              Tổng quan thị trường
            </h3>
            <p className="text-sm text-slate-400" style={{ fontFamily: fontBody }}>
              Xem dữ liệu và xu hướng thị trường theo thời gian thực
            </p>
          </Link>
        </div>
      </section>

      <AppFooter />
    </div>
  );
}
