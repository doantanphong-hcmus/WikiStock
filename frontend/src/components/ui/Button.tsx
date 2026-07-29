import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "outline" | "ghost";
type ButtonSize = "default" | "large";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-company-blue text-surface hover:bg-company-blue-hover disabled:bg-company-blue/50",
  outline:
    "border border-border bg-surface text-text-primary hover:border-company-blue hover:text-company-blue disabled:text-muted",
  ghost:
    "text-text-secondary hover:bg-soft-surface hover:text-text-primary disabled:text-muted",
};

const sizeStyles: Record<ButtonSize, string> = {
  default: "h-10 px-4 text-sm",
  large: "h-12 px-6 text-base",
};

export function Button({
  variant = "primary",
  size = "default",
  className,
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-authentication-blue focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
