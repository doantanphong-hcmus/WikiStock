<p align="center">
  <img width="512" height="512" alt="WikiStock" src="https://github.com/user-attachments/assets/a8964df1-3a7d-46d5-aace-be3e99bac071" />
</p>

<h1 align="center">WikiStock</h1>

<p align="center">
  <strong>Tra cứu doanh nghiệp. Hỏi bằng dữ liệu. Kiểm chứng tại nguồn.</strong>
</p>

<p align="center">
  Nền tảng tri thức về doanh nghiệp niêm yết Việt Nam, kết hợp dữ liệu có cấu trúc với AI có trích dẫn.
</p>

<p align="center">
  <a href="https://github.com/doantanphong-hcmus/WikiStock/actions?query=workflow%3A%22Release+gates%22+branch%3Adevelop"><img src="https://img.shields.io/badge/CI-release%20gates-2088FF?style=for-the-badge&logo=githubactions&logoColor=white" alt="CI release gates" /></a>
  <img src="https://img.shields.io/badge/Node.js-22-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js 22" />
  <img src="https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python 3.12" />
  <img src="https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL 16" />
  <img src="https://img.shields.io/badge/pgvector-vector%20search-7C3AED?style=for-the-badge&logo=postgresql&logoColor=white" alt="pgvector" />
</p>

## Lời cảm ơn

<table align="center">
  <tr>
    <td align="center" width="360">
      <a href="https://attacker2026.uel.edu.vn/competition/timeline#round-1-timeline">
        <img src="./assets/brand/attacker-2026-dark.png" alt="ATTACKER 2026" width="300" />
      </a>
      <br />
      <sub>ATTACKER 2026 · Student Fintech Challenge</sub>
    </td>
    <td align="center" width="220">
      <a href="https://hcmus.edu.vn/">
        <img src="./assets/brand/hcmus.png" alt="Trường Đại học Khoa học Tự nhiên, ĐHQG-HCM" height="100" />
      </a>
      <br />
      <sub>Trường Đại học Khoa học Tự nhiên, ĐHQG-HCM</sub>
    </td>
    <td align="center" width="220">
      <a href="https://www.uel.edu.vn/">
        <img src="./assets/brand/uel.png" alt="Trường Đại học Kinh tế - Luật, ĐHQG-HCM" height="100" />
      </a>
      <br />
      <sub>Trường Đại học Kinh tế - Luật, ĐHQG-HCM</sub>
    </td>
  </tr>
</table>

Nhóm trân trọng cảm ơn **giảng viên hướng dẫn** đã đồng hành bằng những phản biện về dữ liệu, tài chính, tính khả thi và trách nhiệm khi đưa AI vào một sản phẩm hỗ trợ tra cứu doanh nghiệp.

WikiStock được hình thành trong môi trường học tập và đổi mới sáng tạo của **Trường Đại học Khoa học Tự nhiên, ĐHQG-HCM** và **Trường Đại học Kinh tế - Luật, ĐHQG-HCM**. Nhóm cũng cảm ơn **Ban Tổ chức ATTACKER 2026** đã tạo cơ hội để dự án được đánh giá như một sản phẩm thực tế thay vì chỉ dừng ở phạm vi bài tập.

<sub>Logo ATTACKER 2026 do đội thi cung cấp; logo HCMUS và UEL được lấy từ website chính thức của hai trường. Quyền đối với hình ảnh nhận diện thuộc về các đơn vị tương ứng.</sub>

---

Thông tin về một doanh nghiệp niêm yết thường bị chia nhỏ giữa hồ sơ công ty, báo cáo tài chính, bảng số liệu và nhiều nguồn tin. Chatbot phổ thông có thể trả lời nhanh, nhưng người dùng vẫn khó biết con số đến từ tài liệu nào và có đúng với kỳ báo cáo đang hỏi hay không.

