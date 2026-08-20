# Runbook dựng, kiểm tra và demo WikiStock Backend V1

Tài liệu này là điểm bắt đầu duy nhất cho thành viên mới. Làm theo thứ tự từ trên
xuống; không chạy `schema.sql`, `prisma db push` hoặc tự tạo bảng. Prisma migration
trong `backend/prisma/migrations` là lịch sử schema duy nhất.

## 1. Chọn cách chạy

| Cách chạy | Phù hợp khi | Thành phần cần cài trên máy |
|---|---|---|
| Docker Compose | Muốn dựng đồng nhất và nhanh | Git, Docker Engine, Docker Compose V2; Python 3.12 vẫn cần cho crawler |
| Native Windows | Máy không chạy được Docker | Git, Node.js 22 x64, Python 3.12 x64, PostgreSQL và pgvector |

Docker là cách ngắn nhất nhưng không phải cách duy nhất. Hai đường đều dùng chung
migration, seed, crawler, API contract và checklist nghiệm thu.

Luồng khởi động chuẩn:

```text
PostgreSQL + pgvector
  → migration + seed
  → crawler doanh nghiệp/tài chính/RSS
  → ingest PDF và embedding
  → AI Service
  → Backend
  → Frontend
```

## 2. Yêu cầu môi trường

Phiên bản chuẩn của dự án:

- Git.
- Node.js 22 x64 và npm đi kèm.
- Python 3.12 x64.
- PostgreSQL 16 trở lên; Docker và CI dùng PostgreSQL 16.
- pgvector được cài đúng PostgreSQL major version.
- PowerShell 5.1 hoặc 7.
- Khoảng 8 GB RAM trống nếu tải và chạy BGE-M3 local.
- 12 PDF có text layer trong `runtime/ocr/output` nếu nghiệm thu RAG đầy đủ.

Kiểm tra công cụ từ PowerShell:

```powershell
git --version
node --version
npm.cmd --version
python --version
python -c "import platform, struct; print(platform.python_version(), struct.calcsize('P') * 8)"
```

Kết quả Python phải bắt đầu bằng `3.12` và kiến trúc phải là `64`. Nếu dùng Docker:

```powershell
docker --version
docker compose version
```

## 3. Các file cấu hình

Không commit bất kỳ file nào ở cột “File local”. Chỉ các file `.example` được lưu
trong Git.

| Thành phần | Tạo từ | File local |
|---|---|---|
| Docker Compose | `.env.example` | `.env` |
| Backend native | `backend/.env.example` | `backend/.env` |
| AI Service native | `ai-service/.env.example` | `ai-service/.env` |
| Crawler native | `crawler/.env.example` | `crawler/.env` |
| Frontend native | `frontend/.env.example` | `frontend/.env.local` |

Tạo file theo cách chạy đã chọn:

```powershell
# Docker
Copy-Item .env.example .env

# Native Windows
Copy-Item backend\.env.example backend\.env
Copy-Item ai-service\.env.example ai-service\.env
Copy-Item crawler\.env.example crawler\.env
Copy-Item frontend\.env.example frontend\.env.local
```

Tạo `JWT_SECRET` local ngẫu nhiên rồi thay giá trị mẫu trong `.env` hoặc
`backend/.env`:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Không dán API key vào command, commit, log, issue hoặc đoạn chat. Nếu key từng xuất
hiện ở nơi chia sẻ, phải thu hồi và cấp lại.

### 3.1. Ý nghĩa biến Backend và database

