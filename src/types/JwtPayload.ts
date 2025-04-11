export default interface JwtPayload {
  exp: number
  sub: string
  role?: string
}
