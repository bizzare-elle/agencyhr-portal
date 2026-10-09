import moment from "moment";
import { CalendarClock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export interface SummaryRecord {
    clock_in?: string | null;
    total_hours_worked?: string | null;
    total_hrs?: string | null;
    total_hrs_late?: string | null;
    total_hrs_break_late?: string | null;
    total_overtime_hrs?: string | null;
    total_undertime_hrs?: string | null;
}

interface AttendanceSummaryProps {
    records: SummaryRecord[];
    from: string;
    to: string;
    loading: boolean;
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

// Totals exactly the rows the page is showing, so the card can never disagree
// with the table below it. The countdown only appears while the period is open.
export function AttendanceSummary({
    records,
    from,
    to,
    loading,
}: AttendanceSummaryProps) {
    if (!from || !to) return null;

    const start = moment(from);
    const end = moment(to);
    const today = moment().startOf("day");

    const totals = records.reduce(
        (acc, r) => ({
            worked: acc.worked + num(r.total_hours_worked),
            billable: acc.billable + num(r.total_hrs),
            late: acc.late + num(r.total_hrs_late),
            breakLate: acc.breakLate + num(r.total_hrs_break_late),
            overtime: acc.overtime + num(r.total_overtime_hrs),
            undertime: acc.undertime + num(r.total_undertime_hrs),
            present: acc.present + (r.clock_in ? 1 : 0),
            noClockIn: acc.noClockIn + (r.clock_in ? 0 : 1),
        }),
        {
            worked: 0,
            billable: 0,
            late: 0,
            breakLate: 0,
            overtime: 0,
            undertime: 0,
            present: 0,
            noClockIn: 0,
        },
    );

    const daysLeft = end.clone().startOf("day").diff(today, "days");
    const status =
        daysLeft < 0
            ? "Closed"
            : daysLeft === 0
              ? "Cut-off is today"
              : daysLeft === 1
                ? "1 day left"
                : `${daysLeft} days left`;

    const tiles: { label: string; value: string; warn?: boolean }[] = [
        { label: "Hours worked", value: fmt(totals.worked) },
        { label: "Billable hours", value: fmt(totals.billable) },
        { label: "Days present", value: String(totals.present) },
        {
            label: "No clock-in",
            value: String(totals.noClockIn),
            warn: totals.noClockIn > 0,
        },
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
                        Totals for this period
                    </h2>
                    <p className="text-muted-foreground text-xs">
                        {start.format("MMM D")} - {end.format("MMM D, YYYY")}
                        {" · "}
                        {records.length}{" "}
                        {records.length === 1 ? "record" : "records"}
                    </p>
                </div>
                <span
                    className={
                        daysLeft < 0
                            ? "bg-muted text-muted-foreground shrink-0 rounded-full px-3 py-1 text-xs font-medium"
                            : "shrink-0 rounded-full bg-yellow-500/15 px-3 py-1 text-xs font-medium text-yellow-400"
                    }
                >
                    {status}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {tiles.map((tile) => (
                    <div key={tile.label} className="rounded-lg border p-3">
                        <p className="text-muted-foreground text-[11px]">
                            {tile.label}
                        </p>
                        {loading ? (
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

            {!loading && records.length === 0 && (
                <p className="text-muted-foreground text-xs">
                    No time records exist for this period yet. Records appear
                    once they have been consolidated.
                </p>
            )}
        </Card>
    );
}
