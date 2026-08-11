import { AppHeader } from "@/components/layout/AppHeader";
import { AppFooter } from "@/components/layout/AppFooter";
import Link from "next/link";

const fontSans = "'Roboto', 'Open Sans', 'Noto Sans', 'Segoe UI', sans-serif";
const fontBody = "'Poppins', 'Open Sans', 'Roboto', 'Segoe UI', sans-serif";

const teamMembers = [
  {
    name: "Oxfong",
    role: "CEO & Co-Founder",
    description: "Lorem ipsum dolor sit amet consectetur adipiscing elit amet hendrerit pretium",
  },
  {
    name: "Member 2",
    role: "CTO & Co-Founder",
    description: "Lorem ipsum dolor sit amet consectetur adipiscing elit amet hendrerit pretium",
  },
  {
    name: "Member 3",
    role: "Product Manager",
    description: "Lorem ipsum dolor sit amet consectetur adipiscing elit amet hendrerit pretium",
  },
  {
    name: "Member 4",
    role: "Lead Developer",
    description: "Lorem ipsum dolor sit amet consectetur adipiscing elit amet hendrerit pretium",
  },
];

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col" style={{ background: "#0F172A" }}>
      <AppHeader />

      <section className="relative py-20">
        <div className="mx-auto px-[110px]" style={{ maxWidth: 1440 }}>
          <div className="text-center">
            <h1 className="mb-6 text-5xl font-bold" style={{ fontFamily: fontSans, color: "#FFFFFF" }}>
              Gặp gỡ các thành viên
            </h1>
            <p
              className="mx-auto max-w-2xl text-xl"
              style={{ fontFamily: fontBody, color: "#94A3B8", lineHeight: 1.6 }}
            >
              Sự giao thoa hoàn hảo giữa tư duy công nghệ và nhãn quan kinh doanh,
              cùng nhau định hình tương lai Fintech Việt Nam.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full px-[110px] pb-20" style={{ maxWidth: 1440 }}>
        <div className="grid grid-cols-4 gap-8">
          {teamMembers.map((member, index) => (
            <div
              key={index}
              className="group rounded-2xl p-6 transition-all hover:scale-[1.02]"
              style={{ background: "#1E293B", border: "1px solid #334155" }}
            >
              <div
                className="mb-6 flex h-32 w-32 items-center justify-center rounded-full"
                style={{ background: "linear-gradient(135deg, #1CD8D2 0%, #93EDC7 100%)" }}
              >
                <span className="text-4xl font-bold" style={{ fontFamily: fontSans, color: "#0F172A" }}>
                  {member.name.charAt(0)}
                </span>
              </div>
              <h3 className="mb-1 text-xl font-semibold" style={{ fontFamily: fontSans, color: "#FFFFFF" }}>
                {member.name}
              </h3>
              <p className="mb-4 text-sm font-medium" style={{ fontFamily: fontBody, color: "#1CD8D2" }}>
                {member.role}
              </p>
              <p className="text-sm leading-relaxed" style={{ fontFamily: fontBody, color: "#94A3B8" }}>
                {member.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full px-[110px] pb-20" style={{ maxWidth: 1440 }}>
        <div className="rounded-3xl p-12 text-center" style={{ background: "linear-gradient(135deg, #1CD8D2 0%, #93EDC7 100%)" }}>
          <h2 className="mb-4 text-3xl font-bold" style={{ fontFamily: fontSans, color: "#0F172A" }}>
            Sẵn sàng bắt đầu?
          </h2>
          <p className="mb-8 text-lg" style={{ fontFamily: fontBody, color: "#0F172A", opacity: 0.8 }}>
            Tham gia cùng hàng nghìn nhà đầu tư sử dụng WikiStock ngay hôm nay.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-xl px-8 py-3 font-semibold transition-all hover:opacity-90"
              style={{ fontFamily: fontBody, background: "#0F172A", color: "#FFFFFF" }}
            >
              Đăng ký miễn phí
            </Link>
            <Link
              href="/pricing"
              className="rounded-xl px-8 py-3 font-semibold transition-all hover:opacity-90"
              style={{ fontFamily: fontBody, background: "transparent", color: "#0F172A", border: "2px solid #0F172A" }}
            >
              Xem bảng giá
            </Link>
          </div>
        </div>
      </section>

      <AppFooter />
    </div>
  );
}
