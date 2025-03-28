function isTokenExpired(token: string): boolean {
  const payload = JSON.parse(atob(token.split('.')[1])) // Giải mã payload của JWT
  const exp = payload.exp * 1000 // Chuyển timestamp thành milliseconds
  return Date.now() >= exp
}
export default isTokenExpired
