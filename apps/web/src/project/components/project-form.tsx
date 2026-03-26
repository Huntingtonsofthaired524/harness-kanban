'use client'

import { LoaderCircle } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import React, { useEffect, useMemo } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/shadcn/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { isSupportedGithubRepoReference } from '@repo/shared'
import {
  CreateProjectInput,
  normalizeProjectMcpConfig,
  ProjectDetail,
  ProjectMcpConfig,
  projectMcpConfigSchema,
  UpdateProjectInput,
} from '@repo/shared/project/types'

const MCP_CONFIG_PLACEHOLDER = `{
  "docs": {
    "type": "streamable-http",
    "url": "https://example.com/mcp"
  },
  "repo-tools": {
    "type": "stdio",
    "command": "node",
    "args": ["scripts/mcp.js", "--port", "3000"],
    "env": {
      "DEBUG": "1"
    }
  }
}`

const parseProjectMcpConfigText = (
  value: string,
): {
  config: ProjectMcpConfig | null
  error: string | null
} => {
  const trimmed = value.trim()
  if (!trimmed) {
    return {
      config: null,
      error: null,
    }
  }

  let parsedJson: unknown
  try {
    parsedJson = JSON.parse(trimmed)
  } catch {
    return {
      config: null,
      error: 'MCP config must be valid JSON.',
    }
  }

  const parsedConfig = projectMcpConfigSchema.safeParse(parsedJson)
  if (!parsedConfig.success) {
    const issue = parsedConfig.error.issues[0]
    const path = issue?.path?.length ? ` (${issue.path.join('.')})` : ''

    return {
      config: null,
      error: issue ? `${issue.message}${path}` : 'MCP config is invalid.',
    }
  }

  return {
    config: normalizeProjectMcpConfig(parsedConfig.data),
    error: null,
  }
}

const projectFormSchema = z.object({
  name: z.string().trim().min(1, 'Project name is required').max(120, 'Project name must be at most 120 characters'),
  githubRepoUrl: z
    .string()
    .trim()
    .min(1, 'GitHub repository URL is required')
    .refine(isSupportedGithubRepoReference, 'Enter a valid GitHub repository URL or SSH path'),
  repoBaseBranch: z
    .string()
    .trim()
    .min(1, 'Repository base branch is required')
    .max(255, 'Repository base branch must be at most 255 characters'),
  checkCiCd: z.boolean(),
  mcpConfigText: z.string().superRefine((value, ctx) => {
    const parsed = parseProjectMcpConfigText(value)
    if (parsed.error) {
      ctx.addIssue({
        code: 'custom',
        message: parsed.error,
      })
    }
  }),
})

type ProjectFormValues = z.infer<typeof projectFormSchema>

type ProjectFormBaseProps = {
  initialProject?: Partial<ProjectDetail>
  isSubmitting?: boolean
  submitLabel: string
  onCancel?: () => void
  className?: string
}

type ProjectFormProps =
  | (ProjectFormBaseProps & {
      mode: 'create'
      onSubmit: (payload: CreateProjectInput) => Promise<void> | void
    })
  | (ProjectFormBaseProps & {
      mode: 'update'
      onSubmit: (payload: UpdateProjectInput) => Promise<void> | void
    })

const formatProjectMcpConfig = (config?: ProjectMcpConfig | null): string => {
  const normalizedConfig = normalizeProjectMcpConfig(config)
  return normalizedConfig ? JSON.stringify(normalizedConfig, null, 2) : ''
}

const projectToFormValues = (project?: Partial<ProjectDetail>): ProjectFormValues => ({
  name: project?.name ?? '',
  githubRepoUrl: project?.githubRepoUrl ?? '',
  repoBaseBranch: project?.repoBaseBranch ?? '',
  checkCiCd: project?.checkCiCd ?? false,
  mcpConfigText: formatProjectMcpConfig(project?.mcpConfig),
})

const ReadonlyProjectField: React.FC<{
  label: string
  value: React.ReactNode
}> = ({ label, value }) => {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="break-all text-sm">{value}</div>
    </div>
  )
}

