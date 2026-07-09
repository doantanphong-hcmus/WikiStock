# WikiStock Monorepo

Nền tảng tri thức tài chính tích hợp AI.

Cấu trúc thư mục hiện tại: 

wikistock/
├── frontend/           # Next.js, React, TailwindCSS, shadcn/ui
├── backend/            # NestJS, TypeScript (Cổng API chính)
├── ai-service/         # Python, FastAPI, LangChain (Xử lý AI & RAG)
├── crawler/            # Python, Scrapy/BeautifulSoup (Thu thập dữ liệu)
├── docker-compose.yml  # Dùng để chạy toàn bộ hệ thống ở local
├── README.md           # Hướng dẫn setup cho toàn bộ team
└── .github/            # GitHub Actions CI/CD workflows
