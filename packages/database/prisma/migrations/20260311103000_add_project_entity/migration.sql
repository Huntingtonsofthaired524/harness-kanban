CREATE TABLE "project" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "github_repo_url" TEXT NOT NULL,
    "repo_base_branch" TEXT NOT NULL,
    "check_ci_cd" BOOLEAN NOT NULL DEFAULT false,
    "preview_commands" JSONB,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "project_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "project_workspace_id_created_at_idx" ON "project"("workspace_id", "created_at");
CREATE INDEX "project_workspace_id_name_idx" ON "project"("workspace_id", "name");
CREATE UNIQUE INDEX "project_workspace_id_github_repo_url_key" ON "project"("workspace_id", "github_repo_url");

INSERT INTO "property" (
    "id",
    "name",
    "description",
    "type",
    "config",
    "deletable",
    "readonly",
    "alias",
    "created_at",
    "updated_at",
    "deleted_at"
) VALUES (
    'property0014',
    'Project',
    'Project associated with the issue',
    'project',
    NULL,
    false,
    false,
    'project',
    NOW(),
    NOW(),
    NULL
);
