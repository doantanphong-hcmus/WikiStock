"""
Database configuration for WikiStock Crawler
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', 5432)),
    'database': os.getenv('DB_NAME', 'app_db'),
    'user': os.getenv('DB_USER', 'app_user'),
    'password': os.getenv('DB_PASSWORD', 'app_password')
}

# Crawler configuration
# Note: No default VNSTOCK_SOURCE — each crawler module selects the best source:
# - crawl_company.py: VCI (company overview)
# - crawl_financial.py: VCI (statements) + KBS (ratios)
# - crawl_news.py: KBS (has URL)
VNSTOCK_GITHUB = 'https://github.com/thinh-vu/vnstock'

# Demo stock tickers
DEMO_TICKERS = ['FPT', 'GAS', 'HPG', 'HSG', 'MWG', 'SSI', 'VCB', 'VCG', 'VIC', 'VNM']

# Suppress vnstock ads in output
os.environ['PYTHONIOENCODING'] = 'utf-8'
