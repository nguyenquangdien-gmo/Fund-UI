export class OrderItemVoteRequestDTO {
    orderItemId: number; // ID của OrderItem
    rating: number;      // Đánh giá từ 1 đến 5 sao
    note?: string;       // Optional note

    constructor(orderItemId: number, rating: number, note?: string) {
        this.orderItemId = orderItemId;
        this.rating = rating;
        this.note = note;
    }
}