export const ProjectForm: React.FC<ProjectFormProps> = ({
  mode,
  initialProject,
  isSubmitting = false,
  submitLabel,
  onCancel,
  onSubmit,
  className,
}) => {
  const defaultValues = useMemo(() => projectToFormValues(initialProject), [initialProject])
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues,
  })

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = form

  useEffect(() => {
    reset(defaultValues)
  }, [defaultValues, reset])

  const handleFormSubmit = async (values: ProjectFormValues) => {
    const parsedMcpConfig = parseProjectMcpConfigText(values.mcpConfigText)
    if (parsedMcpConfig.error) {
      form.setError('mcpConfigText', {
        message: parsedMcpConfig.error,
      })
      return
    }

    if (mode === 'create') {
      await onSubmit({
        name: values.name,
        githubRepoUrl: values.githubRepoUrl,
        repoBaseBranch: values.repoBaseBranch,
        checkCiCd: values.checkCiCd,
        ...(parsedMcpConfig.config ? { mcpConfig: parsedMcpConfig.config } : {}),
      })
      return
    }

    await onSubmit({
      name: values.name,
      checkCiCd: values.checkCiCd,
      mcpConfig: parsedMcpConfig.config,
    })
  }

  const repoFieldsDisabled = mode === 'update'

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className={cn('space-y-5', className)}>
      <div className="space-y-2">
        <Label htmlFor={`${mode}-project-name`}>Name</Label>
        <Input id={`${mode}-project-name`} {...register('name')} placeholder="Fraud detection service" />
        {errors.name?.message ? <p className="text-sm text-red-500">{errors.name.message}</p> : null}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          {repoFieldsDisabled ? (
            <ReadonlyProjectField
              label="GitHub repository URL"
              value={
                <a
                  href={defaultValues.githubRepoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline-offset-4 hover:underline">
                  {defaultValues.githubRepoUrl}
                </a>
              }
            />
          ) : (
            <>
              <Label htmlFor={`${mode}-project-repo`}>GitHub repository URL</Label>
              <Input
                id={`${mode}-project-repo`}
                {...register('githubRepoUrl')}
                placeholder="https://github.com/org/repo or git@github.com:org/repo.git"
              />
              {errors.githubRepoUrl?.message ? (
                <p className="text-sm text-red-500">{errors.githubRepoUrl.message}</p>
              ) : null}
            </>
          )}
        </div>

        <div className="space-y-2">
          {repoFieldsDisabled ? (
            <ReadonlyProjectField
              label="Repository base branch"
              value={<span className="font-mono">{defaultValues.repoBaseBranch}</span>}
            />
          ) : (
            <>
              <Label htmlFor={`${mode}-project-branch`}>Repository base branch</Label>
              <Input id={`${mode}-project-branch`} {...register('repoBaseBranch')} placeholder="main" />
              {errors.repoBaseBranch?.message ? (
                <p className="text-sm text-red-500">{errors.repoBaseBranch.message}</p>
              ) : null}
            </>
          )}
        </div>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Label htmlFor={`${mode}-project-ci`} className="text-sm font-medium">
            Check CI/CD
          </Label>
          <p className="text-muted-foreground text-sm">
            Store whether the Coding Agent should later verify CI/CD passes and keep fixing related issues until it
            does.
          </p>
        </div>
        <Controller
          control={control}
          name="checkCiCd"
          render={({ field }) => (
            <Switch
              id={`${mode}-project-ci`}
              checked={field.value}
              onCheckedChange={field.onChange}
              aria-label="Toggle project CI/CD check"
            />
          )}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${mode}-project-mcp-config`}>MCP config (JSON)</Label>
        <Textarea
          id={`${mode}-project-mcp-config`}
          {...register('mcpConfigText')}
          className="min-h-48 font-mono text-sm"
          placeholder={MCP_CONFIG_PLACEHOLDER}
          spellCheck={false}
        />
        <p className="text-muted-foreground text-sm">
          Store project-level MCP servers for Codex. This config is loaded only when a new workspace is created, and
          existing workspaces stay unchanged.
        </p>
        {errors.mcpConfigText?.message ? <p className="text-sm text-red-500">{errors.mcpConfigText.message}</p> : null}
      </div>

      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
