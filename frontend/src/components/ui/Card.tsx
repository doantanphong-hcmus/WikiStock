import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

interface CardProps {
  className?: string;
  children: ReactNode;
  variant?: "surface" | "soft" | "dark" | "gradient";
  padding?: "none" | "small" | "default" | "large";
  hover?: boolean;
}

const variantStyles: Record<NonNullable<CardProps["variant"]>, string> = {
  surface: "bg-white border border-[#dee5ed]",
  soft: "bg-[#f8fafc] border border-[#dee5ed]",
  dark: "bg-[#1e293b] border border-[#334155]",
  gradient: "bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-[#334155]",
};

const paddingStyles: Record<NonNullable<CardProps["padding"]>, string> = {
  none: "",
  small: "p-4",
  default: "p-6",
  large: "p-8",
};

export function Card({
  className,
  children,
  variant = "surface",
  padding = "default",
  hover = false,
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl",
        variantStyles[variant],
        paddingStyles[padding],
        hover && "transition-all hover:scale-[1.02] hover:shadow-lg",
        className
      )}
    >
      {children}
    </div>
  );
}
