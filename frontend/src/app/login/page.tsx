export default function LoginPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 items-center px-6 py-10">
      <section className="w-full rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-normal text-zinc-950">
          Login
        </h1>
        <div className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-medium text-zinc-700">
            Email
            <input
              type="email"
              className="h-11 rounded-md border border-zinc-300 bg-white px-3 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-zinc-700">
            Password
            <input
              type="password"
              className="h-11 rounded-md border border-zinc-300 bg-white px-3 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
            />
          </label>
          <button
            type="button"
            className="h-11 rounded-md bg-zinc-900 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            Continue
          </button>
        </div>
        <p className="mt-4 text-sm text-zinc-500">Auth thật sẽ được bổ sung sau MVP.</p>
      </section>
    </div>
  );
}