```text
Tra cứu rời rạc:   Nhiều nguồn → Tải tài liệu → Dò số liệu → Tự đối chiếu
Chatbot phổ thông: Câu hỏi → Câu trả lời → Khó xác định bằng chứng
WikiStock:         Doanh nghiệp → Bằng chứng → Câu trả lời → Tài liệu + trang + đoạn nguồn
```

WikiStock không xem AI là nguồn dữ liệu. AI chỉ là lớp giúp người dùng đặt câu hỏi bằng ngôn ngữ tự nhiên; báo cáo, số liệu và bài viết gốc mới là căn cứ để kiểm chứng kết quả.

## WikiStock giải quyết điều gì?

Người mới tìm hiểu chứng khoán thường gặp hai trở ngại cùng lúc: dữ liệu nằm rải rác và báo cáo tài chính khó đọc. Việc tìm một con số tưởng như đơn giản có thể yêu cầu mở nhiều tệp PDF, xác định đúng báo cáo hợp nhất, đúng quý, đúng đơn vị tính và đúng dòng chỉ tiêu.

WikiStock gom các lớp thông tin quan trọng của doanh nghiệp vào một nơi: hồ sơ, chỉ số tài chính, báo cáo nguồn và tin tức liên quan. Người dùng có thể bắt đầu từ mã chứng khoán, xem dữ liệu đã được chuẩn hóa hoặc đặt câu hỏi cho chatbot. Khi đủ bằng chứng, câu trả lời đi kèm tài liệu, số trang và đoạn nguồn để người dùng mở lại ngay tại nơi thông tin được công bố.

Nếu dữ liệu không đủ, hệ thống phải nói rõ giới hạn thay vì điền vào khoảng trống bằng suy đoán. Đây là điểm khác biệt cốt lõi của WikiStock: rút ngắn thời gian tra cứu nhưng không tách kết luận khỏi bằng chứng.

## Luồng hoạt động

![WikiStock — Hành trình tra cứu của người dùng](./assets/diagrams/wikistock-user-journey.png)

<sub>Các nhãn hiệu VNStock, VnExpress, Thanh Niên, Tuổi Trẻ, CafeBiz, VnEconomy, PostgreSQL và Claude được sử dụng để nhận diện những nguồn hoặc công nghệ được tích hợp trong WikiStock. Quyền đối với các nhãn hiệu thuộc về chủ sở hữu tương ứng; việc xuất hiện trong sơ đồ không hàm ý tài trợ, hợp tác hay chứng thực.</sub>

1. Người dùng đăng ký hoặc đăng nhập để sử dụng luồng trò chuyện có lưu lịch sử.
2. Người dùng tra cứu doanh nghiệp bằng mã chứng khoán như FPT, HPG hoặc GAS.
3. Trang doanh nghiệp tập hợp phần tổng quan, dữ liệu tài chính, báo cáo và tin tức liên quan.
4. Người dùng đặt câu hỏi bằng ngôn ngữ tự nhiên trong trang doanh nghiệp hoặc không gian chatbot.
5. WikiStock truy xuất các đoạn bằng chứng phù hợp với đúng doanh nghiệp và kỳ báo cáo.
6. Mô hình ngôn ngữ chỉ tạo câu trả lời từ ngữ cảnh được hệ thống cung cấp.
7. Backend kiểm tra và dựng liên kết trích dẫn đến đúng tài liệu, trang và đoạn nguồn.
8. Câu trả lời cùng trích dẫn được lưu vào phiên trò chuyện để người dùng hỏi tiếp hoặc xem lại.

Nếu không tìm thấy bằng chứng đạt ngưỡng, luồng phải trả về trạng thái không đủ cơ sở thay vì tạo một câu trả lời có vẻ chắc chắn.

## Chức năng chính

### Tra cứu hồ sơ doanh nghiệp

Người dùng có thể tìm doanh nghiệp theo mã chứng khoán và xem tên, sàn giao dịch, ngành, ngày niêm yết, website chính thức cùng phần giới thiệu tổng quan. Dữ liệu được chuẩn hóa ở Backend để Frontend không phải suy đoán cấu trúc từ từng nguồn riêng lẻ.

