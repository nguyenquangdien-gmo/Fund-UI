import type Team from './Team'
import type UserRole from './UserRole'

export interface User {
  id: number
  fullName: string
  email: string
  password: string
  status: string
  role:
    | {
        id: number
        name: string
      }
    | string
  dob: string
  position: string
  phoneNumber: string
  team: string | Team
  joinDate: string
}
