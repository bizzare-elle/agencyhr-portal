import moment from "moment";
import { format } from "date-fns";

export function formatToMonthDayYear(dateString: string | null): string {
    if (!dateString) return "No data";
    const parsed = moment(dateString);
    return parsed.isValid() ? parsed.format("LL") : "Invalid";
}

export function formatToTime(dateString: string | null): string {
    if (!dateString) return "No data";
    const parsed = moment(dateString);
    return parsed.isValid() ? parsed.format("LT") : "Invalid";
}

export function formatToDateTime(dateString: string | null): string {
    if (!dateString) return "No data";
    const parsed = moment(dateString);
    return parsed.isValid() ? parsed.format("LLL") : "Invalid";
}

export function formatTime(
    time: string | null,
    workDate?: string | null,
): string {
    if (!time) return "No data";

    const parsed = moment(
        time.length <= 8 && workDate ? `${workDate} ${time}` : time,
        ["YYYY-MM-DD HH:mm:ss", "HH:mm:ss"],
    );

    return parsed.isValid() ? parsed.format("HH:mm") : "Invalid";
}

export function formatDuration(hours: number | null | undefined): string {
    if (!hours || hours <= 0) return "0:00";

    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);

    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function formatNumber(value: string | number | null): string {
    if (value === null || value === "" || isNaN(Number(value))) {
        return "No data";
    }
    return Number(value).toFixed(2);
}

export const safeFormat = (
    value: any,
    formatStr = "MMM d, yyyy hh:mm a",
    fallback = "N/A",
): string => {
    if (!value) return fallback;
    const date = new Date(value);
    if (isNaN(date.getTime())) return fallback;
    try {
        return format(date, formatStr);
    } catch {
        return fallback;
    }
};
export const toNumber = (value: string | number | null | undefined): number => {
    const n = parseFloat(String(value));
    return isNaN(n) ? 0 : n;
};

const displayHours = (hrs: number) => {
    if (hrs > 0 && hrs < 0.1) {
        return `${Math.round(hrs * 60)} min`;
    }
    return formatNumber(hrs);
};
