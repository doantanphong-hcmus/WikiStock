"use client";

import { AppHeader } from "@/components/layout/AppHeader";
import { AppFooter } from "@/components/layout/AppFooter";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { Swiper } from "swiper";
import { FreeMode, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";

const fontSans = "'Roboto', 'Open Sans', 'Noto Sans', 'Segoe UI', sans-serif";
const fontBody = "'Poppins', 'Open Sans', 'Roboto', 'Segoe UI', sans-serif";

const teamMembers = [
  {
    name: "Oxphong",
    role: "CEO & Co-Founder",
    university: "Đại học Khoa học Tự nhiên, ĐHQG-HCM",
    major: "Khoa Công nghệ Thông tin",
    work: "Quản lý tổng thể dự án WikiStock, định hướng chiến lược phát triển sản phẩm, xây dựng mối quan hệ với đối tác và nhà đầu tư, giám sát tiến độ và chất lượng triển khai toàn bộ hệ thống từ backend đến frontend, đảm bảo sản phẩm đáp ứng nhu cầu thị trường chứng khoán Việt Nam.",
    image: "/images/landing/phong.jpg",
  },
  {
    name: "Nguyễn Việt Thắng",
    role: "CTO & Co-Founder",
    university: "Đại học Khoa học Tự nhiên, ĐHQG-HCM",
    major: "Khoa Công nghệ Thông tin",
    work: "Thiết kế và phát triển hệ thống AI cho WikiStock, tích hợp các mô hình ngôn ngữ lớn (LLM) để phân tích dữ liệu chứng khoán, xây dựng pipeline xử lý và làm sạch dữ liệu thị trường, tối ưu hóa hiệu suất mô hình và đảm bảo độ chính xác trong việc dự đoán xu hướng và phân tích rủi ro đầu tư.",
    image: "/images/landing/thang.jpg",
  },
  {
    name: "Phan Lê Thành Nhân",
    role: "Lead Developer",
    university: "Đại học Khoa học Tự nhiên, ĐHQG-HCM",
    major: "Khoa Công nghệ Thông tin",
    work: "Phát triển và bảo trì giao diện người dùng (frontend) cho WikiStock bằng Next.js và React, tối ưu trải nghiệm người dùng (UX) và hiệu suất ứng dụng, triển khai các tính năng tương tác như biểu đồ chứng khoán, dashboard phân tích, và hệ thống chatbot AI hỗ trợ nhà đầu tư.",
    image: "/images/landing/tnhan.jpg",
  },
  {
    name: "Võ Ngọc Bảo Trân",
    role: "Product Manager",
    university: "Đại học Khoa học Tự nhiên, ĐHQG-HCM",
    major: "Khoa Quản trị Kinh doanh",
    work: "Thiết kế giao diện người dùng (UI) cho toàn bộ ứng dụng WikiStock bao gồm trang chủ, dashboard, biểu đồ và chatbot, xây dựng và duy trì hệ thống thiết kế (design system) đồng bộ trên mọi nền tảng, nghiên cứu xu hướng thiết kế fintech để tạo ra trải nghiệm người dùng trực quan và chuyên nghiệp nhất.",
    image: null,
  },
  {
    name: "Nguyễn Như Quỳnh",
    role: "UX/UI Designer",
    university: "Đại học Kinh tế - Luật TP.HCM",
    major: "Khoa Quản lý hệ thống",
    work: "Nghiên cứu và phân tích thị trường chứng khoán Việt Nam, thu thập và tổng hợp nhu cầu người dùng thông qua khảo sát và phỏng vấn, xây dựng roadmap sản phẩm và đặc tả tính năng cho WikiStock, phối hợp với đội ngũ phát triển để đảm bảo sản phẩm đáp ứng kỳ vọng của khách hàng mục tiêu.",
    image: null,
  },
];

export default function AboutPage() {
  const swiperRef = useRef<HTMLDivElement>(null);
  const swiperInstance = useRef<Swiper | null>(null);

  useEffect(() => {
    if (swiperRef.current && !swiperInstance.current) {
      swiperInstance.current = new Swiper(swiperRef.current, {
        modules: [FreeMode, Autoplay],
        freeMode: {
          enabled: true,
          sticky: false,
        },
        autoplay: {
          delay: 0,
          disableOnInteraction: true,
          pauseOnMouseEnter: true,
        },
        speed: 3000,
        grabCursor: true,
        slidesPerView: "auto",
        spaceBetween: 32,
        centeredSlides: false,
        loop: true,
      });
    }

    return () => {
      if (swiperInstance.current) {
        swiperInstance.current.destroy(true, true);
        swiperInstance.current = null;
      }
    };
  }, []);

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ background: "#0F172A" }}
    >
      <AppHeader />

      <section className="relative py-20">
        <div className="mx-auto px-[110px]" style={{ maxWidth: 1440 }}>
          <div className="text-center">
            <h1
              className="mb-6 text-5xl font-bold"
              style={{ fontFamily: fontSans, color: "#FFFFFF" }}
            >
              Gặp gỡ các thành viên
            </h1>
            <p
              className="mx-auto max-w-2xl text-xl"
              style={{
                fontFamily: fontBody,
                color: "#94A3B8",
                lineHeight: 1.6,
              }}
            >
              Sự giao thoa hoàn hảo giữa tư duy công nghệ và nhãn quan kinh
              doanh, cùng nhau định hình tương lai Fintech Việt Nam.
            </p>
          </div>
        </div>
      </section>

      <section
        className="mx-auto w-full px-[110px] pb-20"
        style={{ maxWidth: 1440 }}
      >
        <div
          ref={swiperRef}
          className="swiper freemode-swiper"
        >
          <div className="swiper-wrapper pb-8">
            {teamMembers.map((member, index) => (
              <div
                key={index}
                className="swiper-slide flex-shrink-0"
              >
                <div
                  className="member-card group flex flex-col rounded-2xl p-6 transition-all duration-300"
                  style={{ background: "#1E293B", border: "1px solid #334155" }}
                >
                  {/* Top row: Avatar left, Name + Role right */}
                  <div className="flex items-start justify-between">
                    {/* Avatar */}
                    <div
                      className="flex h-24 w-24 items-center justify-center rounded-full overflow-hidden flex-shrink-0"
                      style={{ background: "#FFFFFF" }}
                    >
                      {member.image ? (
                        <Image
                          src={member.image}
                          alt={member.name}
                          width={96}
                          height={96}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span
                          className="text-3xl font-bold"
                          style={{ fontFamily: fontSans, color: "#0F172A" }}
                        >
                          {member.name.charAt(0)}
                        </span>
                      )}
                    </div>

                    {/* Name and Role - top right */}
                    <div className="flex flex-col items-end text-right">
                      <h3
                        className="member-name"
                        style={{ fontFamily: fontSans, color: "#FFFFFF" }}
                      >
                        {member.name}
                      </h3>
                      <p
                        className="member-role"
                        style={{ fontFamily: fontSans, color: "#FFFFFF" }}
                      >
                        {member.role}
                      </p>
                    </div>
                  </div>

                  {/* Bottom section: University, Major, Work */}
                  <div className="member-info-section mt-auto space-y-3">
                    <div className="member-info-inline">
                      <span className="member-info-label">Trường:</span>
                      <span className="member-info-value">{member.university}</span>
                    </div>

                    <div className="member-info-inline">
                      <span className="member-info-label">Khoa / Ngành:</span>
                      <span className="member-info-value">{member.major}</span>
                    </div>

                    <div className="member-info-block">
                      <span className="member-info-label">Công việc:</span>
                      <p className="member-info-value member-work-desc">{member.work}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        className="mx-auto w-full px-[110px] pb-20"
        style={{ maxWidth: 1440 }}
      >
        <div
          className="rounded-3xl p-12 text-center"
          style={{ background: "#1E293B", border: "1px solid #334155" }}
        >
          <h2
            className="mb-4 text-3xl font-bold"
            style={{ fontFamily: fontSans, color: "#FFFFFF" }}
          >
            Sẵn sàng bắt đầu?
          </h2>
          <p
            className="mb-8 text-lg"
            style={{ fontFamily: fontBody, color: "#94A3B8", opacity: 0.8 }}
          >
            Tham gia cùng hàng nghìn nhà đầu tư sử dụng WikiStock ngay hôm nay.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-xl px-8 py-3 font-semibold transition-all hover:opacity-90"
              style={{
                fontFamily: fontBody,
                background: "#FFFFFF",
                color: "#0F172A",
              }}
            >
              Đăng ký miễn phí
            </Link>
            <Link
              href="/pricing"
              className="rounded-xl px-8 py-3 font-semibold transition-all hover:opacity-90"
              style={{
                fontFamily: fontBody,
                background: "transparent",
                color: "#FFFFFF",
                border: "2px solid #FFFFFF",
              }}
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
