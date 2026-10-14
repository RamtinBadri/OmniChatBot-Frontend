import apiClient from './client'
import type { PageDTO } from './types'

export interface UsageRecordDTO {
  id: string
  aiRequestId: string
  userId: string
  conversationId: string
  model: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  providerCost: number
  chargedAmount: number
  timestamp: string
}

export interface UsageSummaryDTO {
  totalRequests: number
  totalInputTokens: number
  totalOutputTokens: number
  totalTokens: number
  totalCost: number
}

export async function getUsageHistory(page = 0, size = 10): Promise<PageDTO<UsageRecordDTO>> {
  const { data } = await apiClient.get<PageDTO<UsageRecordDTO>>('/usage', {
    params: { page, size, sort: 'timestamp,desc' },
  })
  return data
}

export async function getUsageSummary(): Promise<UsageSummaryDTO> {
  const { data } = await apiClient.get<UsageSummaryDTO>('/usage/summary')
  return data
}
