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

export async function getModelCatalog(page = 0, size = 12): Promise<ModelCatalogDTO> {
  const { data } = await apiClient.get<ModelCatalogDTO>('/models', { params: { page, size } })
  return data
}
