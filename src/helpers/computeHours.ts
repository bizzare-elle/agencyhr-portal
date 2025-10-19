import { parse, isValid, differenceInMinutes } from "date-fns";

export function computeUndertime(
    scheduleName: string | null,
    clockOut: string | null,
): number {
    if (!scheduleName || !clockOut) return 0;

    const scheduleParts = scheduleName.split("-");
    if (scheduleParts.length !== 2) return 0;

    const scheduleOutStr = scheduleParts[1].trim();
    const scheduledOut = parse(scheduleOutStr, "HH:mm", new Date());
    const actualOut = parse(clockOut, "HH:mm:ss", new Date());

    if (!isValid(scheduledOut) || !isValid(actualOut)) return 0;

    const diff = differenceInMinutes(actualOut, scheduledOut);
    const undertime = diff < 0 ? Math.abs(diff) / 60 : 0;

    return undertime;
}

export function computeBillableHours(
    totalHours: string | number,
    overtime: string | number,
    late: string | number,
    undertime: string | number,
): number {
    const total =
        (Number(totalHours) || 0) +
        (Number(overtime) || 0) -
        ((Number(late) || 0) + (Number(undertime) || 0));

    return total > 0 ? parseFloat(total.toFixed(2)) : 0;
}
