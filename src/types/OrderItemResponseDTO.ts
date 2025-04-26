export interface UserResponseDTO {
    id: number;
    fullName: string;
    email: string;
    role: string;
    phoneNumber: string;
    position: string;
    team: string;
    dob: Date;
    joinDate: Date;
  }
  
  export interface OrderItemResponseDTO {
    id: number;
    orderId: number;
    user: UserResponseDTO;
    itemName: string;
    size: string;
    sugar: string;
    ice: string;
    topping: string;
    note: string;
    createdAt: Date;
  }
  