"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppFooter } from "@/components/layout/AppFooter";

const fontSans = "'Roboto', 'Open Sans', 'Noto Sans', 'Segoe UI', sans-serif";
const fontBody = "'Poppins', 'Open Sans', 'Roboto', 'Segoe UI', sans-serif";

// Mock data for posts
const posts = [
  {
    id: 1,
    author: "Nguyễn Văn A",
    avatar: "#10B981",
    time: "2 giờ trước",
    title: "Chia sẻ về xu hướng đầu tư cổ phiếu ngân hàng 2025",
    preview: "Theo dõi những cổ phiếu ngân hàng đang có xu hướng tăng trưởng tốt trong năm 2025...",
    comments: 24,
  },
  {
    id: 2,
    author: "Trần Thị B",
    avatar: "#3B82F6",
    time: "5 giờ trước",
    title: "Phân tích kỹ thuật cổ phiếu FPT",
    preview: "FPT đang trong giai đoạn tích lũy với khối lượng giao dịch tăng dần. Các chỉ báo RSI cho thấy...",
    comments: 18,
  },
  {
    id: 3,
    author: "Lê Văn C",
    avatar: "#8B5CF6",
    time: "1 ngày trước",
    title: "Hướng dẫn đọc báo cáo tài chính cho người mới",
    preview: "Báo cáo tài chính là công cụ quan trọng để đánh giá sức khỏe doanh nghiệp. Bài viết này sẽ hướng dẫn...",
    comments: 56,
  },
  {
    id: 4,
    author: "Phạm Thị D",
    avatar: "#EC4899",
    time: "2 ngày trước",
    title: "So sánh lợi nhuận các công ty chứng khoán",
    preview: "Top 10 công ty chứng khoán có lợi nhuận cao nhất quý 4/2025. Phân tích chi tiết từng công ty...",
    comments: 32,
  },
];

// Mock categories
const categories = [
  "Thảo luận chung",
  "Phân tích kỹ thuật",
  "Phân tích cơ bản",
  "Cổ phiếu ngân hàng",
  "Cổ phiếu công nghệ",
];

// Mock stats
const stats = [
  { label: "Tổng bài viết", value: "1,234" },
  { label: "Tổng thành viên", value: "5,678" },
  { label: "Bài viết hôm nay", value: "89" },
];

// Mock popular tags
const popularTags = [
  { name: "FPT", count: 234 },
  { name: "VPB", count: 189 },
  { name: "TCB", count: 156 },
  { name: "SSI", count: 145 },
];

