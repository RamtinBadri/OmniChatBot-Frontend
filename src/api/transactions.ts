import apiClient from './client'
import type { PageDTO } from './types'

export type TransactionType = 'SUBSCRIPTION_PURCHASE' | 'CREDIT_PURCHASE'
export type TransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED'

export interface TransactionDTO {
  id: string
  userId: string
  type: TransactionType
  amount: number
  currency: string
  status: TransactionStatus
  reference: string
  createdAt: string
}

export interface TransactionQuery {
  page: number
  size: number
  sort?: string
  userId?: string
  type?: TransactionType
  status?: TransactionStatus
}

export async function getAdminTransactions(query: TransactionQuery): Promise<PageDTO<TransactionDTO>> {
  const { data } = await apiClient.get<PageDTO<TransactionDTO>>('/admin/transactions', { params: query })
  return data
}

export async function getAdminTransaction(id: string): Promise<TransactionDTO> {
  const { data } = await apiClient.get<TransactionDTO>(`/admin/transactions/${encodeURIComponent(id)}`)
  return data
}

export async function updateAdminTransactionStatus(id: string, status: TransactionStatus): Promise<TransactionDTO> {
  const { data } = await apiClient.put<TransactionDTO>(`/admin/transactions/${encodeURIComponent(id)}/status`, null, { params: { status } })
  return data
}
