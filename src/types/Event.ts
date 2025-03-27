import type { User } from './User'

export default interface Event {
  id: number
  name: string
  eventTime: string
  location: string
  hosts: User[]
}
