# CI Checks

Tài liệu này mô tả các job CI bắt buộc trong repo WikiStock, lệnh chạy tương đương ở
local, cách xử lý khi một check fail, quy tắc đặt tên branch / commit message /
PR title, và test plan chứng minh 14 case được bảo vệ.

Tất cả workflow nằm trong `.github/workflows/`:

- `policy.yml` — Repository Policy
- `ci.yml` — Backend Quality, Frontend Quality, AI Service Quality, Container Build
- `security.yml` — Secret Scan

Tất cả đều trigger bằng `pull_request` vào `develop` hoặc `main`, dùng
`concurrency.cancel-in-progress: true` để tránh chạy chồng job cũ khi tác giả push
commit mới lên cùng PR.

---

## 1. Bảng job và mục đích

| Job                   | File / Workflow | Mục đích                                                                                        | Timeout |
| --------------------- | --------------- | ----------------------------------------------------------------------------------------------- | ------- |
| `repository-policy`   | `policy.yml`    | Branch / commit / PR title regex, whitespace + conflict marker, tracked secret, schema coupling, API contract coupling, PR target branch. | 5 min   |
| `backend-quality`     | `ci.yml`        | `npm ci`, `prisma validate`, `prisma generate`, `lint:check`, `format:check`, `npm test`, `npm run build`, kiểm tra worktree sạch. | 15 min  |
| `frontend-quality`    | `ci.yml`        | `npm ci`, `npm run lint`, `npm run build` với `NEXT_PUBLIC_API_BASE_URL` placeholder.            | 15 min  |
| `ai-service-quality`  | `ci.yml`        | `python -m compileall .` cho `ai-service`. Cố tình không cài `requirements.txt` để giữ CI nhẹ.   | 10 min  |
| `container-build`     | `ci.yml`        | `docker compose config` + BuildKit GHA cache cho 3 image (backend, ai-service, frontend).        | 30 min  |
| `secret-scan`         | `security.yml`  | Gitleaks quét history PR. `permissions: contents: read` (không `packages: write`).               | 10 min  |

---

## 2. Lệnh local tương đương

### 2.1. Repository Policy

Không có lệnh local chính xác một-một vì job này phụ thuộc vào GitHub metadata
(`github.head_ref`, `github.event.pull_request.title`, merge-base so với base).
Tuy nhiên có thể mô phỏng từng phần:

```bash
# Branch name check
echo "$HEAD" | grep -Eq '^(feat|fix|chore|docs|refactor|test|perf|build|ci|hotfix|release)/[a-z0-9._-]+$'

# Commit message check (mọi commit trong PR)
git fetch origin "$BASE" --depth=1
MERGE_BASE=$(git merge-base HEAD "origin/$BASE")
git log --pretty=%s "${MERGE_BASE}..HEAD" | while read s; do
  echo "$s" | grep -Eq '^(feat|fix|chore|docs|refactor|test|perf|build|ci|style|revert)(\([a-zA-Z0-9._-]+\))?!?: .+'
done

# PR title check
gh pr view --json title -q '.title' | grep -Eq '^(feat|fix|chore|docs|refactor|test|perf|build|ci|style|revert)(\([a-zA-Z0-9._-]+\))?!?: .+'

# Whitespace + conflict marker
git diff --check "origin/$BASE...HEAD"

# Tracked secret files
git ls-files | grep -E '\.env$|\.env\.local$|credentials\.json$|\.npmrc$|\.pypirc$'
git ls-files | xargs grep -lE -- '-----BEGIN [A-Z ]*PRIVATE KEY-----|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}'

# Schema coupling
git diff --name-only "${MERGE_BASE}..HEAD" | grep -E '^(schema\.sql|backend/prisma/schema\.prisma)$'

# API contract coupling
git diff --name-only "${MERGE_BASE}..HEAD" | grep -E '^(backend/src/common/types/api\.types\.ts|docs/API_CONTRACT\.md)$'
```

### 2.2. Backend Quality

```bash
cd backend
npm ci
DATABASE_URL='postgresql://postgres:postgres@localhost:5432/wikistock?schema=public' \
JWT_SECRET='ci-placeholder-secret' \
JWT_EXPIRES_IN_SECONDS='3600' \
AI_SERVICE_URL='http://localhost:8000' \
FRONTEND_URL='http://localhost:3000' \
bash -c '
  npx prisma validate
  npx prisma generate
  npm run lint:check
  npm run format:check
  npm test -- --runInBand
  npm run build
  git diff --exit-code
'
```

### 2.3. Frontend Quality

```bash
cd frontend
npm ci
npm run lint
NEXT_PUBLIC_API_BASE_URL='http://localhost:3001/api/v1' npm run build
```

