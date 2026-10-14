import apiClient from './client'
import type { PageDTO } from './types'

export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED'

export interface SubscriptionDTO {
  id: string
  userId: string
  planId: string
  pricePaid: number
  startDate: string
  endDate: string
  status: SubscriptionStatus
  remainingCredit: number
}

export interface SubscriptionQuery {
  page: number
  size: number
  sort?: string
  userId?: string
  planId?: string
  status?: SubscriptionStatus
}

export async function getAdminSubscriptions(query: SubscriptionQuery): Promise<PageDTO<SubscriptionDTO>> {
  const { data } = await apiClient.get<PageDTO<SubscriptionDTO>>('/admin/subscriptions', { params: query })
  return data
}

export async function getAdminSubscription(id: string): Promise<SubscriptionDTO> {
  const { data } = await apiClient.get<SubscriptionDTO>(`/admin/subscriptions/${encodeURIComponent(id)}`)
  return data
}

export async function cancelAdminSubscription(id: string): Promise<void> {
  await apiClient.delete(`/admin/subscriptions/${encodeURIComponent(id)}`)
}
