ALTER TABLE "ai_message"
ADD COLUMN "client_request_id" VARCHAR(100);

CREATE UNIQUE INDEX "ai_message_conversation_id_client_request_id_key"
ON "ai_message"("conversation_id", "client_request_id");
