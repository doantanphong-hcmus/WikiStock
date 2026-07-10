export function LoadingState({ label = "Đang tải dữ liệu" }: { label?: string }) {
  return (
    <div className="rounded-md border border-zinc-200 bg-white p-5 text-sm text-zinc-600">
      {label}
    </div>
  );
}
