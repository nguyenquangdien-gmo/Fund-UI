import type Penalty from './Penalty'
import type { PaymentStatus } from './PaymentStatus'

export interface User {
  id: number
  fullName: string
  email: string
  role: string
  phoneNumber: string
  position: string
  team: string
  dob: string
  joinDate: string
}

export default interface PenaltySlip {
  id: number
  user: User
  penalty: Penalty
  dueDate: string
  amount: number
  description: string
  paymentStatus: PaymentStatus
}
