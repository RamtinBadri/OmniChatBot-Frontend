import apiClient from './client'
import type { PageDTO } from './types'

export type ConversationStatus = 'ACTIVE' | 'ARCHIVED'
export type MessageRole = 'USER' | 'ASSISTANT' | 'SYSTEM'

export interface ConversationDTO {
  id: string
  userId: string
  title: string
  model: string
  status: ConversationStatus
  createdAt: string
  updatedAt: string
}

export interface MessageDTO {
  id: string
  conversationId: string
  role: MessageRole
  content: string
  createdAt: string
}

export interface MessageExchangeDTO {
  userMessage: MessageDTO
  assistantMessage: MessageDTO
}

export interface ConversationQuery {
  page: number
  size: number
  sort?: string
  search?: string
  status?: ConversationStatus
}

export async function getConversations(query: ConversationQuery): Promise<PageDTO<ConversationDTO>> {
  const { data } = await apiClient.get<PageDTO<ConversationDTO>>('/conversations', { params: query })
  return data
}

export async function getConversation(id: string): Promise<ConversationDTO> {
  const { data } = await apiClient.get<ConversationDTO>(`/conversations/${encodeURIComponent(id)}`)
  return data
}

export async function createConversation(title: string, model: string): Promise<ConversationDTO> {
  const { data } = await apiClient.post<ConversationDTO>('/conversations', { title, model })
  return data
}

export async function renameConversation(id: string, title: string): Promise<ConversationDTO> {
  const { data } = await apiClient.put<ConversationDTO>(`/conversations/${encodeURIComponent(id)}`, { title })
  return data
}

export async function updateConversationModel(id: string, model: string): Promise<ConversationDTO> {
  const { data } = await apiClient.put<ConversationDTO>(`/conversations/${encodeURIComponent(id)}`, { model })
  return data
}

export async function archiveConversation(id: string): Promise<void> {
  await apiClient.patch(`/conversations/${encodeURIComponent(id)}/archive`)
}

export async function deleteConversation(id: string): Promise<void> {
  await apiClient.delete(`/conversations/${encodeURIComponent(id)}`)
}

export async function getMessages(conversationId: string, page: number, size: number): Promise<PageDTO<MessageDTO>> {
  const { data } = await apiClient.get<PageDTO<MessageDTO>>(
    `/conversations/${encodeURIComponent(conversationId)}/messages`,
    { params: { page, size, sort: 'createdAt,asc' } },
  )
  return data
}

export async function sendMessage(conversationId: string, content: string): Promise<MessageExchangeDTO> {
  const { data } = await apiClient.post<MessageExchangeDTO>(
    `/conversations/${encodeURIComponent(conversationId)}/messages`,
    { content },
  )
  return data
}
