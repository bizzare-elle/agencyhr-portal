import { useQuery } from "@tanstack/react-query";
import DataTable, { TableColumn } from "react-data-table-component";
import api from "@/lib/axios";
import { ApiResponse } from "@/index";
import { Badge } from "@/components/ui/badge";
import { formatToMonthDayYear } from "@/helpers/formatDates";
import { useState, useMemo } from "react";
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
import {
    CalendarIcon,
    FileDown,
    KeyRound,
    MoreHorizontal,
    FileText,
    Clock,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CustomSelect from "@/components/custom-select";
import { Employee, TimeRecord, GroupedEmployee } from "@/index";
import { ConsolidatedTimeRecordsPDF } from "@/components/employees/batch-report-template";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Link } from "react-router-dom";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * The default handed out by a coordinator reset. Mirrors _default_password()
 * in api_v2/Auth.php -- shown here only so the coordinator can read it back to
 * the employee; the server is what actually sets it.
 */
const DEFAULT_PASSWORD = `Wildflour@${new Date().getFullYear()}`;

function parseManhours(manhour_conversion: any) {
    try {
        const manhours =
            typeof manhour_conversion === "string"
                ? JSON.parse(manhour_conversion)
                : manhour_conversion;

        if (!manhours) return [];

        return Object.entries(manhours)
            .filter(([_, value]) => Number(value) > 0)
            .map(([category, value]) => ({
                category,
                hours: Number(value),
            }));
    } catch {
        return [];
    }
}

