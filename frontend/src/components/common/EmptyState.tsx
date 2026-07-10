export function EmptyState({
  title,
  message,
}: {
  title: string;
  message?: string;
}) {
  return (
    <div className="rounded-md border border-dashed border-zinc-300 bg-white p-6 text-center">
      <h2 className="text-base font-semibold text-zinc-950">{title}</h2>
      {message ? <p className="mt-2 text-sm text-zinc-600">{message}</p> : null}
    </div>
  );
}
