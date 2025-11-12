import { FC } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { DateRange } from "react-day-picker";

interface Schedule {
    date: string;
    schedule_name: string;
}

interface EmployeeScheduleCardProps {
    employeeId: number | string;
    days: Date[];
    filteredSchedules: Schedule[];
    dateRange: { from?: Date; to?: Date } | null;
    setDateRange: React.Dispatch<
        React.SetStateAction<{ from?: Date; to?: Date }>
    >;
}

const EmployeeScheduleCard: FC<EmployeeScheduleCardProps> = ({
    employeeId,
    days,
    filteredSchedules,
    dateRange,
    setDateRange,
}) => {
    return (
        <Card className="mt-6 space-y-4 p-4 shadow-sm sm:p-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                {/* Header */}
                <CardHeader className="w-full p-0">
                    <CardTitle>Employee Schedule</CardTitle>
                    <CardDescription className="text-sm sm:text-base">
                        List of schedules you applied and registered to the
                        system.
                    </CardDescription>
                </CardHeader>

                {/* Date Picker Section */}
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                    <div className="flex w-full flex-col sm:w-auto sm:flex-row sm:items-center sm:gap-2">
                        <span className="text-muted-foreground mb-1 text-sm sm:mb-0">
                            Select Date Range:
                        </span>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-start text-left font-normal sm:w-[240px]",
                                        "rounded-md border px-3 py-2",
                                        "hover:bg-muted/50",
                                        !dateRange && "text-muted-foreground",
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange?.from ? (
                                        dateRange.to ? (
                                            <>
                                                {format(
                                                    dateRange.from,
                                                    "MMM d, yyyy",
                                                )}{" "}
                                                –{" "}
                                                {format(
                                                    dateRange.to,
                                                    "MMM d, yyyy",
                                                )}
                                            </>
                                        ) : (
                                            format(
                                                dateRange.from,
                                                "MMM d, yyyy",
                                            )
                                        )
                                    ) : (
                                        <span>Pick a date range</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                className="w-auto p-0"
                                align="start"
                            >
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    selected={dateRange as DateRange}
                                    onSelect={(range) => {
                                        if (range?.from) {
                                            setDateRange({
                                                from: range.from,
                                                to: range.to ?? range.from,
                                            });
                                        } else {
                                            setDateRange({
                                                from: undefined,
                                                to: undefined,
                                            });
                                        }
                                    }}
                                    numberOfMonths={1}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {dateRange?.from && (
                    <p className="text-muted-foreground text-center text-xs sm:text-left sm:text-sm">
                        Showing schedule for -{" "}
                        <span className="font-bold text-white">
                            {dateRange.from
                                ? format(dateRange.from, "MMM d, yyyy")
                                : "This cut-off"}
                            {dateRange.to &&
                                ` to ${format(dateRange.to, "MMM d, yyyy")}`}
                        </span>
                    </p>
                )}
            </div>

            {/* Schedule Grid */}
            <div className="grid grid-cols-2 gap-2 text-left text-xs sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7">
                {days.map((day, i) => {
                    const daySchedules = filteredSchedules?.filter(
                        (s) =>
                            format(new Date(s.date), "yyyy-MM-dd") ===
                            format(day, "yyyy-MM-dd"),
                    );

                    const isToday =
                        format(day, "yyyy-MM-dd") ===
                        format(new Date(), "yyyy-MM-dd");

                    return (
                        <div
                            key={i}
                            className={`min-h-[90px] rounded-md border p-2 transition ${
                                isToday
                                    ? "bg-primary/10 border-yellow-600"
                                    : "bg-background hover:bg-muted/50"
                            }`}
                        >
                            <div className="mb-1 text-[10px] font-semibold sm:text-[11px]">
                                {format(day, "d")} - {format(day, "EEE")}
                            </div>

                            {daySchedules && daySchedules.length > 0 ? (
                                <ul className="space-y-1">
                                    {daySchedules.map((s, idx) => (
                                        <li
                                            key={idx}
                                            className="truncate rounded px-1 py-1 text-[10px] leading-tight sm:text-[11px]"
                                        >
                                            {s.schedule_name ===
                                            "NO SCHEDULE" ? (
                                                <Badge
                                                    variant="secondary"
                                                    className="bg-blue-500 text-white"
                                                >
                                                    {s.schedule_name}
                                                </Badge>
                                            ) : (
                                                <Badge>{s.schedule_name}</Badge>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-muted-foreground text-[10px]">
                                    —
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </Card>
    );
};

export default EmployeeScheduleCard;
