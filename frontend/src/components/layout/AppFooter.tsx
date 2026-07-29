import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

interface AppFooterProps {
  className?: string;
  children?: ReactNode;
}

export function AppFooter({ className, children }: AppFooterProps) {
  return (
    <footer
      className={cn(
        "border-t border-border bg-surface px-6 py-4",
        className
      )}
    >
      {children ?? (
        <p className="text-center text-xs text-muted">
          &copy; {new Date().getFullYear()} WikiStock. Company intelligence for
          Vietnamese equities.
        </p>
      )}
    </footer>
  );
}
