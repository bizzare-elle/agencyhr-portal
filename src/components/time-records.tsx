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
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { TimeRecord } from "..";
import { computeUndertime, computeBillableHours } from "@/helpers/computeHours";

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
        const start =
            today.date() <= 15
                ? today.clone().startOf("month")
                : today.clone().date(16);
        const end =
            today.date() <= 15
                ? today.clone().date(15)
                : today.clone().endOf("month");
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

        console.log("Payload being sent to backend:", payload);

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

            console.log("Response from backend:", response.data);

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

    const tableData = useMemo(() => {
        return records.map((record) => {
            const undertime = computeUndertime(
                record.schedule_name,
                record.clock_out as string,
            );
            const billableHours = computeBillableHours(
                parseFloat(record.total_hrs || "0"),
                parseFloat(record.total_overtime || "0"),
                parseFloat(record.total_hrs_late || "0"),
                undertime,
            );

            return {
                branch: record.branch_name || "No data",
                scheduleName: record.schedule_name,
                date: moment(record.cut_off).format("YYYY-MM-DD"),
                dayName: moment(record.cut_off).format("dddd"),
                agencyName: record.agency_name,
                timeIn: record.clock_in,
                timeOut: record.clock_out,
                breakIn: record.break_in,
                breakOut: record.break_out,
                totalHrs: parseFloat(record.total_hrs || "0"),
                totalLate: parseFloat(record.total_hrs_late || "0"),
                totalOvertime: parseFloat(record.total_overtime || "0"),
                undertime,
                billableHours,
            };
        });
    }, [records]);

    const handlePrint = () => {
        const table = document.getElementById("time-records-table");
        if (!table) return;

        // Helper function to sum a column by its index
        const sumColumnByIndex = (index: number) => {
            const rows = Array.from(table.querySelectorAll("tbody tr"));
            return rows.reduce((sum, row) => {
                const cells = row.querySelectorAll("td");
                const val = parseFloat(
                    cells[index]?.textContent?.trim() || "0",
                );
                return sum + (isNaN(val) ? 0 : val);
            }, 0);
        };

        // Match your current table order:
        // 0 Branch
        // 1 Schedule
        // 2 Date
        // 3 Day
        // 4 Time In
        // 5 Break In
        // 6 Break Out
        // 7 Time Out
        // 8 Total Hours
        // 9 Late
        // 10 Undertime
        // 11 Overtime
        // 12 Billable Hours

        const totalHours = sumColumnByIndex(8);
        const totalLate = sumColumnByIndex(9);
        const totalUndertime = sumColumnByIndex(10);
        const totalOvertime = sumColumnByIndex(11);
        const totalBillable = sumColumnByIndex(12);

        const printContent = table.outerHTML;
        const printWindow = window.open("", "_blank");

        if (printWindow) {
            printWindow.document.write(`
        <html>
            <head>
                <title>Time Records - ${employeeName}</title>
                <style>
                    body {
                        font-family: Helvetica, Arial, sans-serif;
                        padding: 30px;
                        font-size: 10px;
                        color: #000;
                    }
                    h2, h3, h4 {
                        text-align: left;
                        margin: 0;
                    }
                    h2 {
                        font-size: 14px;
                        font-weight: bold;
                        margin-bottom: 4px;
                    }
                    h3 {
                        font-size: 12px;
                        font-weight: normal;
                        color: #333;
                        margin: 2px 0 6px 0;
                    }
                    h4 {
                        font-size: 10px;
                        color: gray;
                        margin-bottom: 10px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 10px;
                    }
                    th, td {
                        border: 1px solid #ccc;
                        padding: 4px 6px;
                        text-align: center;
                        font-size: 10px;
                    }
                    th {
                        background-color: #f0f0f0;
                        font-weight: bold;
                    }
                    td.late {
                        color: red;
                    }
                    .totals {
                        margin-top: 10px;
                        text-align: left;
                        font-size: 11px;
                        font-weight: bold;
                    }
                    .totals div {
                        margin-bottom: 2px;
                    }
                    @media print {
                        button { display: none; }
                    }
                </style>
            </head>
            <body>
                <div style="text-align: left; margin-bottom: 10px;">
                    <h2>${employeeName}</h2>
                    <h3>${agencyName || "No Agency"}</h3>
                    <h4>Cut-off Period: ${moment(queryFrom).format("MMM D, YYYY")} - ${moment(queryTo).format("MMM D, YYYY")}</h4>
                </div>

                ${printContent}

                <div class="totals">
                    <div>Total Late: ${totalLate.toFixed(2)}</div>
                    <div>Total Undertime: ${totalUndertime.toFixed(2)}</div>
                    <div>Total Overtime: ${totalOvertime.toFixed(2)}</div>
                    <div>Total Hours Worked: ${totalHours.toFixed(2)}</div>
                    <div>Total Billable Hours: ${totalBillable.toFixed(2)}</div>
                </div>
            </body>
        </html>
        `);

            printWindow.document.close();

            printWindow.onload = () => {
                printWindow.print();
            };
        }
    };

    const handleExportExcel = async () => {
        if (!records || records.length === 0) {
            toast.error("No records to export");
            return;
        }

        const employee = employeeName || "Employee";
        const dateRange =
            queryFrom && queryTo
                ? `Date Range: ${moment(queryFrom).format("MMM DD, YYYY")} to ${moment(
                      queryTo,
                  ).format("MMM DD, YYYY")}`
                : "";

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Time Records");

        worksheet.addRow([`Employee Name: ${employee}`]);
        worksheet.addRow([dateRange]);
        worksheet.addRow([]);

        const headers = [
            "Branch",
            "Schedule",
            "Date",
            "Day",
            "Time In",
            "Time Out",
            "Break In",
            "Break Out",
            "Total Hours",
            "Late (hrs)",
            "Undertime (hrs)",
            "Overtime (hrs)",
            "Billable Hours",
        ];
        const headerRow = worksheet.addRow(headers);

        headerRow.eachCell((cell) => {
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "353935" },
            };
            cell.font = { bold: true, color: { argb: "FFFFFF" } };
            cell.alignment = { horizontal: "center", vertical: "middle" };
            cell.border = {
                top: { style: "thin" },
                bottom: { style: "thin" },
                left: { style: "thin" },
                right: { style: "thin" },
            };
        });

        // Compute and add rows
        let totalHours = 0;
        let totalLate = 0;
        let totalUndertime = 0;
        let totalOvertime = 0;
        let totalBillable = 0;

        records.forEach((r) => {
            const undertime = computeUndertime(
                r.schedule_name,
                r.clock_out as string,
            );
            const billableHours = computeBillableHours(
                parseFloat(r.total_hrs || "0"),
                parseFloat(r.total_overtime || "0"),
                parseFloat(r.total_hrs_late || "0"),
                undertime,
            );

            totalHours += parseFloat(r.total_hrs || "0");
            totalLate += parseFloat(r.total_hrs_late || "0");
            totalUndertime += undertime;
            totalOvertime += parseFloat(r.total_overtime || "0");
            totalBillable += billableHours;

            worksheet.addRow([
                r.branch_name ?? "",
                r.schedule_name ?? "",
                r.cut_off ? moment(r.cut_off).format("MMM DD, YYYY") : "",
                r.cut_off ? moment(r.cut_off).format("dddd") : "",
                r.clock_in
                    ? moment(r.clock_in, "HH:mm:ss").format("hh:mm A")
                    : "No Data",
                r.clock_out
                    ? moment(r.clock_out, "HH:mm:ss").format("hh:mm A")
                    : "No Data",
                r.break_in
                    ? moment(r.break_in, "HH:mm:ss").format("hh:mm A")
                    : "No Data",
                r.break_out
                    ? moment(r.break_out, "HH:mm:ss").format("hh:mm A")
                    : "No Data",
                parseFloat(r.total_hrs || "0").toFixed(2),
                parseFloat(r.total_hrs_late || "0").toFixed(2),
                undertime.toFixed(2),
                parseFloat(r.total_overtime || "0").toFixed(2),
                billableHours.toFixed(2),
            ]);
        });

        // Totals Row
        const totalsRow = worksheet.addRow([
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "TOTALS:",
            totalHours.toFixed(2),
            totalLate.toFixed(2),
            totalUndertime.toFixed(2),
            totalOvertime.toFixed(2),
            totalBillable.toFixed(2),
        ]);

        totalsRow.eachCell((cell, colNumber) => {
            if (colNumber >= 8) {
                cell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "353935" },
                };
                cell.font = { bold: true, color: { argb: "FFFFFF" } };
                cell.alignment = { horizontal: "center", vertical: "middle" };
                cell.border = {
                    top: { style: "thin" },
                    bottom: { style: "thin" },
                    left: { style: "thin" },
                    right: { style: "thin" },
                };
            }
        });

        worksheet.columns = [
            { width: 25 },
            { width: 25 },
            { width: 18 },
            { width: 15 },
            { width: 15 },
            { width: 15 },
            { width: 15 },
            { width: 15 },
            { width: 15 },
            { width: 15 },
            { width: 15 },
            { width: 15 },
            { width: 18 },
        ];

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: "application/octet-stream" });
        saveAs(
            blob,
            `Time_Records_${(employee as string).replace(/\s/g, "_")}.xlsx`,
        );

        toast.success("Exported successfully to Excel");
    };

    const formatTime = (time: string | null, workDate?: string | null) => {
        if (!time) return <span className="text-red-500">No data</span>;

        const parsed = moment(
            time.length <= 8 && workDate ? `${workDate} ${time}` : time,
            ["YYYY-MM-DD HH:mm:ss", "HH:mm:ss"],
        );

        return parsed.isValid() ? (
            parsed.format("hh:mm A")
        ) : (
            <span className="text-red-500">Invalid</span>
        );
    };

    const formatNumber = (value: string | null) => {
        if (value === null || value === "" || isNaN(Number(value))) {
            return <span className="text-red-500">No data</span>;
        }
        return Number(value).toFixed(2);
    };

    if (isError) {
        return (
            <div className="text-destructive py-6 text-center">
                Failed to load records. Please try again later.
            </div>
        );
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
                    <DateRangePicker
                        initialDateFrom={datesToRender[0]}
                        initialDateTo={datesToRender[datesToRender.length - 1]}
                        onUpdate={(value) => {
                            const from = value.range.from;
                            const to = value.range.to || value.range.from;
                            setDatesToRender(getDatesInRange(from, to));
                        }}
                    />

                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                        <Button
                            onClick={handleExportExcel}
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto"
                        >
                            <Download className="mr-2 h-4 w-4" /> Export
                        </Button>

                        <Button
                            onClick={handlePrint}
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto"
                        >
                            <Printer className="mr-2 h-4 w-4" /> Print
                        </Button>

                        <Button
                            size="sm"
                            onClick={handleConsolidate}
                            disabled={isConsolidating}
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

            {/* Table */}
            <div
                id="time-records-table"
                className="bg-card overflow-x-auto rounded-md border shadow-sm"
            >
                <Table className="min-w-full divide-y divide-gray-200">
                    <TableHeader>
                        <TableRow className="bg-muted text-sm">
                            <TableHead className="px-2 py-4">Branch</TableHead>
                            <TableHead className="px-2 py-4">
                                Schedule Name
                            </TableHead>
                            <TableHead className="px-2 py-4">Date</TableHead>
                            <TableHead className="px-2 py-4">Day</TableHead>
                            <TableHead className="px-2 py-4 text-center">
                                Time In
                            </TableHead>
                            <TableHead className="px-2 py-4 text-center">
                                Break In
                            </TableHead>
                            <TableHead className="px-2 py-4 text-center">
                                Break Out
                            </TableHead>
                            <TableHead className="px-2 py-4 text-center">
                                Time Out
                            </TableHead>
                            <TableHead className="px-2 py-4 text-center">
                                Total Hours
                            </TableHead>
                            <TableHead className="px-2 py-4 text-center">
                                Late (hrs)
                            </TableHead>
                            <TableHead className="px-2 py-4 text-center">
                                Undertime (hrs)
                            </TableHead>
                            <TableHead className="px-2 py-4 text-center">
                                Overtime (hrs)
                            </TableHead>
                            <TableHead className="px-2 py-4 text-center">
                                Billable Hours
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {tableData.length ? (
                            tableData.map((row, i) => (
                                <TableRow key={i} className="hover:bg-muted/10">
                                    <TableCell className="px-2 py-4">
                                        {row.branch === "No data" ? (
                                            <span className="text-red-500">
                                                No data
                                            </span>
                                        ) : (
                                            row.branch
                                        )}
                                    </TableCell>
                                    <TableCell className="px-2 py-4 capitalize">
                                        {row.scheduleName || "No data"}
                                    </TableCell>
                                    <TableCell className="px-2 py-4">
                                        {moment(row.date).format("LL")}
                                    </TableCell>
                                    <TableCell className="px-2 py-4 capitalize">
                                        {row.dayName}
                                    </TableCell>
                                    <TableCell className="px-2 py-4 text-center">
                                        {row.timeIn
                                            ? formatTime(row.timeIn)
                                            : "No Data"}
                                    </TableCell>

                                    <TableCell className="px-2 py-4 text-center">
                                        {row.breakIn
                                            ? formatTime(row.breakIn)
                                            : "No Data"}
                                    </TableCell>
                                    <TableCell className="px-2 py-4 text-center">
                                        {row.breakOut
                                            ? formatTime(row.breakOut)
                                            : "No Data"}
                                    </TableCell>
                                    <TableCell className="px-2 py-4 text-center">
                                        {row.timeOut
                                            ? formatTime(row.timeOut)
                                            : "No Data"}
                                    </TableCell>
                                    <TableCell className="px-2 py-4 text-center">
                                        {formatNumber(String(row.totalHrs))}
                                    </TableCell>
                                    <TableCell
                                        className={cn(
                                            "px-2 py-4 text-center",
                                            Number(row.totalLate) !== 0 &&
                                                "font-semibold text-red-500",
                                        )}
                                    >
                                        {formatNumber(String(row.totalLate))}
                                    </TableCell>

                                    <TableCell className="px-2 py-4 text-center">
                                        {formatNumber(String(row.undertime))}
                                    </TableCell>
                                    <TableCell className="px-2 py-4 text-center">
                                        {formatNumber(
                                            String(row.totalOvertime),
                                        )}
                                    </TableCell>
                                    <TableCell className="px-2 py-4 text-center">
                                        {formatNumber(
                                            String(row.billableHours),
                                        )}
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
