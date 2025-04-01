export default interface Team {
  id: number
  name: string
  slug: string
  qrcode: Uint8Array
  description: string
  created_at: string
}
