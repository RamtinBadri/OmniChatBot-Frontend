import apiClient from './client'

export interface RegisterRequest {
  username: string
  email: string
  password: string
  firstName: string
  lastName: string
}

export interface LoginRequest {
  username: string
  password: string
}

const TOKEN_KEY = 'accessToken'

export async function register(request: RegisterRequest): Promise<void> {
  await apiClient.post('/auth/register', request)
}

export async function login(request: LoginRequest): Promise<string> {
  const { data } = await apiClient.post<string>('/auth/login', request)
  const token = typeof data === 'string' ? data.trim() : ''

  if (!token) {
    throw new Error('The login endpoint returned an empty token.')
  }

  localStorage.setItem(TOKEN_KEY, token)
  return token
}

export function logout(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}
