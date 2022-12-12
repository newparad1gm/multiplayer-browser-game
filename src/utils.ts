export class Utils {
    static now() {
        return new Date();
    }

    static offsetTime(date: Date, offset: number): Date {
        return new Date(date.getTime() + offset);
    }

    static async delay(duration: number) {
        return new Promise(resolve => {
            setTimeout(resolve, duration);
        });
    }
}