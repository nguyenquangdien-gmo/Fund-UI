const formatDate = (dateString: string): string => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

export default formatDate

export const formatDateToLocalISOString = (date: Date): string => {
  const offsetMs = date.getTimezoneOffset() * 60 * 1000
  const localTime = new Date(date.getTime() - offsetMs)
  return localTime.toISOString().slice(0, 19) // YYYY-MM-DDTHH:mm:ss
}
