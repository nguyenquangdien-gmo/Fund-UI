export interface OrderRequestDTO {
  title: string;
  description: string;
  deadline: Date;
  restaurantId: number | null;
  relatedUserIds: number[];
}
