import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import moment from "moment";
import api from "@/lib/axios";
import { ApiResponse } from "..";
import FullPageLoader from "./page-loader";
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
import { Button } from "./ui/button";
import { Download, Printer } from "lucide-react";
import { toast } from "sonner";
import { useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { handleExportExcel } from "./employees/excel-template";
import { TimeRecord } from "..";
import { minutesToHours } from "@/helpers/computeHours";
import { formatTime, formatNumber } from "@/helpers/formatDates";
import { PrintTimeRecords } from "./employees/print-schedule";

export default function TimeRecords() {
    const [datesToRender, setDatesToRender] = useState<Date[]>([]);
    const [isConsolidating, setIsConsolidating] = useState(false);

    const { id: routeEmployeeId } = useParams();

    const meQuery = useQuery({
        queryKey: ["me"],
        queryFn: async () => {
            const response =
                await api.get<
                    ApiResponse<{ hr_id: string; name: string; role: string }>
                >(`/api/v2/auth/me`);
            return response.data.data;
        },
    });

    const isHrEmployee = meQuery.data?.role === "hr_employee";

    const fetchEmployeeName = useQuery({
        queryKey: ["employeeName", routeEmployeeId],
        queryFn: async () => {
            const response = await api.get<ApiResponse<{ name: string }>>(
                `/api/v2/get_name/${routeEmployeeId}`,
            );
            return response.data.data;
        },
    });

    const employeeId = isHrEmployee
        ? meQuery.data?.hr_id
        : routeEmployeeId || meQuery.data?.hr_id;

    const employeeNameView = fetchEmployeeName.data;
    const employeeName = isHrEmployee
        ? meQuery.data?.name
        : employeeNameView || "Employee";

    const queryFrom = datesToRender[0]
        ? moment(datesToRender[0]).format("YYYY-MM-DD")
        : "";
    const queryTo = datesToRender.length
        ? moment(datesToRender[datesToRender.length - 1]).format("YYYY-MM-DD")
        : "";

    const { data, isLoading, isFetching, isError, refetch } = useQuery({
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
        staleTime: 1000 * 60 * 5,
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
            start = today.clone().subtract(1, "month").date(16);
            end = today.clone().subtract(1, "month").endOf("month");
        } else {
            start = today.clone().startOf("month");
            end = today.clone().date(15);
        }

        setDatesToRender(getDatesInRange(start.toDate(), end.toDate()));
    }, []);

    const handleConsolidate = async () => {
        if (!employeeId || !queryTo) {
            toast.warning("Please select an employee and a cutoff date.");
            return;
        }

        const payload = {
            employee_id: employeeId,
            cut_off_date: queryTo,
        };

        setIsConsolidating(true);
        const toastId = toast.loading("Consolidating records...");

        try {
            const response = await api.post(
                "/api/v2/time-records/consolidate",
                payload,
                { headers: { "Content-Type": "application/json" } },
            );

            toast.success(
                response?.data?.message || "Consolidation complete!",
                {
                    id: toastId,
                },
            );

            await refetch();
        } catch (error: any) {
            console.error("Consolidation error:", error);
            toast.error(
                error?.response?.data?.message ||
                    "Failed to consolidate records.",
                { id: toastId },
            );
        } finally {
            setIsConsolidating(false);
        }
    };

    const records = data?.time_records ?? [];

    const agencyName = useMemo(() => {
        if (records.length > 0) return records[0]?.agency_name || "No Agency";
        return "No Agency";
    }, [records]);

    const branchName = useMemo(() => {
        if (records.length > 0) return records[0]?.branch_name || "No Agency";
        return "No Branch";
    }, [records]);

    const idNumber = useMemo(() => {
        if (records.length > 0) return records[0]?.id_number || "No Agency";
        return "No Branch";
    }, [records]);

    const tableData = useMemo(() => {
        return records.map((record) => {
            return {
                branch: record.branch_name || "No data",
                scheduleName: record.schedule_name,
                date: moment(record.cut_off).format("YYYY-MM-DD"),
                dayName: record.cut_off,
                agencyName: record.agency_name,
                branchName: record.branch_name,
                idNumber: record.id_number,
                timeIn: record.clock_in,
                timeOut: record.clock_out,
                branchTimeIn: record.clock_in_branch,
                branchTimeOut: record.clock_out_branch,
                breakIn: record.break_in,
                breakOut: record.break_out,
                totalHrsWorked: parseFloat(record.total_hours_worked || "0"),
                totalHrs: parseFloat(record.total_hrs || "0"),
                totalLate: parseFloat(record.total_hrs_late || "0"),
                totalBreakLate: parseFloat(record.total_hrs_break_late || "0"),
                totalOvertime: parseFloat(record.total_overtime_hrs || "0"),
                undertimeMinutes: parseFloat(record.total_undertime_hrs || "0"),
            };
        });
    }, [records]);

    if (isError) {
        return <p className="text-danger">Error! Failed to load data</p>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Title Section */}
                <CardTitle className="space-y-1 text-center sm:text-left">
                    <h3 className="text-foreground text-lg font-bold tracking-wide">
                        {employeeName as string} – Time Records
                    </h3>
                    <p className="text-muted-foreground text-sm">
                        Daily employee time tracking
                    </p>
                </CardTitle>

                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-2">
                    {datesToRender.length > 0 && (
                        <DateRangePicker
                            initialDateFrom={datesToRender[0]}
                            initialDateTo={
                                datesToRender[datesToRender.length - 1]
                            }
                            onUpdate={(value) => {
                                const from = value.range.from;
                                const to = value.range.to || value.range.from;
                                setDatesToRender(getDatesInRange(from, to));
                            }}
                        />
                    )}

                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                        <Button
                            onClick={() =>
                                handleExportExcel(
                                    records,
                                    employeeName as string,
                                    queryFrom,
                                    queryTo,
                                )
                            }
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto"
                        >
                            <Download className="mr-2 h-4 w-4" /> Export
                        </Button>

                        <PrintTimeRecords
                            tableId="time-records-table"
                            idNumber={idNumber}
                            isHrEmployee={isHrEmployee}
                            branchName={branchName || "No Branch"}
                            employeeName={employeeName as string}
                            agencyName={agencyName || "No Agency"}
                            queryFrom={queryFrom}
                            queryTo={queryTo}
                        />

                        <Button
                            size="sm"
                            onClick={handleConsolidate}
                            // disabled={isConsolidating}
                            disabled={isHrEmployee}
                            className="w-full bg-yellow-500 sm:w-auto"
                        >
                            {isConsolidating
                                ? "Consolidating..."
                                : "Consolidate"}
                        </Button>
                    </div>
                </div>
            </div>

            {(isLoading || isFetching) && <FullPageLoader />}

            <div
                id="time-records-table"
                className="bg-card overflow-x-auto rounded-md border shadow-sm"
            >
                <Table className="min-w-full divide-y divide-gray-200">
                    <TableHeader>
                        <TableRow className="bg-muted text-sm">
                            <TableHead className="px-2 py-4">Date</TableHead>
                            <TableHead className="px-2 py-4">
                                Schedule
                            </TableHead>

                            <TableHead className="px-2 py-4">
                                Branch Name
                            </TableHead>
                            <TableHead className="px-2 py-4 text-center">
                                Time In
                            </TableHead>
                            <TableHead className="px-2 py-4 text-center">
                                Break Out
                            </TableHead>
                            <TableHead className="px-2 py-4 text-center">
                                Break In
                            </TableHead>
                            <TableHead className="px-2 py-4 text-center">
                                Time Out
                            </TableHead>
                            <TableHead className="px-2 py-4 text-center">
                                Overtime (hrs)
                            </TableHead>
                            <TableHead className="px-2 py-4 text-center">
                                Break Late (hrs)
                            </TableHead>
                            <TableHead className="px-2 py-4 text-center">
                                Late (hrs)
                            </TableHead>
                            <TableHead className="px-2 py-4 text-center">
                                Undertime (hrs)
                            </TableHead>
                            <TableHead className="px-2 py-4 text-center">
                                Total Hours Worked
                            </TableHead>
                            <TableHead className="px-2 py-4 text-center">
                                Total Billable Hours
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {tableData.length ? (
                            tableData.map((row, i) => (
                                <TableRow key={i} className="hover:bg-muted/10">
                                    <TableCell className="px-2 py-4 capitalize">
                                        {row.dayName}
                                    </TableCell>
                                    <TableCell className="px-2 py-4 capitalize">
                                        {row.scheduleName || "No data"}
                                    </TableCell>
                                    <TableCell className="px-2 py-4">
                                        {row.branchTimeIn === "No data" &&
                                        row.branchTimeOut === "No data" ? (
                                            <span className="text-red-500">
                                                No data
                                            </span>
                                        ) : (
                                            <>
                                                <span>{row.branchTimeIn}</span>
                                                {" - "}
                                                <span className="ml-1">
                                                    {row.branchTimeOut}
                                                </span>
                                            </>
                                        )}
                                    </TableCell>

                                    <TableCell
                                        className={cn(
                                            "px-2 py-4 text-center",
                                            !row.timeIn &&
                                                "font-semibold text-red-500",
                                        )}
                                    >
                                        {row.timeIn
                                            ? formatTime(row.timeIn)
                                            : "No Data"}
                                    </TableCell>

                                    <TableCell
                                        className={cn(
                                            "px-2 py-4 text-center",
                                            !row.breakOut &&
                                                "font-semibold text-red-500",
                                        )}
                                    >
                                        {row.breakOut
                                            ? formatTime(row.breakOut)
                                            : "No Data"}
                                    </TableCell>

                                    <TableCell
                                        className={cn(
                                            "px-2 py-4 text-center",
                                            !row.breakIn &&
                                                "font-semibold text-red-500",
                                        )}
                                    >
                                        {row.breakIn
                                            ? formatTime(row.breakIn)
                                            : "No Data"}
                                    </TableCell>

                                    <TableCell
                                        className={cn(
                                            "px-2 py-4 text-center",
                                            !row.timeOut &&
                                                "font-semibold text-red-500",
                                        )}
                                    >
                                        {row.timeOut
                                            ? formatTime(row.timeOut)
                                            : "No Data"}
                                    </TableCell>

                                    <TableCell className="px-2 py-4 text-center">
                                        {row.totalOvertime
                                            ? row.totalOvertime
                                            : "No Filed"}
                                    </TableCell>
                                    <TableCell
                                        className={cn(
                                            "px-2 py-4 text-center",
                                            Number(row.totalBreakLate) !== 0 &&
                                                "font-semibold text-red-500",
                                        )}
                                    >
                                        {row.totalBreakLate}
                                    </TableCell>
                                    <TableCell
                                        className={cn(
                                            "px-2 py-4 text-center",
                                            Number(row.totalLate) !== 0 &&
                                                "font-semibold text-red-500",
                                        )}
                                    >
                                        {row.totalLate}
                                    </TableCell>

                                    <TableCell
                                        className={cn(
                                            "px-2 py-4 text-center",
                                            Number(row.undertimeMinutes) !==
                                                0 &&
                                                "font-semibold text-red-500",
                                        )}
                                    >
                                        {row.undertimeMinutes}
                                    </TableCell>

                                    <TableCell className="px-2 py-4 text-center">
                                        {formatNumber(
                                            String(row.totalHrsWorked),
                                        )}
                                    </TableCell>

                                    <TableCell className="px-2 py-4 text-center">
                                        {formatNumber(String(row.totalHrs))}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={13}
                                    className="text-muted-foreground py-6 text-center"
                                >
                                    No time records found for this range.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
