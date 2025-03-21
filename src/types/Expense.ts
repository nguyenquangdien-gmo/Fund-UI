import type ExpenseType from './ExpenseType'

export default interface Expense {
  id: number
  name: string
  description: string
  userId: number
  amount: number
  expenseType: ExpenseType
  createdAt: string
}
