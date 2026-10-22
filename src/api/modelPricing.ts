import apiClient from './client'

export interface ModelPricingDTO {
  id: string
  model: string
  inputPricePerMillion: number
  outputPricePerMillion: number
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface ModelPricingRequest {
  model: string
  inputPricePerMillion: number
  outputPricePerMillion: number
  active: boolean
}

export interface ModelPricingCatalogDTO {
  defaultInputPricePerMillion: number
  defaultOutputPricePerMillion: number
  pricing: ModelPricingDTO[]
}

export async function getAdminModelPricing(): Promise<ModelPricingCatalogDTO> {
  const { data } = await apiClient.get<ModelPricingCatalogDTO>('/admin/model-pricing')
  return data
}

export async function saveAdminModelPricing(model: string, request: ModelPricingRequest): Promise<ModelPricingDTO> {
  const { data } = await apiClient.put<ModelPricingDTO>('/admin/model-pricing', { ...request, model })
  return data
}

export async function deactivateAdminModelPricing(model: string): Promise<void> {
  await apiClient.delete('/admin/model-pricing', { params: { model } })
}
