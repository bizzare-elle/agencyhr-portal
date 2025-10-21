import moment from "moment";

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

    return parsed.isValid() ? parsed.format("hh:mm A") : "Invalid";
}

export function formatNumber(value: string | number | null): string {
    if (value === null || value === "" || isNaN(Number(value))) {
        return "No data";
    }
    return Number(value).toFixed(2);
}
