import Link from "next/link";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { CompanyLogo } from "@/components/company/CompanyLogo";
import { getCompanies } from "@/features/company/api";
import type { Company } from "@/lib/types";

export const dynamic = "force-dynamic";

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = "" } = await searchParams;
  const keyword = q.trim().toUpperCase();
  let companies: Company[] = [];
  let errorMessage: string | null = null;

  try {
    companies = await getCompanies();
  } catch (caughtError) {
    errorMessage =
      caughtError instanceof Error
        ? caughtError.message
        : "Không tải được danh sách doanh nghiệp.";
  }

  if (errorMessage) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-8">
        <ErrorState message={errorMessage} />
      </div>
    );
  }

  const results = keyword
    ? companies.filter((company) =>
        [company.ticker, company.companyName, company.industry.industryName]
          .join(" ")
          .toUpperCase()
          .includes(keyword),
      )
    : companies;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-8">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex h-9 items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-950"
        >
          <span aria-hidden="true">←</span>
          Quay về trang chủ
        </Link>
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-normal text-zinc-950">
          Tra cứu doanh nghiệp
        </h1>
        <form action="/search" className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input
            name="q"
            defaultValue={q}
            placeholder="Nhập mã hoặc tên doanh nghiệp..."
            className="h-11 flex-1 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
          />
          <button
            type="submit"
            className="h-11 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
          >
            Tìm kiếm
          </button>
        </form>
      </section>

      {results.length ? (
        <div className="grid gap-4">
          {results.map((company) => (
            <Link
              key={company.ticker}
              href={`/companies/${company.ticker}`}
              className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-emerald-700"
            >
              <div className="flex items-start gap-4">
                <CompanyLogo
                  ticker={company.ticker}
                  companyName={company.companyName}
                  className="h-14 w-20"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-emerald-700 px-2.5 py-1 text-xs font-semibold text-white">
                      {company.ticker}
                    </span>
                    <span className="text-sm text-zinc-500">
                      {company.exchange.exchangeCode}
                    </span>
                  </div>
                  <h2 className="mt-2 text-lg font-semibold text-zinc-950">
                    {company.companyName}
                  </h2>
                </div>
              </div>
              <p className="mt-2 text-sm text-zinc-600">
                {company.description}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Không có kết quả"
          message="Không tìm thấy doanh nghiệp phù hợp."
        />
      )}
    </div>
  );
}
