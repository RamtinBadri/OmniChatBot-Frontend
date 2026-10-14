import apiClient from './client'
import type { PageDTO } from './types'

export interface AvailableModelDTO {
  id: string
  name: string
  defaultModel: boolean
}

export interface ModelCatalogDTO {
  defaultModel: string
  models: PageDTO<AvailableModelDTO>
}

export interface CompleteModelCatalogDTO {
  defaultModel: string
  models: AvailableModelDTO[]
}

export async function getModelCatalog(page = 0, size = 12): Promise<ModelCatalogDTO> {
  const { data } = await apiClient.get<ModelCatalogDTO>('/models', { params: { page, size } })
  return data
}

export async function getCompleteModelCatalog(size = 100): Promise<CompleteModelCatalogDTO> {
  const firstPage = await getModelCatalog(0, size)
  const models = [...firstPage.models.content]

  for (let page = 1; page < firstPage.models.totalPages; page += 1) {
    const result = await getModelCatalog(page, size)
    models.push(...result.models.content)
  }

  return { defaultModel: firstPage.defaultModel, models }
}
