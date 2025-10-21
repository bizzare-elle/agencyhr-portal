import { parse, isValid, differenceInMinutes } from "date-fns";

export function minutesToHours(
    minutes: number | string | null | undefined,
): number {
    const min = parseFloat(minutes as string);
    if (isNaN(min) || min <= 0) return 0;
    return parseFloat((min / 60).toFixed(2));
}

export function computeWorkedBill(
    log: {
        Clock_In?: string | null;
        Clock_Out?: string | null;
        is_bill_off?: string | number | null;
        total_hours_worked?: string | number | null;
        ot_no_of_hours?: string | number | null;
        total_late_minutes?: string | number | null;
    },
    total_hours_worked_billed: number,
): number {
    if (!log?.Clock_In || !log?.Clock_Out) return 0;

    const isBillOff = Number(log.is_bill_off ?? 0);
    const totalHoursWorked = Number(log.total_hours_worked ?? 0);

    if (isBillOff === 1 || totalHoursWorked < 0) {
        return 0;
    }

    const ot = Number(log.ot_no_of_hours ?? 0);
    const late = Number(log.total_late_minutes ?? 0);

    const workedBill = total_hours_worked_billed + ot - late / 60;

    return workedBill;
}
