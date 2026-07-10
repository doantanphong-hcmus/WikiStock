import Link from "next/link";

const suggestions = ["FPT", "CMG"];

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 py-12">
      <section className="grid gap-8 rounded-lg border border-emerald-900/10 bg-white p-6 shadow-sm md:grid-cols-[1.2fr_0.8fr] md:p-8">
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              WikiStock MVP
            </p>
            <h1 className="max-w-2xl text-4xl font-semibold tracking-normal text-zinc-950 md:text-5xl">
              Tra cứu doanh nghiệp niêm yết với dữ liệu có trích dẫn.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-zinc-600">
              Skeleton demo cho luồng search, company profile, financials, AI
              answer và admin data status.
            </p>
          </div>

          <form action="/search" className="flex max-w-xl flex-col gap-3 sm:flex-row">
            <label className="sr-only" htmlFor="ticker">
              Mã cổ phiếu
            </label>
            <input
              id="ticker"
              name="q"
              placeholder="Nhập FPT hoặc CMG"
              className="h-12 flex-1 rounded-md border border-zinc-300 bg-white px-4 text-base outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
            />
            <button
              type="submit"
              className="h-12 rounded-md bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              Tìm kiếm
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-3">
            {suggestions.map((ticker) => (
              <Link
                key={ticker}
                href={`/companies/${ticker}`}
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 transition hover:border-emerald-700 hover:text-emerald-800"
              >
                {ticker}
              </Link>
            ))}
          </div>
        </div>

        <div className="grid content-between gap-4 rounded-md border border-zinc-200 bg-zinc-50 p-5">
          <div>
            <p className="text-sm font-medium text-zinc-500">Demo path</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-950">
              FPT profile ready
            </p>
          </div>
          <div className="grid gap-3 text-sm text-zinc-600">
            <Link href="/companies/FPT" className="font-medium text-emerald-800">
              /companies/FPT
            </Link>
            <Link href="/companies/FPT/financials" className="font-medium text-emerald-800">
              /companies/FPT/financials
            </Link>
            <Link href="/companies/FPT/ai" className="font-medium text-emerald-800">
              /companies/FPT/ai
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
