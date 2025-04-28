export class OrderItemFeedbackRequestDTO {
    private orderItemId: number;
    private feedbackType: number; // 1 = like, -1 = dislike

    constructor(orderItemId: number, feedbackType: number) {
        this.orderItemId = orderItemId;
        this.feedbackType = feedbackType;
    }

    public getOrderItemId(): number {
        return this.orderItemId;
    }

    public setOrderItemId(orderItemId: number): void {
        this.orderItemId = orderItemId;
    }

    public getFeedbackType(): number {
        return this.feedbackType;
    }

    public setFeedbackType(feedbackType: number): void {
        this.feedbackType = feedbackType;
    }
}