import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

interface CardProps {
  className?: string;
  children: ReactNode;
  variant?: "surface" | "soft";
}

export function Card({ className, children, variant = "surface" }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface",
        variant === "soft" && "bg-soft-surface",
        className
      )}
    >
      {children}
    </div>
  );
}
