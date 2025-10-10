import { CardTitle } from "./ui/card";
import {
    Table,
    TableHeader,
    TableHead,
    TableRow,
    TableBody,
    TableCell,
} from "./ui/table";
import { DateRangePicker } from "./ui/date-range-picker";
import moment from "moment";
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { ApiResponse } from "..";
import { cn } from "@/lib/utils";
import FullPageLoader from "./page-loader";
import { useAuthStore } from "@/hooks/use-auth";
import { Badge } from "./ui/badge";
import {
    Pagination,
    PaginationNext,
    PaginationPrevious,
} from "./ui/pagination";

interface TimeRecord {
    employee_schedule_id: string;
    employee_id: string;
    schedule_date: string;
    schedule_name: string | null;
    schedule_time_in: string | null;
    schedule_time_out: string | null;
    time_in: string | null;
    time_out: string | null;
    overtime_hours: string | null;
}

export default function TimeRecords() {
    const [datesToRender, setDatesToRender] = useState<Date[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const { setToken } = useAuthStore.getState();

    const meQuery = useQuery({
        queryKey: ["me"],
        queryFn: async () => {
            const response =
                await api.get<ApiResponse<{ hr_id: string }>>(
                    `/api/v2/auth/me`,
                );
            return response.data.data;
        },
    });

    const employeeId = meQuery.data?.hr_id;

    const queryFrom = datesToRender[0]
        ? moment(datesToRender[0]).format("YYYY-MM-DD")
        : "";
    const queryTo = datesToRender.length
        ? moment(datesToRender[datesToRender.length - 1]).format("YYYY-MM-DD")
        : "";

    const { data, isLoading, isFetching } = useQuery({
        queryKey: ["time-records", employeeId, queryFrom, queryTo],
        queryFn: async () => {
            const response = await api.get<
                ApiResponse<{ time_records: TimeRecord[] }>
            >(
                `/api/v2/time-records/${employeeId}?from=${queryFrom}&to=${queryTo}`,
            );
            return response.data.data;
        },
        enabled: !!employeeId && !!queryFrom && !!queryTo,
    });

    const getDatesInRange = (from: Date, to: Date) => {
        const dates: Date[] = [];
        let day = moment(from);
        const end = moment(to);
        while (day.isSameOrBefore(end)) {
            dates.push(day.toDate());
            day.add(1, "day");
        }
        return dates;
    };

    useEffect(() => {
        const today = moment();
        let start: moment.Moment;
        let end: moment.Moment;

        if (today.date() <= 15) {
            start = today.clone().startOf("month");
            end = today.clone().date(15);
        } else {
            start = today.clone().date(16);
            end = today.clone().endOf("month");
        }

        setDatesToRender(getDatesInRange(start.toDate(), end.toDate()));
    }, []);

    const records = data?.time_records ?? [];

    const parseScheduleTime = (
        scheduleDate: string,
        scheduleTime: string | null,
    ) => {
        if (!scheduleTime) return null;
        const m = moment(
            `${scheduleDate} ${scheduleTime}`,
            "YYYY-MM-DD HH:mm",
            true,
        );
        return m.isValid() ? m : null;
    };

    const parseActualTime = (actualDateTime: string | null) => {
        if (!actualDateTime) return null;
        const m = moment(
            actualDateTime,
            ["YYYY-MM-DD HH:mm:ss", "YYYY-MM-DD hh:mm A"],
            true,
        );
        return m.isValid() ? m : null;
    };

    const computeTimeDiff = (
        scheduleDate: string,
        scheduleTime: string | null,
        actualDateTime: string | null,
        type: "late" | "undertime",
    ): string => {
        const sched = parseScheduleTime(scheduleDate, scheduleTime);
        const actual = parseActualTime(actualDateTime);

        if (!sched || !actual) return "";

        let diffMinutes: number;
        if (type === "late") diffMinutes = actual.diff(sched, "minutes");
        else diffMinutes = sched.diff(actual, "minutes");

        if (isNaN(diffMinutes) || diffMinutes <= 0) return "";

        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    };

    const formatTime = (actualDateTime: string | null) => {
        const m = parseActualTime(actualDateTime);
        return m ? m.format("hh:mm A") : "";
    };

    const tableData = useMemo(() => {
        return datesToRender.map((day) => {
            const rowDate = moment(day).format("YYYY-MM-DD");
            const record = records.find((r) => r.schedule_date === rowDate);

            const schedule = record?.schedule_name || "";
            const schedIn = record?.schedule_time_in || "";
            const schedOut = record?.schedule_time_out || "";
            const timeIn = record?.time_in || "";
            const timeOut = record?.time_out || "";
            const overtime = record?.overtime_hours || "";

            const isPastDate = moment(rowDate).isBefore(moment(), "day");
            const isOffDay =
                schedule.toUpperCase() === "OFF" ||
                schedule.toUpperCase() === "NO SCHEDULE";

            const late =
                !isOffDay && timeIn
                    ? computeTimeDiff(rowDate, schedIn, timeIn, "late")
                    : "";
            const undertime =
                !isOffDay && timeOut
                    ? computeTimeDiff(rowDate, schedOut, timeOut, "undertime")
                    : "";

            const remarks: string[] = [];
            if (!isOffDay && isPastDate && schedule) {
                if (!timeIn) remarks.push("No Time-In");
                if (!timeOut) remarks.push("No Time-Out");
            }

            return {
                date: day,
                dayName: moment(day).format("dddd"),
                schedule,
                timeIn,
                timeOut,
                late,
                undertime,
                overtime,
                remarks: remarks.join(", "),
                isOffDay,
            };
        });
    }, [datesToRender, records]);

    const totalPages = Math.ceil(tableData.length / pageSize);
    const paginatedData = tableData.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize,
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <CardTitle className="space-y-1">
                    <h3 className="text-foreground text-lg font-bold tracking-wide">
                        Time Records
                    </h3>
                    <p className="text-muted-foreground text-sm">
                        Daily employee time tracking
                    </p>
                </CardTitle>

                <DateRangePicker
                    initialDateFrom={datesToRender[0]}
                    initialDateTo={datesToRender[datesToRender.length - 1]}
                    onUpdate={(value) => {
                        const from = value.range.from;
                        const to = value.range.to || value.range.from;
                        setDatesToRender(getDatesInRange(from, to));
                        setCurrentPage(1);
                    }}
                />
            </div>

            {(isLoading || isFetching) && <FullPageLoader />}

            <div className="bg-card overflow-x-auto rounded-md border shadow-sm">
                <Table className="min-w-full divide-y divide-gray-200">
                    <TableHeader>
                        <TableRow className="bg-muted text-sm">
                            <TableHead className="px-2 py-6">Date</TableHead>
                            <TableHead className="px-2 py-6">Day</TableHead>
                            <TableHead className="hidden px-2 py-6 sm:table-cell">
                                Shift
                            </TableHead>
                            <TableHead className="px-2 py-6 text-center">
                                Time In
                            </TableHead>
                            <TableHead className="px-2 py-6 text-center">
                                Time Out
                            </TableHead>
                            <TableHead className="hidden px-2 py-6 text-center md:table-cell">
                                Late
                            </TableHead>
                            <TableHead className="hidden px-2 py-6 text-center md:table-cell">
                                Undertime
                            </TableHead>
                            <TableHead className="hidden px-2 py-6 text-center lg:table-cell">
                                Overtime
                            </TableHead>
                            <TableHead className="px-2 py-6 text-center">
                                Remarks
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {paginatedData.length ? (
                            paginatedData.map((row, i) => (
                                <TableRow
                                    key={i}
                                    className={cn(
                                        "transition-colors",
                                        row.isOffDay
                                            ? "bg-muted/70 text-muted-foreground opacity-70"
                                            : "hover:bg-muted/20",
                                    )}
                                >
                                    <TableCell className="px-2 py-5">
                                        {moment(row.date).format("LL")}
                                    </TableCell>
                                    <TableCell className="px-2 py-5 capitalize">
                                        {row.dayName}
                                    </TableCell>
                                    <TableCell className="hidden px-2 py-5 sm:table-cell">
                                        {row.schedule}
                                    </TableCell>
                                    <TableCell className="px-2 py-5 text-center">
                                        {!row.isOffDay
                                            ? formatTime(row.timeIn)
                                            : ""}
                                    </TableCell>
                                    <TableCell className="px-2 py-5 text-center">
                                        {!row.isOffDay
                                            ? formatTime(row.timeOut)
                                            : ""}
                                    </TableCell>
                                    <TableCell className="hidden px-2 py-5 text-center md:table-cell">
                                        {row.late && (
                                            <Badge
                                                variant="destructive"
                                                className="px-1 text-xs"
                                            >
                                                {row.late}
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="hidden px-2 py-5 text-center md:table-cell">
                                        {row.undertime && (
                                            <Badge
                                                variant="destructive"
                                                className="px-1 text-xs"
                                            >
                                                {row.undertime}
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="hidden px-2 py-5 text-center font-semibold text-green-500 lg:table-cell">
                                        {row.overtime &&
                                            row.overtime !== "0.00" && (
                                                <Badge
                                                    variant="default"
                                                    className="px-1 text-xs"
                                                >
                                                    {row.overtime}
                                                </Badge>
                                            )}
                                    </TableCell>
                                    <TableCell className="px-2 py-5 text-center break-words text-yellow-500">
                                        {row.remarks}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={9}
                                    className="text-muted-foreground py-6 text-center"
                                >
                                    No records found for this range.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="mt-4 flex items-center justify-between">
                {/* Current page / total pages */}
                <div className="text-muted-foreground text-sm">
                    Page {currentPage} of {totalPages}
                </div>

                {/* Pagination buttons */}
                <div>
                    {totalPages > 1 && (
                        <Pagination>
                            <PaginationPrevious
                                onClick={() =>
                                    setCurrentPage((prev) =>
                                        Math.max(prev - 1, 1),
                                    )
                                }
                                className={
                                    currentPage === 1
                                        ? "pointer-events-none opacity-50"
                                        : "cursor-pointer"
                                }
                            >
                                Previous
                            </PaginationPrevious>

                            <PaginationNext
                                onClick={() =>
                                    setCurrentPage((prev) =>
                                        Math.min(prev + 1, totalPages),
                                    )
                                }
                                className={
                                    currentPage === totalPages
                                        ? "pointer-events-none opacity-50"
                                        : "cursor-pointer"
                                }
                            >
                                Next
                            </PaginationNext>
                        </Pagination>
                    )}
                </div>
            </div>
        </div>
    );
}
