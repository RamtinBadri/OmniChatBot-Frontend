import apiClient from './client'
import type { PageDTO } from './types'

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'

export interface TicketDTO {
  id: string
  userId: string
  subject: string
  description: string
  status: TicketStatus
  createdAt: string
  updatedAt: string
}

export interface CreateTicketRequest {
  subject: string
  description: string
}

export interface TicketQuery {
  page: number
  size: number
  sort: string
  search?: string
  status?: TicketStatus
}

export interface TicketHistoryDTO {
  id: string
  ticketId: string
  userId: string
  type: 'STATUS_CHANGE' | 'REPLY'
  status: TicketStatus | null
  message: string | null
  createdAt: string
}

export async function getTickets(query: TicketQuery): Promise<PageDTO<TicketDTO>> {
  const { data } = await apiClient.get<PageDTO<TicketDTO>>('/tickets', { params: query })
  return data
}

export async function getTicket(ticketId: string): Promise<TicketDTO> {
  const { data } = await apiClient.get<TicketDTO>(`/tickets/${encodeURIComponent(ticketId)}`)
  return data
}

export async function createTicket(request: CreateTicketRequest): Promise<TicketDTO> {
  const { data } = await apiClient.post<TicketDTO>('/tickets', request)
  return data
}

export interface AdminTicketQuery extends TicketQuery {
  userId?: string
}

export async function getAdminTickets(query: AdminTicketQuery): Promise<PageDTO<TicketDTO>> {
  const { data } = await apiClient.get<PageDTO<TicketDTO>>('/admin/tickets', { params: query })
  return data
}

export async function getAdminTicket(ticketId: string): Promise<TicketDTO> {
  const { data } = await apiClient.get<TicketDTO>(`/admin/tickets/${encodeURIComponent(ticketId)}`)
  return data
}

export async function getTicketHistory(ticketId: string, page = 0, size = 20): Promise<PageDTO<TicketHistoryDTO>> {
  const { data } = await apiClient.get<PageDTO<TicketHistoryDTO>>(
    `/admin/tickets/${encodeURIComponent(ticketId)}/history`,
    { params: { page, size, sort: 'createdAt,asc' } },
  )
  return data
}

export async function replyToTicket(ticketId: string, message: string): Promise<void> {
  await apiClient.post(`/admin/tickets/${encodeURIComponent(ticketId)}/replies`, { message })
}

export async function updateTicketStatus(ticketId: string, status: TicketStatus): Promise<void> {
  await apiClient.patch(`/admin/tickets/${encodeURIComponent(ticketId)}/status`, { status })
}
