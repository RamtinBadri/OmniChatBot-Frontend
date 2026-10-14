import apiClient from './client'
import type { PageDTO } from './types'

export interface PlanDTO {
  id: string
  name: string
  price: number
  duration: number
  creditLimit: number
  active: boolean
  createdAt: string
  updatedAt: string
}

export type { PageDTO } from './types'
export async function getPlans(page = 0, size = 10): Promise<PageDTO<PlanDTO>> {
  const { data } = await apiClient.get<PageDTO<PlanDTO>>('/plans', { params: { page, size } })
  return data
}
