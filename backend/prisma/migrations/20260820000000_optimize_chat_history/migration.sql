DROP INDEX IF EXISTS "idx_ai_message_conversation";

CREATE INDEX "idx_ai_conversation_user_started"
ON "ai_conversation"("user_id", "started_at");

CREATE INDEX "idx_ai_message_conversation_created"
ON "ai_message"("conversation_id", "created_at");
