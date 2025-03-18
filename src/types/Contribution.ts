export default interface Contributiond {
  id: number
  memberId: number
  memberName: string
  periodId: number
  periodName: string
  totalAmount: number
  paymentStatus: string
  note: string
  deadline: string
  isLate: boolean
  owedAmount: number
  overPaidAmount: number
  createdAt: string
}
// export default Contribution;
