export class OrderResponseDTO {
    id: number;
    title: string;
    description: string;
    deadline: Date;
    status: string;
    restaurantId: number;
    restaurantName: string;
    restaurantLink: string;
    createdBy: UserResponseDTO;
    createdAt: Date;

    constructor(
        id: number,
        title: string,
        description: string,
        deadline: Date,
        status: string,
        restaurantId: number,
        restaurantName: string,
        restaurantLink: string,
        createdBy: UserResponseDTO,
        createdAt: Date
    ) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.deadline = deadline;
        this.status = status;
        this.restaurantId = restaurantId;
        this.restaurantName = restaurantName;
        this.restaurantLink = restaurantLink;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
    }
}

export class UserResponseDTO {
    id: number;
    fullName: string;
    email: string;
    role: string;
    phoneNumber: string;
    position: string;
    team: string;
    dob: Date;
    joinDate: Date;

    constructor(
        id: number,
        fullName: string,
        email: string,
        role: string,
        phoneNumber: string,
        position: string,
        team: string,
        dob: Date,
        joinDate: Date
    ) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.role = role;
        this.phoneNumber = phoneNumber;
        this.position = position;
        this.team = team;
        this.dob = dob;
        this.joinDate = joinDate;
    }
}