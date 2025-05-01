const formatCurrency = (value: string | number): string => {
  const numberValue = typeof value === 'string' ? parseFloat(value) : value

  if (isNaN(numberValue)) return '0 VND'

  return numberValue.toLocaleString('vi-VN') + ' VND'
}

export default formatCurrency
