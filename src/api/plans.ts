import apiClient from './client'
import type { PageDTO } from './types'
import type { SubscriptionDTO } from './subscriptions'

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

export interface PlanRequest {
  name: string
  price: number
  duration: number
  creditLimit: number
  active: boolean
}

export type { PageDTO } from './types'
export async function getAdminPlan(planId: string): Promise<PlanDTO> {
  const { data } = await apiClient.get<PlanDTO>(`/admin/plans/${encodeURIComponent(planId)}`)
  return data
}

export async function createAdminPlan(request: PlanRequest): Promise<PlanDTO> {
  const { data } = await apiClient.post<PlanDTO>('/admin/plans', request)
  return data
}

export async function updateAdminPlan(planId: string, request: PlanRequest): Promise<PlanDTO> {
  const { data } = await apiClient.put<PlanDTO>(`/admin/plans/${encodeURIComponent(planId)}`, request)
  return data
}

export async function deactivateAdminPlan(planId: string): Promise<void> {
  await apiClient.delete(`/admin/plans/${encodeURIComponent(planId)}`)
}

export async function getPlanSubscriptions(planId: string, page = 0, size = 10): Promise<PageDTO<SubscriptionDTO>> {
  const { data } = await apiClient.get<PageDTO<import('./subscriptions').SubscriptionDTO>>(
    `/admin/plans/${encodeURIComponent(planId)}/subscriptions`, { params: { page, size } },
  )
  return data
}

export async function getPlans(page = 0, size = 10): Promise<PageDTO<PlanDTO>> {
  const { data } = await apiClient.get<PageDTO<PlanDTO>>('/plans', { params: { page, size } })
  return data
}
