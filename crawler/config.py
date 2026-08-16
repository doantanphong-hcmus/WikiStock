"""Cấu hình dùng chung cho crawler WikiStock."""

import os

from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", "5432")),
    "dbname": os.getenv("DB_NAME", "app_db"),
    "user": os.getenv("DB_USER", "app_user"),
    "password": os.getenv("DB_PASSWORD", "app_password"),
}

DEMO_TICKERS = ("FPT", "GAS", "HPG", "HSG", "MWG", "SSI", "VCB", "VCG", "VIC", "VNM")
VNSTOCK_SOURCE_NAME = "vnstock"

