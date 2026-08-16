-- pgvector must be installed on the PostgreSQL server before this migration runs.
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "exchange" (
    "exchange_id" SERIAL NOT NULL,
    "exchange_code" VARCHAR(10) NOT NULL,
    "exchange_name" VARCHAR(100) NOT NULL,

    CONSTRAINT "exchange_pkey" PRIMARY KEY ("exchange_id")
);

-- CreateTable
CREATE TABLE "industry" (
    "industry_id" SERIAL NOT NULL,
    "industry_code" VARCHAR(20) NOT NULL,
    "industry_name" VARCHAR(150) NOT NULL,

    CONSTRAINT "industry_pkey" PRIMARY KEY ("industry_id")
);

-- CreateTable
CREATE TABLE "data_source" (
    "source_id" SERIAL NOT NULL,
    "source_name" VARCHAR(100) NOT NULL,
    "source_type" VARCHAR(30) NOT NULL,
    "reliability_tier" SMALLINT NOT NULL,
    "cost_tier" VARCHAR(20) NOT NULL,
    "access_url" TEXT,

    CONSTRAINT "data_source_pkey" PRIMARY KEY ("source_id")
);

-- CreateTable
CREATE TABLE "document_type" (
    "doc_type_id" SERIAL NOT NULL,
    "type_name" VARCHAR(100) NOT NULL,

    CONSTRAINT "document_type_pkey" PRIMARY KEY ("doc_type_id")
);

-- CreateTable
CREATE TABLE "metric" (
    "metric_id" SERIAL NOT NULL,
    "metric_code" VARCHAR(30) NOT NULL,
    "metric_name" VARCHAR(150) NOT NULL,
    "unit" VARCHAR(20) NOT NULL,
    "statement_type" VARCHAR(30) NOT NULL,

    CONSTRAINT "metric_pkey" PRIMARY KEY ("metric_id")
);

-- CreateTable
CREATE TABLE "event_type" (
    "event_type_id" SERIAL NOT NULL,
    "type_name" VARCHAR(100) NOT NULL,

    CONSTRAINT "event_type_pkey" PRIMARY KEY ("event_type_id")
);

-- CreateTable
CREATE TABLE "risk_signal_type" (
    "signal_type_id" SERIAL NOT NULL,
    "signal_name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "default_weight" DECIMAL(4,2) NOT NULL DEFAULT 1.0,

    CONSTRAINT "risk_signal_type_pkey" PRIMARY KEY ("signal_type_id")
);

-- CreateTable
CREATE TABLE "user_role" (
    "role_id" SERIAL NOT NULL,
    "role_name" VARCHAR(30) NOT NULL,

    CONSTRAINT "user_role_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "company" (
    "company_id" SERIAL NOT NULL,
    "ticker" VARCHAR(10) NOT NULL,
    "company_name" VARCHAR(255) NOT NULL,
    "exchange_id" INTEGER NOT NULL,
    "industry_id" INTEGER NOT NULL,
    "listing_date" DATE,
    "charter_capital" DECIMAL(20,2),
    "website" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_pkey" PRIMARY KEY ("company_id")
);

-- CreateTable
CREATE TABLE "source_document" (
    "document_id" SERIAL NOT NULL,
    "company_id" INTEGER,
    "source_id" INTEGER NOT NULL,
    "doc_type_id" INTEGER NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "published_date" DATE,
    "fiscal_year" SMALLINT,
    "fiscal_quarter" SMALLINT,
    "url" TEXT,
    "file_ref" TEXT,
    "crawled_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checksum" VARCHAR(64),
    "ingestion_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "ingested_at" TIMESTAMPTZ(6),
    "ingestion_error" TEXT,
    "embedding_model" VARCHAR(100),
    "chunk_version" VARCHAR(30),

    CONSTRAINT "source_document_pkey" PRIMARY KEY ("document_id")
);

-- CreateTable
CREATE TABLE "document_chunk" (
    "chunk_id" SERIAL NOT NULL,
    "document_id" INTEGER NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "page_number" INTEGER NOT NULL,
    "location_ref" VARCHAR(100) NOT NULL,
    "content" TEXT NOT NULL,
    "char_count" INTEGER NOT NULL,
    "content_hash" VARCHAR(64) NOT NULL,
    "embedding" vector(1024),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_chunk_pkey" PRIMARY KEY ("chunk_id")
);