### 2.4. AI Service Quality

```bash
cd ai-service
python -m compileall .
```

### 2.5. Container Build

```bash
docker compose config
docker buildx build --load --cache-from type=gha --cache-to type=gha,mode=max \
  -t wikistock/backend:local ./backend
docker buildx build --load --cache-from type=gha --cache-to type=gha,mode=max \
  -t wikistock/ai-service:local ./ai-service
docker buildx build --load --cache-from type=gha --cache-to type=gha,mode=max \
  --build-arg NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api/v1 \
  -t wikistock/frontend:local ./frontend
```

### 2.6. Secret Scan

```bash
# Local: dùng gitleaks binary
gitleaks detect --source . --no-banner
```

---

## 3. Xử lý khi check đỏ

### 3.1. `repository-policy` fail

- **Branch name** → đổi branch về dạng `feat/<slug>`, `fix/<slug>`, v.v.
- **Commit message** → dùng `git rebase -i` (hoặc `git commit --amend`) để sửa
  từng subject về dạng `feat: short summary`. Repo không cho phép interactive
  rebase trong CI, làm local rồi force-push.
- **PR title** → `gh pr edit --title "feat: short summary"`.
- **`git diff --check`** → mở file có trailing whitespace hoặc conflict marker
  (`<<<<<<<`, `=======`, `>>>>>>>`), xoá. Editor thường highlight trailing space.
- **Tracked secret files** → xoá file khỏi index (`git rm --cached .env`) và
  đảm bảo nó có trong `.gitignore`. Đổi mọi secret đã leak.
- **Schema coupling** → nếu sửa `schema.sql` phải kéo theo `backend/prisma/schema.prisma`,
  và ngược lại.
- **API contract coupling** → sửa `backend/src/common/types/api.types.ts` thì
  phải cập nhật `docs/API_CONTRACT.md` (và ngược lại).
- **PR target main** → nếu PR đang target `main` mà head không phải `develop`
  hay `hotfix/*`, đổi base ref về `develop` (hoặc đổi branch sang `hotfix/...`).

### 3.2. `backend-quality` fail

- **`lint:check` đỏ** → chạy `npm run lint` (có `--fix`) trong `backend/`, commit
  lại.
- **`format:check` đỏ** → chạy `npm run format` (`prettier --write`), commit lại.
- **`prisma validate` / `prisma generate` đỏ** → đồng bộ `schema.prisma` với
  `schema.sql` (xem mục 3.1).
- **`npm test` đỏ** → chạy local `npm test -- --runInBand`, đọc stack trace,
  sửa root cause, không `it.skip`.
- **`npm run build` đỏ** → thường là type error; `npx tsc --noEmit` cho nhanh.
- **`git diff --exit-code` đỏ** → chính job đã tạo file (thường là `dist/` chưa
  có trong `.gitignore`). Nếu là build artifact, thêm vào `.gitignore`.

### 3.3. `frontend-quality` fail

- **`npm run lint` đỏ** → sửa theo gợi ý, không `eslint-disable` tùy tiện.
- **`npm run build` đỏ** → thường là type error hoặc missing import; Next.js
  in stack trace rõ ràng.

### 3.4. `ai-service-quality` fail

- **`compileall` đỏ** → file Python có syntax error; sửa ngay. Lưu ý repo này
  dùng Next.js đặc biệt ở frontend, không liên quan Python.

### 3.5. `container-build` fail

- **`docker compose config` đỏ** → syntax YAML hoặc biến môi trường sai.
- **Image build fail** → chạy local với cùng `docker buildx build` để xem log;
  nguyên nhân thường là Dockerfile sai (`FORM` thay vì `FROM`) hoặc thiếu
  `package-lock.json`.

### 3.6. `secret-scan` fail

- Gitleaks tìm thấy pattern giống secret → xoá khỏi file, **đổi secret ngay**
  vì lịch sử git vẫn lưu. Nếu là test fixture cố ý, dùng placeholder rõ ràng
  (`EXAMPLE_TOKEN`) thay vì chuỗi trông giống secret thật.

---

## 4. Quy tắc branch name / commit message / PR title

### 4.1. Branch name

Regex:

```text
^(feat|fix|chore|docs|refactor|test|perf|build|ci|hotfix|release)/[a-z0-9._-]+$
```

Ví dụ pass:

- `feat/company-profile-api`
- `fix/ai-timeout-fallback`
- `docs/coding-convention`
- `ci/setup-github-actions`
- `hotfix/prod-jwt-secret`

Ví dụ fail:

- `feature/company-profile-api` (sai prefix, phải là `feat`)
- `feat/CompanyProfile` (chữ hoa)
- `feat/company profile api` (có dấu cách)
- `update-readme` (thiếu prefix)

