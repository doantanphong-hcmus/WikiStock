export function LoadingState({ label = "Đang tải dữ liệu..." }: { label?: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl border border-[#334155] bg-[#1e293b] p-8"
      style={{ minHeight: 200 }}
    >
      {/* Spinner */}
      <div className="relative h-12 w-12">
        <div
          className="absolute inset-0 animate-spin rounded-full border-4 border-[#334155] border-t-[#1cd8d2]"
        />
      </div>
      <p
        className="mt-4 text-sm"
        style={{ color: "#94a3b8", fontFamily: "var(--font-body)" }}
      >
        {label}
      </p>
    </div>
  );
}

export function Skeleton({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-[#334155] ${className}`}
    />
  );
}
