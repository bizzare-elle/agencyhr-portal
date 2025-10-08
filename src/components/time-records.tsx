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
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { ApiResponse } from "..";
import { cn } from "@/lib/utils";
import FullPageLoader from "./page-loader";
import { useAuthStore } from "@/hooks/use-auth";

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

interface UserResponse {
    id: number;
    employee_id: number;
    name: string;
    // ...other user fields from /auth/me
}

export default function TimeRecords() {
    const [datesToRender, setDatesToRender] = useState<Date[]>([]);

    const { setToken } = useAuthStore.getState();

    const meQuery = useQuery({
        queryKey: ["me"],
        queryFn: async () => {
            const response =
                await api.get<ApiResponse<{ id: string }>>(`/api/v2/auth/me`);
            return response.data.data;
        },
    });

    const employeeId = meQuery.data?.id;

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

    function getDatesInRange(from: Date, to: Date) {
        const dates: Date[] = [];
        let day = moment(from);
        const end = moment(to);
        while (day.isSameOrBefore(end)) {
            dates.push(new Date(day.format("YYYY-MM-DD")));
            day.add(1, "day");
        }
        return dates;
    }

    // Default to current month
    useEffect(() => {
        const startOfMonth = moment().startOf("month").toDate();
        const endOfMonth = moment().endOf("month").toDate();
        setDatesToRender(getDatesInRange(startOfMonth, endOfMonth));
    }, []);

    if (isLoading || isFetching) return <FullPageLoader />;

    const records = data?.time_records ?? [];

    return (
        <div className="space-y-6">
            {/* Header */}
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
                    }}
                />
            </div>

            {/* Table */}
            <div className="bg-card overflow-x-auto rounded-md border shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50 text-sm">
                            <TableHead>Date</TableHead>
                            <TableHead>Day</TableHead>
                            <TableHead>Shift</TableHead>
                            <TableHead className="text-center">
                                Time In
                            </TableHead>
                            <TableHead className="text-center">
                                Time Out
                            </TableHead>
                            <TableHead className="text-center">
                                Overtime (hrs)
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {datesToRender.map((day, i) => {
                            const rowDate = moment(day).format("YYYY-MM-DD");
                            const record = records.find(
                                (r) => r.schedule_date === rowDate,
                            );

                            const schedule = record?.schedule_name || "--";
                            const timeIn = record?.time_in
                                ? moment(record.time_in).format("hh:mm A")
                                : null;
                            const timeOut = record?.time_out
                                ? moment(record.time_out).format("hh:mm A")
                                : null;
                            const overtime = record?.overtime_hours || "--";

                            return (
                                <TableRow
                                    key={i}
                                    className="hover:bg-muted/30 transition-colors"
                                >
                                    <TableCell>
                                        {moment(day).format("LL")}
                                    </TableCell>
                                    <TableCell className="capitalize">
                                        {moment(day).format("dddd")}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {schedule}
                                    </TableCell>

                                    <TableCell
                                        className={cn(
                                            "text-center",
                                            !timeIn &&
                                                "font-medium text-red-500",
                                        )}
                                    >
                                        {timeIn || "Missing"}
                                    </TableCell>

                                    <TableCell
                                        className={cn(
                                            "text-center",
                                            !timeOut &&
                                                "font-medium text-red-500",
                                        )}
                                    >
                                        {timeOut || "Missing"}
                                    </TableCell>

                                    <TableCell className="text-center font-semibold">
                                        {overtime}
                                    </TableCell>
                                </TableRow>
                            );
                        })}

                        {!records.length && (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="text-muted-foreground py-6 text-center"
                                >
                                    No records found for this range.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
