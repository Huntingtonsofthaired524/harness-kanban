/*
  Warnings:

  - You are about to drop the `suprsend_user_channel_config` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "suprsend_user_channel_config";

-- CreateTable
CREATE TABLE "notification_payload" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_payload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_delivery" (
    "id" TEXT NOT NULL,
    "notification_payload_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "channel_type" TEXT NOT NULL,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_delivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notification_payload_workspace_id_created_at_idx" ON "notification_payload"("workspace_id", "created_at");

-- CreateIndex
CREATE INDEX "notification_delivery_user_id_channel_type_created_at_idx" ON "notification_delivery"("user_id", "channel_type", "created_at");

-- CreateIndex
CREATE INDEX "notification_delivery_user_id_channel_type_read_at_idx" ON "notification_delivery"("user_id", "channel_type", "read_at");

-- CreateIndex
CREATE INDEX "notification_delivery_notification_payload_id_idx" ON "notification_delivery"("notification_payload_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_delivery_notification_payload_id_user_id_chann_key" ON "notification_delivery"("notification_payload_id", "user_id", "channel_type");

-- AddForeignKey
ALTER TABLE "notification_delivery" ADD CONSTRAINT "notification_delivery_notification_payload_id_fkey" FOREIGN KEY ("notification_payload_id") REFERENCES "notification_payload"("id") ON DELETE CASCADE ON UPDATE CASCADE;
