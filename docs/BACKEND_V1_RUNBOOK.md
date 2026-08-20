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

Trang đăng nhập và đăng ký dành cho khách hàng đã gọi Auth API thật. Request trên vẫn
được giữ để nghiệm thu riêng quyền quản trị và không phụ thuộc giao diện.

## 7. Kiểm thử nhanh và đầy đủ

### 7.1. Smoke test trước buổi demo

Chạy khi các service đã bật:

```powershell
$health = Invoke-RestMethod http://localhost:3001/api/health
if ($health.data.status -ne 'ready') { throw 'Backend chưa sẵn sàng' }

Invoke-RestMethod http://localhost:3001/api/v1/companies
Invoke-RestMethod http://localhost:3001/api/v1/companies/FPT/profile
Invoke-RestMethod http://localhost:3001/api/v1/companies/FPT/financials
Invoke-RestMethod 'http://localhost:3001/api/v1/companies/FPT/financials?year=2025&quarter=4'
Invoke-RestMethod 'http://localhost:3001/api/v1/companies/FPT/news?page=1&limit=5'
Invoke-RestMethod http://localhost:3001/api/v1/companies/FPT/documents
Invoke-RestMethod http://localhost:3001/api/v1/companies/FPT/citations
```

Một endpoint trả `200` chưa chứng minh dữ liệu tài chính đúng. Kiểm tra nội dung FPT,
kỳ báo cáo, đơn vị và URL nguồn trước khi demo.

### 7.2. Quality test không cần dịch vụ live

Backend:

```powershell
cd backend
npm.cmd run lint:check
npm.cmd run format:check
npm.cmd test -- --runInBand
npm.cmd run build
cd ..
```

Crawler:

```powershell
cd crawler
.\.venv\Scripts\python.exe -m compileall -q .
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
cd ..
```

AI Service:

```powershell
cd ai-service
..\.venv\Scripts\python.exe -m compileall -q app main.py
..\.venv\Scripts\python.exe -m unittest discover -s tests -v
cd ..
```

Frontend:

```powershell
cd frontend
npm.cmd run lint
npm.cmd run build
cd ..
```

Các test live bị skip là hành vi đúng. Không bật mạng hoặc API key chỉ để làm cho số
test skip bằng 0.

### 7.3. PostgreSQL integration và HTTP E2E

Database test phải tách khỏi `app_db` và có hậu tố `_test`. Các test được phép tạo,
cập nhật và xóa fixture trong database này.

```powershell
$pgBin = 'C:\Program Files\PostgreSQL\16\bin'
& "$pgBin\psql.exe" -U postgres -d postgres -c "CREATE DATABASE wikistock_test OWNER app_user;"
& "$pgBin\psql.exe" -U postgres -d wikistock_test -c "CREATE EXTENSION IF NOT EXISTS vector;"

cd backend
$env:DATABASE_URL = 'postgresql://app_user:app_password@localhost:5432/wikistock_test'
$env:TEST_DATABASE_URL = $env:DATABASE_URL
npm.cmd run db:bootstrap
npm.cmd run test:e2e -- --runInBand
cd ..
```

Sau Backend E2E, có thể chạy integration test của AI Service và crawler trên cùng
database test đã bootstrap:

```powershell
cd ai-service
..\.venv\Scripts\python.exe -m unittest tests.test_persistence tests.test_retrieval -v
cd ..\crawler
.\.venv\Scripts\python.exe -m unittest tests.test_rss_postgres -v
cd ..
```

Xóa hai biến khỏi terminal sau khi chạy để tránh crawler thường ngày ghi nhầm DB test:

```powershell
Remove-Item Env:DATABASE_URL, Env:TEST_DATABASE_URL -ErrorAction SilentlyContinue
```

CI thực hiện các gate tương đương trên môi trường sạch. Xem
[tài liệu release gate](CI_RELEASE_GATES.md) để biết sáu check bắt buộc.

## 8. Kịch bản demo từ đầu đến cuối

### 8.1. Luồng không dùng AI provider

