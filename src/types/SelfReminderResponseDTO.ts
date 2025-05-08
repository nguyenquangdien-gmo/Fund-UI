export class SelfReminderResponseDTO {
    id: number;
    title: string;
    message: string;
    startTime: Date;
    endTime: Date;
    notifyHour: string;
    repeatCount: number;
    repeatIntervalDays: number;
    status: string;
    createdAt: Date;

    constructor(
        id: number,
        title: string,
        message: string,
        startTime: Date,
        endTime: Date,
        notifyHour: number,
        repeatCount: number,
        repeatIntervalDays: number,
        status: string,
        createdAt: Date
    ) {
        this.id = id;
        this.title = title;
        this.message = message;
        this.startTime = startTime;
        this.endTime = endTime;
        this.notifyHour = notifyHour;
        this.repeatCount = repeatCount;
        this.repeatIntervalDays = repeatIntervalDays;
        this.status = status;
        this.createdAt = createdAt;
    }
}