| Biến | Ý nghĩa |
|---|---|
| `NODE_ENV` | Môi trường chạy Backend; native local dùng `development` |
| `PORT` | Cổng Backend, mặc định `3001` |
| `JWT_SECRET` | Khóa ký JWT, bắt buộc dài ít nhất 32 ký tự và không dùng giá trị mẫu |
| `JWT_EXPIRES_IN_SECONDS` | Thời gian sống access token |
| `FRONTEND_URL` | Origin duy nhất được CORS cho phép, không chứa path |
| `AI_SERVICE_URL` | URL nội bộ AI Service; native là `localhost`, Compose là tên service |
| `AI_SERVICE_TIMEOUT_MS` | Thời gian Backend chờ AI Service |
| `AI_DEMO_MODE` | Cho phép fallback mock của Backend; phải là `false` khi nghiệm thu |
| `DB_HOST`, `DB_PORT` | Host và cổng PostgreSQL khi không dùng URL đầy đủ |
| `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Tài khoản và database của ứng dụng |
| `DATABASE_URL` | URL PostgreSQL ưu tiên của Backend, AI Service và crawler |
| `TEST_DATABASE_URL` | Chỉ dùng cho database test có thể bị sửa/xóa dữ liệu fixture |

Trong Compose, `DATABASE_URL` dùng hostname `postgres`. Khi chạy native hoặc crawler
từ host, dùng `localhost`. Không sao chép nguyên URL Compose sang file native.

### 3.2. Ý nghĩa biến PDF, embedding và retrieval

| Biến | Ý nghĩa |
|---|---|
| `RAG_SEED_DATA_PATH` | Đường dẫn PDF trên máy host để Compose mount read-only |
| `SEED_DATA_PATH` | Seed root mà Backend/AI Service nhìn thấy trong môi trường đang chạy |
| `MAX_PDF_SIZE_MB` | Kích thước PDF tối đa được ingest |
| `CHUNK_SIZE_CHARS` | Số ký tự mục tiêu của một đoạn |
| `CHUNK_OVERLAP_CHARS` | Số ký tự chồng lấn; phải nhỏ hơn chunk size |
| `CHUNK_VERSION` | Phiên bản thuật toán chia đoạn, dùng quyết định re-ingest |
| `EMBEDDING_MODEL` | Model embedding; V1 dùng `BAAI/bge-m3` |
| `EMBEDDING_DIMENSIONS` | Số chiều vector, phải là `1024` để khớp schema |
| `EMBEDDING_BATCH_SIZE` | Số đoạn được embedding trong một batch |
| `RETRIEVAL_TOP_K` | Số đoạn tối đa được lấy cho một câu hỏi |
| `RETRIEVAL_MIN_SIMILARITY` | Ngưỡng cosine similarity tối thiểu |
| `HF_HOME` | Thư mục hoặc volume cache model Hugging Face |

### 3.3. Ý nghĩa biến AI provider

| Biến | Ý nghĩa |
|---|---|
| `AI_PROVIDER` | `demo` không gọi provider; `gateway` chạy RAG và provider thật |
| `AI_API_BASE_URL` | Base URL Client API tương thích Anthropic Messages |
| `AI_API_KEY` | Client API key; để rỗng khi chạy offline |
| `AI_AUTH_SCHEME` | Kiểu xác thực `x-api-key` hoặc `bearer` |
| `AI_MODEL` | Tên model provider |
| `AI_CUSTOM_HEADERS` | Header bổ sung dạng `Tên: giá trị`, mỗi header một dòng |
| `AI_CONNECT_TIMEOUT_SECONDS` | Thời gian chờ thiết lập kết nối provider |
| `AI_READ_TIMEOUT_SECONDS` | Thời gian chờ provider trả nội dung |
| `EMBEDDING_BASE_URL`, `EMBEDDING_API_KEY` | Để trống trong V1 vì embedding chạy local |

### 3.4. Ý nghĩa biến Frontend

| Biến | Ý nghĩa |
|---|---|
| `API_BASE_URL` | URL Backend dùng khi Next.js render phía server; Compose dùng `http://backend:3001/api/v1` |
| `NEXT_PUBLIC_API_BASE_URL` | URL Backend được đóng vào client bundle và trình duyệt truy cập |

## 4. Dựng bằng Docker Compose

### 4.1. Chuẩn bị và khởi động

Mở `.env`, thay `JWT_SECRET`, giữ `AI_PROVIDER=demo` cho lần dựng đầu và xác nhận:

```powershell
$pdfs = @(Get-ChildItem runtime\ocr\output -Recurse -File -Filter *.pdf -ErrorAction SilentlyContinue)
$pdfs.Count
docker compose config --quiet
docker compose up -d --build
docker compose ps --all
```

Nếu nghiệm thu đủ bộ PDF, số lượng phải là `12`. `db-migrate` ở trạng thái
`Exited (0)` là bình thường; đây là job chạy migration/seed một lần, không phải service
cần chạy liên tục.

