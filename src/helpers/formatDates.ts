import moment from "moment";

export function formateToMonthDayYear(dateString: string): string {
    return moment(dateString).format("LL");
}

export function formatToTime(dateString: string): string {
    return moment(dateString).format("LT");
}

export function formatToDateTime(dateString: string) {
    return moment(dateString).format("LLL");
}