### Dữ liệu tài chính theo kỳ

WikiStock tổ chức báo cáo tài chính theo năm, quý, loại báo cáo và bộ chỉ tiêu. API hỗ trợ lọc đúng kỳ; giá trị thiếu không bị biến thành số 0 và dữ liệu trả về giữ nguyên đơn vị để tránh tạo ra so sánh sai.

### Tin tức doanh nghiệp từ RSS

Pipeline tin tức đọc RSS từ VnExpress, Thanh Niên, Tuổi Trẻ, CafeBiz và VnEconomy. Bài viết được chuẩn hóa, loại bỏ bản ghi trùng, đối chiếu doanh nghiệp bằng mã chứng khoán và alias, sau đó lưu mối liên hệ cùng mức độ phù hợp. URL bài viết phải đến từ nguồn thực tế; hệ thống không tự dựng liên kết theo phỏng đoán.

### Kho báo cáo và xử lý OCR

Tài liệu PDF được kiểm tra trước khi đưa vào pipeline. Những trang không có lớp văn bản đủ dùng được OCR, sau đó giữ lại thông tin trang để bước chia đoạn và trích dẫn không làm mất vị trí trong tài liệu gốc. Backfill cho phép nạp lại những tài liệu đã có mà không tạo bản ghi trùng.

### RAG và chatbot có trích dẫn

AI Service tạo embedding, truy xuất các đoạn gần nhất bằng PostgreSQL/pgvector và xây dựng ngữ cảnh cho mô hình ngôn ngữ. Câu trả lời được truyền dần về giao diện theo streaming. Người dùng không phải chờ toàn bộ nội dung hoàn tất mới bắt đầu đọc.

### Kiểm chứng tại tài liệu gốc

Citation không chỉ là một đoạn văn trang trí. Mỗi trích dẫn liên kết câu trả lời với tài liệu đã lưu, số trang và đoạn bằng chứng. Backend là nơi dựng URL nguồn; mô hình AI không được tự tạo đường dẫn hoặc tham chiếu đến tài liệu lạ.

### Tài khoản và lịch sử trò chuyện

Người dùng có thể đăng ký, đăng nhập, tạo phiên trò chuyện, hỏi tiếp theo ngữ cảnh trước đó và mở lại lịch sử sau khi đăng nhập lại. Mỗi người chỉ được truy cập các phiên thuộc tài khoản của mình.

### Vận hành và quản trị dữ liệu

Backend cung cấp API quản trị có bảo vệ để bổ sung doanh nghiệp và tài liệu. Migration, seed, kiểm tra schema, lịch chạy RSS, health check và runbook giúp môi trường demo có thể được dựng lại thay vì phụ thuộc vào trạng thái thủ công trên một máy cá nhân.

## Nguyên tắc bảo vệ hệ thống

| Nguyên tắc | Cách WikiStock áp dụng |
| --- | --- |
| Nguồn trước, câu trả lời sau | Câu trả lời tài chính phải bắt đầu từ dữ liệu truy xuất được, không bắt đầu từ trí nhớ của mô hình. |
| Không đủ bằng chứng thì không kết luận | Retrieval dưới ngưỡng hoặc thiếu citation hợp lệ phải trả về giới hạn rõ ràng. |
| AI không tự tạo nguồn | URL tài liệu và số trang được dựng từ bản ghi Backend đã kiểm tra. |
| Tách chế độ demo và provider thật | Kết quả demo không được dùng để chứng minh RAG hoặc AI live đang hoạt động. |
| Giữ đúng phạm vi doanh nghiệp | Bằng chứng phải thuộc đúng doanh nghiệp được hỏi; hội thoại tiếp theo kế thừa mã doanh nghiệp có kiểm soát. |
| Lịch sử thuộc về người dùng | API xác thực quyền sở hữu trước khi trả phiên hoặc tin nhắn trò chuyện. |
| Ingestion có thể chạy lại | Unique constraint và upsert ngăn crawler, RSS hoặc backfill tạo dữ liệu trùng. |
| Không che lỗi bằng câu trả lời giả | Lỗi provider, timeout hoặc lỗi bridge được trả thành trạng thái lỗi rõ ràng thay vì âm thầm dùng mock response. |

