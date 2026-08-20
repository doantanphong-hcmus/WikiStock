import Link from "next/link";
import type { Company } from "@/lib/types";
import { CompanyLogo } from "./CompanyLogo";

export function CompanyHeader({ company }: { company: Company }) {
  const baseHref = `/companies/${company.ticker}`;

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <CompanyLogo
            ticker={company.ticker}
            companyName={company.companyName}
          />
          <h1 className="text-3xl font-semibold tracking-normal text-zinc-950">
            {company.companyName}
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={baseHref}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-emerald-700 hover:text-emerald-800"
          >
            Tổng quan
          </Link>
          <Link
            href={`${baseHref}/financials`}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-emerald-700 hover:text-emerald-800"
          >
            Tài chính
          </Link>
          <Link
            href={`/ai?company=${encodeURIComponent(company.ticker)}`}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-emerald-700 hover:text-emerald-800"
          >
            Hỏi AI
          </Link>
        </div>
      </div>
    </section>
  );
}
