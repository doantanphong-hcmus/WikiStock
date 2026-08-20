import { CompanyHeader } from "@/components/company/CompanyHeader";
import { CompanySummaryCard } from "@/components/company/CompanySummaryCard";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Badge } from "@/components/ui/Badge";
import { getDocuments } from "@/features/citation/api";
import { getCompany, getCompanyNews } from "@/features/company/api";
import { API_BASE_URL } from "@/lib/env";
import type { Company, CompanyNewsPage, DocumentSummary } from "@/lib/types";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ ticker: string }>;
};

function formatPublishedAt(value: string | null) {
  if (!value) return "Chưa rõ thời gian đăng";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa rõ thời gian đăng";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function documentHref(value: string | null) {
  if (!value) return null;
  try {
    const publicApiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? API_BASE_URL;
    return new URL(value, publicApiBase).href;
  } catch {
    return null;
  }
}

export default async function CompanyPage({ params }: PageProps) {
  const { ticker } = await params;
  let company: Company | null = null;
  let documents: DocumentSummary[] = [];
  let news: CompanyNewsPage | null = null;
  let errorMessage: string | null = null;

  try {
    [company, documents, news] = await Promise.all([
      getCompany(ticker),
      getDocuments(ticker),
      getCompanyNews(ticker),
    ]);
  } catch (caughtError) {
    errorMessage =
      caughtError instanceof Error
        ? caughtError.message
        : "Không tìm thấy dữ liệu doanh nghiệp.";
  }

  if (errorMessage || !company || !news) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-8">
        <ErrorState
          message={errorMessage ?? "Không tìm thấy dữ liệu doanh nghiệp."}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-6 py-8">
      <CompanyHeader company={company} />
      <CompanySummaryCard company={company} />

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950">
              Tin tức mới nhất
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Tin được tổng hợp từ nguồn báo chí và mở tại trang gốc.
            </p>
          </div>
          {news.total > 0 ? (
            <span className="text-xs text-zinc-500">
              Hiển thị {news.items.length}/{news.total} bài
            </span>
          ) : null}
        </div>

        {news.items.length ? (
          <ul className="mt-5 grid gap-4 md:grid-cols-2">
            {news.items.map((article) => (
              <li
                key={article.articleId}
                className="rounded-lg border border-zinc-200 p-4"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                  <Badge variant="info" size="small">
                    {article.sourceName}
                  </Badge>
                  <time dateTime={article.publishedAt ?? undefined}>
                    {formatPublishedAt(article.publishedAt)}
                  </time>
                </div>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 block font-semibold text-zinc-950 hover:text-emerald-800"
                >
                  {article.title}
                </a>
                {article.summary ? (
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-600">
                    {article.summary}
                  </p>
                ) : null}
                <p className="mt-3 text-xs text-zinc-500">
                  Doanh nghiệp liên quan:{" "}
                  {article.companies.map(({ ticker }) => ticker).join(", ")}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-5">
            <EmptyState
              title="Chưa có tin tức"
              message={`Hiện chưa có bài viết nào được xác nhận liên quan đến ${company.ticker}.`}
              icon="inbox"
            />
          </div>
        )}
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-950">
          Báo cáo doanh nghiệp
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Mở báo cáo gốc để xem và đối chiếu số liệu của doanh nghiệp.
        </p>
        <ul className="mt-4 space-y-3">
          {documents.map((document) => {
            const href = documentHref(document.url);
            return (
              <li
                key={document.documentId}
                className="rounded-md border border-zinc-200 p-3"
              >
                {href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-emerald-800 hover:underline"
                  >
                    {document.title}
                  </a>
                ) : (
                  <p className="text-sm font-medium text-zinc-950">
                    {document.title}
                  </p>
                )}
                <p className="mt-1 text-xs text-zinc-500">
                  {document.documentType.typeName === "financial_statement"
                    ? "Báo cáo tài chính"
                    : document.documentType.typeName}
                  {document.publishedDate ? ` · ${document.publishedDate}` : ""}
                  {href ? " · Mở PDF" : ""}
                </p>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