## Benchmark độ tin cậy đã xác minh

WikiStock chỉ công bố những chỉ số đã đạt ngưỡng trên bộ kiểm tra có đầu vào và kết quả kỳ vọng rõ ràng. Đây không phải số lượng test đơn thuần: mỗi tỷ lệ bên dưới đo một hành vi trực tiếp ảnh hưởng tới khả năng người dùng nhận đúng thông tin và tránh một kết luận thiếu căn cứ.

![WikiStock reliability benchmark](./assets/benchmarks/wikistock-reliability-benchmark.svg)

| Phép đo | Kết quả | Phạm vi kiểm tra |
| --- | ---: | --- |
| Ghép bài báo với đúng tập doanh nghiệp | **100% · 43/43** | 10 mã chứng khoán; tên doanh nghiệp, thương hiệu, mã có ngữ cảnh và bài nhắc nhiều doanh nghiệp |
| Loại bỏ trường hợp dễ nhận diện nhầm | **100% · 11/11** | Từ thông thường, mã thiết bị, mã sản phẩm, mã tệp và mã đứng ngoài ngữ cảnh tài chính |
| Từ chối an toàn khi không đủ căn cứ | **100% · 4/4** | Chạy với provider thật; gồm câu hỏi sai kỳ dữ liệu, giá tức thời và yêu cầu khuyến nghị mua cổ phiếu |
| Thời gian truy xuất bằng chứng p95 | **236,42 ms** | 19 truy vấn sau cold start; thấp hơn ngưỡng 300 ms khoảng **21,2%** |

### Phương pháp và khả năng tái lập

