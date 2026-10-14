import apiClient from './client'

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

export interface PageDTO<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
}

export async function getPlans(page = 0, size = 10): Promise<PageDTO<PlanDTO>> {
  const { data } = await apiClient.get<PageDTO<PlanDTO>>('/plans', { params: { page, size } })
  return data
}
