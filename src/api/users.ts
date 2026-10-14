import apiClient from './client'
import type { PageDTO } from './types'

export type UserRole = 'USER' | 'ADMIN'
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'

export interface UserDTO {
  id: string
  email: string
  firstName: string
  lastName: string
  userRole: UserRole
  status: UserStatus
  createdAt: string
  updatedAt: string
}

export interface UserQuery {
  page: number
  size: number
  sort?: string
  search?: string
  role?: UserRole
  status?: UserStatus
}

export interface UpdateUserRequest {
  email: string
  firstName: string
  lastName: string
}

export async function getUsers(query: UserQuery): Promise<PageDTO<UserDTO>> {
  const { data } = await apiClient.get<PageDTO<UserDTO>>('/users', { params: query })
  return data
}

export async function getUser(userId: string): Promise<UserDTO> {
  const { data } = await apiClient.get<UserDTO>(`/users/${encodeURIComponent(userId)}`)
  return data
}

export async function updateUserRole(userId: string, role: UserRole): Promise<void> {
  await apiClient.patch(`/admin/users/${encodeURIComponent(userId)}/role`, { role })
}

export async function deleteUser(userId: string): Promise<void> {
  await apiClient.delete(`/users/${encodeURIComponent(userId)}`)
}

export async function getCurrentUser(): Promise<UserDTO> {
  const { data } = await apiClient.get<UserDTO>('/users/me')
  return data
}

export async function updateUser(userId: string, request: UpdateUserRequest): Promise<UserDTO> {
  const { data } = await apiClient.put<UserDTO>(`/users/${encodeURIComponent(userId)}`, request)
  return data
}
