import { CompanyHeader } from "@/components/company/CompanyHeader";
import { ErrorState } from "@/components/common/ErrorState";
import { FinancialTable } from "@/components/financial/FinancialTable";
import { getCompany } from "@/features/company/api";
import { getFinancials } from "@/features/financial/api";
import type { Company, FinancialSummary } from "@/lib/types";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ ticker: string }>;
};

export default async function FinancialsPage({ params }: PageProps) {
  const { ticker } = await params;
  let company: Company | null = null;
  let financials: FinancialSummary | null = null;
  let errorMessage: string | null = null;

  try {
    [company, financials] = await Promise.all([
      getCompany(ticker),
      getFinancials(ticker),
    ]);
  } catch (caughtError) {
    errorMessage =
      caughtError instanceof Error
        ? caughtError.message
        : "Không tải được dữ liệu tài chính.";
  }

  if (errorMessage || !company) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-8">
        <ErrorState message={errorMessage ?? "Không tải được dữ liệu tài chính."} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-6 py-8">
      <CompanyHeader company={company} />
      <FinancialTable financials={financials} />
    </div>
  );
}
