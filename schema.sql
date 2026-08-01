-- WikiStock — Database Schema (PostgreSQL)
-- Schema Dang Chuẩn 3NF/BCNF

CREATE EXTENSION IF NOT EXISTS vector;

BEGIN;

-- NHÓM 1: LOOKUP / DANH MỤC

-- Sàn giao dịch
CREATE TABLE exchange (
    exchange_id     SERIAL PRIMARY KEY,
    exchange_code   VARCHAR(10) NOT NULL UNIQUE,
    exchange_name   VARCHAR(100) NOT NULL
);

-- Ngành nghề kinh doanh
CREATE TABLE industry (
    industry_id     SERIAL PRIMARY KEY,
    industry_code   VARCHAR(20) NOT NULL UNIQUE,
    industry_name   VARCHAR(150) NOT NULL
);

-- Nguồn dữ liệu WikiStock crawl về
CREATE TABLE data_source (
    source_id        SERIAL PRIMARY KEY,
    source_name       VARCHAR(100) NOT NULL UNIQUE,
    source_type      VARCHAR(30) NOT NULL CHECK (source_type IN
                         ('official','aggregator','news','ai_api','internal')),
    reliability_tier SMALLINT NOT NULL CHECK (reliability_tier BETWEEN 1 AND 5),
    cost_tier        VARCHAR(20) NOT NULL CHECK (cost_tier IN ('free','freemium','paid')),
    access_url       TEXT
);

-- Loại tài liệu nguồn
CREATE TABLE document_type (
    doc_type_id     SERIAL PRIMARY KEY,
    type_name       VARCHAR(100) NOT NULL UNIQUE
);

-- Danh mục chỉ số tài chính
CREATE TABLE metric (
    metric_id       SERIAL PRIMARY KEY,
    metric_code     VARCHAR(30) NOT NULL UNIQUE,
    metric_name     VARCHAR(150) NOT NULL,
    unit            VARCHAR(20) NOT NULL,
    statement_type  VARCHAR(30) NOT NULL CHECK (statement_type IN
                        ('income_statement','balance_sheet','cash_flow','ratio'))
);

-- Loại sự kiện doanh nghiệp, dùng cho Timeline
CREATE TABLE event_type (
    event_type_id   SERIAL PRIMARY KEY,
    type_name       VARCHAR(100) NOT NULL UNIQUE
);

-- Loại tín hiệu rủi ro, dùng cho Risk Center
CREATE TABLE risk_signal_type (
    signal_type_id  SERIAL PRIMARY KEY,
    signal_name     VARCHAR(100) NOT NULL UNIQUE,
    description     TEXT,
    default_weight  NUMERIC(4,2) NOT NULL DEFAULT 1.0
);

-- Vai trò người dùng
CREATE TABLE user_role (
    role_id         SERIAL PRIMARY KEY,
    role_name       VARCHAR(30) NOT NULL UNIQUE
);

-- NHÓM 2: COMPANY KNOWLEDGE

