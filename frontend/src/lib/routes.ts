export const ROUTES = {
  HOME: "/",
  SEARCH: "/search",
  LOGIN: "/login",
  ADMIN: "/admin",
  COMPANY: (ticker: string) => `/companies/${ticker}`,
  COMPANY_FINANCIALS: (ticker: string) => `/companies/${ticker}/financials`,
  COMPANY_RISK: (ticker: string) => `/companies/${ticker}/risk`,
  COMPANY_AI: (ticker: string) => `/companies/${ticker}/ai`,
} as const;
