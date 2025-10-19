import { useQuery } from "@tanstack/react-query";
import DataTable, { TableColumn } from "react-data-table-component";
import api from "@/lib/axios";
import { ApiResponse } from "@/index";
import { Badge } from "@/components/ui/badge";
import { formateToMonthDayYear } from "@/helpers/formatDates";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import FullPageLoader from "@/components/page-loader";
import { toast } from "sonner";
import { format } from "date-fns";
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, FileDown } from "lucide-react";
import CustomSelect from "@/components/custom-select";
import { Employee } from "@/index";
import { ConsolidatedTimeRecordsPDF } from "@/components/employees/batch-report-template";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Spinner } from "@/components/ui/spinner";
import { TimeRecord } from "@/index";
import { Link } from "react-router-dom";
import { differenceInMinutes, parse, isValid } from "date-fns";
import { exportConsolidatedToExcel } from "@/components/employees/excel-report-template";

const columns: TableColumn<Employee>[] = [
    { name: "ID", selector: (row) => row.id, sortable: true },
    { name: "Name", selector: (row) => row.name, sortable: true },
    { name: "Branch", selector: (row) => row.branch_id },
    { name: "Department", selector: (row) => row.department },
    {
        name: "Status",
        cell: (row) => {
            if (row.employment_status === "Active")
                return (
                    <Badge className="bg-green-700 text-white">Active</Badge>
                );
            if (row.employment_status === "Resign")
                return <Badge variant="destructive">Resigned</Badge>;
            return <Badge className="bg-gray-600 text-white">Terminated</Badge>;
        },
    },
    {
        name: "Created At",
        selector: (row) => row.created_at,
        format: (row) => formateToMonthDayYear(row.created_at),
    },
    {
        name: "Action",
        cell: (row) => (
            <Button variant="default">
                <Link to={`/employees/${row.id}`}>View Profile</Link>
            </Button>
        ),
    },
];

