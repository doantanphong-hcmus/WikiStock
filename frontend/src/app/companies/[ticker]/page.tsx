import { CompanyHeader } from "@/components/company/CompanyHeader";
import { CompanySummaryCard } from "@/components/company/CompanySummaryCard";
import { ErrorState } from "@/components/common/ErrorState";
import { getCitations, getDocuments } from "@/features/citation/api";
import { getCompany } from "@/features/company/api";
import type { Citation, Company, DocumentSummary } from "@/lib/types";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ ticker: string }>;
};

export default async function CompanyPage({ params }: PageProps) {
  const { ticker } = await params;
  let company: Company | null = null;
  let citations: Citation[] = [];
  let documents: DocumentSummary[] = [];
  let errorMessage: string | null = null;

  try {
    [company, citations, documents] = await Promise.all([
      getCompany(ticker),
      getCitations(ticker),
      getDocuments(ticker),
    ]);
  } catch (caughtError) {
    errorMessage =
      caughtError instanceof Error
        ? caughtError.message
        : "Không tìm thấy dữ liệu doanh nghiệp.";
  }

  if (errorMessage || !company) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-8">
        <ErrorState message={errorMessage ?? "Không tìm thấy dữ liệu doanh nghiệp."} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-6 py-8">
      <CompanyHeader company={company} />
      <CompanySummaryCard company={company} />

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-950">Documents</h2>
          <ul className="mt-4 space-y-3">
            {documents.map((document) => (
              <li key={document.id} className="rounded-md border border-zinc-200 p-3">
                <a
                  href={document.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-emerald-800"
                >
                  {document.title}
                </a>
                <p className="mt-1 text-xs text-zinc-500">
                  {document.type} - {document.year}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-950">Citations</h2>
          <ul className="mt-4 space-y-3">
            {citations.map((citation) => (
              <li key={citation.id} className="rounded-md border border-zinc-200 p-3">
                <p className="text-sm font-medium text-zinc-950">
                  {citation.docTitle}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Trang {citation.pageNumber}
                </p>
                <p className="mt-2 text-sm text-zinc-600">
                  {citation.matchedText}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
