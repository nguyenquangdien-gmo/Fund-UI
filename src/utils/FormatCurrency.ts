const formatCurrency = (value: string) => {
  return Number(value).toLocaleString('vi-VN') + ' VND'
}
export default formatCurrency