1. Mở `http://localhost:3000/search` và tìm FPT.
2. Mở `/companies/FPT` để xem hồ sơ, tin RSS, tài liệu và nguồn.
3. Mở `/companies/FPT/financials` để xem báo cáo tài chính.
4. Chứng minh API trả dữ liệu PostgreSQL bằng các request ở Mục 7.1.
5. Mở `/companies/FPT/ai`; với `AI_PROVIDER=demo`, kết quả phải ghi rõ không tự tin,
   không có citation và không được trình bày như phân tích tài chính thật.

Trang `/ai` đã nối Auth, lịch sử hội thoại và luồng streaming của Backend. Chỉ dùng
trang này để chứng minh RAG khi `AI_PROVIDER=gateway`, `AI_DEMO_MODE=false`, dữ liệu
đã ingest và nguồn dẫn mở được. Xem
[checklist demo chatbot](CHAT_CUSTOMER_DEMO_CHECKLIST.md) trước khi bàn giao.

### 8.2. Chứng minh thiếu API key không làm hỏng dữ liệu nền

Đặt `AI_PROVIDER=gateway`, để `AI_API_KEY` rỗng và giữ `AI_DEMO_MODE=false`, sau đó
khởi động lại AI Service. Request AI phải trả lỗi rõ ràng; hai request sau vẫn phải
thành công:

```powershell
Invoke-RestMethod http://localhost:3001/api/v1/companies/FPT/profile
Invoke-RestMethod http://localhost:3001/api/v1/companies/FPT/financials
```

Không bật `AI_DEMO_MODE=true` để biến lỗi provider thành câu trả lời giả thành công.

### 8.3. Demo RAG với provider thật

Điền Client API key vào `ai-service/.env` hoặc `.env` local qua kênh an toàn:

```dotenv
AI_PROVIDER=gateway
AI_DEMO_MODE=false
AI_API_BASE_URL=https://claude.zunef.com/v1/ai
AI_API_KEY=<CLIENT_API_KEY>
AI_MODEL=claude-sonnet-4-6
```

Khởi động lại AI Service, mở `/companies/FPT/ai` và đặt câu hỏi thuộc đúng tài liệu đã
ingest. Câu trả lời chỉ đạt khi:

- `answer` không rỗng.
- `isConfident=true` chỉ khi có đủ bằng chứng.
- Có citation do Backend dựng từ database.
- Citation mở đúng PDF, đúng doanh nghiệp và đúng trang.
- `excerpt` trực tiếp hỗ trợ mệnh đề đang được trả lời.
- Câu ngoài dữ liệu trả `isConfident=false` và không bịa nguồn.

