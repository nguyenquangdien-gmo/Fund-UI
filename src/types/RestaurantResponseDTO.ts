export class RestaurantResponseDTO {
    id: number;
    name: string;
    link: string;
    isBlacklisted: boolean;
    orderCount: number;
    totalVotes: number;
    totalStars: number;

    constructor(
        id: number,
        name: string,
        link: string,
        isBlacklisted: boolean,
        orderCount: number,
        totalVotes: number,
        totalStars: number
    ) {
        this.id = id;
        this.name = name;
        this.link = link;
        this.isBlacklisted = isBlacklisted;
        this.orderCount = orderCount;
        this.totalVotes = totalVotes;
        this.totalStars = totalStars;
    }
}