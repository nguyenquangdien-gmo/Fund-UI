export default interface Team {
  id: number
  name: string
  slug: string
  qrcode: Uint8Array
  description: string
  regulation: string
  created_at: string
}
