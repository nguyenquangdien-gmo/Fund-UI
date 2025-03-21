import type UserRole from './UserRole'

export interface User {
  id: number
  fullName: string
  email: string
  password: string
  status: string
  role: UserRole
}