Các bước mở PDF và đối chiếu trang nằm tại
[runbook RAG, mục citation](RAG_OPERATIONS_RUNBOOK.md#12-mở-citation-và-đối-chiếu-đúng-trang).

## 9. Backup và restore database demo

Database dump không chứa file PDF vì `source_document.file_ref` chỉ lưu tham chiếu.
Muốn phục hồi demo đầy đủ phải giữ cả database dump và thư mục `runtime/ocr/output`.
Model cache không bắt buộc backup vì có thể tải lại.

### 9.1. Backup native Windows

```powershell
$pgBin = 'C:\Program Files\PostgreSQL\16\bin'
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
New-Item -ItemType Directory -Force backups | Out-Null
$dump = (Resolve-Path backups).Path + "\wikistock-demo-$stamp.dump"

& "$pgBin\pg_dump.exe" `
  -h localhost -p 5432 -U app_user -d app_db `
  -Fc --no-owner --file $dump

& "$pgBin\pg_restore.exe" --list $dump | Select-Object -First 20
Compress-Archive -Path runtime\ocr\output -DestinationPath "backups\wikistock-pdf-$stamp.zip"
```

Không dùng PowerShell `>` để ghi binary custom dump vì Windows PowerShell cũ có thể
làm hỏng byte stream. Dùng `--file` như trên.

### 9.2. Restore native vào database mới

Restore vào database mới để kiểm tra trước; không ghi đè `app_db` đang demo:

```powershell
$restoreDb = 'app_db_restore'
& "$pgBin\createdb.exe" -h localhost -p 5432 -U postgres -O app_user $restoreDb
& "$pgBin\psql.exe" -h localhost -p 5432 -U postgres -d $restoreDb `
  -c "CREATE EXTENSION IF NOT EXISTS vector;"
& "$pgBin\pg_restore.exe" -h localhost -p 5432 -U app_user -d $restoreDb `
  --no-owner --exit-on-error $dump
& "$pgBin\psql.exe" -h localhost -p 5432 -U app_user -d $restoreDb `
  -c "SELECT count(*) AS companies FROM company;"
```

Chỉ đổi `DATABASE_URL` sang database restore sau khi migration table, số công ty,
báo cáo, tin tức, tài liệu và chunk đã được kiểm tra.

### 9.3. Backup Docker

```powershell
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$name = "wikistock-demo-$stamp.dump"
New-Item -ItemType Directory -Force backups | Out-Null

docker compose exec -T postgres `
  pg_dump -U app_user -d app_db -Fc --no-owner --file "/tmp/$name"
docker compose exec -T postgres pg_restore --list "/tmp/$name"
docker compose cp "postgres:/tmp/$name" ".\backups\$name"
Compress-Archive -Path runtime\ocr\output -DestinationPath "backups\wikistock-pdf-$stamp.zip"
```

### 9.4. Restore Docker vào database mới

```powershell
$name = '<TEN_FILE_DUMP>'
docker compose cp ".\backups\$name" "postgres:/tmp/$name"
docker compose exec -T postgres createdb -U app_user -O app_user app_db_restore
docker compose exec -T postgres psql -U app_user -d app_db_restore `
  -c "CREATE EXTENSION IF NOT EXISTS vector;"
docker compose exec -T postgres pg_restore -U app_user -d app_db_restore `
  --no-owner --exit-on-error "/tmp/$name"
docker compose exec -T postgres psql -U app_user -d app_db_restore `
  -c "SELECT count(*) AS companies FROM company;"
```

Không xóa volume hoặc database hiện tại cho đến khi bản restore đã được kiểm tra.

## 10. Xử lý lỗi thường gặp

### Backend hoặc crawler không kết nối được PostgreSQL

```powershell
$pgBin = 'C:\Program Files\PostgreSQL\16\bin'
& "$pgBin\pg_isready.exe" -h localhost -p 5432
```

- Native dùng `localhost`; service trong Compose dùng hostname `postgres`.
- Kiểm tra đúng cổng, database, user và password trong URL.
- Nếu cổng 5432 đã bị PostgreSQL native chiếm, không bật đồng thời PostgreSQL Compose
  với override mặc định.
- Gọi `/api/health`; `DATABASE_UNAVAILABLE` nghĩa là Backend còn chạy nhưng DB chưa
  sẵn sàng.

### Thiếu pgvector

```sql
SELECT name, default_version, installed_version
FROM pg_available_extensions
WHERE name = 'vector';
```

- Không có dòng: pgvector chưa được cài đúng PostgreSQL major version trên server.
- Có `default_version` nhưng `installed_version` rỗng: dùng tài khoản quản trị chạy
  `CREATE EXTENSION vector` trong đúng database.
- Không đổi schema sang kiểu text để né lỗi vector.

### Migration hoặc seed lỗi

- Không chạy `schema.sql` hoặc `prisma db push` để “vá nhanh”.
- Chạy riêng `npm.cmd run db:migrate`, `db:seed`, `db:check` để biết bước nào lỗi.
- Với database legacy đã có dữ liệu, làm theo cảnh báo trong `backend/README.md`; không
  áp baseline migration mù.

### VNStock đổi response hoặc thiếu cột

```powershell
cd crawler
.\.venv\Scripts\python.exe -m unittest tests.test_mappings -v
.\.venv\Scripts\python.exe main.py --ticker FPT --stage company
.\.venv\Scripts\python.exe main.py --ticker FPT --stage financial
```

Giữ mẫu response đã khử dữ liệu nhạy cảm, cập nhật mapping và fixture cùng nhau. Không
đổi database hoặc Backend để che lỗi nguồn. Một mã lỗi không được làm mất summary của
các mã còn lại.

### RSS lỗi hoặc không có tin mới

Chạy lại một nguồn và kiểm tra health:

```powershell
cd crawler
.\.venv\Scripts\python.exe main.py --stage news --news-source 'VnExpress RSS'
.\.venv\Scripts\python.exe rss_health.py
```

Nếu cấu trúc XML thay đổi, sửa parser cùng fixture. Không tạo URL suy đoán và không tự
gán doanh nghiệp chỉ để giảm số bài chưa khớp. Xem
[runbook RSS](RSS_NEWS_OPERATIONS_RUNBOOK.md).

### AI thiếu key, sai xác thực hoặc timeout

- `AI_PROVIDER=demo`: không cần key, luôn không tự tin và không có evidence.
- `AI_PROVIDER=gateway`: cần Client API key phù hợp với `AI_AUTH_SCHEME`.
- `AI_API_KEY_REQUIRED`/`AI_AUTHENTICATION_FAILED`: kiểm tra key và base URL, không in
  key vào log.
- `AI_CONNECT_TIMEOUT`: kiểm tra DNS, mạng và gateway.
- `AI_READ_TIMEOUT`: kiểm tra provider trước khi tăng timeout; không tăng vô hạn.
- Provider lỗi phải fail closed; không bật fallback mock trong nghiệm thu online.

### PDF không nằm trong seed root

- Native: `SEED_DATA_PATH` phải trỏ tới `../runtime/ocr/output` khi chạy trong
  `ai-service`.
- Compose: `RAG_SEED_DATA_PATH` là đường dẫn host; `SEED_DATA_PATH` trong container là
  `/data/seed_data`.
- Không dùng symlink hoặc `..` để thoát seed root.
- Chạy dry-run một file/batch trước khi ingest.
- Nếu nhận `PDF_NEEDS_OCR`, xử lý theo [tài liệu OCR](OCR_PREPROCESSING.md).

### Frontend không thấy dữ liệu

- Native: cả `API_BASE_URL` và `NEXT_PUBLIC_API_BASE_URL` dùng
  `http://localhost:3001/api/v1`.
- Compose: `API_BASE_URL` dùng `http://backend:3001/api/v1`, còn biến `NEXT_PUBLIC_*`
  vẫn dùng URL trình duyệt truy cập được.
- Sau khi đổi `NEXT_PUBLIC_API_BASE_URL`, phải build lại Frontend image/client bundle.
- Kiểm tra Backend API trực tiếp trước khi kết luận Frontend lỗi.

### Port đã được sử dụng

```powershell
Get-NetTCPConnection -State Listen | Where-Object LocalPort -In 3000,3001,5432,8000
```

Không chạy đồng thời cùng một service ở native và Compose trên cùng cổng.

## 11. Giới hạn V1 đã biết

1. **AI chưa đủ điều kiện production.** Đợt đánh giá R8 đạt Recall@5 nhưng citation
   precision chỉ 50% và có timeout/sai định dạng. Xem
   [rủi ro sau R8](R8_POST_EVALUATION_RISK.md). Không quảng bá mức tin cậy 99% hiện tại.
2. **Streaming chưa giảm thời gian chờ đoạn đầu.** Backend chỉ phát từng đoạn sau khi
   AI Service đã hoàn tất câu trả lời và kiểm chứng nguồn.
3. **Phiên đăng nhập nằm ở `sessionStorage`.** Lịch sử được lưu trong PostgreSQL nhưng
   người dùng phải đăng nhập lại sau khi đóng phiên trình duyệt.
4. **Phạm vi dữ liệu hữu hạn.** Crawler demo 10 mã; RAG PDF hiện hỗ trợ FPT, GAS, HPG,
   HSG. Hệ thống chưa phải kho dữ liệu toàn thị trường.
5. **Không có giá chứng khoán thời gian thực.** Không dùng câu hỏi “giá hôm nay” hoặc
   khuyến nghị mua/bán để nghiệm thu V1.
6. **Dữ liệu tài chính phụ thuộc VNStock.** Response có thể đổi; kỹ thuật mapping xanh
   không thay thế đối chiếu nghiệp vụ với báo cáo công bố chính thức.
7. **Nhận diện tin RSS dùng luật và alias.** Precision 98% chỉ được tuyên bố sau khi BA
   hoàn thành phiếu review độc lập; bài mơ hồ phải giữ ở trạng thái chưa khớp.
8. **PDF nằm trên filesystem.** Database chỉ giữ `fileRef`; mất thư mục seed thì citation
   không mở được dù metadata còn tồn tại.
9. **Backup và restore đang thủ công.** Chưa có retention, mã hóa backup hoặc lịch phục
   hồi tự động.
10. **Chưa có hạ tầng production hoàn chỉnh.** V1 chưa có deploy pipeline, monitoring,
    distributed tracing, rate limiting, object storage hoặc multi-replica ingestion.
11. **Không có conversation memory.** Mỗi câu hỏi AI được xử lý độc lập.
12. **Container mới được build trong CI.** Máy thực hiện B9 không có Docker Engine nên
    clean-stack runtime cần được một thành viên có Docker nghiệm thu trên Pull Request.
13. **Dependency audit chưa sạch.** Lần audit ở B7 ghi nhận 4 cảnh báo mức cao trong
    dependency production và 6 cảnh báo mức cao nếu tính cả toolchain. Không chạy
    `npm audit fix --force` vì đề xuất hiện tại gây thay đổi Prisma không tương thích;
    không mô tả V1 là đã đạt chuẩn bảo mật production.

## 12. Checklist nghiệm thu cuối cùng

### 12.1. Môi trường

- [ ] Checkout `develop` mới nhất và worktree sạch.
- [ ] Tạo đúng file `.env` từ `.example`; không có secret trong Git.
- [ ] PostgreSQL có extension `vector`.
- [ ] Migration và seed chạy hai lần không lỗi hoặc tạo duplicate.
- [ ] AI Service, Backend và Frontend health/startup thành công.

### 12.2. Dữ liệu

- [ ] Crawler FPT chạy thành công.
- [ ] Chạy lại FPT không tạo duplicate.
- [ ] Chạy đủ 10 mã và có summary success/failure rõ ràng.
- [ ] Có `data_ingestion_log` thật cho VNStock/RSS.
- [ ] RAG ingest đủ PDF đã chuẩn bị; lần hai chuyển thành `skipped`.
- [ ] BA đối chiếu FPT, HPG, VCB ở hai kỳ gần nhất cho doanh thu, lợi nhuận sau thuế,
      tổng nợ và ROE với nguồn công bố; ghi ngày, URL và pass/fail.

### 12.3. Public API và giao diện

- [ ] Company list/profile đọc dữ liệu PostgreSQL thật.
- [ ] Financial API trả kỳ mới nhất và lọc đúng năm/quý.
- [ ] News trả URL thật và tên nguồn.
- [ ] Documents/citations không lẫn doanh nghiệp.
- [ ] Frontend tìm và mở được trang FPT từ đầu đến cuối.
- [ ] Người nghiệm thu không nhầm các trang mock là dữ liệu Backend thật.

### 12.4. AI và citation

- [ ] Thiếu API key không làm Company/Financial API chết; AI báo lỗi rõ ràng.
- [ ] Có key thì request đi qua Backend, retrieval và provider thật.
- [ ] Backend chỉ dựng citation từ evidence hợp lệ trong database.
- [ ] Mở được PDF đúng trang và excerpt trực tiếp chứng minh câu trả lời.
- [ ] Câu ngoài dữ liệu trả không tự tin và không bịa citation.
- [ ] Không coi AI là production-ready khi gate trong `R8_POST_EVALUATION_RISK.md` chưa đạt.

### 12.5. Chất lượng và vận hành

- [ ] Sáu release gate B8 chạy xanh trên Pull Request.
- [ ] PostgreSQL E2E xanh.
- [ ] Health báo đúng khi DB up và trả `503` khi DB down.
- [ ] Admin login qua Backend và endpoint bảo vệ hoạt động.
- [ ] Tạo được database restore riêng từ bản backup.
- [ ] Thành viên không viết Backend làm theo runbook mà không phải sửa code.

## 13. Tài liệu chuyên sâu

- [Cấu hình, health và lỗi công khai của Backend](BACKEND_OPERATIONS.md)
- [Backend E2E với PostgreSQL thật](BACKEND_REAL_DATA_E2E.md)
- [Release gate và branch protection](CI_RELEASE_GATES.md)
- [Vận hành RAG](RAG_OPERATIONS_RUNBOOK.md)
- [Giới hạn và mã lỗi RAG](RAG_KNOWN_LIMITATIONS.md)
- [Vận hành RSS](RSS_NEWS_OPERATIONS_RUNBOOK.md)
- [Tiền xử lý OCR](OCR_PREPROCESSING.md)
- [API contract](API_CONTRACT.md)
