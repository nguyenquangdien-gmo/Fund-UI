import type Late from '@/types/Late'
const extractLateRecords = (message: string): Late[] => {
  const regex = /\|([^|]+?)\s*\|\s*([^|]+)\s*\|/g
  const records: Late[] = []
  let match

  while ((match = regex.exec(message)) !== null) {
    const name = match[1].trim()
    let checkinAt = match[2].trim()
    let note = null

    if (checkinAt.includes('(Có đơn NP)')) {
      note = 'Có đơn NP'
      checkinAt = checkinAt.replace(/\(Có đơn NP\)/, '').trim()
    }

    // Nếu là "Nghỉ phép" hoặc "-", đặt checkinAt thành rỗng
    if (checkinAt === 'Nghỉ phép' || checkinAt === '-') {
      checkinAt = ''
    }

    records.push({ name, checkinAt, note })
  }

  return records
}
export default extractLateRecords
