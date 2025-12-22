import { useQuery } from "@tanstack/react-query";
import DataTable, { TableColumn } from "react-data-table-component";
import api from "@/lib/axios";
import { ApiResponse } from "@/index";
import { Badge } from "@/components/ui/badge";
import { formatToMonthDayYear } from "@/helpers/formatDates";
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
import { exportConsolidatedToExcel } from "@/components/employees/excel-report-template";

interface EmployeeTimeRecord {
    date: string;
    schedule: string;
    time_in: string | null;
    time_out: string | null;
    break_in: string | null;
    break_out: string | null;
    branch_timeIn: string | null;
    branch_timeOut: string | null;
    hours: number;
    late: number;
    overtime: number;
    undertime: number;
    late_break: number;
}

interface GroupedEmployee {
    id: number;
    employee_name: string;
    id_number: string;
    branch: string;
    employment_status: string;
    agency_name: string;
    time_records: EmployeeTimeRecord[];
}

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
        format: (row) => formatToMonthDayYear(row.created_at),
    },
    {
        name: "Action",
        cell: (row) => (
            <div className="flex flex-col gap-2 p-2">
                <Button className="btn-sm" variant="secondary">
                    <Link to={`/employees/${row.id}`}>View Profile</Link>
                </Button>
                <Button className="btn-sm" variant="secondary">
                    <Link to={`/${row.id}`}>View Timesheet</Link>
                </Button>
            </div>
        ),
    },
];

export default function Employees() {
    const [page, setPage] = useState<number>(1);
    const [rowsPerPage, setRowsPerPage] = useState<number>(15);
    const [search, setSearch] = useState<string>("");
    const [cutOffDate, setCutOffDate] = useState<Date | undefined>();
    const [isConsolidating, setIsConsolidating] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState<string | undefined>(
        undefined,
    );

    const [consolidatedData, setConsolidatedData] = useState<any[]>([]);
    const [hasConsolidated, setHasConsolidated] = useState(false);

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
        queryFn: async function () {
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

        setIsConsolidating(true);
        setHasConsolidated(false);

        try {
            const agency_id = meQuery.data?.agency_id;
            const branch_id = selectedBranch;
            const employee_id = null;

            const { data: consolidateData } = await api.post(
                "/api/v2/time-records/consolidate",
                {
                    cut_off_date: format(cutOffDate, "yyyy-MM-dd"),
                    branch_id,
                    employee_id,
                    agency_id,
                },
            );

            const employee_ids: number[] = Array.isArray(
                consolidateData.employees_processed?.employee_ids,
            )
                ? consolidateData.employees_processed.employee_ids.map(Number)
                : [];

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

            const allRecordsResponses = await Promise.all(
                employee_ids.map((empId) =>
                    api
                        .get<
                            ApiResponse<{ time_records: TimeRecord[] }>
                        >(`/api/v2/time-records/${empId}?from=${date_from}&to=${date_to}`)
                        .then((res) => res.data.data.time_records || []),
                ),
            );

            const allRecords: TimeRecord[] = allRecordsResponses.flat();

            if (!allRecords.length) {
                toast.info(
                    "No time records found for the selected cutoff period.",
                );
                setConsolidatedData([]);
                setHasConsolidated(true);
                return;
            }

            const groupedByEmployee: Record<number, GroupedEmployee> =
                allRecords.reduce(
                    (acc, rec) => {
                        const empId = rec.employee_id as number;

                        if (!acc[empId]) {
                            acc[empId] = {
                                id: empId,
                                employee_name: rec.employee_name,
                                id_number: rec.id_number,
                                branch: rec.branch_name,
                                employment_status: rec.employment_status,
                                agency_name: rec.agency_name,
                                time_records: [],
                            };
                        }

                        acc[empId].time_records.push({
                            date: rec.cut_off,
                            schedule: rec.schedule_name,
                            time_in: rec.clock_in,
                            time_out: rec.clock_out,
                            break_in: rec.break_in,
                            break_out: rec.break_out,
                            branch_timeIn: rec.clock_in_branch,
                            branch_timeOut: rec.clock_out_branch,

                            hours: Number(rec.total_hrs ?? 0),
                            late: Number(rec.total_hrs_late ?? 0),
                            overtime: Number(rec.total_overtime ?? 0),
                            late_break: Number(rec.total_hrs_break_late ?? 0),
                            undertime: Number(rec.total_undertime_hrs ?? 0),
                        });

                        return acc;
                    },
                    {} as Record<number, GroupedEmployee>,
                );

            setConsolidatedData(Object.values(groupedByEmployee));
            toast.success(
                "Consolidation and time record fetch successfully completed!",
            );
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

    function handleSort(rows: any, selector: any, direction: any) {}

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
                <div className="w-full md:w-auto">
                    <Input
                        type="text"
                        placeholder="Search Employee..."
                        className="w-full md:max-w-[250px]"
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end md:justify-end md:gap-3">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal sm:w-[180px]"
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

                    <div className="w-full sm:w-[180px]">
                        <CustomSelect
                            apiUrl="api/v2/get_branch"
                            value={selectedBranch}
                            onChange={(value) => setSelectedBranch(value)}
                            placeholder="Select branch..."
                        />
                    </div>

                    <Button
                        onClick={handleConsolidate}
                        disabled={isConsolidating}
                        className={`w-full sm:w-auto ${
                            isConsolidating ? "" : "bg-yellow-500"
                        }`}
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
                            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
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
                                            className="flex w-full items-center justify-center gap-2 sm:w-auto"
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
                                    className="flex w-full items-center justify-center gap-2 sm:w-auto"
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
                            </div>
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
                        data={[...(data?.data.records || [])]}
                        pagination
                        paginationServer
                        theme="dark"
                        responsive
                        progressPending={isLoading}
                        paginationPerPage={rowsPerPage}
                        sortServer
                        onSort={handleSort}
                        onChangePage={(page) => setPage(page)}
                        onChangeRowsPerPage={(value) => setRowsPerPage(value)}
                        paginationTotalRows={data?.data.total || 0}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
