import { CompaniesService } from './companies.service';

describe('CompaniesService', () => {
  it('returns a mock company by ticker', () => {
    const service = new CompaniesService();
    const result = service.findByTicker('FPT');

    expect(result).toBeDefined();
    expect(result.data?.ticker).toBe('FPT');
    expect(result.data?.companyName).toContain('FPT');
  });
});
