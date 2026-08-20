# Cổng kiểm tra trước khi merge và phát hành

Tài liệu này mô tả các kiểm tra tự động được bổ sung ở B8. Mục tiêu là chặn Pull
Request làm hỏng build, migration, API hoặc các luồng dữ liệu chính trước khi code
được merge vào `develop` hay `main`.

Workflow nằm tại `.github/workflows/release-gates.yml` và chỉ chạy khi có Pull
Request vào hai nhánh trên. Khi tác giả đẩy commit mới, lượt chạy cũ của cùng Pull
Request được hủy để không tốn runner.

## Các cổng bắt buộc

| Check trên GitHub | Nội dung kiểm tra |
|---|---|
| `Backend quality` | Prisma validate/generate, lint chỉ đọc, format check, 57 unit test và build NestJS |
| `Backend PostgreSQL integration` | PostgreSQL 16 có `pgvector`, migration và seed trên database trắng, kiểm tra schema, chạy lại migration và 25 HTTP E2E test |
| `Crawler offline` | Python 3.12, cài dependency, compile và test bằng fixture; không gọi VNStock hay RSS thật |
| `AI Service quality` | Python 3.12, cài dependency, compile và unit test; live provider và database integration tự bỏ qua |
| `Frontend quality` | Cài dependency sạch, ESLint và production build Next.js |
| `Container build` | Kiểm tra Docker Compose và build image Backend, AI Service, Frontend |

Database trong job integration là service container tạm thời có tên
`wikistock_test`. Nó được tạo mới cho mỗi job và bị hủy cùng runner, vì vậy không thể
đọc hoặc ghi database dev/demo.

Các giá trị database và JWT trong workflow chỉ là placeholder của môi trường CI,
không phải secret. Workflow không dùng API key, GitHub Secret, VNStock live, RSS live
hoặc AI provider thật.

## Chạy tương đương ở local

### Backend quality

```powershell
cd backend
npm ci
npx prisma validate
npx prisma generate
npm run lint:check
npm run format:check
npm test -- --runInBand
npm run build
```

### Backend PostgreSQL integration

`TEST_DATABASE_URL` phải trỏ tới PostgreSQL test riêng đã có extension `vector`.
Không dùng database dev hoặc demo.

```powershell
cd backend
$env:DATABASE_URL = 'postgresql://app_user:app_password@localhost:5432/wikistock_test'
$env:TEST_DATABASE_URL = $env:DATABASE_URL
npm run db:bootstrap
npm run db:migrate
npm run test:e2e -- --runInBand
```

### Crawler offline

```powershell
cd crawler
.\.venv\Scripts\python.exe -m compileall -q .
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

Hai test live được bỏ qua khi không đặt `RUN_LIVE_RSS_TESTS=1` và
`TEST_DATABASE_URL`. Không bật các biến này trong quality gate mặc định.

### AI Service offline

```powershell
cd ai-service
..\.venv\Scripts\python.exe -m compileall -q app main.py
..\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

Không đặt `RUN_LIVE_AI_TESTS=1` trong CI. Live evaluation tiếp tục là bước nghiệm
thu thủ công vì phụ thuộc hạn mức và tình trạng provider.

### Frontend

```powershell
cd frontend
npm ci
npm run lint
$env:NEXT_PUBLIC_API_BASE_URL = 'http://localhost:3001/api/v1'
npm run build
```

### Container

```powershell
$env:JWT_SECRET = 'local-placeholder-at-least-32-characters'
docker compose config --quiet
docker compose build
```

## Bật branch protection

Sau khi workflow đã chạy xanh trên một Pull Request thật, cấu hình rule cho
`develop` trong phần cài đặt repository:

1. Bắt buộc Pull Request trước khi merge.
2. Bắt buộc ít nhất một thành viên khác approve.
3. Bắt buộc branch phải cập nhật với `develop` trước khi merge.
4. Bật sáu status check trong bảng ở trên.
5. Không cho bỏ qua các yêu cầu này khi merge thông thường.

Không chọn live VNStock, live RSS hoặc live AI làm required check. Các nguồn bên
ngoài có thể lỗi mạng, đổi response hoặc hết hạn mức dù code trong Pull Request vẫn
đúng.

## Khi một check thất bại

- `Backend quality`: chạy lại đúng lệnh lint, format, test hoặc build đang đỏ; không
  sửa bằng cách tắt rule hay bỏ qua test.
- `Backend PostgreSQL integration`: xem log PostgreSQL trước, sau đó log migration,
  seed, schema check và E2E theo đúng thứ tự.
- `Crawler offline`: xác định test fixture nào sai; không bật mạng để làm test xanh.
- `AI Service quality`: kiểm tra dependency, syntax và unit test; test live bị skip là
  hành vi đúng.
- `Frontend quality`: sửa toàn bộ ESLint error rồi chạy production build.
- `Container build`: chạy `docker compose config --quiet`, sau đó build riêng image
  bị lỗi để có log ngắn hơn.

## Checklist nghiệm thu B8

- [x] Workflow không chứa API key hoặc secret thật.
- [x] Quality command không tự sửa file source.
- [x] PostgreSQL test dùng `pgvector` và database trắng tạm thời.
- [x] Migration chạy lần hai không tạo lỗi.
- [x] Crawler và AI Service mặc định không gọi dịch vụ live.
- [x] Migration được giữ trong Docker build context.
- [x] Các lệnh tương đương đã chạy xanh ở local, trừ Docker do máy local không có Docker Engine.
- [ ] Sáu check chạy xanh trên Pull Request thật.
- [ ] Branch protection của `develop` được bật sau khi GitHub nhận diện tên check.

Hai mục cuối cần thao tác trên GitHub sau khi push nhánh. Không thể xác nhận chúng chỉ
bằng commit local.

## Giới hạn chủ động

B8 không thêm hệ thống deploy, tự động merge, live smoke test hoặc công cụ giám sát.
Container gate chứng minh cấu hình hợp lệ và image build được; việc khởi động toàn bộ
stack từ database trắng thuộc runbook và nghiệm thu B9.
