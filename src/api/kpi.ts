import apiClient from './client'

export interface KpiSummaryDTO {
  totalUsers: number
  activeUsers: number
  subscribedUsers: number
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  totalInputTokens: number
  totalOutputTokens: number
  totalTokens: number
  totalProviderCost: number
  totalChargedAmount: number
  subscriptionRevenue: number
  creditPurchaseRevenue: number
  totalRevenue: number
}

export interface KpiUsageDTO {
  date: string
  requests: number
  successfulRequests: number
  failedRequests: number
  inputTokens: number
  outputTokens: number
  totalTokens: number
  providerCost: number
  chargedAmount: number
}

export async function getKpiSummary(): Promise<KpiSummaryDTO> {
  const { data } = await apiClient.get<KpiSummaryDTO>('/admin/kpi/summary')
  return data
}

export async function getKpiUsage(from: string, to: string): Promise<KpiUsageDTO[]> {
  const { data } = await apiClient.get<KpiUsageDTO[]>('/admin/kpi/usage', { params: { from, to } })
  return data
}