-- CreateTable
CREATE TABLE "company_executive" (
    "executive_id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "full_name" VARCHAR(150) NOT NULL,
    "position" VARCHAR(150) NOT NULL,
    "start_date" DATE,
    "end_date" DATE,
    "document_id" INTEGER,

    CONSTRAINT "company_executive_pkey" PRIMARY KEY ("executive_id")
);

-- CreateTable
CREATE TABLE "citation" (
    "citation_id" SERIAL NOT NULL,
    "document_id" INTEGER NOT NULL,
    "chunk_id" INTEGER,
    "excerpt" TEXT,
    "location_ref" VARCHAR(100),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "citation_pkey" PRIMARY KEY ("citation_id")
);

-- CreateTable
CREATE TABLE "financial_report" (
    "report_id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "period_type" VARCHAR(1) NOT NULL,
    "fiscal_year" SMALLINT NOT NULL,
    "fiscal_quarter" SMALLINT,
    "report_date" DATE,
    "document_id" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_report_pkey" PRIMARY KEY ("report_id")
);

-- CreateTable
CREATE TABLE "financial_line_item" (
    "line_item_id" SERIAL NOT NULL,
    "report_id" INTEGER NOT NULL,
    "metric_id" INTEGER NOT NULL,
    "value" DECIMAL(20,4) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_line_item_pkey" PRIMARY KEY ("line_item_id")
);

-- CreateTable
CREATE TABLE "financial_line_item_citation" (
    "line_item_id" INTEGER NOT NULL,
    "citation_id" INTEGER NOT NULL,

    CONSTRAINT "financial_line_item_citation_pkey" PRIMARY KEY ("line_item_id","citation_id")
);

-- CreateTable
CREATE TABLE "news_article" (
    "article_id" SERIAL NOT NULL,
    "source_id" INTEGER NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "url" TEXT NOT NULL,
    "published_at" TIMESTAMPTZ(6),
    "summary" TEXT,
    "sentiment_label" VARCHAR(20),
    "crawled_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "news_article_pkey" PRIMARY KEY ("article_id")
);

-- CreateTable
CREATE TABLE "news_article_company" (
    "article_id" INTEGER NOT NULL,
    "company_id" INTEGER NOT NULL,
    "relevance_score" DECIMAL(3,2),

    CONSTRAINT "news_article_company_pkey" PRIMARY KEY ("article_id","company_id")
);

-- CreateTable
CREATE TABLE "timeline_event" (
    "event_id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "event_type_id" INTEGER NOT NULL,
    "event_date" DATE NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timeline_event_pkey" PRIMARY KEY ("event_id")
);

-- CreateTable
CREATE TABLE "timeline_event_citation" (
    "event_id" INTEGER NOT NULL,
    "citation_id" INTEGER NOT NULL,

    CONSTRAINT "timeline_event_citation_pkey" PRIMARY KEY ("event_id","citation_id")
);

-- CreateTable
CREATE TABLE "risk_signal" (
    "signal_id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "signal_type_id" INTEGER NOT NULL,
    "period" VARCHAR(10) NOT NULL,
    "value" DECIMAL(20,4),
    "detected_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risk_signal_pkey" PRIMARY KEY ("signal_id")
);

-- CreateTable
CREATE TABLE "risk_signal_citation" (
    "signal_id" INTEGER NOT NULL,
    "citation_id" INTEGER NOT NULL,

    CONSTRAINT "risk_signal_citation_pkey" PRIMARY KEY ("signal_id","citation_id")
);

-- CreateTable
CREATE TABLE "risk_score" (
    "score_id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "period" VARCHAR(10) NOT NULL,
    "total_score" DECIMAL(5,2) NOT NULL,
    "risk_level" VARCHAR(20) NOT NULL,
    "computed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risk_score_pkey" PRIMARY KEY ("score_id")
);

-- CreateTable
CREATE TABLE "app_user" (
    "user_id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" VARCHAR(150),
    "role_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_user_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "ai_conversation" (
    "conversation_id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_conversation_pkey" PRIMARY KEY ("conversation_id")
);

