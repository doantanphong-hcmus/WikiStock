import { apiGet } from "@/lib/api";
import type { FinancialSummary } from "@/lib/types";

export function getFinancials(
  companyCode: string,
  year?: number,
  quarter?: number,
) {
  const params = new URLSearchParams();
  if (year !== undefined) params.set("year", String(year));
  if (quarter !== undefined) params.set("quarter", String(quarter));
  const query = params.size ? `?${params.toString()}` : "";

  return apiGet<FinancialSummary>(
    `/companies/${encodeURIComponent(companyCode.toUpperCase())}/financials${query}`,
  );
}
