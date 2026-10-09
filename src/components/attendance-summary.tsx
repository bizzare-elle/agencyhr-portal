import { useQuery } from "@tanstack/react-query";
import moment from "moment";
import { CalendarClock } from "lucide-react";
import api from "@/lib/axios";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface RawRecord {
    clock_in?: string | null;
    total_hours_worked?: string | null;
    total_hrs_late?: string | null;
    total_hrs_break_late?: string | null;
    total_overtime_hrs?: string | null;
    total_undertime_hrs?: string | null;
}

// Cut-offs run 1st-15th and 16th-month end, the same periods the daily
// time-record generation uses.
function currentCutoff(now: moment.Moment) {
    if (now.date() <= 15) {
        return {
            start: now.clone().startOf("month"),
            end: now.clone().date(15),
        };
    }
    return { start: now.clone().date(16), end: now.clone().endOf("month") };
}

const num = (value?: string | null) => {
    const n = parseFloat(value ?? "0");
    return Number.isFinite(n) ? n : 0;
};

const fmt = (value: number) =>
    value.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

export function AttendanceSummary({ employeeId }: { employeeId?: string }) {
    const now = moment();
    const { start, end } = currentCutoff(now);
    const from = start.format("YYYY-MM-DD");
    const to = end.format("YYYY-MM-DD");

    const { data, isLoading, isError } = useQuery<RawRecord[]>({
        queryKey: ["attendance-summary", employeeId, from, to],
        enabled: !!employeeId,
        staleTime: 1000 * 60 * 5,
        queryFn: async () => {
            const res = await api.get(
                `/api/v2/time-records/${employeeId}?from=${from}&to=${to}`,
            );
            return res.data?.data?.time_records ?? [];
        },
    });

    if (isError) return null;

    const records = data ?? [];
    const totals = records.reduce(
        (acc, r) => ({
            worked: acc.worked + num(r.total_hours_worked),
            late: acc.late + num(r.total_hrs_late),
            breakLate: acc.breakLate + num(r.total_hrs_break_late),
            overtime: acc.overtime + num(r.total_overtime_hrs),
            undertime: acc.undertime + num(r.total_undertime_hrs),
            days: acc.days + (r.clock_in ? 1 : 0),
        }),
        {
            worked: 0,
            late: 0,
            breakLate: 0,
            overtime: 0,
            undertime: 0,
            days: 0,
        },
    );

    const daysLeft = end
        .clone()
        .startOf("day")
        .diff(now.clone().startOf("day"), "days");
    const countdown =
        daysLeft === 0
            ? "Cut-off is today"
            : daysLeft === 1
              ? "1 day left"
              : `${daysLeft} days left`;

    const tiles: { label: string; value: string; warn?: boolean }[] = [
        { label: "Hours worked", value: fmt(totals.worked) },
        { label: "Days present", value: String(totals.days) },
        { label: "Overtime (hrs)", value: fmt(totals.overtime) },
        { label: "Late (hrs)", value: fmt(totals.late), warn: totals.late > 0 },
        {
            label: "Break late (hrs)",
            value: fmt(totals.breakLate),
            warn: totals.breakLate > 0,
        },
        {
            label: "Undertime (hrs)",
            value: fmt(totals.undertime),
            warn: totals.undertime > 0,
        },
    ];

    return (
        <Card className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h2 className="flex items-center gap-2 text-sm font-semibold">
                        <CalendarClock className="h-4 w-4 text-yellow-500" />
                        This cut-off
                    </h2>
                    <p className="text-muted-foreground text-xs">
                        {start.format("MMM D")} - {end.format("MMM D, YYYY")}
                    </p>
                </div>
                <span className="shrink-0 rounded-full bg-yellow-500/15 px-3 py-1 text-xs font-medium text-yellow-400">
                    {countdown}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {tiles.map((tile) => (
                    <div key={tile.label} className="rounded-lg border p-3">
                        <p className="text-muted-foreground text-[11px]">
                            {tile.label}
                        </p>
                        {isLoading ? (
                            <Skeleton className="mt-1 h-6 w-16" />
                        ) : (
                            <p
                                className={
                                    tile.warn
                                        ? "text-lg font-semibold text-red-400"
                                        : "text-lg font-semibold"
                                }
                            >
                                {tile.value}
                            </p>
                        )}
                    </div>
                ))}
            </div>

            <p className="text-muted-foreground text-[11px]">
                Based on punches synced so far. Today's record may not be
                included yet.
            </p>
        </Card>
    );
}
