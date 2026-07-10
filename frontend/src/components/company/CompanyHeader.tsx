import Link from "next/link";
import type { Company } from "@/lib/types";

export function CompanyHeader({ company }: { company: Company }) {
  const baseHref = `/companies/${company.ticker}`;

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-emerald-700 px-3 py-1 text-sm font-semibold text-white">
              {company.ticker}
            </span>
            <span className="rounded-md border border-zinc-300 px-3 py-1 text-sm text-zinc-600">
              {company.exchange}
            </span>
            <span className="rounded-md border border-zinc-300 px-3 py-1 text-sm text-zinc-600">
              {company.industry}
            </span>
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-normal text-zinc-950">
              {company.name}
            </h1>
            <p className="mt-2 max-w-3xl text-base leading-7 text-zinc-600">
              {company.summary}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={baseHref}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-emerald-700 hover:text-emerald-800"
          >
            Profile
          </Link>
          <Link
            href={`${baseHref}/financials`}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-emerald-700 hover:text-emerald-800"
          >
            Financials
          </Link>
          <Link
            href={`${baseHref}/ai`}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-emerald-700 hover:text-emerald-800"
          >
            AI
          </Link>
        </div>
      </div>
    </section>
  );
}
