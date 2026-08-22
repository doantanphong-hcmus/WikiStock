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
  <a href="https://github.com/doantanphong-hcmus/WikiStock/actions?query=workflow%3A%22Release+gates%22+branch%3Amain"><img src="https://img.shields.io/badge/CI-release%20gates-2088FF?style=for-the-badge&logo=githubactions&logoColor=white" alt="CI release gates" /></a>
  <img src="https://img.shields.io/badge/Node.js-22-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js 22" />
  <img src="https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python 3.12" />
  <img src="https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL 16" />
  <img src="https://img.shields.io/badge/pgvector-vector%20search-7C3AED?style=for-the-badge&logo=postgresql&logoColor=white" alt="pgvector" />
</p>

<p align="center">
  <sub>ATTACKER 2026 · Mã nguồn chạy và tài liệu mới nhất của WikiStock được duy trì trên nhánh <a href="https://github.com/doantanphong-hcmus/WikiStock/tree/main"><code>main</code></a>.</sub>
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

Nhóm trân trọng cảm ơn **giảng viên hướng dẫn, ThS. Nguyễn Hữu Toàn - giảng viên Khoa Toán, Trường Đại học Khoa học Tự nhiên, ĐHQG-TP.HCM** đã đồng hành bằng những phản biện về dữ liệu, tài chính, tính khả thi và trách nhiệm khi đưa AI vào một sản phẩm hỗ trợ tra cứu doanh nghiệp.

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

![WikiStock - Hành trình tra cứu của người dùng](./assets/diagrams/wikistock-user-journey.png)

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

