export enum RestaurantType {
    DRINK = "DRINK",
    FOOD = "FOOD",
    BOTH = "BOTH"
}

export interface RestaurantRequestDTO {
    name: string;
    link: string;
    type: RestaurantType; // added type
}