export default function Employees() {
    const [page, setPage] = useState<number>(1);
    const [rowsPerPage, setRowsPerPage] = useState<number>(15);
    const [search, setSearch] = useState<string>("");
    const [cutOffDate, setCutOffDate] = useState<Date | undefined>();
    const [isConsolidating, setIsConsolidating] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState<string>("");
    const [consolidatedData, setConsolidatedData] = useState<any[]>([]);
    const [hasConsolidated, setHasConsolidated] = useState(false); // ✅ NEW STATE

    const meQuery = useQuery({
        queryKey: ["me"],
        queryFn: async () => {
            const response = await api.get<
                ApiResponse<{
                    hr_id: string;
                    name: string;
                    role: string;
                    agency_id: string;
                }>
            >(`/api/v2/auth/me`);
            return response.data.data;
        },
    });

    const { data, isLoading, isError } = useQuery({
        queryKey: ["employees", page, rowsPerPage, search],
        queryFn: async () => {
            const response = await api.get<
                ApiResponse<{ total: number; records: Employee[] }>
            >(
                `/api/v2/employees?search=${search}&page=${page}&limit=${rowsPerPage}`,
            );
            return response.data;
        },
        placeholderData: (previousData) => previousData,
    });

    const handleConsolidate = async () => {
        if (!cutOffDate) {
            toast.error("Please select a cut off date");
            return;
        }

        try {
            setIsConsolidating(true);
            setHasConsolidated(false);
            const agency_id = meQuery.data?.agency_id;
            const branch_id = selectedBranch;

            const consolidateResponse = await api.post(
                "/api/v2/time-records/consolidate_agency",
                {
                    agency_id,
                    cut_off_date: format(cutOffDate, "yyyy-MM-dd"),
                    branch_id,
                },
            );

            const employee_ids = consolidateResponse.data.employee_ids || [];
            if (employee_ids.length === 0) {
                toast.info("No employees found for this cutoff");
                setConsolidatedData([]);
                setHasConsolidated(true);
                return;
            }

            const day = cutOffDate.getDate();
            const month = cutOffDate.getMonth() + 1;
            const year = cutOffDate.getFullYear();
            const lastDay = new Date(year, month, 0).getDate();

            const date_from =
                day > 15 ? `${year}-${month}-16` : `${year}-${month}-01`;
            const date_to =
                day > 15
                    ? `${year}-${month}-${lastDay}`
                    : `${year}-${month}-15`;

            const allRecords: TimeRecord[] = [];

            for (const emp_id of employee_ids) {
                const res = await api.get<
                    ApiResponse<{ time_records: TimeRecord[] }>
                >(
                    `/api/v2/time-records/${emp_id}?from=${date_from}&to=${date_to}`,
                );

                if (res.data.data.time_records?.length) {
                    allRecords.push(...res.data.data.time_records);
                }
            }

            if (allRecords.length === 0) {
                toast.info(
                    "No time records found for the selected cutoff period.",
                );
                setConsolidatedData([]);
                setHasConsolidated(true);
                return;
            }

            const groupedByEmployee = employee_ids
                .map((emp_id: number) => {
                    const empRecords = allRecords.filter(
                        (r) => (r.employee_id as number) === emp_id,
                    );
                    if (!empRecords.length) return null;

                    return {
                        id: emp_id,
                        employee_name: empRecords[0].employee_name,
                        id_number: empRecords[0].id_number,
                        branch: empRecords[0].branch_name,
                        department: empRecords[0].department_name,
                        employment_status: empRecords[0].employment_status,
                        agency_name: empRecords[0].agency_name,
                        time_records: empRecords.map((rec) => {
                            const totalHrs = parseFloat(rec.total_hrs || "0");
                            const late = parseFloat(rec.total_hrs_late || "0");
                            const overtime = parseFloat(
                                rec.total_overtime || "0",
                            );

                            let undertime = 0;
                            const scheduleParts =
                                rec.schedule_name?.split("-") || [];

                            if (scheduleParts.length === 2 && rec.clock_out) {
                                const scheduleOutStr = scheduleParts[1].trim();
                                const scheduledOut = parse(
                                    scheduleOutStr,
                                    "HH:mm",
                                    new Date(),
                                );
                                const actualOut = parse(
                                    rec.clock_out,
                                    "HH:mm:ss",
                                    new Date(),
                                );

                                if (
                                    isValid(scheduledOut) &&
                                    isValid(actualOut)
                                ) {
                                    const diff = differenceInMinutes(
                                        scheduledOut,
                                        actualOut,
                                    );
                                    undertime = diff > 0 ? diff / 60 : 0;
                                }
                            }

                            const billableHours = Math.max(
                                totalHrs - undertime,
                                0,
                            );

                            return {
                                date: rec.cut_off,
                                schedule_name: rec.schedule_name,
                                time_in: rec.clock_in,
                                time_out: rec.clock_out,
                                break_in: rec.break_in,
                                break_out: rec.break_out,
                                hours: totalHrs.toFixed(2),
                                late: late.toFixed(2),
                                overtime: overtime.toFixed(2),
                                undertime: undertime.toFixed(2),
                                billable_hours: billableHours.toFixed(2),
                            };
                        }),
                    };
                })
                .filter(Boolean);

            setConsolidatedData(groupedByEmployee);
            toast.success("Consolidation successfully completed!");
        } catch (error: any) {
            console.error(error);
            toast.error("Consolidation Failed!");
        } finally {
            setIsConsolidating(false);
            setHasConsolidated(true);
        }
    };

    if (isLoading) return <FullPageLoader />;

    if (isError) {
        return (
            <div className="flex h-64 flex-col items-center justify-center text-red-500">
                <p>Failed to load employees.</p>
                <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    className="mt-3"
                >
                    Retry
                </Button>
            </div>
        );
    }

    const employees = data?.data.records ?? [];

    return (
        <div className="mx-auto w-full max-w-[1600px] space-y-8 p-6">
            <div className="flex flex-col gap-1">
                <h3 className="text-lg font-semibold">Employees</h3>
                <span className="text-sm text-white/50">
                    View Employee Profiles. Generate and Consolidate time
                    records.
                </span>
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                {/* Left: Search */}
                <Input
                    type="text"
                    placeholder="Search Employee..."
                    className="max-w-[250px]"
                    onChange={(e) => setSearch(e.target.value)}
                />

                {/* Right: Filters + Buttons */}
                <div className="flex flex-wrap items-end gap-3">
                    {/* Date Picker */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-[180px] justify-start text-left font-normal"
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {cutOffDate ? (
                                    format(cutOffDate, "MMM d, yyyy")
                                ) : (
                                    <span>Pick date</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={cutOffDate}
                                onSelect={setCutOffDate}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>

                    {/* Branch Selector */}
                    <CustomSelect
                        apiUrl="api/v2/get_branch"
                        value={selectedBranch}
                        onChange={(value) => setSelectedBranch(value)}
                        placeholder="Select branch..."
                    />

                    {/* Consolidate Button */}
                    <Button
                        onClick={handleConsolidate}
                        disabled={isConsolidating}
                        className={isConsolidating ? "" : "bg-yellow-500"}
                    >
                        {isConsolidating ? (
                            <>
                                <Spinner className="mr-2 h-4 w-4" />
                                Consolidating...
                            </>
                        ) : (
                            "Consolidate"
                        )}
                    </Button>

                    {/* Conditional: Download & Export */}
                    {hasConsolidated &&
                        (consolidatedData.length > 0 ? (
                            <>
                                <PDFDownloadLink
                                    document={
                                        <ConsolidatedTimeRecordsPDF
                                            recordsByEmployee={consolidatedData}
                                        />
                                    }
                                    fileName={`Consolidated_Time_Records_${format(
                                        cutOffDate!,
                                        "yyyyMMdd",
                                    )}.pdf`}
                                >
                                    {({ loading }) => (
                                        <Button
                                            variant={
                                                loading
                                                    ? "secondary"
                                                    : "default"
                                            }
                                            className="flex items-center gap-2"
                                        >
                                            <FileDown className="h-4 w-4" />
                                            {loading
                                                ? "Preparing PDF..."
                                                : "Download PDF"}
                                        </Button>
                                    )}
                                </PDFDownloadLink>

                                <Button
                                    variant="outline"
                                    className="flex items-center gap-2"
                                    onClick={() =>
                                        exportConsolidatedToExcel(
                                            consolidatedData,
                                            cutOffDate!,
                                        )
                                    }
                                >
                                    <FileDown className="h-4 w-4" />
                                    Export Excel
                                </Button>
                            </>
                        ) : (
                            <p className="text-muted-foreground text-sm italic">
                                No records found for this cutoff period.
                            </p>
                        ))}
                </div>
            </div>

            <Card>
                <CardContent>
                    <DataTable
                        columns={columns}
                        data={employees}
                        pagination
                        paginationServer
                        theme="dark"
                        responsive
                        progressPending={isLoading}
                        paginationPerPage={rowsPerPage}
                        onChangePage={(page) => setPage(page)}
                        onChangeRowsPerPage={(value) => setRowsPerPage(value)}
                        paginationTotalRows={data?.data.total || 0}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