Kiểm tra health và log bootstrap:

```powershell
Invoke-RestMethod http://localhost:3001/api/health
Invoke-RestMethod http://localhost:8000/health
docker compose logs --tail 100 db-migrate postgres backend ai-service
```

Backend health phải trả `ready` và database `available`.

### 4.2. Chạy crawler với PostgreSQL trong Compose

Crawler chưa được đóng thành service; chạy nó bằng Python 3.12 trên host. File
`crawler/.env` phải dùng `localhost:5432` vì override development đã mở cổng này.

```powershell
Copy-Item crawler\.env.example crawler\.env -ErrorAction SilentlyContinue
cd crawler
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe check_requirements.py
.\.venv\Scripts\python.exe main.py --ticker FPT
.\.venv\Scripts\python.exe main.py --ticker FPT
.\.venv\Scripts\python.exe main.py
.\.venv\Scripts\python.exe rss_health.py
cd ..
```

Lần chạy FPT thứ hai không được tạo bản ghi trùng. Summary phải nêu rõ mã/công đoạn
thành công hoặc lỗi. RSS sử dụng URL thật từ nguồn đã duyệt và không gọi VNStock news.

### 4.3. Ingest PDF

```powershell
docker compose run --rm ai-service python -m app.ingestion scan --dry-run
docker compose run --rm ai-service python -m app.ingestion scan
docker compose run --rm ai-service python -m app.ingestion scan
```

Với bộ chuẩn 12 PDF:

- Dry-run: `discovered=12`, `ready=12`, không có `failed` hoặc `needs_ocr`.
- Lần ingest đầu: tổng `inserted=12`.
- Lần ingest hai: tổng `skipped=12`, không insert/re-ingest lại.

Chi tiết kiểm tra citation và model cache nằm trong
[runbook RAG](RAG_OPERATIONS_RUNBOOK.md).

### 4.4. Dừng hệ thống

Giữ database và model cache:

```powershell
docker compose down
```

Không chạy `docker compose down --volumes` nếu chưa backup và còn cần dữ liệu demo.

## 5. Dựng native trên Windows

### 5.1. Khởi động PostgreSQL và cài pgvector

Xem tên Windows service rồi khởi động nó bằng PowerShell có quyền Administrator:

```powershell
Get-Service -Name 'postgresql*'
Start-Service -Name '<TEN_SERVICE_POSTGRESQL>'
```

Kiểm tra server:

```powershell
$pgBin = 'C:\Program Files\PostgreSQL\16\bin'
& "$pgBin\pg_isready.exe" -h localhost -p 5432
```

