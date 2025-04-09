import type { User } from './User'

export default interface Reminder {
  id: number
  title: string
  description: string
  reminderType: string
  status: string
  createdAt: string
  scheduledTime: string | null
  isSendChatGroup: boolean
  users: User[]
}