-- CreateTable
CREATE TABLE "ai_message" (
    "message_id" SERIAL NOT NULL,
    "conversation_id" INTEGER NOT NULL,
    "role" VARCHAR(10) NOT NULL,
    "content" TEXT NOT NULL,
    "related_company_id" INTEGER,
    "model_used" VARCHAR(50),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_message_pkey" PRIMARY KEY ("message_id")
);

-- CreateTable
CREATE TABLE "ai_message_citation" (
    "message_id" INTEGER NOT NULL,
    "citation_id" INTEGER NOT NULL,

    CONSTRAINT "ai_message_citation_pkey" PRIMARY KEY ("message_id","citation_id")
);

-- CreateTable
CREATE TABLE "watchlist" (
    "watchlist_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "company_id" INTEGER NOT NULL,
    "added_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "watchlist_pkey" PRIMARY KEY ("watchlist_id")
);

-- CreateTable
CREATE TABLE "compare_session" (
    "session_id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compare_session_pkey" PRIMARY KEY ("session_id")
);

-- CreateTable
CREATE TABLE "compare_session_company" (
    "session_id" INTEGER NOT NULL,
    "company_id" INTEGER NOT NULL,

    CONSTRAINT "compare_session_company_pkey" PRIMARY KEY ("session_id","company_id")
);

