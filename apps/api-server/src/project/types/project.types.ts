import {
  CreateProjectInput,
  CreateProjectResponseDto as SharedCreateProjectResponseDto,
  GetProjectResponseDto as SharedGetProjectResponseDto,
  GetProjectsResponseDto as SharedGetProjectsResponseDto,
  UpdateProjectResponseDto as SharedUpdateProjectResponseDto,
  UpdateProjectInput,
} from '@repo/shared/project/types'

export interface CreateProjectDto {
  project: CreateProjectInput
}

export interface UpdateProjectDto {
  project: UpdateProjectInput
}

export type GetProjectsResponseDto = SharedGetProjectsResponseDto
export type GetProjectResponseDto = SharedGetProjectResponseDto
export type CreateProjectResponseDto = SharedCreateProjectResponseDto
export type UpdateProjectResponseDto = SharedUpdateProjectResponseDto
