import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import moment from "moment";
import { CalendarDays, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import { ParentComponent } from "@/components/parent-container";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ScheduleRow {
    id: string;
    date: string;
    status: string;
    schedule_name: string | null;
    time_in: string | null;
    time_out: string | null;
    branch_name: string | null;
    leave_type_label?: string | null;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function clock(value: string | null): string {
    if (!value) return "";
    const parsed = moment(value, "H:mm");
    return parsed.isValid() ? parsed.format("h:mm A") : value;
}

// Month cells are ~45px wide, so the chip uses a compact time such as 4a or 1:30p.
function shortClock(value: string | null): string {
    if (!value) return "";
    const parsed = moment(value, "H:mm");
    if (!parsed.isValid()) return value;
    const base =
        parsed.minutes() === 0 ? parsed.format("h") : parsed.format("h:mm");
    return base + (parsed.hours() < 12 ? "a" : "p");
}

function timeRange(row: ScheduleRow): string {
    if (!row.time_in) return "";
    return row.time_out
        ? `${clock(row.time_in)} - ${clock(row.time_out)}`
        : clock(row.time_in);
}

function useScheduleWindow(
    employeeId: string | undefined,
    from: string,
    to: string,
) {
    return useQuery<ScheduleRow[]>({
        queryKey: ["my-schedule", employeeId, from, to],
        enabled: !!employeeId,
        staleTime: 1000 * 60 * 2,
        queryFn: async () => {
            const res = await api.get(
                `/api/v2/get_employee_schedules/${employeeId}?from=${from}&to=${to}`,
            );
            const rows: ScheduleRow[] = res.data?.data?.schedules ?? [];
            return rows.filter((row) => String(row.status) === "1");
        },
    });
}

export default function MySchedulePage() {
    const [month, setMonth] = useState(() => moment().startOf("month"));
    const [selected, setSelected] = useState(() =>
        moment().format("YYYY-MM-DD"),
    );

    const meQuery = useQuery({
        queryKey: ["me"],
        queryFn: async () => {
            const res = await api.get("/api/v2/auth/me");
            return res.data.data as { hr_id: string };
        },
    });
    const employeeId = meQuery.data?.hr_id;

    const gridStart = month.clone().startOf("month").startOf("week");
    const gridEnd = month.clone().endOf("month").endOf("week");
    const scheduleQuery = useScheduleWindow(
        employeeId,
        gridStart.format("YYYY-MM-DD"),
        gridEnd.format("YYYY-MM-DD"),
    );

    const today = moment().format("YYYY-MM-DD");
    const upcomingQuery = useScheduleWindow(
        employeeId,
        today,
        moment().add(14, "days").format("YYYY-MM-DD"),
    );

    const byDate = useMemo(() => {
        const map = new Map<string, ScheduleRow>();
        (scheduleQuery.data ?? []).forEach((row) => {
            if (!map.has(row.date)) map.set(row.date, row);
        });
        return map;
    }, [scheduleQuery.data]);

    const days = useMemo(() => {
        const out: moment.Moment[] = [];
        const cursor = gridStart.clone();
        while (cursor.isSameOrBefore(gridEnd, "day")) {
            out.push(cursor.clone());
            cursor.add(1, "day");
        }
        return out;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [month]);

    const selectedRow = byDate.get(selected);
    const upcoming = (upcomingQuery.data ?? []).slice(0, 5);

    return (
        <ParentComponent>
            <div className="mx-auto w-full max-w-3xl space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/15 text-yellow-400">
                        <CalendarDays className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">My Schedule</h1>
                        <p className="text-muted-foreground text-sm">
                            Your shifts, as filed by your coordinator.
                        </p>
                    </div>
                </div>

                <Card className="gap-3 p-3 sm:p-5">
                    <div className="flex items-center justify-between gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10"
                            aria-label="Previous month"
                            onClick={() =>
                                setMonth((m) => m.clone().subtract(1, "month"))
                            }
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex flex-col items-center">
                            <span className="font-semibold">
                                {month.format("MMMM YYYY")}
                            </span>
                            <button
                                type="button"
                                className="text-xs text-yellow-500 hover:underline"
                                onClick={() => {
                                    setMonth(moment().startOf("month"));
                                    setSelected(today);
                                }}
                            >
                                Today
                            </button>
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10"
                            aria-label="Next month"
                            onClick={() =>
                                setMonth((m) => m.clone().add(1, "month"))
                            }
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="text-muted-foreground grid grid-cols-7 gap-1 text-center text-[11px] font-medium">
                        {WEEKDAYS.map((d) => (
                            <div key={d}>{d}</div>
                        ))}
                    </div>

                    {scheduleQuery.isLoading ? (
                        <div className="grid grid-cols-7 gap-1">
                            {Array.from({ length: 35 }).map((_, i) => (
                                <Skeleton key={i} className="h-14 w-full" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-7 gap-1">
                            {days.map((day) => {
                                const key = day.format("YYYY-MM-DD");
                                const row = byDate.get(key);
                                const inMonth = day.isSame(month, "month");
                                const isToday = key === today;
                                const isSelected = key === selected;
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setSelected(key)}
                                        aria-label={`${day.format("dddd, MMMM D")}${row ? `, ${row.schedule_name}` : ", no shift"}`}
                                        aria-pressed={isSelected}
                                        className={cn(
                                            "flex h-14 flex-col items-center justify-start rounded-md border p-1 text-xs transition",
                                            !inMonth && "opacity-40",
                                            isSelected &&
                                                "border-yellow-500 bg-yellow-500/10",
                                            isToday &&
                                                !isSelected &&
                                                "border-yellow-500/50",
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                "font-medium",
                                                isToday && "text-yellow-500",
                                            )}
                                        >
                                            {day.date()}
                                        </span>
                                        {row && (
                                            <span
                                                className={cn(
                                                    "mt-0.5 w-full truncate rounded px-0.5 text-[10px] leading-tight",
                                                    row.leave_type_label
                                                        ? "bg-blue-500/20 text-blue-300"
                                                        : "bg-yellow-500/20 text-yellow-300",
                                                )}
                                            >
                                                {row.leave_type_label
                                                    ? "Leave"
                                                    : shortClock(row.time_in) ||
                                                      row.schedule_name}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </Card>

                <Card className="space-y-2 p-4">
                    <p className="text-muted-foreground text-xs tracking-wide uppercase">
                        {moment(selected).format("dddd, MMMM D")}
                    </p>
                    {selectedRow ? (
                        <div className="space-y-1">
                            <p className="text-lg font-semibold">
                                {selectedRow.leave_type_label ??
                                    selectedRow.schedule_name}
                            </p>
                            {timeRange(selectedRow) && (
                                <p className="text-sm">
                                    {timeRange(selectedRow)}
                                </p>
                            )}
                            {selectedRow.branch_name && (
                                <p className="text-muted-foreground flex items-center gap-1 text-sm">
                                    <MapPin className="h-4 w-4" />
                                    {selectedRow.branch_name}
                                </p>
                            )}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-sm">
                            No shift is filed for this day.
                        </p>
                    )}
                </Card>

                <Card className="p-4">
                    <h2 className="mb-2 text-sm font-semibold">Next 14 days</h2>
                    {upcomingQuery.isLoading ? (
                        <Skeleton className="h-16 w-full" />
                    ) : upcoming.length === 0 ? (
                        <EmptyState
                            icon={CalendarDays}
                            title="No upcoming shifts"
                            description="Shifts appear here once your coordinator files them."
                        />
                    ) : (
                        <ul className="divide-y">
                            {upcoming.map((row) => (
                                <li
                                    key={row.id}
                                    className="flex items-center justify-between gap-3 py-2"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium">
                                            {row.leave_type_label ??
                                                row.schedule_name}
                                        </p>
                                        <p className="text-muted-foreground truncate text-xs">
                                            {timeRange(row)}
                                            {row.branch_name
                                                ? ` · ${row.branch_name}`
                                                : ""}
                                        </p>
                                    </div>
                                    <span className="shrink-0 text-xs font-medium">
                                        {moment(row.date).calendar(null, {
                                            sameDay: "[Today]",
                                            nextDay: "[Tomorrow]",
                                            nextWeek: "ddd, MMM D",
                                            sameElse: "ddd, MMM D",
                                        })}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            </div>
        </ParentComponent>
    );
}