export default function ForumPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const totalPages = 4;

  return (
    <div className="min-h-screen" style={{ background: "#F8FAFC" }}>
      <AppHeader />

      <main className="mx-auto px-4 py-6" style={{ maxWidth: 1440 }}>
        <div className="flex gap-4">
          {/* Left Sidebar - Profile & Categories */}
          <div className="hidden w-72 flex-shrink-0 lg:block">
            {/* Profile Card */}
            <div
              className="mb-4 rounded-xl bg-white p-6"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-semibold text-white"
                  style={{ background: "#3B82F6" }}
                >
                  N
                </div>
                <div>
                  <p
                    className="font-medium"
                    style={{ fontFamily: fontBody, color: "#1F2937" }}
                  >
                    Nguyễn Văn User
                  </p>
                  <p
                    className="text-sm"
                    style={{ fontFamily: fontBody, color: "#6B7280" }}
                  >
                    Thành viên
                  </p>
                </div>
              </div>
              <div
                className="mt-4 border-t pt-4"
                style={{ borderColor: "#E5E7EB" }}
              >
                <div className="flex justify-between text-sm">
                  <span style={{ fontFamily: fontBody, color: "#6B7280" }}>
                    Bài viết
                  </span>
                  <span style={{ fontFamily: fontBody, color: "#1F2937" }}>
                    42
                  </span>
                </div>
                <div className="mt-2 flex justify-between text-sm">
                  <span style={{ fontFamily: fontBody, color: "#6B7280" }}>
                    Bình luận
                  </span>
                  <span style={{ fontFamily: fontBody, color: "#1F2937" }}>
                    156
                  </span>
                </div>
              </div>
            </div>

            {/* Categories Card */}
            <div
              className="rounded-xl bg-white p-6"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}
            >
              <h3
                className="mb-4 text-base font-semibold"
                style={{ fontFamily: fontBody, color: "#1F2937" }}
              >
                Danh mục
              </h3>
              <div className="space-y-2">
                {categories.map((category, index) => (
                  <button
                    key={category}
                    onClick={() =>
                      setSelectedCategory(
                        selectedCategory === category ? null : category
                      )
                    }
                    className={`w-full rounded-lg px-4 py-2.5 text-left text-sm transition-all ${selectedCategory === category ? "bg-cyan-50" : "bg-gray-100"}`}
                    style={{
                      fontFamily: fontBody,
                      color: selectedCategory === category ? "#06B6D4" : "#4B5563",
                    }}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Search Bar */}
            <div
              className="mb-4 flex items-center gap-4 rounded-xl bg-white p-4"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}
            >
              <div className="flex flex-1 items-center gap-3">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#9CA3AF"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  placeholder="Tìm kiếm bài viết..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent outline-none"
                  style={{
                    fontFamily: fontBody,
                    color: "#1F2937",
                  }}
                />
              </div>
              <div
                className="h-6 w-px"
                style={{ background: "#E5E7EB" }}
              />
              <button
                className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  fontFamily: fontBody,
                  background: "#2563EB",
                  color: "#FFFFFF",
                }}
              >
                Tạo bài viết
              </button>
            </div>

            {/* Posts List */}
            <div
              className="rounded-xl bg-white p-4"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}
            >
              <div className="divide-y" style={{ borderColor: "#E5E7EB" }}>
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex gap-4">
                      <div
                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                        style={{ background: post.avatar }}
                      >
                        {post.author.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="font-medium"
                            style={{
                              fontFamily: fontBody,
                              color: "#1F2937",
                            }}
                          >
                            {post.author}
                          </span>
                          <span
                            className="text-sm"
                            style={{ fontFamily: fontBody, color: "#9CA3AF" }}
                          >
                            {post.time}
                          </span>
                        </div>
                        <h4
                          className="mt-1 text-base font-medium"
                          style={{ fontFamily: fontBody, color: "#111827" }}
                        >
                          {post.title}
                        </h4>
                        <p
                          className="mt-1 text-sm"
                          style={{
                            fontFamily: fontBody,
                            color: "#6B7280",
                            lineHeight: 1.5,
                          }}
                        >
                          {post.preview}
                        </p>
                        <div className="mt-2 flex items-center gap-4">
                          <button
                            className="flex items-center gap-1 text-sm transition-colors hover:text-cyan-600"
                            style={{ fontFamily: fontBody, color: "#6B7280" }}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                            {post.comments} bình luận
                          </button>
                          <button
                            className="text-sm transition-colors hover:text-cyan-600"
                            style={{ fontFamily: fontBody, color: "#6B7280" }}
                          >
                            Lưu bài
                          </button>
                        </div>
                      </div>
                      <button
                        className="flex-shrink-0 text-gray-400 transition-colors hover:text-gray-600"
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="12" cy="12" r="1" />
                          <circle cx="19" cy="12" r="1" />
                          <circle cx="5" cy="12" r="1" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div
                className="mt-4 flex items-center justify-center gap-2 border-t pt-4"
                style={{ borderColor: "#E5E7EB" }}
              >
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
                  style={{ fontFamily: fontBody, color: "#6B7280" }}
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                {[1, 2, 3, 4].map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors ${currentPage === page ? "text-white" : "hover:bg-gray-100"}`}
                    style={{
                      fontFamily: fontBody,
                      background: currentPage === page ? "#06B6D4" : "transparent",
                      color: currentPage === page ? "#FFFFFF" : "#6B7280",
                    }}
                  >
                    {page}
                  </button>
                ))}
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
                  style={{ fontFamily: fontBody, color: "#6B7280" }}
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Stats & Popular */}
          <div className="hidden w-72 flex-shrink-0 lg:block">
            {/* Stats Card */}
            <div
              className="mb-4 rounded-xl bg-white p-6"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}
            >
              <h3
                className="mb-4 text-base font-semibold"
                style={{ fontFamily: fontBody, color: "#1F2937" }}
              >
                Thống kê diễn đàn
              </h3>
              <div
                className="rounded-lg bg-gray-50 p-4"
                style={{ background: "#F9FAFB" }}
              >
                {stats.map((stat, index) => (
                  <div
                    key={stat.label}
                    className={`flex justify-between py-2 ${index < stats.length - 1 ? "border-b" : ""}`}
                    style={{ borderColor: "#E5E7EB" }}
                  >
                    <span
                      style={{ fontFamily: fontBody, color: "#6B7280" }}
                    >
                      {stat.label}
                    </span>
                    <span
                      className="font-medium"
                      style={{ fontFamily: fontBody, color: "#1F2937" }}
                    >
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Popular Tags Card */}
            <div
              className="mb-4 rounded-xl bg-white p-6"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}
            >
              <h3
                className="mb-4 text-base font-semibold"
                style={{ fontFamily: fontBody, color: "#1F2937" }}
              >
                Chủ đề nổi bật
              </h3>
              <div className="space-y-3">
                {popularTags.map((tag) => (
                  <div
                    key={tag.name}
                    className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2"
                    style={{ background: "#F9FAFB" }}
                  >
                    <div className="flex items-center gap-2">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#6B7280"
                        strokeWidth="2"
                      >
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                        <line x1="7" y1="7" x2="7.01" y2="7" />
                      </svg>
                      <span
                        style={{ fontFamily: fontBody, color: "#1F2937" }}
                      >
                        {tag.name}
                      </span>
                    </div>
                    <span
                      className="text-sm"
                      style={{ fontFamily: fontBody, color: "#9CA3AF" }}
                    >
                      {tag.count}
                    </span>
                  </div>
                ))}
              </div>
              <button
                className="mt-4 w-full rounded-lg py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                style={{ fontFamily: fontBody, background: "#2563EB" }}
              >
                Xem tất cả
              </button>
            </div>

            {/* Quick Links Card */}
            <div
              className="rounded-xl bg-white p-6"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}
            >
              <h3
                className="mb-4 text-base font-semibold"
                style={{ fontFamily: fontBody, color: "#1F2937" }}
              >
                Liên kết nhanh
              </h3>
              <div className="space-y-3">
                {[
                  { label: "Hướng dẫn sử dụng", icon: "book" },
                  { label: "Nội quy diễn đàn", icon: "shield" },
                  { label: "Báo cáo vi phạm", icon: "flag" },
                ].map((link) => (
                  <div
                    key={link.label}
                    className="flex items-center gap-3 border-b pb-3 last:border-0 last:pb-0"
                    style={{ borderColor: "#E5E7EB" }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#6B7280"
                      strokeWidth="2"
                    >
                      {link.icon === "book" && (
                        <>
                          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        </>
                      )}
                      {link.icon === "shield" && (
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      )}
                      {link.icon === "flag" && (
                        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z M4 22V15" stroke="currentColor" strokeWidth="2" fill="none" />
                      )}
                    </svg>
                    <span
                      style={{ fontFamily: fontBody, color: "#4B5563" }}
                    >
                      {link.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
