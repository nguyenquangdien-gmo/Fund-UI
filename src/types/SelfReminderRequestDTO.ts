export class SelfReminderRequestDTO {
    title: string;
    message: string;
    startTime: Date; // JavaScript Date object
    endTime: Date; // JavaScript Date object
    notifyHour: Date; // Time in "HH:mm:ss" format
    repeatCount: string;
    repeatIntervalDays: string;

    constructor(
        title: string,
        message: string,
        startTime: Date,
        endTime: Date,
        notifyHour: Date,
        repeatCount: string,
        repeatIntervalDays: string
    ) {
        this.title = title;
        this.message = message;
        this.startTime = startTime;
        this.endTime = endTime;
        this.notifyHour = notifyHour;
        this.repeatCount = repeatCount;
        this.repeatIntervalDays = repeatIntervalDays;
    }
}