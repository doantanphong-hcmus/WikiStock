"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppFooter } from "@/components/layout/AppFooter";

const fontSans = "'Roboto', 'Open Sans', 'Noto Sans', 'Segoe UI', sans-serif";
const fontBody = "'Poppins', 'Open Sans', 'Roboto', 'Segoe UI', sans-serif";

interface FormErrors {
  name?: string;
  dob?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!name.trim()) {
      newErrors.name = "Vui lòng nhập họ và tên.";
    } else if (name.trim().length < 2) {
      newErrors.name = "Họ và tên phải có ít nhất 2 ký tự.";
    }

    // DOB validation
    if (!dob) {
      newErrors.dob = "Vui lòng chọn ngày sinh.";
    } else {
      const birthDate = new Date(dob);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 13) {
        newErrors.dob = "Bạn phải từ 13 tuổi trở lên để đăng ký.";
      } else if (age > 120) {
        newErrors.dob = "Ngày sinh không hợp lệ.";
      }
    }

    // Email validation
    if (!email) {
      newErrors.email = "Vui lòng nhập email.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Email không hợp lệ.";
    }

    // Password validation
    if (!password) {
      newErrors.password = "Vui lòng nhập mật khẩu.";
    } else if (password.length < 8) {
      newErrors.password = "Mật khẩu phải có ít nhất 8 ký tự.";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password = "Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số.";
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu.";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock successful registration
    setSuccessMessage("Đăng ký thành công! Đang chuyển hướng...");

    // Store mock session
    if (typeof window !== "undefined") {
      sessionStorage.setItem("wikistock_user", JSON.stringify({ email, name, loggedIn: true }));
    }

    // Redirect after short delay
    setTimeout(() => {
      router.push("/");
    }, 1500);

    setIsLoading(false);
  };

  // Calculate max date (today - 13 years) and min date (today - 120 years)
  const getMaxDate = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 13);
    return date.toISOString().split("T")[0];
  };

  const getMinDate = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 120);
    return date.toISOString().split("T")[0];
  };

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ background: "#0F172A" }}
    >
      <header className="w-full px-6 py-6">
        <div className="mx-auto" style={{ maxWidth: 1440 }}>
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span
                className="text-3xl font-bold"
                style={{ fontFamily: fontSans, color: "#FFFFFF", letterSpacing: "0.5px" }}
              >
                WikiStock
              </span>
            </Link>
            <Link href="/" className="text-sm transition-colors hover:text-cyan-400" style={{ fontFamily: fontBody, color: "#94A3B8" }}>
              ← Quay về trang chủ
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
            <h1 className="mb-2 text-3xl font-bold" style={{ fontFamily: fontSans, color: "#0F172A", letterSpacing: "0.5px" }}>
              Đăng ký
            </h1>
            <p style={{ fontFamily: fontBody, color: "#64748B" }}>
              Đăng ký để trải nghiệm các tính năng của WikiStock
            </p>
          </div>

          {successMessage && (
            <div
              className="mb-6 rounded-lg p-4 text-center"
              style={{ background: "#dcfce7", border: "1px solid #86efac", color: "#166534", fontFamily: fontBody }}
            >
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium" style={{ fontFamily: fontBody, color: "#374151" }}>
                Họ và tên <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors({ ...errors, name: undefined });
                }}
                placeholder="Nguyễn Văn A"
                required
                className={`w-full rounded-xl border px-4 py-3 text-base transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/20 ${errors.name ? "border-red-500" : "border-gray-200"}`}
                style={{ fontFamily: fontBody, color: "#1F2937", background: "#F9FAFB" }}
              />
              {errors.name && (
                <p className="mt-1 text-xs" style={{ color: "#dc2626", fontFamily: fontBody }}>{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="dob" className="block text-sm font-medium" style={{ fontFamily: fontBody, color: "#374151" }}>
                Ngày sinh <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <input
                id="dob"
                name="dob"
                type="date"
                value={dob}
                onChange={(e) => {
                  setDob(e.target.value);
                  if (errors.dob) setErrors({ ...errors, dob: undefined });
                }}
                min={getMinDate()}
                max={getMaxDate()}
                required
                className={`w-full rounded-xl border px-4 py-3 text-base transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/20 ${errors.dob ? "border-red-500" : "border-gray-200"}`}
                style={{ fontFamily: fontBody, color: "#1F2937", background: "#F9FAFB" }}
              />
              {errors.dob && (
                <p className="mt-1 text-xs" style={{ color: "#dc2626", fontFamily: fontBody }}>{errors.dob}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium" style={{ fontFamily: fontBody, color: "#374151" }}>
                Email <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                placeholder="abc@gmail.com"
                required
                className={`w-full rounded-xl border px-4 py-3 text-base transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/20 ${errors.email ? "border-red-500" : "border-gray-200"}`}
                style={{ fontFamily: fontBody, color: "#1F2937", background: "#F9FAFB" }}
              />
              {errors.email && (
                <p className="mt-1 text-xs" style={{ color: "#dc2626", fontFamily: fontBody }}>{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium" style={{ fontFamily: fontBody, color: "#374151" }}>
                Mật khẩu <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: undefined });
                }}
                placeholder="Tối thiểu 8 ký tự"
                required
                minLength={8}
                className={`w-full rounded-xl border px-4 py-3 text-base transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/20 ${errors.password ? "border-red-500" : "border-gray-200"}`}
                style={{ fontFamily: fontBody, color: "#1F2937", background: "#F9FAFB" }}
              />
              {errors.password && (
                <p className="mt-1 text-xs" style={{ color: "#dc2626", fontFamily: fontBody }}>{errors.password}</p>
              )}
              <p className="mt-1 text-xs" style={{ color: "#64748B", fontFamily: fontBody }}>
                Ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium" style={{ fontFamily: fontBody, color: "#374151" }}>
                Xác nhận mật khẩu <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
                }}
                placeholder="Nhập lại mật khẩu"
                required
                className={`w-full rounded-xl border px-4 py-3 text-base transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/20 ${errors.confirmPassword ? "border-red-500" : "border-gray-200"}`}
                style={{ fontFamily: fontBody, color: "#1F2937", background: "#F9FAFB" }}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs" style={{ color: "#dc2626", fontFamily: fontBody }}>{errors.confirmPassword}</p>
              )}
            </div>

            <p className="text-xs" style={{ fontFamily: fontBody, color: "#94A3B8" }}>
              Khi tạo tài khoản, bạn đồng ý với{" "}
              <Link href="#" className="underline hover:text-cyan-600" style={{ color: "#06B6D4" }}>Điều khoản Dịch vụ</Link>{" "}
              và{" "}
              <Link href="#" className="underline hover:text-cyan-600" style={{ color: "#06B6D4" }}>Chính sách Bảo mật</Link>{" "}
              của chúng tôi
            </p>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl py-3.5 text-base font-semibold transition-all hover:opacity-90 disabled:opacity-50"
              style={{ fontFamily: fontBody, background: "#FFFFFF", color: "#0F172A" }}
            >
              {isLoading ? "Đang xử lý..." : "Đăng ký"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ fontFamily: fontBody, color: "#64748B" }}>
            Đã có tài khoản?{" "}
            <Link href="/login" className="font-medium transition-colors hover:text-cyan-600" style={{ color: "#06B6D4" }}>
              Đăng nhập
            </Link>
          </p>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