function buildColumns(
    canResetPassword: boolean,
    onResetPassword: (employee: Employee) => void,
    resettingId: string | number | null,
): TableColumn<Employee>[] {
    return [
        { name: "ID", selector: (row) => row.id, sortable: true },
        { name: "Name", selector: (row) => row.name, sortable: true },
        { name: "Branch", selector: (row) => row.branch_id },
        { name: "Department", selector: (row) => row.department },
        {
            name: "Status",
            cell: (row) => {
                if (row.employment_status === "Active")
                    return (
                        <Badge className="bg-green-500/10 text-green-400">
                            Active
                        </Badge>
                    );

                if (row.employment_status === "Resign")
                    return <Badge variant="destructive">Resigned</Badge>;

                return (
                    <Badge className="bg-muted text-muted-foreground">
                        Terminated
                    </Badge>
                );
            },
        },
        {
            name: "Created At",
            selector: (row) => row.created_at,
            format: (row) => formatToMonthDayYear(row.created_at),
        },
        {
            name: "Action",
            width: "90px",
            cell: (row) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label={`Actions for ${row.name}`}
                            disabled={resettingId === row.id}
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem asChild>
                            <Link to={`/employees/${row.id}`}>
                                <FileText className="h-4 w-4" />
                                View Profile
                            </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem asChild>
                            <Link to={`/${row.id}`}>
                                <Clock className="h-4 w-4" />
                                View Timesheet
                            </Link>
                        </DropdownMenuItem>

                        {canResetPassword && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    variant="destructive"
                                    // Deferred a tick so the menu finishes closing
                                    // before the dialog grabs focus -- otherwise the
                                    // two focus traps fight and the dialog opens blurred.
                                    onSelect={() =>
                                        setTimeout(
                                            () => onResetPassword(row),
                                            0,
                                        )
                                    }
                                >
                                    <KeyRound className="h-4 w-4" />
                                    {resettingId === row.id
                                        ? "Resetting…"
                                        : "Reset Password"}
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];
}

export default function Employees() {
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(15);
    const [search, setSearch] = useState("");
    const [cutOffDate, setCutOffDate] = useState<Date>();
    const [selectedBranch, setSelectedBranch] = useState<string>();
    const [isConsolidating, setIsConsolidating] = useState(false);
    const [pdfKey, setPdfKey] = useState(0);
    const [resetTarget, setResetTarget] = useState<Employee | null>(null);
    const [resettingId, setResettingId] = useState<string | number | null>(
        null,
    );

    const [consolidatedData, setConsolidatedData] = useState<GroupedEmployee[]>(
        [],
    );

    const meQuery = useQuery({
        queryKey: ["me"],
        queryFn: async () => {
            const response = await api.get<
                ApiResponse<{
                    hr_id: string;
                    name: string;
                    role: string;
                    agency_id: string;
                    is_admin: number;
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
        placeholderData: (prev) => prev,
    });

    const employees = data?.data.records ?? [];

    const pdfDocument = useMemo(() => {
        if (!consolidatedData.length) return null;

        return (
            <ConsolidatedTimeRecordsPDF recordsByEmployee={consolidatedData} />
        );
    }, [consolidatedData]);

    const pdfFileName = useMemo(() => {
        return `Consolidated_Time_Records_${
            cutOffDate ? format(cutOffDate, "yyyyMMdd") : "NA"
        }.pdf`;
    }, [cutOffDate]);

    const canResetPassword =
        meQuery.data?.role === "agency_coordinator" ||
        Number(meQuery.data?.is_admin) === 1;

    const handleResetPassword = async (employee: Employee) => {
        setResettingId(employee.id);

        try {
            await api.post(`/api/v2/auth/admin-reset/${employee.id}`);

            toast.success(`Password reset for ${employee.name}`, {
                description: `Temporary password: ${DEFAULT_PASSWORD} — they must change it at next login.`,
                duration: 10000,
            });
        } catch (error: any) {
            toast.error(
                error?.response?.data?.message || "Failed to reset password.",
            );
        } finally {
            setResettingId(null);
            setResetTarget(null);
        }
    };

    const columns = useMemo(
        () => buildColumns(canResetPassword, setResetTarget, resettingId),
        [canResetPassword, resettingId],
    );

    const normalizeEmployeeIds = (ids: any): number[] => {
        if (!ids) return [];

        if (Array.isArray(ids)) return ids.map(Number);

        if (typeof ids === "object") return Object.values(ids).map(Number);

        return [Number(ids)];
    };

    const handleConsolidate = async () => {
        if (!cutOffDate) {
            toast.error("Please select a cut off date");
            return;
        }

        setIsConsolidating(true);

        try {
            const agency_id = meQuery.data?.agency_id;

            const { data: consolidateData } = await api.post(
                "/api/v2/time-records/consolidate",
                {
                    cut_off_date: format(cutOffDate, "yyyy-MM-dd"),
                    branch_id: selectedBranch,
                    employee_id: null,
                    agency_id,
                },
            );

            const employeeIds = normalizeEmployeeIds(
                consolidateData.employees_processed?.employee_ids,
            );

            if (!employeeIds.length) {
                toast.info("No employees processed.");
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

            const responses = await Promise.all(
                employeeIds.map((id) =>
                    api
                        .get<
                            ApiResponse<{ time_records: TimeRecord[] }>
                        >(`/api/v2/time-records/${id}?from=${date_from}&to=${date_to}`)
                        .then((res) => res.data.data.time_records || []),
                ),
            );

            const allRecords: TimeRecord[] = responses.flat();

            if (!allRecords.length) {
                toast.info("No time records found.");
                setConsolidatedData([]);
                return;
            }

            const grouped: Record<number, GroupedEmployee> = {};

            allRecords.forEach((rec) => {
                const empId = rec.employee_id as number;

                if (!grouped[empId]) {
                    grouped[empId] = {
                        id: String(empId),
                        employee_name: rec.employee_name,
                        id_number: rec.id_number,
                        branch: rec.branch_name,
                        employment_status: rec.employment_status,
                        agency_name: rec.agency_name,
                        time_records: [],
                    };
                }

                grouped[empId].time_records.push({
                    date: rec.cut_off,
                    schedule: rec.schedule_type,
                    time_in: rec.clock_in,
                    time_out: rec.clock_out,
                    break_in: rec.break_in,
                    break_out: rec.break_out,
                    branch_timeIn: rec.clock_in_branch,
                    branch_timeOut: rec.clock_out_branch,
                    hoursWorked: Number(rec.total_hours_worked ?? 0),
                    hours: Number(rec.total_hrs ?? 0),
                    late: Number(rec.total_hrs_late ?? 0),
                    overtime: Number(rec.total_overtime_hrs ?? 0),
                    undertime: Number(rec.total_undertime_hrs ?? 0),
                    late_break: Number(rec.total_hrs_break_late ?? 0),
                    manhourArray: parseManhours(rec.manhour_conversion),
                });
            });

            setConsolidatedData(Object.values(grouped));

            // force PDF rerender
            setPdfKey((prev) => prev + 1);

            toast.success("Consolidation completed!");
        } catch (error) {
            console.error(error);
            toast.error("Consolidation failed.");
        } finally {
            setIsConsolidating(false);
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
                <Input
                    placeholder="Search Employee..."
                    className="w-full md:max-w-[250px]"
                    onChange={(e) => setSearch(e.target.value)}
                />

                <div className="flex flex-wrap gap-3">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {cutOffDate
                                    ? format(cutOffDate, "MMM d, yyyy")
                                    : "Pick date"}
                            </Button>
                        </PopoverTrigger>

                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={cutOffDate}
                                onSelect={setCutOffDate}
                            />
                        </PopoverContent>
                    </Popover>

                    <CustomSelect
                        apiUrl="api/v2/get_branch"
                        value={selectedBranch}
                        onChange={setSelectedBranch}
                        placeholder="Select branch..."
                    />

                    <Button
                        onClick={handleConsolidate}
                        disabled={
                            !cutOffDate || !selectedBranch || isConsolidating
                        }
                    >
                        {isConsolidating ? "Consolidating..." : "Consolidate"}
                    </Button>

                    {pdfDocument ? (
                        <PDFDownloadLink
                            key={pdfKey}
                            document={pdfDocument}
                            fileName={pdfFileName}
                        >
                            {({ loading }) => (
                                <Button disabled={loading}>
                                    <FileDown className="mr-2 h-4 w-4" />
                                    {loading
                                        ? "Preparing PDF..."
                                        : "Download Timesheet"}
                                </Button>
                            )}
                        </PDFDownloadLink>
                    ) : (
                        <Button disabled>
                            <FileDown className="mr-2 h-4 w-4" />
                            No Records
                        </Button>
                    )}
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
                        paginationPerPage={rowsPerPage}
                        onChangePage={setPage}
                        onChangeRowsPerPage={setRowsPerPage}
                        paginationTotalRows={data?.data.total || 0}
                    />
                </CardContent>
            </Card>

            <AlertDialog
                open={resetTarget !== null}
                onOpenChange={(open) => {
                    if (!open) setResetTarget(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Reset password?</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-2">
                                <p>
                                    This replaces{" "}
                                    <span className="text-foreground font-semibold">
                                        {resetTarget?.name}
                                    </span>
                                    &rsquo;s password with the default{" "}
                                    <code className="bg-muted text-foreground rounded px-1.5 py-0.5 font-mono">
                                        {DEFAULT_PASSWORD}
                                    </code>
                                    .
                                </p>
                                <p>
                                    Their current password stops working
                                    immediately, and they will be required to
                                    set a new one the next time they log in.
                                </p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={resettingId !== null}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            disabled={resettingId !== null}
                            onClick={(e) => {
                                e.preventDefault();
                                if (resetTarget)
                                    handleResetPassword(resetTarget);
                            }}
                        >
                            {resettingId !== null
                                ? "Resetting…"
                                : "Reset password"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
