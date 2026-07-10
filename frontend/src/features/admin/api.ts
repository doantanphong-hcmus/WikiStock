import { apiGet } from "@/lib/api";
import type { AdminCompanyStatus } from "@/lib/types";

export function getAdminCompanies() {
  return apiGet<AdminCompanyStatus[]>("/admin/companies");
}
