export default interface UserDto {
  id: number
  fullName: string
  email: string
}

export default interface Trans {
  id: number
  userDto: UserDto
  amount: number
  description: string
  transactionType: string
  createdAt: string
}
