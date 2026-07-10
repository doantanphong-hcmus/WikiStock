export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T | null;
  error: {
    code: string;
    details: string;
  } | null;
}

export interface Citation {
  id: string;
  docTitle: string;
  sourceUrl: string;
  pageNumber: number;
  matchedText: string;
}

export interface Company {
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
  key: keyof Pick<
    FinancialSummary,
    "revenue" | "netProfit" | "totalAssets" | "liabilities" | "equity"
  >;
  label: string;
  value: number;
  unit: string;
}

export interface DocumentSummary {
  id: string;
  companyCode: string;
  title: string;
  type: string;
  year: number;
  sourceUrl: string;
}

export interface AiAskRequest {
  query: string;
  companyCode: string;
  filters?: {
    year?: number;
    documentTypes?: string[];
  };
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
