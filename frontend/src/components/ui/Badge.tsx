import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "gradient";
type BadgeSize = "small" | "default";

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-[#334155] text-[#f8fafc]",
  success: "bg-[#dcfce7] text-[#198038]",
  warning: "bg-[#fef9c3] text-[#a16207]",
  danger: "bg-[#fee2e2] text-[#da1e28]",
  info: "bg-[#1cd8d2]/10 text-[#1cd8d2]",
  gradient: "bg-gradient-to-r from-[#1cd8d2] to-[#93edc7] text-[#0f172a]",
};

const sizeStyles: Record<BadgeSize, string> = {
  small: "px-2 py-0.5 text-xs",
  default: "px-3 py-1 text-sm",
};

export function Badge({
  variant = "default",
  size = "default",
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  );
}
