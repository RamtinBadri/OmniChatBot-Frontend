import apiClient from './client'

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

export interface UpdateUserRequest {
  email: string
  firstName: string
  lastName: string
}

export async function getCurrentUser(): Promise<UserDTO> {
  const { data } = await apiClient.get<UserDTO>('/users/me')
  return data
}

export async function updateUser(userId: string, request: UpdateUserRequest): Promise<UserDTO> {
  const { data } = await apiClient.put<UserDTO>(`/users/${encodeURIComponent(userId)}`, request)
  return data
}
