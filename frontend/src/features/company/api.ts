import { apiGet } from "@/lib/api";
import type { Company } from "@/lib/types";

export function getCompanies() {
  return apiGet<Company[]>("/companies");
}

export function getCompany(companyCode: string) {
  return apiGet<Company>(
    `/companies/${encodeURIComponent(companyCode.toUpperCase())}/profile`,
  );
}
