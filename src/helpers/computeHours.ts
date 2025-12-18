import { parse, isValid, differenceInMinutes } from "date-fns";

export const minutesToHours = (minutes?: number | string) =>
    (Number(minutes) || 0) / 60;

export const displayHours = (hrs: number) => {
    if (hrs > 0 && hrs < 0.1) {
        return `${Math.round(hrs * 60)} min`;
    }
    return hrs.toFixed(2);
};
