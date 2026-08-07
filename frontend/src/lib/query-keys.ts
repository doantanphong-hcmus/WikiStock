// Query keys for React Query / SWR
export const queryKeys = {
  // Companies
  companies: ["companies"] as const,
  company: (ticker: string) => ["companies", ticker] as const,
  companyCitations: (ticker: string) => ["companies", ticker, "citations"] as const,
  companyDocuments: (ticker: string) => ["companies", ticker, "documents"] as const,

  // Financials
  financials: (ticker: string) => ["financials", ticker] as const,
  financialsChart: (ticker: string) => ["financials", ticker, "chart"] as const,

  // AI
  aiAsk: ["ai", "ask"] as const,

  // Admin
  adminCompanies: ["admin", "companies"] as const,
} as const;