- Benchmark RSS dùng **exact-set accuracy**: kết quả chỉ được tính đúng khi toàn bộ danh sách doanh nghiệp dự đoán trùng khớp với đáp án, không thừa và không thiếu. Bộ dữ liệu gồm [43 tình huống công khai](https://github.com/doantanphong-hcmus/WikiStock/blob/main/crawler/tests/fixtures/rss_match_cases.json).
- Benchmark RAG dùng [20 câu hỏi đánh giá](https://github.com/doantanphong-hcmus/WikiStock/blob/main/ai-service/tests/fixtures/rag_evaluation.json). Chỉ số từ chối và thời gian truy xuất ở trên lấy từ [lần chạy live provider ngày 16/08/2026](https://github.com/doantanphong-hcmus/WikiStock/blob/main/ai-service/reports/rag_evaluation_live.json), không lấy từ mock hoặc chế độ demo.
- Cold start được tách khỏi p95 để không trộn thời gian nạp mô hình với độ trễ của các lượt truy vấn đã sẵn sàng phục vụ.

```bash
# Kiểm tra lại 43 tình huống nhận diện doanh nghiệp trong tin RSS
cd crawler
python -m unittest tests.test_news_matcher -v

# Chạy lại bộ đánh giá RAG với provider thật sau khi cấu hình môi trường
cd ../ai-service
python -m app.evaluation --live-provider --output reports/rag_evaluation_live
```

> Benchmark này chỉ đại diện cho những lớp đã đạt ngưỡng, không được diễn giải thành “AI chính xác 100%”. Các chỉ số sinh câu trả lời và citation chưa đạt điều kiện phát hành vẫn được công khai trong [Rủi ro độ tin cậy AI sau R8](https://github.com/doantanphong-hcmus/WikiStock/blob/main/docs/R8_POST_EVALUATION_RISK.md), thay vì bị trộn vào một điểm tổng hợp có thể gây hiểu lầm.

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

> Nhánh `main` là nguồn chính thức để clone, cài đặt và chạy phiên bản WikiStock hiện tại.

## Bắt đầu từ một bản clone sạch

WikiStock không phải một ứng dụng chỉ cần mở Frontend là có sẵn toàn bộ dữ liệu. Một lần dựng đầy đủ gồm ba mốc độc lập:

| Mốc | Khi nào được xem là đạt? | Nếu chưa đạt thì người dùng thấy gì? |
| --- | --- | --- |
| **1. Hạ tầng sẵn sàng** | PostgreSQL, AI Service, Backend và Frontend đều chạy; migration hoàn tất | Website không mở được hoặc API báo lỗi |
| **2. Dữ liệu nghiệp vụ sẵn sàng** | Crawler đã nạp hồ sơ, tài chính và tin tức | Website mở được nhưng một số trang doanh nghiệp còn ít hoặc chưa có dữ liệu |
| **3. RAG và AI thật sẵn sàng** | PDF đã qua OCR, được lập chỉ mục và gateway AI có key hợp lệ | Tra cứu doanh nghiệp vẫn dùng được, nhưng chatbot không thể trả lời có nguồn từ báo cáo |

Docker Compose là đường chạy được khuyến nghị vì nó dựng sẵn PostgreSQL có `pgvector`, chạy migration và nối đúng các dịch vụ. Python trên máy host chỉ cần thiết khi muốn chạy crawler hoặc tiền xử lý OCR.

### Điều kiện tối thiểu

| Công cụ | Dùng để làm gì? | Bắt buộc khi nào? |
| --- | --- | --- |
| Git | Tải mã nguồn và chuyển nhánh | Luôn cần |
| Docker Engine và Docker Compose V2 | Chạy toàn bộ hệ thống | Cần cho cách chạy khuyến nghị |
| Khoảng 8 GB RAM trống | Chạy các container và embedding model BGE-M3 | Cần nếu nạp dữ liệu RAG |
| Node.js 22 | Cài và chạy Backend/Frontend | Chỉ cần khi chạy native, Docker đã có Node trong image |
| Python 3.12 x64 | Chạy crawler và OCR trên máy host | Chỉ cần khi nạp/cập nhật dữ liệu |
| Client API key | Gọi mô hình AI thật | Chỉ cần khi kiểm thử chatbot online |

Kiểm tra nhanh:

```bash
git --version
docker --version
docker compose version
```

### Các file cài thư viện nằm ở đâu?

WikiStock gồm nhiều ứng dụng nên không dùng một `requirements.txt` chung cho toàn repository. Mỗi thành phần chỉ cài đúng thư viện nó cần:

| Thành phần | File dependency | Nội dung chính |
| --- | --- | --- |
| AI Service | `ai-service/requirements.txt` | FastAPI, PostgreSQL/pgvector, đọc PDF và BGE-M3 |
| Crawler | `crawler/requirements.txt` | VNStock, RSS, pandas và PostgreSQL |
| Backend | `backend/package-lock.json` | NestJS, Prisma, xác thực và API |
| Frontend | `frontend/package-lock.json` | Next.js, React và giao diện |

Nếu chạy bằng Docker, các Dockerfile tự đọc bốn file này trong lúc build. **Không cần tạo `venv`, không cần chạy `pip install` và không cần chạy `npm install` trên máy host.**

Nếu chạy native, sử dụng đúng khối lệnh tại mục [Chạy native trên Windows](#chạy-native-trên-windows). Khối đó tạo một `venv` dùng chung và cài toàn bộ dependency Python lẫn Node trong một lượt.

### Bước 1 - Clone nhánh `main`

```bash
git clone https://github.com/doantanphong-hcmus/WikiStock.git
cd WikiStock
git switch main
git pull --ff-only origin main
```

`main` chứa phiên bản chính thức dùng để cài đặt và chạy Frontend, Backend, AI Service cùng crawler. Có thể kiểm tra lại nhánh hiện tại bằng:

```bash
git branch --show-current
```

Kết quả mong đợi là `main`.

### Bước 2 - Tạo `.env` và secret local

PowerShell:

```powershell
Copy-Item .env.example .env
$rng = [Security.Cryptography.RandomNumberGenerator]::Create()
$bytes = New-Object byte[] 32
$rng.GetBytes($bytes)
$jwtSecret = [BitConverter]::ToString($bytes).Replace('-', '').ToLowerInvariant()
$rng.Dispose()
$jwtSecret
```

macOS hoặc Linux:

```bash
cp .env.example .env
openssl rand -hex 32
```

Mở `.env`, thay giá trị của `JWT_SECRET` bằng chuỗi vừa tạo. File `.env` là cấu hình riêng của máy đang chạy và có thể chứa API key; **không commit, chụp màn hình hoặc gửi file này lên issue/PR**.

Với lần mở ứng dụng đầu tiên, chưa cần thay các biến khác. Cấu hình mặc định dùng database trong Docker và không gọi nhà cung cấp AI bên ngoài.

### Bước 3 - Khởi động hạ tầng

```bash
docker compose config --quiet
docker compose up -d --build
docker compose ps --all
```

Lần đầu có thể lâu hơn vì Docker phải build image và tải dependency. Compose sẽ thực hiện lần lượt:

1. Khởi động PostgreSQL có `pgvector`.
2. Chờ database sẵn sàng.
3. Chạy Prisma migration, seed dữ liệu nền và kiểm tra schema.
4. Khởi động AI Service, Backend và Frontend.

Container `db-migrate` có trạng thái `Exited (0)` là **bình thường**: đây là tác vụ chạy một lần rồi kết thúc. Các container `postgres`, `ai-service`, `backend` và `frontend` mới là các dịch vụ cần tiếp tục chạy.

### Bước 4 - Xác nhận hệ thống đã sẵn sàng

| Thành phần | Địa chỉ trên máy đang chạy Docker | Kết quả mong đợi |
| --- | --- | --- |
| WikiStock | `http://localhost:3000` | Mở được giao diện |
| Backend health | `http://localhost:3001/api/health` | Trạng thái `ready`, database khả dụng |
| Backend API | `http://localhost:3001/api/v1` | API gốc của ứng dụng |
| AI Service health | `http://localhost:8000/health` | Service phản hồi bình thường |
| PostgreSQL | `localhost:5432` | Dành cho crawler và công cụ quản trị local |

PowerShell:

```powershell
Invoke-RestMethod http://localhost:3001/api/health
Invoke-RestMethod http://localhost:8000/health
```

macOS hoặc Linux:

```bash
curl http://localhost:3001/api/health
curl http://localhost:8000/health
```

Nếu health check lỗi, xem log trước khi chạy lại nhiều lần:

```bash
docker compose logs --tail 100 db-migrate postgres ai-service backend frontend
```

### Bước 5 - Hiểu dữ liệu có sẵn sau lần chạy đầu

Migration và seed tạo schema, vai trò người dùng, các danh mục tài chính, nguồn dữ liệu và bốn doanh nghiệp mẫu `FPT`, `GAS`, `HPG`, `HSG`. Nó **không tự gọi VNStock, không tải RSS và không tự OCR/lập chỉ mục báo cáo**.

Vì vậy, một database sạch có thể hiển thị tên doanh nghiệp nhưng chưa có đủ chỉ số tài chính, tin tức hoặc nguồn cho chatbot. Đây là trạng thái chưa nạp dữ liệu, không phải lỗi giao diện.

#### Nạp hồ sơ, tài chính và tin tức

Crawler chạy trên máy host và kết nối PostgreSQL qua `localhost:5432`:

```powershell
Copy-Item crawler\.env.example crawler\.env
cd crawler
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe check_requirements.py
.\.venv\Scripts\python.exe main.py --ticker FPT
cd ..
```

Nên nghiệm thu một doanh nghiệp trước. Khi FPT chạy đúng, dùng `main.py` không có `--ticker` để chạy danh sách demo. Crawler phụ thuộc dịch vụ bên ngoài nên một nguồn tạm lỗi không đồng nghĩa Backend hoặc database bị lỗi. Xem thêm [hướng dẫn crawler](https://github.com/doantanphong-hcmus/WikiStock/blob/main/crawler/README.md).

#### Chuẩn bị và nạp báo cáo cho RAG

Repository lưu 12 PDF nguồn của FPT, GAS, HPG và HSG trong `docs/Seed_Daa`. Đầu ra OCR tại `runtime/ocr/output` là dữ liệu sinh ra trên máy chạy và không được Git lưu lại. Vì vậy, người clone mới cần tạo output OCR trước khi ingest đầy đủ.

Sau khi hoàn thành bước OCR theo [OCR Preprocessing](https://github.com/doantanphong-hcmus/WikiStock/blob/main/docs/OCR_PREPROCESSING.md), kiểm tra và nạp PDF:

```bash
docker compose run --rm ai-service python -m app.ingestion scan --dry-run
docker compose run --rm ai-service python -m app.ingestion scan
```

Với bộ dữ liệu chuẩn, dry-run phải tìm thấy `12` tài liệu, `12` tài liệu sẵn sàng và `0` lỗi. Lệnh ingest tạo embedding local nên không tiêu thụ API credit, nhưng lần đầu có thể mất thời gian tải BGE-M3. Quy trình nghiệm thu đầy đủ nằm trong [RAG Operations Runbook](https://github.com/doantanphong-hcmus/WikiStock/blob/main/docs/RAG_OPERATIONS_RUNBOOK.md).

### Bước 6 - Mở ứng dụng như người dùng mới

1. Mở `http://localhost:3000/signup` để tạo tài khoản.
2. Đăng nhập tại `http://localhost:3000/login`.
3. Tra cứu `FPT`, `GAS`, `HPG` hoặc `HSG`.
4. Chỉ kiểm thử chatbot có trích dẫn sau khi PDF đã được ingest và AI thật đã được cấu hình.

### Bước 7 - Dừng hoặc làm sạch môi trường

Giữ database và model cache cho lần chạy sau:

```bash
docker compose down
```

`docker compose down --volumes` xóa database và model cache của project local. Chỉ dùng khi chủ động muốn dựng lại từ đầu và chắc chắn không cần dữ liệu hiện có.

## Cấu hình biến môi trường

File `.env.example` ở thư mục gốc là mẫu dành cho Docker Compose. Khi chạy từng thành phần native, sao chép thêm file `.env.example` nằm trong `backend/`, `ai-service/`, `frontend/` hoặc `crawler/` thành `.env` của chính thành phần đó.

### Ứng dụng và kết nối nội bộ

| Biến | Ý nghĩa | Khi nào cần đổi? |
| --- | --- | --- |
| `JWT_SECRET` | Khóa ký access token đăng nhập | **Luôn phải thay** bằng chuỗi bí mật tối thiểu 32 ký tự |
| `FRONTEND_URL` | Origin được Backend cho phép gọi API | Giữ `http://localhost:3000` khi chạy local; đổi theo domain khi deploy |
| `AI_SERVICE_URL` | Địa chỉ Backend dùng để gọi AI Service | Trong Compose giữ `http://ai-service:8000`; chạy native dùng `http://localhost:8000` |
| `AI_SERVICE_TIMEOUT_MS` | Thời gian Backend chờ AI Service trước khi báo timeout | Chỉ tăng khi provider hoặc máy local phản hồi chậm |
| `AI_DEMO_MODE` | Cho phép Backend dùng câu trả lời giả khi AI Service lỗi | Giữ `false` khi nghiệm thu để không che lỗi bằng dữ liệu demo |

### PostgreSQL

| Biến | Ý nghĩa | Giá trị local mặc định |
| --- | --- | --- |
| `DB_HOST` | Tên máy chạy PostgreSQL trong mạng Compose | `postgres` |
| `DB_PORT` | Cổng PostgreSQL bên trong Compose | `5432` |
| `DB_USER` | Tài khoản ứng dụng | `app_user` |
| `DB_PASSWORD` | Mật khẩu database local | `app_password`; phải thay và quản lý bằng secret khi deploy |
| `DB_NAME` | Tên database | `app_db` |
| `DATABASE_URL` | Chuỗi kết nối đầy đủ mà Backend và AI Service sử dụng | Trong Compose dùng hostname `postgres`; từ máy host dùng `localhost` |

Không đổi riêng `DB_PASSWORD` mà quên cập nhật `DATABASE_URL`, vì ứng dụng sẽ tiếp tục kết nối bằng mật khẩu cũ trong URL.

### Tài liệu, chia đoạn và retrieval

| Biến | Ý nghĩa | Ghi chú |
| --- | --- | --- |
| `RAG_SEED_DATA_PATH` | Thư mục PDF trên **máy host** được Compose mount vào container | Mặc định `./runtime/ocr/output` |
| `SEED_DATA_PATH` | Đường dẫn tới cùng bộ PDF nhưng nhìn từ **bên trong container** | Giữ `/data/seed_data` khi dùng Compose |
| `MAX_PDF_SIZE_MB` | Kích thước tối đa của một PDF được ingest | Mặc định `100` MB |
| `CHUNK_SIZE_CHARS` | Số ký tự mục tiêu của mỗi đoạn văn bản | Mặc định `1800` |
| `CHUNK_OVERLAP_CHARS` | Phần ký tự chồng lấn giữa hai đoạn liên tiếp | Mặc định `200`; phải nhỏ hơn chunk size |
| `CHUNK_VERSION` | Phiên bản quy tắc chia đoạn dùng để xác định khi nào cần re-ingest | Chỉ đổi khi thuật toán chunking thực sự thay đổi |
| `EMBEDDING_MODEL` | Mô hình tạo vector tìm kiếm | Mặc định `BAAI/bge-m3` |
| `EMBEDDING_DIMENSIONS` | Số chiều vector phải khớp schema pgvector | Giữ `1024` với BGE-M3 và schema hiện tại |
| `EMBEDDING_BATCH_SIZE` | Số đoạn được embedding trong một batch | Giảm nếu máy thiếu RAM |
| `RETRIEVAL_TOP_K` | Số đoạn liên quan tối đa được lấy cho một câu hỏi | Mặc định `5` |
| `RETRIEVAL_MIN_SIMILARITY` | Ngưỡng tương đồng tối thiểu để một đoạn được dùng làm bằng chứng | Tăng sẽ chặt hơn nhưng có thể bỏ sót nguồn |
| `HF_HOME` | Nơi lưu cache embedding model trong container | Giữ `/models` để tận dụng Docker volume |

Các giá trị chunking, embedding và retrieval ảnh hưởng trực tiếp đến dữ liệu đã lập chỉ mục. Không nên chỉnh chỉ để “thử xem sao” trên database dùng để demo.

### Nhà cung cấp AI

| Biến | Ý nghĩa | Ghi chú |
| --- | --- | --- |
| `AI_PROVIDER` | `demo` để kiểm tra đường truyền không gọi AI; `gateway` để dùng provider thật | Chatbot có câu trả lời thật cần `gateway` |
| `AI_API_BASE_URL` | Endpoint tương thích Anthropic Messages của nhà cung cấp | Lấy đúng URL từ nhà cung cấp |
| `AI_API_KEY` | Client API key dùng để xác thực | Là secret; không commit hoặc đưa vào ảnh chụp |
| `AI_AUTH_SCHEME` | Cách gửi key: `bearer` hoặc `x-api-key` | Phải khớp tài liệu của nhà cung cấp |
| `AI_MODEL` | Tên model mà endpoint hỗ trợ | Không tự đoán tên model |
| `AI_CONNECT_TIMEOUT_SECONDS` | Thời gian tối đa để thiết lập kết nối | Mặc định `5` giây |
| `AI_READ_TIMEOUT_SECONDS` | Thời gian tối đa chờ provider trả nội dung | Mặc định `45` giây |
| `AI_CUSTOM_HEADERS` | Header bổ sung do gateway yêu cầu | Để trống nếu nhà cung cấp không yêu cầu |

Chế độ dựng giao diện và API, không tiêu thụ AI credit:

```dotenv
AI_PROVIDER=demo
AI_DEMO_MODE=false
```

Chế độ chatbot thật:

```dotenv
AI_PROVIDER=gateway
AI_DEMO_MODE=false
AI_API_BASE_URL=https://endpoint-cua-nha-cung-cap.example
AI_API_KEY=thay_bang_client_api_key
AI_AUTH_SCHEME=x-api-key
AI_MODEL=ten_model_duoc_ho_tro
AI_CUSTOM_HEADERS=
```

Sau khi đổi cấu hình AI, tạo lại hai container đọc các biến này:

```bash
docker compose up -d --force-recreate ai-service backend
```

`AI_PROVIDER=demo` không phải là một chatbot giả để trình diễn nội dung tài chính. Nó chỉ chứng minh đường gọi Backend → AI Service hoạt động và phải trả kết quả không tự tin. Muốn nghiệm thu câu trả lời có nguồn, cần `gateway`, key hợp lệ và dữ liệu RAG đã ingest.

### Frontend

| Biến | Ý nghĩa | Giá trị khi chạy Compose local |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | URL mà trình duyệt của người dùng gọi tới Backend | `http://localhost:3001/api/v1` |
| `API_BASE_URL` | URL mà Next.js gọi Backend từ bên trong mạng Compose | `http://backend:3001/api/v1` |

Hai URL này khác nhau vì trình duyệt hiểu `localhost`, còn container giao tiếp với nhau bằng tên service `backend`.

### Biến chỉ dành cho native hoặc kiểm thử

| Biến | Dùng khi nào? |
| --- | --- |
| `JWT_EXPIRES_IN_SECONDS` | Chỉnh thời hạn access token khi chạy Backend native |
| `PORT` | Đổi cổng Backend native; mặc định `3001` |
| `TEST_DATABASE_URL` | Integration test trên database dùng một lần; không trỏ vào database phát triển |
| `EMBEDDING_BASE_URL` | Chỉ dùng nếu thay embedding local bằng một endpoint riêng |
| `EMBEDDING_API_KEY` | Key của endpoint embedding riêng; để trống với BGE-M3 local |

## Chạy native trên Windows

Chỉ chọn cách này khi không thể dùng Docker. Máy phải cài sẵn:

- Node.js 22.
- Python 3.12 x64.
- PostgreSQL cùng extension `pgvector`.

Nếu chưa có PostgreSQL hoặc `pgvector`, hãy dùng Docker Compose ở phần trên. Hai thành phần hệ thống này không nên được một script dự án tự ý cài vào Windows.

### 1. Kiểm tra đúng phiên bản

Mở PowerShell tại thư mục gốc `WikiStock`:

```powershell
node --version
npm --version
py -3.12 --version
psql --version
```

Nếu một lệnh không tồn tại, dừng lại và cài đúng công cụ đó trước. Không tiếp tục bằng một phiên bản Python hoặc Node khác rồi xử lý lỗi dependency về sau.

### 2. Cài toàn bộ thư viện trong một lượt

Sao chép nguyên khối dưới đây vào PowerShell. Dự án dùng một `venv` tại thư mục gốc; không cần tạo thêm `venv` trong `crawler` hoặc `ai-service`.

```powershell
# Tạo và kích hoạt môi trường Python dùng chung.
py -3.12 -m venv .venv
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1

# Cập nhật pip và cài thư viện cho cả AI Service lẫn Crawler.
python -m pip install --upgrade pip
python -m pip install `
  -r ai-service\requirements.txt `
  -r crawler\requirements.txt

# Cài dependency và tạo Prisma Client cho Backend.
Push-Location backend
npm ci
npx prisma generate
Pop-Location

# Cài dependency cho Frontend.
Push-Location frontend
npm ci
Pop-Location
```

`npm ci` được dùng thay cho `npm install` vì nó cài đúng phiên bản đã khóa trong `package-lock.json`, giúp các máy có môi trường giống nhau.

### 3. Tạo bốn file cấu hình local

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item ai-service\.env.example ai-service\.env
Copy-Item frontend\.env.example frontend\.env.local
Copy-Item crawler\.env.example crawler\.env
```

Tạo `JWT_SECRET` tương thích cả Windows PowerShell cũ:

```powershell
$rng = [Security.Cryptography.RandomNumberGenerator]::Create()
$bytes = New-Object byte[] 32
$rng.GetBytes($bytes)
$jwtSecret = [BitConverter]::ToString($bytes).Replace('-', '').ToLowerInvariant()
$rng.Dispose()
$jwtSecret
```

Mở `backend/.env`, thay `JWT_SECRET` bằng chuỗi vừa in ra. Sau đó kiểm tra:

```dotenv
# backend/.env
DATABASE_URL=postgresql://app_user:app_password@localhost:5432/app_db
AI_SERVICE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000

# ai-service/.env và crawler/.env
DATABASE_URL=postgresql://app_user:app_password@localhost:5432/app_db

# frontend/.env.local
API_BASE_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api/v1
```

Thay tài khoản, mật khẩu và tên database nếu PostgreSQL trên máy dùng giá trị khác. Mọi URL native đều dùng `localhost`; không dùng hostname `postgres` hoặc `backend` dành cho mạng Docker.

### 4. Khởi tạo database

Khi PostgreSQL đã chạy và `DATABASE_URL` trong `backend/.env` kết nối được:

```powershell
Push-Location backend
npm run db:bootstrap
Pop-Location
```

Lệnh này chạy migration, seed danh mục ban đầu và kiểm tra schema. Chỉ chuyển sang bước tiếp theo khi lệnh kết thúc thành công.

### 5. Mở bốn terminal để chạy hệ thống

Terminal 1 - AI Service:

```powershell
cd ai-service
..\.venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000
```

Terminal 2 - Backend:

```powershell
cd backend
npm run start:dev
```

Terminal 3 - Frontend:

```powershell
cd frontend
npm run dev
```

Terminal 4 chỉ cần khi muốn nạp dữ liệu:

```powershell
cd crawler
..\.venv\Scripts\python.exe check_requirements.py
..\.venv\Scripts\python.exe main.py --ticker FPT
```

Thứ tự khởi động đầy đủ là:

```text
PostgreSQL + pgvector
  → migration và seed
  → AI Service
  → Backend
  → Frontend
  → crawler/OCR/ingestion khi cần dữ liệu
```

### 6. Xác nhận trước khi mở giao diện

```powershell
Invoke-RestMethod http://localhost:8000/health
Invoke-RestMethod http://localhost:3001/api/health
Start-Process http://localhost:3000
```

Chỉ khi cả hai health check phản hồi thành công mới xem việc cài đặt đã hoàn tất. Nếu cần xử lý lỗi PostgreSQL, `pgvector`, OCR hoặc RAG, làm theo [Backend V1 Runbook](https://github.com/doantanphong-hcmus/WikiStock/blob/main/docs/BACKEND_V1_RUNBOOK.md).

Các cổng mặc định:

| Dịch vụ | Địa chỉ |
| --- | --- |
| Frontend | `http://localhost:3000` |
| Backend | `http://localhost:3001` |
| AI Service | `http://localhost:8000` |
| PostgreSQL | Theo `DATABASE_URL`, thường là `localhost:5432` |

## Kiểm tra chất lượng mã nguồn

GitHub Actions kiểm tra Backend, PostgreSQL integration, AI Service, Crawler, Frontend và quá trình build container trước khi thay đổi được đưa vào `main`.

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

- [API contract](https://github.com/doantanphong-hcmus/WikiStock/blob/main/docs/API_CONTRACT.md)
- [AI streaming contract](https://github.com/doantanphong-hcmus/WikiStock/blob/main/docs/AI_STREAMING_CONTRACT.md)
- [Checklist demo chatbot](https://github.com/doantanphong-hcmus/WikiStock/blob/main/docs/CHAT_CUSTOMER_DEMO_CHECKLIST.md)
- [Backend V1 runbook](https://github.com/doantanphong-hcmus/WikiStock/blob/main/docs/BACKEND_V1_RUNBOOK.md)
- [RAG operations runbook](https://github.com/doantanphong-hcmus/WikiStock/blob/main/docs/RAG_OPERATIONS_RUNBOOK.md)
- [RSS news operations runbook](https://github.com/doantanphong-hcmus/WikiStock/blob/main/docs/RSS_NEWS_OPERATIONS_RUNBOOK.md)
- [Giới hạn đã biết của RAG](https://github.com/doantanphong-hcmus/WikiStock/blob/main/docs/RAG_KNOWN_LIMITATIONS.md)
- [Cổng kiểm tra trước khi phát hành](https://github.com/doantanphong-hcmus/WikiStock/blob/main/docs/CI_RELEASE_GATES.md)

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

Cảm ơn những thành viên đã trực tiếp tham gia nghiên cứu, thiết kế, phát triển, kiểm thử và vận hành dự án:

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
  Sản phẩm được phát triển bởi nhóm WikiStock cho ATTACKER 2026.
</p>
