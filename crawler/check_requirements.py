#!/usr/bin/env python3
"""
Check all task requirements are met before acceptance.
Exit code 0 = all requirements met, non-zero = missing data.
"""
import sys
import psycopg2
from config import DB_CONFIG, DEMO_TICKERS

# Required metrics that must be present for each ticker
REQUIRED_METRICS = {'REVENUE', 'NET_PROFIT', 'TOTAL_LIABILITIES'}
# Financial ratios that should be present (at least one quarter)
REQUIRED_RATIOS = {'ROE', 'ROA', 'PE', 'GROSS_MARGIN'}
# Banks don't have GROSS_MARGIN in their financial statements
BANK_TICKERS = {'VCB'}
MIN_QUARTERS = 4


def check():
    """Run all checks and return True if all pass, False otherwise."""
    conn = psycopg2.connect(**DB_CONFIG)
    conn.set_client_encoding('UTF8')
    cur = conn.cursor()

    all_passed = True

    print('=' * 60)
    print('CHECKING CRAWLER REQUIREMENTS')
    print('=' * 60)
    print(f'Expected tickers: {DEMO_TICKERS}\n')

    # 1. Check exactly 10 tickers in database
    print('[1] COMPANY COUNT:')
    cur.execute('SELECT ticker FROM company ORDER BY ticker')
    db_tickers = [r[0] for r in cur.fetchall()]
    print(f'    Found: {db_tickers}')
    print(f'    Status: {"OK" if len(db_tickers) == 10 else "FAIL"} ({len(db_tickers)}/10)')
    if len(db_tickers) != 10:
        all_passed = False

    missing_tickers = set(DEMO_TICKERS) - set(db_tickers)
    if missing_tickers:
        print(f'    Missing: {missing_tickers}')
        all_passed = False

    # 2. Check company profiles
    print('\n[2] COMPANY PROFILES:')
    cur.execute('''
        SELECT c.ticker, c.company_name, e.exchange_code, i.industry_name,
               c.charter_capital, c.website, c.description
        FROM company c
        JOIN exchange e ON e.exchange_id = c.exchange_id
        JOIN industry i ON i.industry_id = c.industry_id
        WHERE c.ticker = ANY(%s)
        ORDER BY c.ticker
    ''', (DEMO_TICKERS,))
    profiles = cur.fetchall()

    for row in profiles:
        t, name, ex, ind, cap, web, desc = row
        fields = []
        if name:
            fields.append('name')
        else:
            fields.append('MISSING-name')
            all_passed = False
        if ex:
            fields.append('exchange')
        else:
            fields.append('MISSING-exchange')
            all_passed = False
        if ind:
            fields.append('industry')
        else:
            fields.append('MISSING-industry')
            all_passed = False
        if cap:
            fields.append('charter_capital')
        if web:
            fields.append('website')
        if desc:
            fields.append('description')
        print(f'    {t}: {", ".join(fields)}')

    missing_profiles = set(DEMO_TICKERS) - {r[0] for r in profiles}
    if missing_profiles:
        print(f'    MISSING companies: {missing_profiles}')
        all_passed = False

    # 3. Check 4 quarters per ticker
    print('\n[3] FINANCIAL REPORTS (4 quarters each):')
    cur.execute('''
        SELECT c.ticker,
               COUNT(DISTINCT fr.fiscal_year || '-Q' || fr.fiscal_quarter) as quarters
        FROM company c
        JOIN financial_report fr ON fr.company_id = c.company_id
        WHERE c.ticker = ANY(%s)
        GROUP BY c.ticker
        ORDER BY c.ticker
    ''', (DEMO_TICKERS,))
    quarters_data = dict(cur.fetchall())

    for ticker in DEMO_TICKERS:
        q_count = quarters_data.get(ticker, 0)
        status = 'OK' if q_count >= MIN_QUARTERS else f'FAIL ({q_count}/{MIN_QUARTERS})'
        print(f'    {ticker}: {q_count} quarters [{status}]')
        if q_count < MIN_QUARTERS:
            all_passed = False

    # 4. Check required metrics
    print('\n[4] REQUIRED METRICS (REVENUE, NET_PROFIT, TOTAL_LIABILITIES):')
    for ticker in DEMO_TICKERS:
        missing_metrics = []
        for metric in REQUIRED_METRICS:
            cur.execute('''
                SELECT COUNT(*)
                FROM financial_line_item fli
                JOIN financial_report fr ON fr.report_id = fli.report_id
                JOIN company c ON c.company_id = fr.company_id
                JOIN metric m ON m.metric_id = fli.metric_id
                WHERE c.ticker = %s AND m.metric_code = %s AND fli.value IS NOT NULL
            ''', (ticker, metric))
            count = cur.fetchone()[0]
            if count == 0:
                missing_metrics.append(metric)

        if missing_metrics:
            print(f'    {ticker}: MISSING {", ".join(missing_metrics)}')
            all_passed = False
        else:
            print(f'    {ticker}: OK')

    # 5. Check financial ratios
    print('\n[5] FINANCIAL RATIOS (ROE, ROA, P/E, GROSS_MARGIN):')
    for ticker in DEMO_TICKERS:
        missing_ratios = []
        for ratio in REQUIRED_RATIOS:
            # Skip GROSS_MARGIN for banks
            if ticker in BANK_TICKERS and ratio == 'GROSS_MARGIN':
                continue
            cur.execute('''
                SELECT COUNT(*)
                FROM financial_line_item fli
                JOIN financial_report fr ON fr.report_id = fli.report_id
                JOIN company c ON c.company_id = fr.company_id
                JOIN metric m ON m.metric_id = fli.metric_id
                WHERE c.ticker = %s AND m.metric_code = %s AND fli.value IS NOT NULL
            ''', (ticker, ratio))
            count = cur.fetchone()[0]
            if count == 0:
                missing_ratios.append(ratio)

        if missing_ratios:
            print(f'    {ticker}: MISSING {", ".join(missing_ratios)}')
            all_passed = False
        else:
            print(f'    {ticker}: OK')

    # 6. Check news
    print('\n[6] NEWS ARTICLES:')
    cur.execute('''
        SELECT c.ticker, COUNT(*) as articles
        FROM company c
        JOIN news_article_company nac ON nac.company_id = c.company_id
        JOIN news_article na ON na.article_id = nac.article_id
        WHERE c.ticker = ANY(%s)
        GROUP BY c.ticker
        ORDER BY c.ticker
    ''', (DEMO_TICKERS,))
    news_data = dict(cur.fetchall())

    for ticker in DEMO_TICKERS:
        count = news_data.get(ticker, 0)
        status = 'OK' if count > 0 else 'FAIL (0 articles)'
        print(f'    {ticker}: {count} articles [{status}]')
        if count == 0:
            all_passed = False

    # Show sample news
    cur.execute('''
        SELECT c.ticker, na.title, na.url, na.published_at
        FROM news_article na
        JOIN news_article_company nac ON nac.article_id = na.article_id
        JOIN company c ON c.company_id = nac.company_id
        LIMIT 3
    ''')
    news_samples = cur.fetchall()
    if news_samples:
        print('\n    Sample news:')
        for ticker, title, url, pub_date in news_samples:
            title_display = str(title)[:50].encode('ascii', 'replace').decode('ascii')
            url_display = str(url)[:60].encode('ascii', 'replace').decode('ascii')
            print(f'    - {ticker}: {title_display}...')
            print(f'      URL: {url_display}...')

    # 7. Check database tables
    print('\n[7] DATABASE TABLES:')
    cur.execute("""
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
    """)
    tables = [r[0] for r in cur.fetchall()]
    print(f'    Tables ({len(tables)}): {tables}')

    cur.close()
    conn.close()

    # Summary
    print('\n' + '=' * 60)
    if all_passed:
        print('RESULT: ALL REQUIREMENTS MET')
        print('=' * 60)
        return 0
    else:
        print('RESULT: SOME REQUIREMENTS NOT MET')
        print('=' * 60)
        return 1


if __name__ == '__main__':
    sys.exit(check())