-- Hồ sơ doanh nghiệp niêm yết, bảng lõi của hệ thống
CREATE TABLE company (
    company_id      SERIAL PRIMARY KEY,
    ticker          VARCHAR(10) NOT NULL UNIQUE,
    company_name    VARCHAR(255) NOT NULL,
    exchange_id     INT NOT NULL REFERENCES exchange(exchange_id),
    industry_id     INT NOT NULL REFERENCES industry(industry_id),
    listing_date    DATE,
    charter_capital NUMERIC(20,2),
    website         TEXT,
    description     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- NHÓM 3: NGUỒN TÀI LIỆU & CITATION ENGINE

-- Tài liệu nguồn đã crawl được
CREATE TABLE source_document (
    document_id     SERIAL PRIMARY KEY,
    company_id      INT REFERENCES company(company_id),
    source_id       INT NOT NULL REFERENCES data_source(source_id),
    doc_type_id     INT NOT NULL REFERENCES document_type(doc_type_id),
    title           VARCHAR(500) NOT NULL,
    published_date  DATE,
    fiscal_year     SMALLINT,
    fiscal_quarter  SMALLINT CHECK (fiscal_quarter BETWEEN 1 AND 4),
    url             TEXT,
    file_ref        TEXT,
    crawled_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    checksum        VARCHAR(64) UNIQUE
                        CHECK (checksum ~ '^[0-9a-f]{64}$'),
    ingestion_status VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (ingestion_status IN
                            ('pending','processing','ready','failed','missing')),
    ingested_at     TIMESTAMPTZ,
    ingestion_error TEXT,
    embedding_model VARCHAR(100),
    chunk_version   VARCHAR(30),
    CHECK (NULLIF(btrim(url), '') IS NOT NULL
        OR NULLIF(btrim(file_ref), '') IS NOT NULL)
);

-- Đơn vị nhỏ nhất được retrieval và dùng làm bằng chứng cho AI
CREATE TABLE document_chunk (
    chunk_id        SERIAL PRIMARY KEY,
    document_id     INT NOT NULL REFERENCES source_document(document_id)
                        ON DELETE CASCADE,
    chunk_index     INT NOT NULL CHECK (chunk_index >= 0),
    page_number     INT NOT NULL CHECK (page_number > 0),
    location_ref    VARCHAR(100) NOT NULL,
    content         TEXT NOT NULL CHECK (btrim(content) <> ''),
    char_count      INT NOT NULL CHECK (char_count > 0),
    content_hash    VARCHAR(64) NOT NULL
                        CHECK (content_hash ~ '^[0-9a-f]{64}$'),
    embedding       vector(1024),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (document_id, chunk_index)
);

-- Ban lãnh đạo doanh nghiệp theo thời gian
CREATE TABLE company_executive (
    executive_id    SERIAL PRIMARY KEY,
    company_id      INT NOT NULL REFERENCES company(company_id),
    full_name       VARCHAR(150) NOT NULL,
    position        VARCHAR(150) NOT NULL,
    start_date      DATE,
    end_date        DATE,
    document_id     INT REFERENCES source_document(document_id)
);

-- Trích dẫn từ tài liệu nguồn, dùng chung cho mọi module
CREATE TABLE citation (
    citation_id     SERIAL PRIMARY KEY,
    document_id     INT NOT NULL REFERENCES source_document(document_id),
    chunk_id        INT UNIQUE REFERENCES document_chunk(chunk_id)
                        ON DELETE SET NULL,
    excerpt         TEXT,
    location_ref    VARCHAR(100),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- NHÓM 4: FINANCIAL CENTER

-- Vỏ báo cáo tài chính theo công ty và kỳ
CREATE TABLE financial_report (
    report_id       SERIAL PRIMARY KEY,
    company_id      INT NOT NULL REFERENCES company(company_id),
    period_type     VARCHAR(1) NOT NULL CHECK (period_type IN ('Q','Y')),
    fiscal_year     SMALLINT NOT NULL,
    fiscal_quarter  SMALLINT CHECK (fiscal_quarter BETWEEN 1 AND 4),
    report_date     DATE,
    document_id     INT REFERENCES source_document(document_id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (company_id, period_type, fiscal_year, fiscal_quarter)
);

-- Từng chỉ số tài chính cụ thể trong 1 báo cáo
CREATE TABLE financial_line_item (
    line_item_id    SERIAL PRIMARY KEY,
    report_id       INT NOT NULL REFERENCES financial_report(report_id),
    metric_id       INT NOT NULL REFERENCES metric(metric_id),
    value           NUMERIC(20,4) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (report_id, metric_id)
);

-- Liên kết chỉ số tài chính với nguồn trích dẫn
CREATE TABLE financial_line_item_citation (
    line_item_id    INT NOT NULL REFERENCES financial_line_item(line_item_id),
    citation_id     INT NOT NULL REFERENCES citation(citation_id),
    PRIMARY KEY (line_item_id, citation_id)
);

-- NHÓM 5: NEWS INTELLIGENCE

-- Tin tức đã crawl
CREATE TABLE news_article (
    article_id      SERIAL PRIMARY KEY,
    source_id       INT NOT NULL REFERENCES data_source(source_id),
    title           VARCHAR(500) NOT NULL,
    url             TEXT NOT NULL UNIQUE,
    published_at    TIMESTAMPTZ,
    summary         TEXT,
    sentiment_label VARCHAR(20) CHECK (sentiment_label IN ('positive','neutral','negative')),
    crawled_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Liên kết tin tức với các công ty được nhắc tới
CREATE TABLE news_article_company (
    article_id      INT NOT NULL REFERENCES news_article(article_id),
    company_id      INT NOT NULL REFERENCES company(company_id),
    relevance_score NUMERIC(3,2) CHECK (relevance_score BETWEEN 0 AND 1),
    PRIMARY KEY (article_id, company_id)
);

-- NHÓM 6: TIMELINE

-- Sự kiện doanh nghiệp trên Timeline
CREATE TABLE timeline_event (
    event_id        SERIAL PRIMARY KEY,
    company_id      INT NOT NULL REFERENCES company(company_id),
    event_type_id   INT NOT NULL REFERENCES event_type(event_type_id),
    event_date      DATE NOT NULL,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Liên kết sự kiện với nguồn trích dẫn
CREATE TABLE timeline_event_citation (
    event_id        INT NOT NULL REFERENCES timeline_event(event_id),
    citation_id     INT NOT NULL REFERENCES citation(citation_id),
    PRIMARY KEY (event_id, citation_id)
);

-- NHÓM 7: RISK CENTER

-- Tín hiệu rủi ro theo công ty và kỳ
CREATE TABLE risk_signal (
    signal_id       SERIAL PRIMARY KEY,
    company_id      INT NOT NULL REFERENCES company(company_id),
    signal_type_id  INT NOT NULL REFERENCES risk_signal_type(signal_type_id),
    period          VARCHAR(10) NOT NULL,
    value           NUMERIC(20,4),
    detected_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (company_id, signal_type_id, period)
);

-- Liên kết tín hiệu rủi ro với nguồn trích dẫn
CREATE TABLE risk_signal_citation (
    signal_id       INT NOT NULL REFERENCES risk_signal(signal_id),
    citation_id     INT NOT NULL REFERENCES citation(citation_id),
    PRIMARY KEY (signal_id, citation_id)
);

-- Điểm rủi ro tổng hợp theo công ty và kỳ
CREATE TABLE risk_score (
    score_id        SERIAL PRIMARY KEY,
    company_id      INT NOT NULL REFERENCES company(company_id),
    period          VARCHAR(10) NOT NULL,
    total_score     NUMERIC(5,2) NOT NULL,
    risk_level      VARCHAR(20) NOT NULL CHECK (risk_level IN ('low','medium','high')),
    computed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (company_id, period)
);

-- NHÓM 8: USERS / AI ANALYST

-- Tài khoản người dùng
CREATE TABLE app_user (
    user_id         SERIAL PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    full_name       VARCHAR(150),
    role_id         INT NOT NULL REFERENCES user_role(role_id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Phiên hội thoại với AI Analyst
CREATE TABLE ai_conversation (
    conversation_id SERIAL PRIMARY KEY,
    user_id         INT REFERENCES app_user(user_id),
    started_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tin nhắn trong hội thoại AI. model_used chỉ có giá trị khi role = assistant
CREATE TABLE ai_message (
    message_id      SERIAL PRIMARY KEY,
    conversation_id INT NOT NULL REFERENCES ai_conversation(conversation_id),
    role            VARCHAR(10) NOT NULL CHECK (role IN ('user','assistant')),
    content         TEXT NOT NULL,
    related_company_id INT REFERENCES company(company_id),
    model_used      VARCHAR(50),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Liên kết câu trả lời AI với nguồn trích dẫn
CREATE TABLE ai_message_citation (
    message_id      INT NOT NULL REFERENCES ai_message(message_id),
    citation_id     INT NOT NULL REFERENCES citation(citation_id),
    PRIMARY KEY (message_id, citation_id)
);

-- NHÓM 9: COMPARE & WATCHLIST

-- Danh sách công ty người dùng theo dõi
CREATE TABLE watchlist (
    watchlist_id    SERIAL PRIMARY KEY,
    user_id         INT NOT NULL REFERENCES app_user(user_id),
    company_id      INT NOT NULL REFERENCES company(company_id),
    added_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, company_id)
);

-- Một lượt so sánh nhiều công ty
CREATE TABLE compare_session (
    session_id      SERIAL PRIMARY KEY,
    user_id         INT REFERENCES app_user(user_id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Danh sách công ty trong 1 lượt so sánh
CREATE TABLE compare_session_company (
    session_id      INT NOT NULL REFERENCES compare_session(session_id),
    company_id      INT NOT NULL REFERENCES company(company_id),
    PRIMARY KEY (session_id, company_id)
);

-- NHÓM 10: ADMIN / CMS / VẬN HÀNH DỮ LIỆU

-- Nhật ký các lần crawler chạy
CREATE TABLE data_ingestion_log (
    log_id          SERIAL PRIMARY KEY,
    source_id       INT NOT NULL REFERENCES data_source(source_id),
    run_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    status          VARCHAR(20) NOT NULL CHECK (status IN ('success','partial','failed')),
    records_fetched INT DEFAULT 0,
    error_message   TEXT
);

-- Trạng thái kiểm duyệt tài liệu
CREATE TABLE document_review (
    document_id     INT PRIMARY KEY REFERENCES source_document(document_id),
    reviewed_by     INT REFERENCES app_user(user_id),
    review_status   VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (review_status IN ('pending','approved','rejected')),
    reviewed_at     TIMESTAMPTZ,
    notes           TEXT
);

-- =====================================================================
-- INDEXES

CREATE INDEX idx_source_document_company ON source_document(company_id);
CREATE INDEX idx_financial_report_company ON financial_report(company_id);
CREATE INDEX idx_news_article_published ON news_article(published_at);
CREATE INDEX idx_timeline_event_company ON timeline_event(company_id, event_date);
CREATE INDEX idx_risk_signal_company ON risk_signal(company_id, period);
CREATE INDEX idx_ai_message_conversation ON ai_message(conversation_id);

-- =====================================================================
-- COMMENT ON TABLE — lưu mô tả vào metadata database, xem được qua
-- DBeaver/pgAdmin/TablePlus khi hover vào tên bảng

COMMENT ON TABLE exchange IS 'Sàn giao dịch';
COMMENT ON TABLE industry IS 'Ngành nghề kinh doanh';
COMMENT ON TABLE data_source IS 'Nguồn dữ liệu WikiStock thu thập';
COMMENT ON TABLE document_type IS 'Loại tài liệu nguồn';
COMMENT ON TABLE metric IS 'Danh mục chỉ số tài chính';
COMMENT ON TABLE event_type IS 'Loại sự kiện doanh nghiệp';
COMMENT ON TABLE risk_signal_type IS 'Loại tín hiệu rủi ro';
COMMENT ON TABLE user_role IS 'Vai trò người dùng';
COMMENT ON TABLE company IS 'Hồ sơ doanh nghiệp niêm yết, bảng lõi hệ thống';
COMMENT ON TABLE source_document IS 'Tài liệu nguồn và trạng thái xử lý RAG';
COMMENT ON TABLE document_chunk IS 'Đoạn văn bản có embedding dùng cho retrieval và citation';
COMMENT ON TABLE company_executive IS 'Ban lãnh đạo doanh nghiệp theo thời gian';
COMMENT ON TABLE citation IS 'Trích dẫn từ tài liệu nguồn';
COMMENT ON TABLE financial_report IS 'Vỏ báo cáo tài chính theo kỳ';
COMMENT ON TABLE financial_line_item IS 'Từng chỉ số tài chính trong 1 báo cáo';
COMMENT ON TABLE financial_line_item_citation IS 'Liên kết chỉ số tài chính với trích dẫn';
COMMENT ON TABLE news_article IS 'Tin tức đã crawl';
COMMENT ON TABLE news_article_company IS 'Liên kết tin tức với công ty liên quan';
COMMENT ON TABLE timeline_event IS 'Sự kiện doanh nghiệp trên Timeline';
COMMENT ON TABLE timeline_event_citation IS 'Liên kết sự kiện với trích dẫn';
COMMENT ON TABLE risk_signal IS 'Tín hiệu rủi ro theo công ty và kỳ';
COMMENT ON TABLE risk_signal_citation IS 'Liên kết tín hiệu rủi ro với trích dẫn';
COMMENT ON TABLE risk_score IS 'Điểm rủi ro tổng hợp theo công ty và kỳ';
COMMENT ON TABLE app_user IS 'Tài khoản người dùng';
COMMENT ON TABLE ai_conversation IS 'Phiên hội thoại với AI Analyst';
COMMENT ON TABLE ai_message IS 'Tin nhắn trong hội thoại AI';
COMMENT ON TABLE ai_message_citation IS 'Liên kết câu trả lời AI với trích dẫn';
COMMENT ON TABLE watchlist IS 'Công ty người dùng theo dõi';
COMMENT ON TABLE compare_session IS 'Một lượt so sánh nhiều công ty';
COMMENT ON TABLE compare_session_company IS 'Công ty trong 1 lượt so sánh';
COMMENT ON TABLE data_ingestion_log IS 'Nhật ký các lần crawler chạy';
COMMENT ON TABLE document_review IS 'Trạng thái kiểm duyệt tài liệu';

COMMIT;
