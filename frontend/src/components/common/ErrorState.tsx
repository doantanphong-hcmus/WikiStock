export function ErrorState({
  title = "Không tải được dữ liệu",
  message,
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 p-5">
      <h2 className="text-base font-semibold text-red-900">{title}</h2>
      {message ? <p className="mt-2 text-sm text-red-700">{message}</p> : null}
    </div>
  );
}
