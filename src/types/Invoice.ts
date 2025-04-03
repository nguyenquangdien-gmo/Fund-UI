import type FundType from './FundType'
import type InvoiceType from './InvoiceType'

export default interface Invoice {
  id: number
  name: string
  description: string
  userId: number
  amount: number
  type: InvoiceType
  fundType: FundType
  createdAt: string
}