-- CreateTable
CREATE TABLE "data_ingestion_log" (
    "log_id" SERIAL NOT NULL,
    "source_id" INTEGER NOT NULL,
    "run_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(20) NOT NULL,
    "records_fetched" INTEGER DEFAULT 0,
    "error_message" TEXT,

    CONSTRAINT "data_ingestion_log_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "document_review" (
    "document_id" INTEGER NOT NULL,
    "reviewed_by" INTEGER,
    "review_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "reviewed_at" TIMESTAMPTZ(6),
    "notes" TEXT,

    CONSTRAINT "document_review_pkey" PRIMARY KEY ("document_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "exchange_exchange_code_key" ON "exchange"("exchange_code");

-- CreateIndex
CREATE UNIQUE INDEX "industry_industry_code_key" ON "industry"("industry_code");

-- CreateIndex
CREATE UNIQUE INDEX "data_source_source_name_key" ON "data_source"("source_name");

-- CreateIndex
CREATE UNIQUE INDEX "document_type_type_name_key" ON "document_type"("type_name");

-- CreateIndex
CREATE UNIQUE INDEX "metric_metric_code_key" ON "metric"("metric_code");

-- CreateIndex
CREATE UNIQUE INDEX "event_type_type_name_key" ON "event_type"("type_name");

-- CreateIndex
CREATE UNIQUE INDEX "risk_signal_type_signal_name_key" ON "risk_signal_type"("signal_name");

-- CreateIndex
CREATE UNIQUE INDEX "user_role_role_name_key" ON "user_role"("role_name");

-- CreateIndex
CREATE UNIQUE INDEX "company_ticker_key" ON "company"("ticker");

-- CreateIndex
CREATE UNIQUE INDEX "source_document_checksum_key" ON "source_document"("checksum");

-- CreateIndex
CREATE INDEX "idx_source_document_company" ON "source_document"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "document_chunk_document_id_chunk_index_key" ON "document_chunk"("document_id", "chunk_index");

-- CreateIndex
CREATE UNIQUE INDEX "citation_chunk_id_key" ON "citation"("chunk_id");

-- CreateIndex
CREATE INDEX "idx_financial_report_company" ON "financial_report"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "financial_report_company_id_period_type_fiscal_year_fiscal__key" ON "financial_report"("company_id", "period_type", "fiscal_year", "fiscal_quarter");

-- CreateIndex
CREATE UNIQUE INDEX "financial_line_item_report_id_metric_id_key" ON "financial_line_item"("report_id", "metric_id");

-- CreateIndex
CREATE UNIQUE INDEX "news_article_url_key" ON "news_article"("url");

-- CreateIndex
CREATE INDEX "idx_news_article_published" ON "news_article"("published_at");

-- CreateIndex
CREATE INDEX "idx_timeline_event_company" ON "timeline_event"("company_id", "event_date");

-- CreateIndex
CREATE INDEX "idx_risk_signal_company" ON "risk_signal"("company_id", "period");

-- CreateIndex
CREATE UNIQUE INDEX "risk_signal_company_id_signal_type_id_period_key" ON "risk_signal"("company_id", "signal_type_id", "period");

-- CreateIndex
CREATE UNIQUE INDEX "risk_score_company_id_period_key" ON "risk_score"("company_id", "period");

-- CreateIndex
CREATE UNIQUE INDEX "app_user_email_key" ON "app_user"("email");

-- CreateIndex
CREATE INDEX "idx_ai_message_conversation" ON "ai_message"("conversation_id");

-- CreateIndex
CREATE UNIQUE INDEX "watchlist_user_id_company_id_key" ON "watchlist"("user_id", "company_id");

-- AddForeignKey
ALTER TABLE "company" ADD CONSTRAINT "company_exchange_id_fkey" FOREIGN KEY ("exchange_id") REFERENCES "exchange"("exchange_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company" ADD CONSTRAINT "company_industry_id_fkey" FOREIGN KEY ("industry_id") REFERENCES "industry"("industry_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_document" ADD CONSTRAINT "source_document_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("company_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_document" ADD CONSTRAINT "source_document_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "data_source"("source_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_document" ADD CONSTRAINT "source_document_doc_type_id_fkey" FOREIGN KEY ("doc_type_id") REFERENCES "document_type"("doc_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_chunk" ADD CONSTRAINT "document_chunk_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "source_document"("document_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_executive" ADD CONSTRAINT "company_executive_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("company_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_executive" ADD CONSTRAINT "company_executive_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "source_document"("document_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citation" ADD CONSTRAINT "citation_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "source_document"("document_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citation" ADD CONSTRAINT "citation_chunk_id_fkey" FOREIGN KEY ("chunk_id") REFERENCES "document_chunk"("chunk_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_report" ADD CONSTRAINT "financial_report_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("company_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_report" ADD CONSTRAINT "financial_report_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "source_document"("document_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_line_item" ADD CONSTRAINT "financial_line_item_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "financial_report"("report_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_line_item" ADD CONSTRAINT "financial_line_item_metric_id_fkey" FOREIGN KEY ("metric_id") REFERENCES "metric"("metric_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_line_item_citation" ADD CONSTRAINT "financial_line_item_citation_line_item_id_fkey" FOREIGN KEY ("line_item_id") REFERENCES "financial_line_item"("line_item_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_line_item_citation" ADD CONSTRAINT "financial_line_item_citation_citation_id_fkey" FOREIGN KEY ("citation_id") REFERENCES "citation"("citation_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_article" ADD CONSTRAINT "news_article_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "data_source"("source_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_article_company" ADD CONSTRAINT "news_article_company_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "news_article"("article_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_article_company" ADD CONSTRAINT "news_article_company_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("company_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_event" ADD CONSTRAINT "timeline_event_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("company_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_event" ADD CONSTRAINT "timeline_event_event_type_id_fkey" FOREIGN KEY ("event_type_id") REFERENCES "event_type"("event_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_event_citation" ADD CONSTRAINT "timeline_event_citation_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "timeline_event"("event_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_event_citation" ADD CONSTRAINT "timeline_event_citation_citation_id_fkey" FOREIGN KEY ("citation_id") REFERENCES "citation"("citation_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_signal" ADD CONSTRAINT "risk_signal_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("company_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_signal" ADD CONSTRAINT "risk_signal_signal_type_id_fkey" FOREIGN KEY ("signal_type_id") REFERENCES "risk_signal_type"("signal_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_signal_citation" ADD CONSTRAINT "risk_signal_citation_signal_id_fkey" FOREIGN KEY ("signal_id") REFERENCES "risk_signal"("signal_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_signal_citation" ADD CONSTRAINT "risk_signal_citation_citation_id_fkey" FOREIGN KEY ("citation_id") REFERENCES "citation"("citation_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_score" ADD CONSTRAINT "risk_score_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("company_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_user" ADD CONSTRAINT "app_user_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "user_role"("role_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_conversation" ADD CONSTRAINT "ai_conversation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_message" ADD CONSTRAINT "ai_message_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "ai_conversation"("conversation_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_message" ADD CONSTRAINT "ai_message_related_company_id_fkey" FOREIGN KEY ("related_company_id") REFERENCES "company"("company_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_message_citation" ADD CONSTRAINT "ai_message_citation_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "ai_message"("message_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_message_citation" ADD CONSTRAINT "ai_message_citation_citation_id_fkey" FOREIGN KEY ("citation_id") REFERENCES "citation"("citation_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlist" ADD CONSTRAINT "watchlist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlist" ADD CONSTRAINT "watchlist_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("company_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compare_session" ADD CONSTRAINT "compare_session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compare_session_company" ADD CONSTRAINT "compare_session_company_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "compare_session"("session_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compare_session_company" ADD CONSTRAINT "compare_session_company_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("company_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_ingestion_log" ADD CONSTRAINT "data_ingestion_log_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "data_source"("source_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_review" ADD CONSTRAINT "document_review_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "source_document"("document_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_review" ADD CONSTRAINT "document_review_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "app_user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Database-level validation that Prisma cannot express in its schema.
ALTER TABLE "data_source" ADD CONSTRAINT "data_source_source_type_check" CHECK ("source_type" IN ('official', 'aggregator', 'news', 'ai_api', 'internal'));
ALTER TABLE "data_source" ADD CONSTRAINT "data_source_reliability_tier_check" CHECK ("reliability_tier" BETWEEN 1 AND 5);
ALTER TABLE "data_source" ADD CONSTRAINT "data_source_cost_tier_check" CHECK ("cost_tier" IN ('free', 'freemium', 'paid'));
ALTER TABLE "metric" ADD CONSTRAINT "metric_statement_type_check" CHECK ("statement_type" IN ('income_statement', 'balance_sheet', 'cash_flow', 'ratio'));
ALTER TABLE "source_document" ADD CONSTRAINT "source_document_fiscal_quarter_check" CHECK ("fiscal_quarter" BETWEEN 1 AND 4);
ALTER TABLE "source_document" ADD CONSTRAINT "source_document_checksum_check" CHECK ("checksum" ~ '^[0-9a-f]{64}$');
ALTER TABLE "source_document" ADD CONSTRAINT "source_document_ingestion_status_check" CHECK ("ingestion_status" IN ('pending', 'processing', 'ready', 'failed', 'missing'));
ALTER TABLE "source_document" ADD CONSTRAINT "source_document_reference_check" CHECK (NULLIF(btrim("url"), '') IS NOT NULL OR NULLIF(btrim("file_ref"), '') IS NOT NULL);
ALTER TABLE "document_chunk" ADD CONSTRAINT "document_chunk_chunk_index_check" CHECK ("chunk_index" >= 0);
ALTER TABLE "document_chunk" ADD CONSTRAINT "document_chunk_page_number_check" CHECK ("page_number" > 0);
ALTER TABLE "document_chunk" ADD CONSTRAINT "document_chunk_content_check" CHECK (btrim("content") <> '');
ALTER TABLE "document_chunk" ADD CONSTRAINT "document_chunk_char_count_check" CHECK ("char_count" > 0);
ALTER TABLE "document_chunk" ADD CONSTRAINT "document_chunk_content_hash_check" CHECK ("content_hash" ~ '^[0-9a-f]{64}$');
ALTER TABLE "financial_report" ADD CONSTRAINT "financial_report_period_type_check" CHECK ("period_type" IN ('Q', 'Y'));
ALTER TABLE "financial_report" ADD CONSTRAINT "financial_report_fiscal_quarter_check" CHECK ("fiscal_quarter" BETWEEN 1 AND 4);
ALTER TABLE "news_article" ADD CONSTRAINT "news_article_sentiment_label_check" CHECK ("sentiment_label" IN ('positive', 'neutral', 'negative'));
ALTER TABLE "news_article_company" ADD CONSTRAINT "news_article_company_relevance_score_check" CHECK ("relevance_score" BETWEEN 0 AND 1);
ALTER TABLE "risk_score" ADD CONSTRAINT "risk_score_risk_level_check" CHECK ("risk_level" IN ('low', 'medium', 'high'));
ALTER TABLE "ai_message" ADD CONSTRAINT "ai_message_role_check" CHECK ("role" IN ('user', 'assistant'));
ALTER TABLE "data_ingestion_log" ADD CONSTRAINT "data_ingestion_log_status_check" CHECK ("status" IN ('success', 'partial', 'failed'));
ALTER TABLE "document_review" ADD CONSTRAINT "document_review_status_check" CHECK ("review_status" IN ('pending', 'approved', 'rejected'));
