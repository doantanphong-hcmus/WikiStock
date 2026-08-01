export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T | null;
  error: {
    code: string;
    details: string;
  } | null;
}

export interface ExchangeSummary {
  exchangeId: number;
  exchangeCode: string;
  exchangeName: string;
}

export interface IndustrySummary {
  industryId: number;
  industryCode: string;
  industryName: string;
}

export interface CompanyExecutiveSummary {
  executiveId: number;
  fullName: string;
  position: string;
  startDate: string | null;
  endDate: string | null;
}

export interface CompanyProfile {
  companyId: number;
  ticker: string;
  companyName: string;
  exchange: ExchangeSummary;
  industry: IndustrySummary;
  listingDate: string | null;
  charterCapital: string | null;
  website: string | null;
  description: string | null;
  executives: CompanyExecutiveSummary[];
  citations: Citation[];
}

export interface MetricSummary {
  metricId: number;
  metricCode: string;
  metricName: string;
  unit: string;
  statementType: string;
}

export interface FinancialLineItemSummary {
  lineItemId: number;
  metric: MetricSummary;
  value: string;
}

export interface FinancialSummary {
  reportId: number;
  companyId: number;
  ticker: string;
  periodType: 'Q' | 'Y';
  fiscalYear: number;
  fiscalQuarter: number | null;
  reportDate: string | null;
  lineItems: FinancialLineItemSummary[];
}

export interface Citation {
  citationId: number;
  documentId: number;
  docTitle: string;
  sourceUrl: string;
  locationRef: string | null;
  excerpt: string | null;
}

export interface DataSourceSummary {
  sourceId: number;
  sourceName: string;
  sourceType: string;
  reliabilityTier: number;
  costTier: string;
  accessUrl: string | null;
}

export interface DocumentTypeSummary {
  docTypeId: number;
  typeName: string;
}

export interface DocumentSummary {
  documentId: number;
  companyId: number | null;
  source: DataSourceSummary;
  documentType: DocumentTypeSummary;
  title: string;
  publishedDate: string | null;
  url: string | null;
  fileRef: string | null;
  crawledAt: string;
  checksum: string | null;
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
  companyId: number;
  ticker: string;
  companyName: string;
  dataStatus: string;
  sourceStatus: string;
  lastUpdated: string;
}
