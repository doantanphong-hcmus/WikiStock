import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "outline" | "ghost" | "danger";
type ButtonSize = "small" | "default" | "large";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  isLoading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-[#1cd8d2] to-[#93edc7] text-[#0f172a] hover:opacity-90 disabled:opacity-50",
  outline:
    "border-2 border-[#1cd8d2] text-[#1cd8d2] bg-transparent hover:bg-[#1cd8d2]/10 disabled:opacity-50",
  ghost:
    "text-[#94a3b8] hover:text-white hover:bg-[#334155] disabled:opacity-50",
  danger:
    "bg-[#da1e28] text-white hover:bg-[#da1e28]/90 disabled:opacity-50",
};

const sizeStyles: Record<ButtonSize, string> = {
  small: "h-8 px-3 text-xs",
  default: "h-10 px-5 text-sm",
  large: "h-12 px-6 text-base",
};

export function Button({
  variant = "primary",
  size = "default",
  className,
  children,
  disabled,
  isLoading,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1cd8d2] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f172a]",
        "disabled:cursor-not-allowed",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {isLoading ? (
        <svg
          className="h-4 w-4 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : null}
      {children}
    </button>
  );
}
