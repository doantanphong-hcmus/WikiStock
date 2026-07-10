import { apiGet } from "@/lib/api";
import type { Citation, DocumentSummary } from "@/lib/types";

export function getCitations(companyCode: string) {
  return apiGet<Citation[]>(
    `/companies/${encodeURIComponent(companyCode.toUpperCase())}/citations`,
  );
}

export function getDocuments(companyCode: string) {
  return apiGet<DocumentSummary[]>(
    `/companies/${encodeURIComponent(companyCode.toUpperCase())}/documents`,
  );
}
