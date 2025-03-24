import { ref } from 'vue'
import formatCurrency from './FormatCurrency'
import type { User } from '@/types/User'

let message = 'Các anh/chị/em chưa đóng quỹ hoặc còn nợ:\n'
interface UserData {
  user: User
  amountToPay: number
}

const formatUserDebtMessageForExcel = (users: UserData[]): string => {
  message += '|STT | TÊN | TIỀN NỢ|\n'
  message += '|--- | --- | ---|\n' // Dòng phân cách cột

  users.forEach((userDebt, index) => {
    const stt = (index + 1).toString() // Số thứ tự
    const name = userDebt.user.fullName // Họ tên
    const amount = formatCurrency(userDebt.amountToPay.toLocaleString()) // Số tiền đã format

    message += `|${stt} | ${name} | ${amount}|\n`
  })

  return message
}
export default formatUserDebtMessageForExcel
