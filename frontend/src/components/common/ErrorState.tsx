import { Button } from "@/components/ui/Button";

const fontSans = "'Roboto', 'Open Sans', 'Noto Sans', 'Segoe UI', sans-serif";
const fontBody = "'Poppins', 'Open Sans', 'Roboto', 'Segoe UI', sans-serif";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Đã xảy ra lỗi",
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl border border-[#da1e28]/30 bg-[#fee2e2] p-8 text-center"
    >
      {/* Error icon */}
      <div
        className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#da1e28]/10"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#da1e28"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <h3
        className="mb-2 text-lg font-semibold"
        style={{ color: "#0f172a", fontFamily: fontSans }}
      >
        {title}
      </h3>

      {message && (
        <p
          className="mb-4 max-w-md text-sm"
          style={{ color: "#64748b", fontFamily: fontBody }}
        >
          {message}
        </p>
      )}

      {onRetry && (
        <Button variant="danger" size="small" onClick={onRetry}>
          Thử lại
        </Button>
      )}
    </div>
  );
}
