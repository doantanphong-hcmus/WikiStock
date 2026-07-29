import { cn } from "@/lib/cn";
import type { ReactNode } from "react";
import { AppFooter } from "./AppFooter";
import { AppHeader } from "./AppHeader";

interface DesktopPageShellProps {
  children: ReactNode;
  className?: string;
}

export function DesktopPageShell({ children, className }: DesktopPageShellProps) {
  return (
    <div className="min-h-screen min-w-[1440px]">
      <AppHeader />
      <div className={cn("mx-auto w-full max-w-6xl px-6", className)}>
        {children}
      </div>
      <AppFooter />
    </div>
  );
}
