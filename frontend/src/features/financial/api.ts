import { apiGet } from "@/lib/api";
import type { FinancialSummary } from "@/lib/types";

export function getFinancials(companyCode: string, year = 2025, quarter = 4) {
  const params = new URLSearchParams({
    year: String(year),
    quarter: String(quarter),
  });

  return apiGet<FinancialSummary>(
    `/companies/${encodeURIComponent(companyCode.toUpperCase())}/financials?${params.toString()}`,
  );
}
