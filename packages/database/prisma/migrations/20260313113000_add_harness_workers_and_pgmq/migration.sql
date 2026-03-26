CREATE EXTENSION IF NOT EXISTS pgmq;

CREATE TABLE "harness_workers" (
    "id" TEXT NOT NULL,
    "issue_id" INTEGER,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "harness_workers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "harness_workers_issue_id_key" ON "harness_workers"("issue_id");
CREATE INDEX "harness_workers_status_idx" ON "harness_workers"("status");
CREATE INDEX "harness_workers_last_updated_at_idx" ON "harness_workers"("last_updated_at");
CREATE INDEX "harness_workers_status_last_updated_at_idx" ON "harness_workers"("status", "last_updated_at");