Nếu `vector` chưa được cài trên server, làm theo hướng dẫn Windows chính thức của
[pgvector](https://github.com/pgvector/pgvector#installation-notes---windows).
Với pgvector `v0.8.6`, chạy **x64 Native Tools Command Prompt for Visual Studio** bằng
quyền Administrator và thay `PGROOT` cho đúng PostgreSQL đang dùng:

```bat
set "PGROOT=C:\Program Files\PostgreSQL\16"
cd %TEMP%
git clone --branch v0.8.6 https://github.com/pgvector/pgvector.git
cd pgvector
nmake /F Makefile.win
nmake /F Makefile.win install
```

Tạo role/database local một lần. Nếu đã tồn tại thì không chạy lại lệnh tạo tương
ứng. Không cấp quyền superuser cho `app_user`; dùng `postgres` để bật extension:

```powershell
& "$pgBin\psql.exe" -U postgres -d postgres -c "CREATE ROLE app_user WITH LOGIN PASSWORD 'app_password';"
& "$pgBin\psql.exe" -U postgres -d postgres -c "CREATE DATABASE app_db OWNER app_user;"
& "$pgBin\psql.exe" -U postgres -d app_db -c "CREATE EXTENSION IF NOT EXISTS vector;"
& "$pgBin\psql.exe" -U postgres -d app_db -c "SELECT extversion FROM pg_extension WHERE extname = 'vector';"
```

Nếu dùng PostgreSQL 17/18 hoặc cổng khác, sửa cả `$pgBin` và các URL trong file `.env`.

### 5.2. Migration và seed

```powershell
cd backend
npm.cmd ci
npx.cmd prisma generate
npm.cmd run db:bootstrap
npm.cmd run db:bootstrap
cd ..
```

Cả hai lượt phải thành công; lượt hai không tạo dữ liệu tham chiếu trùng.

### 5.3. Crawler

```powershell
cd crawler
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe check_requirements.py
.\.venv\Scripts\python.exe main.py --ticker FPT
.\.venv\Scripts\python.exe main.py --ticker FPT
.\.venv\Scripts\python.exe main.py
.\.venv\Scripts\python.exe rss_health.py
cd ..
```

Không sửa trực tiếp số liệu trong PostgreSQL nếu mapping sai. Giữ response/fixture đã
khử thông tin nhạy cảm, sửa mapping ở crawler rồi chạy lại.

### 5.4. AI Service và ingest PDF

Tạo virtual environment riêng ở root repository:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r ai-service\requirements.txt
cd ai-service
..\.venv\Scripts\python.exe -m app.ingestion scan --dry-run
..\.venv\Scripts\python.exe -m app.ingestion scan
..\.venv\Scripts\python.exe -m app.ingestion scan
cd ..
```

AI Service tự đọc `ai-service/.env`. Lần đầu tạo embedding có thể cần Internet để tải
BGE-M3 vào `HF_HOME`; nó không gọi AI provider và không tiêu thụ API credit.

### 5.5. Khởi động bốn tiến trình

Mở bốn cửa sổ PowerShell từ root repository.

Terminal 1 — AI Service:

```powershell
cd ai-service
..\.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
```

Terminal 2 — Backend:

```powershell
cd backend
npm.cmd run start:dev
```

Terminal 3 — Frontend:

```powershell
cd frontend
npm.cmd ci
npm.cmd run dev
```

Terminal 4 — kiểm tra:

```powershell
Invoke-RestMethod http://localhost:8000/health
Invoke-RestMethod http://localhost:3001/api/health
Invoke-RestMethod http://localhost:3001/api/v1/companies
Start-Process http://localhost:3000
```

## 6. Tạo và kiểm tra Admin đầu tiên

Mật khẩu Admin tối thiểu 12 ký tự. Script từ chối ghi đè email đã tồn tại.

Native Windows:

```powershell
cd backend
$env:ADMIN_EMAIL = 'admin@wikistock.local'
$env:ADMIN_PASSWORD = '<MAT_KHAU_DEMO_TREN_12_KY_TU>'
$env:ADMIN_FULL_NAME = 'WikiStock Admin'
npm.cmd run admin:create
```

Docker:

```powershell
$env:ADMIN_EMAIL = 'admin@wikistock.local'
$env:ADMIN_PASSWORD = '<MAT_KHAU_DEMO_TREN_12_KY_TU>'
$env:ADMIN_FULL_NAME = 'WikiStock Admin'
docker compose exec `
  -e "ADMIN_EMAIL=$env:ADMIN_EMAIL" `
  -e "ADMIN_PASSWORD=$env:ADMIN_PASSWORD" `
  -e "ADMIN_FULL_NAME=$env:ADMIN_FULL_NAME" `
  backend npm run admin:create
```

Xác minh login và endpoint được bảo vệ qua Backend thật:

```powershell
$login = Invoke-RestMethod `
  -Method Post `
  -Uri 'http://localhost:3001/api/v1/auth/login' `
  -ContentType 'application/json' `
  -Body (@{ email = $env:ADMIN_EMAIL; password = $env:ADMIN_PASSWORD } | ConvertTo-Json)

$headers = @{ Authorization = "Bearer $($login.data.accessToken)" }
Invoke-RestMethod -Headers $headers http://localhost:3001/api/v1/admin/companies

Remove-Item Env:ADMIN_EMAIL, Env:ADMIN_PASSWORD, Env:ADMIN_FULL_NAME -ErrorAction SilentlyContinue
```

Trang đăng nhập Frontend hiện vẫn là giao diện demo và chưa gọi Auth API. Vì vậy phải
dùng request trên để nghiệm thu Admin; không dùng việc Frontend chấp nhận email làm
bằng chứng xác thực Backend hoạt động.
