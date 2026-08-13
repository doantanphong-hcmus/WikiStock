# WikiStock Crawler

Crawler Python để lấy dữ liệu tài chính từ vnstock và insert vào PostgreSQL.

## Chuẩn bị môi trường

### 1. Tạo virtualenv
Dùng Python 3.12 (Python 3.14 quá mới, numpy/psycopg2 chưa có wheel ổn định cho Windows và sẽ crash/lỗi build):
```bash
cd crawler
py -3.12 -m venv venv
source venv/Scripts/activate  # Windows Git Bash
```

### 2. Cài đặt dependencies
```bash
pip install -r requirements.txt
```

### 3. Cấu hình database
```bash
cp .env.example .env
# Chỉnh sửa .env với thông tin database của bạn
```

### 4. Khởi tạo database (chỉ chạy lần đầu — schema.sql không hỗ trợ chạy lại trên database đã có bảng)
```bash
python setup_db.py
```

### 5. Seed lookup tables
```bash
python seed_lookup.py
```

### 6. Chạy crawler
```bash
python main.py
```

## Thứ tự chạy đúng
1. `setup_db.py`  — Áp dụng schema.sql chuẩn (chỉ chạy lần đầu; không hỗ trợ chạy lại để reset trên database đã có bảng)
2. `seed_lookup.py` — Tạo các bảng lookup (metric, data_source)
3. `main.py`       — Chạy pipeline đầy đủ cho 10 mã cổ phiếu

## Demo Stocks
Mã cổ phiếu demo: FPT, GAS, HPG, HSG, MWG, SSI, VCB, VCG, VIC, VNM

## Cấu trúc
- `seed_lookup.py`  - Seed bảng metric và data_source
- `setup_db.py`     - Áp dụng schema.sql chuẩn
- `main.py`         - Entry point cho pipeline
- `config.py`       - Cấu hình kết nối database
- `db.py`           - Helper kết nối và upsert
- `crawl_company.py`   - Thu thập hồ sơ công ty
- `crawl_financial.py` - Thu thập báo cáo tài chính
- `crawl_news.py`      - Thu thập tin tức
- `check_requirements.py` - Kiểm tra dữ liệu đã thu thập đủ chưa
