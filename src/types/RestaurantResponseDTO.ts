export class RestaurantResponseDTO {
    id: number;
    name: string;
    link: string;
    orderCount: number;
    totalVotes: number;
    totalStars: number;
    type: RestaurantType; // Added type property

    constructor(
        id: number,
        name: string,
        link: string,
        isBlacklisted: boolean,
        orderCount: number,
        totalVotes: number,
        totalStars: number,
        type: RestaurantType // Added type parameter
    ) {
        this.id = id;
        this.name = name;
        this.link = link;
        this.orderCount = orderCount;
        this.totalVotes = totalVotes;
        this.totalStars = totalStars;
        this.type = type; // Assign type
    }
}

export enum RestaurantType {
    DRINK = "DRINK",
    FOOD = "FOOD",
    BOTH = "BOTH"
}