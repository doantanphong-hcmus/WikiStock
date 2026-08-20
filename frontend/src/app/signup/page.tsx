"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppFooter } from "@/components/layout/AppFooter";
import { register } from "@/features/auth/api";
import { ApiError } from "@/lib/api";

const fontSans = "'Roboto', 'Open Sans', 'Noto Sans', 'Segoe UI', sans-serif";
const fontBody = "'Poppins', 'Open Sans', 'Roboto', 'Segoe UI', sans-serif";

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  request?: string;
}

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (name.trim().length < 2) {
      nextErrors.name = "Họ và tên phải có ít nhất 2 ký tự.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Email không hợp lệ.";
    }
    if (password.length < 8) {
      nextErrors.password = "Mật khẩu phải có ít nhất 8 ký tự.";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      nextErrors.password = "Mật khẩu cần có chữ hoa, chữ thường và chữ số.";
    }
    if (password !== confirmPassword) {
      nextErrors.confirmPassword = "Mật khẩu xác nhận không khớp.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await register({ fullName: name, email, password });
      router.replace("/login");
    } catch (requestError) {
      setErrors({
        request:
          requestError instanceof ApiError && requestError.statusCode === 409
            ? "Email này đã được sử dụng."
            : "Không thể tạo tài khoản lúc này. Vui lòng thử lại.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = (field: keyof FormErrors) => {
    if (errors[field]) {
      setErrors((current) => ({
        ...current,
        [field]: undefined,
        request: undefined,
      }));
    }
  };

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "#0F172A" }}>
      <header className="w-full px-6 py-6">
        <div className="mx-auto flex items-center justify-between" style={{ maxWidth: 1440 }}>
          <Link href="/" className="text-3xl font-bold text-white" style={{ fontFamily: fontSans }}>
            WikiStock
          </Link>
          <Link href="/" className="text-sm text-slate-400 transition-colors hover:text-cyan-400" style={{ fontFamily: fontBody }}>
            ← Quay về trang chủ
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-3xl bg-white p-10 shadow-2xl">
          <div className="mb-6 text-center">
            <h1 className="mb-2 text-3xl font-bold text-slate-900" style={{ fontFamily: fontSans }}>
              Đăng ký
            </h1>
            <p className="text-slate-500" style={{ fontFamily: fontBody }}>
              Tạo tài khoản để sử dụng các tính năng của WikiStock.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field id="name" label="Họ và tên" error={errors.name}>
              <input
                id="name"
                name="name"
                autoComplete="name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  clearError("name");
                }}
                placeholder="Nguyễn Văn A"
                required
                maxLength={150}
                className={inputClass(errors.name)}
              />
            </Field>

            <Field id="email" label="Email" error={errors.email}>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  clearError("email");
                }}
                placeholder="abc@gmail.com"
                required
                className={inputClass(errors.email)}
              />
            </Field>

            <Field
              id="password"
              label="Mật khẩu"
              error={errors.password}
              hint="Ít nhất 8 ký tự, gồm chữ hoa, chữ thường và chữ số."
            >
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  clearError("password");
                }}
                placeholder="Tối thiểu 8 ký tự"
                required
                minLength={8}
                maxLength={72}
                className={inputClass(errors.password)}
              />
            </Field>

            <Field id="confirmPassword" label="Xác nhận mật khẩu" error={errors.confirmPassword}>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  clearError("confirmPassword");
                }}
                placeholder="Nhập lại mật khẩu"
                required
                className={inputClass(errors.confirmPassword)}
              />
            </Field>

            {errors.request && (
              <div role="alert" className="rounded-lg bg-red-100 p-3 text-sm text-red-700">
                {errors.request}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-slate-900 py-3.5 font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ fontFamily: fontBody }}
            >
              {isLoading ? "Đang tạo tài khoản..." : "Đăng ký"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500" style={{ fontFamily: fontBody }}>
            Đã có tài khoản?{" "}
            <Link href="/login" className="font-medium text-cyan-600 hover:text-cyan-700">
              Đăng nhập
            </Link>
          </p>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2" style={{ fontFamily: fontBody }}>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label} <span className="text-red-600">*</span>
      </label>
      {children}
      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

function inputClass(error?: string) {
  return `w-full rounded-xl border bg-gray-50 px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 ${error ? "border-red-500" : "border-gray-200 focus:border-cyan-500"}`;
}
