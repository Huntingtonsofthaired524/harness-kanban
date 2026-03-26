-- CreateTable
CREATE TABLE "chat" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT,
    "userId" TEXT,
    "model" TEXT,
    "metadata" JSONB,

    CONSTRAINT "chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" TEXT NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "part" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "text_content" TEXT,
    "text_state" TEXT,
    "reasoning_content" TEXT,
    "reasoning_state" TEXT,
    "file_mediaType" TEXT,
    "file_url" TEXT,
    "file_filename" TEXT,
    "source_url_sourceId" TEXT,
    "source_url_url" TEXT,
    "source_url_title" TEXT,
    "source_document_sourceId" TEXT,
    "source_document_mediaType" TEXT,
    "source_document_title" TEXT,
    "source_document_filename" TEXT,
    "tool_toolCallId" TEXT,
    "tool_name" TEXT,
    "tool_state" TEXT,
    "tool_input" JSONB,
    "tool_output" JSONB,
    "tool_errorText" TEXT,
    "tool_providerExecuted" BOOLEAN,
    "data_type" TEXT,
    "data_id" TEXT,
    "data_payload" JSONB,
    "provider_metadata" JSONB,

    CONSTRAINT "part_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chat_userId_idx" ON "chat"("userId");

-- CreateIndex
CREATE INDEX "chat_createdAt_idx" ON "chat"("createdAt");

-- CreateIndex
CREATE INDEX "message_chatId_idx" ON "message"("chatId");

-- CreateIndex
CREATE INDEX "message_chatId_createdAt_idx" ON "message"("chatId", "createdAt");

-- CreateIndex
CREATE INDEX "part_messageId_idx" ON "part"("messageId");

-- CreateIndex
CREATE INDEX "part_messageId_order_idx" ON "part"("messageId", "order");

-- CreateIndex
CREATE INDEX "part_type_idx" ON "part"("type");

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part" ADD CONSTRAINT "part_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
