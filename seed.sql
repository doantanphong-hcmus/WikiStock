BEGIN;

INSERT INTO exchange (exchange_code, exchange_name)
VALUES ('HOSE', 'Ho Chi Minh Stock Exchange')
ON CONFLICT (exchange_code) DO NOTHING;

INSERT INTO industry (industry_code, industry_name)
VALUES
    ('TECH', 'Technology'),
    ('ENERGY', 'Energy'),
    ('STEEL', 'Steel')
ON CONFLICT (industry_code) DO NOTHING;

INSERT INTO company (ticker, company_name, exchange_id, industry_id)
SELECT seed.ticker, seed.company_name, exchange.exchange_id, industry.industry_id
FROM (
    VALUES
        ('FPT', 'FPT Corporation', 'TECH'),
        ('GAS', 'PetroVietnam Gas Joint Stock Corporation', 'ENERGY'),
        ('HPG', 'Hoa Phat Group Joint Stock Company', 'STEEL'),
        ('HSG', 'Hoa Sen Group Joint Stock Company', 'STEEL')
) AS seed(ticker, company_name, industry_code)
JOIN exchange ON exchange.exchange_code = 'HOSE'
JOIN industry ON industry.industry_code = seed.industry_code
ON CONFLICT (ticker) DO NOTHING;

INSERT INTO data_source (
    source_name, source_type, reliability_tier, cost_tier, access_url
)
VALUES ('WikiStock seed PDF', 'internal', 5, 'free', NULL)
ON CONFLICT (source_name) DO NOTHING;

INSERT INTO document_type (type_name)
VALUES ('financial_statement')
ON CONFLICT (type_name) DO NOTHING;

COMMIT;
