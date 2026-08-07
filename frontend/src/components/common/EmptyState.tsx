import { Button } from "@/components/ui/Button";

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: "search" | "document" | "inbox";
  actionLabel?: string;
  onAction?: () => void;
}

const icons = {
  search: (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#64748b"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  ),
  document: (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#64748b"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  inbox: (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#64748b"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  ),
};

export function EmptyState({
  title = "Không có dữ liệu",
  message,
  icon = "inbox",
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#334155] bg-[#1e293b]/50 p-12 text-center"
    >
      <div className="mb-4">{icons[icon]}</div>

      <h3
        className="mb-2 text-lg font-semibold"
        style={{ color: "#f8fafc", fontFamily: "var(--font-sans)" }}
      >
        {title}
      </h3>

      {message && (
        <p
          className="mb-6 max-w-md text-sm"
          style={{ color: "#94a3b8", fontFamily: "var(--font-body)" }}
        >
          {message}
        </p>
      )}

      {actionLabel && onAction && (
        <Button variant="outline" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