- Benchmark RSS dùng **exact-set accuracy**: kết quả chỉ được tính đúng khi toàn bộ danh sách doanh nghiệp dự đoán trùng khớp với đáp án, không thừa và không thiếu. Bộ dữ liệu gồm [43 tình huống công khai](https://github.com/doantanphong-hcmus/WikiStock/blob/develop/crawler/tests/fixtures/rss_match_cases.json).
- Benchmark RAG dùng [20 câu hỏi đánh giá](https://github.com/doantanphong-hcmus/WikiStock/blob/develop/ai-service/tests/fixtures/rag_evaluation.json). Chỉ số từ chối và thời gian truy xuất ở trên lấy từ [lần chạy live provider ngày 16/08/2026](https://github.com/doantanphong-hcmus/WikiStock/blob/develop/ai-service/reports/rag_evaluation_live.json), không lấy từ mock hoặc chế độ demo.
- Cold start được tách khỏi p95 để không trộn thời gian nạp mô hình với độ trễ của các lượt truy vấn đã sẵn sàng phục vụ.

```bash
# Kiểm tra lại 43 tình huống nhận diện doanh nghiệp trong tin RSS
cd crawler
python -m unittest tests.test_news_matcher -v

# Chạy lại bộ đánh giá RAG với provider thật sau khi cấu hình môi trường
cd ../ai-service
python -m app.evaluation --live-provider --output reports/rag_evaluation_live
```

> Benchmark này chỉ đại diện cho những lớp đã đạt ngưỡng, không được diễn giải thành “AI chính xác 100%”. Các chỉ số sinh câu trả lời và citation chưa đạt điều kiện phát hành vẫn được công khai trong [Rủi ro độ tin cậy AI sau R8](https://github.com/doantanphong-hcmus/WikiStock/blob/develop/docs/R8_POST_EVALUATION_RISK.md), thay vì bị trộn vào một điểm tổng hợp có thể gây hiểu lầm.

## Kiến trúc hệ thống

WikiStock tách giao diện, nghiệp vụ Backend, pipeline AI và các tác vụ thu thập dữ liệu để mỗi thành phần có thể kiểm thử độc lập nhưng vẫn dùng chung một nguồn dữ liệu có kiểm soát.

```text
Browser
   │
   ▼
Next.js Frontend
   │
   ▼
NestJS Backend API
   ├── Xác thực và lịch sử trò chuyện
   ├── Hồ sơ, tài chính, tin tức và tài liệu
   ├── PostgreSQL 16 + Prisma
   └── FastAPI AI Service
          ├── BGE-M3 embeddings
          ├── PostgreSQL + pgvector retrieval
          └── Claude-compatible AI provider

VNStock ───────┐
RSS báo chí ───┼──► Crawler / Matcher / Persistence ──► PostgreSQL
PDF báo cáo ───┴──► Preflight / OCR / Ingestion ──────► pgvector
```

Backend là điểm kiểm soát quyền truy cập và hợp đồng API. AI Service chỉ nhận câu hỏi cùng phạm vi doanh nghiệp, truy xuất bằng chứng và trả về nội dung theo contract. Frontend hiển thị câu trả lời, nhưng không tự suy đoán citation hoặc tạo fallback tài chính khi dịch vụ phía sau thất bại.

### Vì sao kiến trúc được chọn như vậy?

| Quyết định | Lý do |
| --- | --- |
| Tách AI Service khỏi Backend | Python phù hợp cho OCR, embedding và RAG; NestJS giữ API, xác thực và dữ liệu người dùng. |
| PostgreSQL là nguồn trạng thái chung | Dữ liệu doanh nghiệp, tài chính, tài liệu, vector, citation và hội thoại có thể kiểm tra bằng transaction và constraint. |
| pgvector thay cho một vector database riêng | Giảm một thành phần vận hành trong giai đoạn MVP và giữ metadata gần vector. |
| Backend dựng citation | Người dùng chỉ nhận liên kết đến tài liệu mà hệ thống thực sự quản lý. |
| Streaming qua một contract SSE | Frontend xử lý thống nhất các trạng thái bắt đầu, nội dung, hoàn tất và lỗi. |
| Crawler và ingestion chạy độc lập | Sự cố nguồn dữ liệu không làm gián đoạn API phục vụ người dùng đang hoạt động. |
| Fail closed khi thiếu bằng chứng | Một câu trả lời chậm hoặc bị từ chối an toàn hơn một kết luận tài chính không có căn cứ. |

## Công nghệ sử dụng

| Khu vực | Công nghệ |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Backend | Node.js 22, NestJS 11, Prisma 7, JWT, bcryptjs |
| AI và RAG | Python 3.12, FastAPI, sentence-transformers, BGE-M3, PyMuPDF, pgvector |
| Database | PostgreSQL 16, pgvector |
| Dữ liệu doanh nghiệp | VNStock 4.0.5, pandas, PostgreSQL |
| Tin tức | RSS, parser và company matcher nội bộ |
| Mô hình ngôn ngữ | Claude qua gateway tương thích API, có timeout và schema kiểm tra |
| Hạ tầng | Docker, Docker Compose, GitHub Actions |
| Kiểm thử | Jest, Supertest, Node.js Test Runner, Python unittest |

## Cấu trúc repository

```text
.
├── frontend/            # Next.js web application
├── backend/             # NestJS API, Prisma schema, migrations và tests
├── ai-service/          # FastAPI, OCR ingestion, retrieval và AI generation
├── crawler/             # VNStock, RSS ingestion và company matching
├── docs/                # API contract, runbook và giới hạn đã biết
├── scripts/ocr/         # Tiền xử lý tài liệu scan
├── assets/diagrams/     # Sơ đồ sử dụng trong README
├── docker-compose.yml   # Môi trường chạy tích hợp
├── .env.example         # Cấu hình mẫu, không chứa secret thật
└── README.md
```

> Nhánh `main` hiện đóng vai trò trang giới thiệu. Bản tích hợp end-to-end mới nhất nằm ở `develop` cho đến khi nhóm tạo bản phát hành ổn định.

## Khởi chạy bằng Docker Compose

### Yêu cầu

- Docker Engine và Docker Compose.
- Tối thiểu 8 GB RAM; lần chạy đầu có thể cần thêm thời gian để tải embedding model.
- AI API key nếu muốn kiểm thử provider thật. Không cần key nếu chỉ chạy chế độ `demo`.

### 1. Clone repository và chuyển sang nhánh tích hợp

```bash
git clone https://github.com/doantanphong-hcmus/WikiStock.git
cd WikiStock
git switch develop
```

### 2. Tạo file cấu hình

Trên macOS hoặc Linux:

```bash
cp .env.example .env
```

Trên PowerShell:

```powershell
Copy-Item .env.example .env
```

Mở `.env` và thay `JWT_SECRET` bằng chuỗi ngẫu nhiên dài ít nhất 32 ký tự. Không commit `.env`, API key hoặc token vào Git.

Chế độ mặc định không gọi provider AI:

```dotenv
AI_PROVIDER=demo
```

Để kiểm thử AI thật, đặt provider, base URL, model, cơ chế xác thực và key theo nhà cung cấp của bạn:

```dotenv
AI_PROVIDER=gateway
AI_API_BASE_URL=
AI_API_KEY=
AI_AUTH_SCHEME=bearer
AI_MODEL=
```

### 3. Khởi động hệ thống

```bash
docker compose up -d --build
docker compose ps --all
```

Compose chờ PostgreSQL sẵn sàng, chạy migration, seed lookup, kiểm tra pgvector rồi mới khởi động các dịch vụ phụ thuộc.

### 4. Mở ứng dụng và kiểm tra trạng thái

| Thành phần | Địa chỉ từ máy host |
| --- | --- |
| WikiStock Frontend | `http://localhost:3000` |
| Backend API | `http://localhost:3001/api/v1` |
| Backend health check | `http://localhost:3001/api/health` |
| AI Service | Chỉ mở trong mạng Compose tại `http://ai-service:8000` |
| PostgreSQL | Chỉ mở trong mạng Compose tại `postgres:5432` |

```bash
curl http://localhost:3001/api/health
```

### 5. Nạp dữ liệu RAG

Đặt các PDF được phép sử dụng tại đường dẫn cấu hình bởi `RAG_SEED_DATA_PATH`, sau đó làm theo [RAG Operations Runbook](https://github.com/doantanphong-hcmus/WikiStock/blob/develop/docs/RAG_OPERATIONS_RUNBOOK.md). Repository có bộ báo cáo mẫu cho FPT, GAS, HPG và HSG để kiểm tra luồng ingestion và citation.

### 6. Dừng hệ thống

```bash
docker compose down
```

Không thêm `-v` nếu muốn giữ dữ liệu PostgreSQL và model cache.

## Chạy native trên Windows

WikiStock có thể chạy không cần Docker nếu máy đã có PostgreSQL cùng pgvector, Node.js và Python. Thứ tự khởi động đúng là PostgreSQL → AI Service → Backend → Frontend.

Hướng dẫn chi tiết, biến môi trường và lệnh kiểm tra nằm trong [Backend V1 Runbook](https://github.com/doantanphong-hcmus/WikiStock/blob/develop/docs/BACKEND_V1_RUNBOOK.md).

Các cổng mặc định khi chạy native:

| Dịch vụ | Địa chỉ |
| --- | --- |
| Frontend | `http://localhost:3000` |
| Backend | `http://localhost:3001` |
| AI Service | `http://localhost:8000` |
| PostgreSQL | Theo `DATABASE_URL` trong `.env` |

## Kiểm tra chất lượng mã nguồn

GitHub Actions kiểm tra Backend, PostgreSQL integration, AI Service, Crawler, Frontend và quá trình build container trên pull request vào `develop` hoặc `main`.

### Backend

```bash
cd backend
npm ci
npx prisma generate
npm run lint:check
npm run format:check
npm test -- --runInBand
npm run build
```

Để chạy E2E với PostgreSQL test riêng:

```bash
npm run db:bootstrap
npm run test:e2e -- --runInBand
```

### AI Service

```bash
cd ai-service
python -m pip install -r requirements.txt
python -m compileall -q app main.py
python -m unittest discover -s tests -v
```

### Crawler

```bash
cd crawler
python -m pip install -r requirements.txt
python -m compileall -q .
python -m unittest discover -s tests -v
```

### Frontend

```bash
cd frontend
npm ci
npm test
npm run lint
npm run build
```

## Tài liệu vận hành

- [API contract](https://github.com/doantanphong-hcmus/WikiStock/blob/develop/docs/API_CONTRACT.md)
- [AI streaming contract](https://github.com/doantanphong-hcmus/WikiStock/blob/develop/docs/AI_STREAMING_CONTRACT.md)
- [Checklist demo chatbot](https://github.com/doantanphong-hcmus/WikiStock/blob/develop/docs/CHAT_CUSTOMER_DEMO_CHECKLIST.md)
- [Backend V1 runbook](https://github.com/doantanphong-hcmus/WikiStock/blob/develop/docs/BACKEND_V1_RUNBOOK.md)
- [RAG operations runbook](https://github.com/doantanphong-hcmus/WikiStock/blob/develop/docs/RAG_OPERATIONS_RUNBOOK.md)
- [RSS news operations runbook](https://github.com/doantanphong-hcmus/WikiStock/blob/develop/docs/RSS_NEWS_OPERATIONS_RUNBOOK.md)
- [Giới hạn đã biết của RAG](https://github.com/doantanphong-hcmus/WikiStock/blob/develop/docs/RAG_KNOWN_LIMITATIONS.md)
- [Cổng kiểm tra trước khi phát hành](https://github.com/doantanphong-hcmus/WikiStock/blob/develop/docs/CI_RELEASE_GATES.md)

## Đội ngũ phát triển

| Thành viên | Vai trò | Đơn vị |
| --- | --- | --- |
| Nguyễn Việt Thắng | Data Engineer / DevOps | Trường Đại học Khoa học Tự nhiên, ĐHQG-HCM |
| Đoàn Tấn Phong | Data Scientist / ML Engineer | Trường Đại học Khoa học Tự nhiên, ĐHQG-HCM |
| Phan Lê Thành Nhân | Fullstack Developer | Trường Đại học Khoa học Tự nhiên, ĐHQG-HCM |
| Võ Ngọc Bảo Trân | Business Analyst / UI/UX / QA | Trường Đại học Khoa học Tự nhiên, ĐHQG-HCM |
| Nguyễn Như Quỳnh | Product Owner / Nghiệp vụ tài chính | Trường Đại học Kinh tế - Luật, ĐHQG-HCM |

## Trạng thái dự án

WikiStock hiện là MVP có thể chạy end-to-end: dữ liệu doanh nghiệp được thu thập và chuẩn hóa, báo cáo PDF được OCR và lập chỉ mục, Backend phục vụ dữ liệu thật, người dùng có thể đăng ký và trò chuyện theo kiểu streaming, còn câu trả lời được lưu cùng citation để mở lại tài liệu nguồn.

Phạm vi dữ liệu hiện vẫn là phạm vi demo có kiểm soát, chưa đại diện cho toàn bộ thị trường chứng khoán Việt Nam. Chất lượng câu trả lời phụ thuộc vào độ đầy đủ của tài liệu, kết quả OCR, retrieval và provider AI. Vì vậy, việc có citation làm tăng khả năng kiểm chứng nhưng không phải cam kết loại bỏ hoàn toàn sai sót.

### Phạm vi chưa tuyên bố

WikiStock không phải sàn giao dịch, không quản lý tài sản, không dự đoán giá cổ phiếu và không đưa ra khuyến nghị mua hoặc bán. Nền tảng không thay thế báo cáo công bố chính thức, chuyên gia phân tích, kiểm toán viên hoặc cố vấn tài chính.

Trước khi triển khai thương mại, dự án cần tiếp tục mở rộng độ phủ dữ liệu, đánh giá pháp lý đối với từng nguồn, diễn tập backup/restore, quản lý secret theo hạ tầng, giám sát tập trung, kiểm thử tải và kiểm định chất lượng tài chính bằng bộ dữ liệu độc lập.

Sự minh bạch này là một phần của sản phẩm: WikiStock giúp người dùng tìm và kiểm tra thông tin nhanh hơn, không đưa ra quyết định đầu tư thay họ.

## Phạm vi sử dụng mã nguồn

Repository hiện chưa công bố giấy phép mã nguồn mở. Không mặc định sao chép, phân phối hoặc sử dụng thương mại mã nguồn nếu chưa có sự đồng ý của nhóm tác giả.

## 🙏 Cảm ơn những người đã xây dựng WikiStock

WikiStock không phải dự án mã nguồn mở, nhưng sản phẩm là kết quả từ công sức chung của cả đội. Cảm ơn những thành viên đã trực tiếp tham gia nghiên cứu, thiết kế, phát triển, kiểm thử và vận hành dự án:

<table align="center">
  <tr>
    <td align="center" width="180">
      <a href="https://github.com/NguyenVietThang2303">
        <img src="https://avatars.githubusercontent.com/u/242140816?v=4&amp;s=192" width="96" height="96" alt="Nguyễn Việt Thắng" />
        <br />
        <sub><b>Nguyễn Việt Thắng</b></sub>
        <br />
        <sub>@NguyenVietThang2303</sub>
      </a>
    </td>
    <td align="center" width="180">
      <a href="https://github.com/doantanphong-hcmus">
        <img src="https://avatars.githubusercontent.com/u/205402007?v=4&amp;s=192" width="96" height="96" alt="Đoàn Tấn Phong" />
        <br />
        <sub><b>Đoàn Tấn Phong</b></sub>
        <br />
        <sub>@doantanphong-hcmus</sub>
      </a>
    </td>
    <td align="center" width="180">
      <a href="https://github.com/Congahoccode">
        <img src="https://avatars.githubusercontent.com/u/141097890?v=4&amp;s=192" width="96" height="96" alt="Phan Lê Thành Nhân" />
        <br />
        <sub><b>Phan Lê Thành Nhân</b></sub>
        <br />
        <sub>@Congahoccode</sub>
      </a>
    </td>
    <td align="center" width="180">
      <a href="https://github.com/BaroTrun">
        <img src="https://avatars.githubusercontent.com/u/248502507?v=4&amp;s=192" width="96" height="96" alt="Võ Ngọc Bảo Trân" />
        <br />
        <sub><b>Võ Ngọc Bảo Trân</b></sub>
        <br />
        <sub>@BaroTrun</sub>
      </a>
    </td>
    <td align="center" width="180">
      <a href="https://github.com/quynhnnk25406-wq">
        <img src="https://avatars.githubusercontent.com/u/259352800?v=4&amp;s=192" width="96" height="96" alt="Nguyễn Như Quỳnh" />
        <br />
        <sub><b>Nguyễn Như Quỳnh</b></sub>
        <br />
        <sub>@quynhnnk25406-wq</sub>
      </a>
    </td>
  </tr>
</table>

<p align="center">
  <sub>Danh sách ghi nhận đóng góp theo vai trò trong dự án.</sub>
</p>

---

<p align="center">
  Sản phẩm được phát triển bởi nhóm ULESER cho ATTACKER 2026.
</p>