### 4.2. Commit message (Conventional Commits)

Regex (subject):

```text
^(feat|fix|chore|docs|refactor|test|perf|build|ci|style|revert)(\([a-zA-Z0-9._-]+\))?!?: .+
```

Ví dụ pass:

- `feat: add company profile API`
- `fix(ai): handle missing financial report`
- `docs!: add coding convention`
- `chore: bump prisma to 7.9`

Ví dụ fail:

- `update readme` (thiếu prefix)
- `Feat: new api` (chữ hoa ở prefix)
- `feat:add api` (thiếu khoảng trắng sau `:`)
- `feat add api` (thiếu `:`)

### 4.3. PR title

Cùng regex commit message. Job `repository-policy` đọc `github.event.pull_request.title`.

Ví dụ pass:

- `feat: add company profile API`
- `fix(ai): handle missing financial report`

Ví dụ fail:

- `Add company profile API`
- `feat/add-company-profile-api`

### 4.4. PR target branch

- Base `develop` → bất kỳ branch nào theo regex mục 4.1.
- Base `main` → head phải là `develop` hoặc `hotfix/<slug>`.

---

## 5. Test plan — 14 case

Mỗi case tạo một commit tạm (hoặc đổi branch tạm) trên probe PR, quan sát job
đỏ/xanh, revert ngay, không để lỗi giả tồn đọng trong lịch sử merge.

| #   | Cách tạo lỗi tạm                                                                              | Job dự kiến đỏ                       | Cách revert                                                       |
| --- | ---------------------------------------------------------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------- |
| 1   | Đổi branch PR thành `update-readme` (sai regex branch)                                         | `repository-policy`                  | Đổi lại branch đúng regex                                        |
| 2   | Đổi branch thành `feat/CapitalCase-API` (sai regex do chữ hoa)                                 | `repository-policy`                  | Đổi lại branch                                                    |
| 3   | Commit message `update readme` (không theo Conventional Commits)                                | `repository-policy`                  | `git commit --amend` hoặc `git rebase -i` rồi force-push           |
| 4   | PR title `Add company profile API` (không theo Conventional Commits)                           | `repository-policy`                  | `gh pr edit --title "feat: add company profile API"`              |
| 5   | Thêm một dòng có trailing space vào bất kỳ file text                                           | `repository-policy`                  | Xoá trailing space, commit lại                                   |
| 6   | `git add -f .env` rồi commit                                                                   | `repository-policy` + `secret-scan`  | `git rm --cached .env`, commit lại                                |
| 7   | Chỉ sửa `schema.sql`, không sửa `backend/prisma/schema.prisma`                                 | `repository-policy`                  | Revert và sửa cả hai, hoặc chỉ giữ thay đổi ở `.prisma`           |
| 8   | Chỉ sửa `backend/src/common/types/api.types.ts`, không sửa `docs/API_CONTRACT.md`              | `repository-policy`                  | Revert và cập nhật cả hai                                        |
| 9   | Cố ý vi phạm eslint rule trong `backend/src/`                                                  | `backend-quality` (`lint:check`)     | `npm run lint` để auto-fix, commit lại                            |
| 10  | Sửa 1 test trong `backend/src/**` cho fail                                                     | `backend-quality` (`npm test`)       | Revert commit đó                                                 |
| 11  | Thêm lỗi TS type / eslint ở `frontend/src/`                                                    | `frontend-quality`                   | Revert commit đó                                                 |
| 12  | Thêm một file `ai-service/broken.py` với syntax sai                                            | `ai-service-quality` (`compileall`)  | `git rm` file đó                                                 |
| 13  | Sửa `backend/Dockerfile` thành `FORM` thay vì `FROM`                                           | `container-build`                    | Revert commit đó                                                 |
| 14  | PR sạch, không lỗi gì                                                                          | Cả 6 job xanh                        | —                                                                 |

Sau khi chứng minh đủ 14 case, revert toàn bộ commit tạm trước khi merge thật.
Probe PR chỉ dùng để quan sát; squash hoặc close nó sau khi xong.

---

## 6. Khi nào cần mở rộng CI

- Khi RAG test suite xuất hiện: đổi `ai-service-quality` sang `pip install
  -r requirements.txt` + `pytest` với fake provider (xem comment trong
  `ci.yml`). Hiện tại cố tình giữ baseline ở `compileall` để tránh kéo theo
  download BGE-M3 trong mỗi PR.
- Khi backend test cần Postgres thật: thêm service container `postgres` vào
  job `backend-quality` (chưa cần ở skeleton hiện tại vì test chưa chạm DB).
- Khi frontend cần Playwright/E2E: tách thành job riêng có timeout riêng, đừng
  nhét vào `frontend-quality`.
