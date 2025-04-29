export class RestaurantFeedbackRequestDto {
    restaurantId: number;
    feedbackType: number; // 1 = like, -1 = dislike

    constructor(restaurantId: number, feedbackType: number) {
        this.restaurantId = restaurantId;
        this.feedbackType = feedbackType;
    }
}