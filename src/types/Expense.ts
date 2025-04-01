import type FundType from './FundType'

export default interface Expense {
  id: number
  name: string
  description: string
  userId: number
  amount: number
  expenseType: FundType
  createdAt: string
}
