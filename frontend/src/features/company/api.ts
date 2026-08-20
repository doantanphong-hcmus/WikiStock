import { apiGet } from "@/lib/api";
import type { Company, CompanyNewsPage } from "@/lib/types";

export function getCompanies() {
  return apiGet<Company[]>("/companies");
}

export function getCompany(companyCode: string) {
  return apiGet<Company>(
    `/companies/${encodeURIComponent(companyCode.toUpperCase())}/profile`,
  );
}

export function getCompanyNews(companyCode: string, page = 1, limit = 6) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  return apiGet<CompanyNewsPage>(
    `/companies/${encodeURIComponent(companyCode.toUpperCase())}/news?${params.toString()}`,
  );
}
