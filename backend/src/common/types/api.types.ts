export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T | null;
  error: {
    code: string;
    details: string;
  } | null;
}

export interface CompanyProfile {
  companyCode: string;
  ticker: string;
  name: string;
  exchange: string;
  industry: string;
  summary: string;
  description: string;
  website: string;
  ceo: string;
  sources: string[];
  citations: Citation[];
}

export interface FinancialSummary {
  companyCode: string;
  year: number;
  quarter: number;
  revenue: number;
  netProfit: number;
  totalAssets: number;
  liabilities: number;
  equity: number;
}

export interface FinancialMetric {
  label: string;
  value: number;
  unit: string;
}

export interface Citation {
  id: string;
  docTitle: string;
  sourceUrl: string;
  pageNumber: number;
  matchedText: string;
}

export interface DocumentSummary {
  id: string;
  companyCode: string;
  title: string;
  type: string;
  year: number;
  sourceUrl: string;
}

export interface AiAskFilters {
  year?: number;
  documentTypes?: string[];
}

export interface AiAskRequest {
  query?: string;
  question?: string;
  companyCode?: string;
  ticker?: string;
  filters?: AiAskFilters;
  context?: string;
  conversationId?: string;
}

export interface AiAskResponse {
  answer: string;
  isConfident: boolean;
  citations: Citation[];
  limitations?: string;
}

export interface AdminCompanyStatus {
  companyCode: string;
  ticker: string;
  name: string;
  dataStatus: string;
  sourceStatus: string;
  lastUpdated: string;
}
