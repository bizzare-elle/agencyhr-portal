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
import { PropagateLoader } from "react-spinners";
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
    ScanFace,
    Copy,
    Check,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
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
    showFaceEnrollment: boolean,
    enrolledIds: Set<number>,
): TableColumn<Employee>[] {
    const faceColumn: TableColumn<Employee>[] = showFaceEnrollment
        ? [
              {
                  name: "Face Enrollment",
                  cell: (row) =>
                      enrolledIds.has(Number(row.id)) ? (
                          <Badge className="bg-green-500/10 text-green-400">
                              Enrolled
                          </Badge>
                      ) : (
                          <Link
                              to={`/face-enrollment?employee=${row.id}`}
                              className="text-yellow-400 hover:underline"
                          >
                              <Badge className="cursor-pointer bg-yellow-500/10 text-yellow-400">
                                  Not enrolled — Enroll now
                              </Badge>
                          </Link>
                      ),
              },
          ]
        : [];

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
        ...faceColumn,
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

                        {showFaceEnrollment && (
                            <DropdownMenuItem asChild>
                                <Link
                                    to={`/face-enrollment?employee=${row.id}`}
                                >
                                    <ScanFace className="h-4 w-4" />
                                    {enrolledIds.has(Number(row.id))
                                        ? "Re-enroll Face"
                                        : "Enroll Face"}
                                </Link>
                            </DropdownMenuItem>
                        )}

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
    const [resetResult, setResetResult] = useState<{
        name: string;
        password: string;
    } | null>(null);
    const [passwordCopied, setPasswordCopied] = useState(false);

    const [consolidatedData, setConsolidatedData] = useState<GroupedEmployee[]>(
        [],
    );
    const [consolidateStage, setConsolidateStage] = useState<
        "idle" | "consolidating" | "fetching" | "building"
    >("idle");
    const [fetchProgress, setFetchProgress] = useState({ done: 0, total: 0 });

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

    const isCoordinator = meQuery.data?.role === "agency_coordinator";

    // Face Enrollment is coordinator-only (see Face_enrollment api_v2
    // controller) — only fetch this list for coordinators, never for
    // hr_employee viewers of this same page.
    const faceEnrollmentQuery = useQuery({
        queryKey: ["face-enrollments"],
        queryFn: async () => {
            const response = await api.get<
                ApiResponse<{ id: number; enrolled: boolean }[]>
            >("/api/v2/face-enrollments");
            return response.data.data;
        },
        enabled: isCoordinator,
        staleTime: 60 * 1000,
    });

    const enrolledIds = useMemo(() => {
        const ids = new Set<number>();
        (faceEnrollmentQuery.data ?? []).forEach((row) => {
            if (row.enrolled) ids.add(Number(row.id));
        });
        return ids;
    }, [faceEnrollmentQuery.data]);

    const handleResetPassword = async (employee: Employee) => {
        setResettingId(employee.id);

        try {
            const res = await api.post<
                ApiResponse<{
                    employee_id: number;
                    emailed: boolean;
                    sent_to?: string;
                    password?: string;
                }>
            >(`/api/v2/auth/admin-reset/${employee.id}`);

            // The server generates a fresh single-use password per reset (see
            // _default_password() in api_v2/Auth.php) and returns it exactly
            // once here -- there is no fixed/predictable default to fall back
            // on, so surfacing anything other than this value would hand the
            // coordinator a password that doesn't actually work.
            if (res.data?.data?.emailed) {
                toast.success(
                    `A temporary password was emailed to ${res.data.data.sent_to}.`,
                );
                return;
            }

            const password = res.data?.data?.password;

            if (!password) {
                toast.error(
                    "Password was reset, but the server didn't return it. Ask the employee to use Forgot Password instead.",
                );
                return;
            }

            // A toast alone is too easy to lose (small text, auto-dismisses,
            // no way to copy) for a value the coordinator has to relay
            // accurately and that's shown exactly once. Surface it in a
            // dialog that stays open until they explicitly close it.
            setResetResult({ name: employee.name, password });
        } catch (error: any) {
            toast.error(
                error?.response?.data?.message || "Failed to reset password.",
            );
        } finally {
            setResettingId(null);
            setResetTarget(null);
        }
    };

    const handleCopyPassword = async () => {
        if (!resetResult) return;
        try {
            await navigator.clipboard.writeText(resetResult.password);
            setPasswordCopied(true);
            setTimeout(() => setPasswordCopied(false), 2000);
        } catch {
            toast.error("Couldn't copy automatically — select and copy manually.");
        }
    };

    const columns = useMemo(
        () =>
            buildColumns(
                canResetPassword,
                setResetTarget,
                resettingId,
                isCoordinator,
                enrolledIds,
            ),
        [canResetPassword, resettingId, isCoordinator, enrolledIds],
    );

    const normalizeEmployeeIds = (ids: any): number[] => {
        if (!ids) return [];

        if (Array.isArray(ids)) return ids.map(Number);

        if (typeof ids === "object") return Object.values(ids).map(Number);

        return [Number(ids)];
    };

    // Batch size for the bulk time-records fetch below -- keeps each request
    // (and the backend's own per-chunk batching) to a bounded size instead of
    // sending every processed employee id in one request, and gives the
    // loading indicator real progress increments to report.
    const CONSOLIDATE_FETCH_CHUNK_SIZE = 50;

    const handleConsolidate = async () => {
        if (!cutOffDate) {
            toast.error("Please select a cut off date");
            return;
        }

        setIsConsolidating(true);
        setConsolidateStage("consolidating");
        setFetchProgress({ done: 0, total: 0 });

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
            // Zero-padded so 'YYYY-MM-DD' sorts/compares correctly as a plain
            // string against consolidated_time_records.cut_off (also stored
            // zero-padded) -- an unpadded "2026-9-16" string-compares as
            // GREATER than "2026-09-16" and silently excludes real rows.
            const monthStr = String(month).padStart(2, "0");

            const date_from =
                day > 15 ? `${year}-${monthStr}-16` : `${year}-${monthStr}-01`;

            const date_to =
                day > 15
                    ? `${year}-${monthStr}-${String(lastDay).padStart(2, "0")}`
                    : `${year}-${monthStr}-15`;

            // One bulk request per chunk of employees instead of one HTTP
            // request per employee -- was `Promise.all(employeeIds.map(...))`,
            // which fired e.g. 300 parallel requests for a 300-employee agency.
            setConsolidateStage("fetching");
            setFetchProgress({ done: 0, total: employeeIds.length });

            const allRecords: TimeRecord[] = [];

            for (
                let i = 0;
                i < employeeIds.length;
                i += CONSOLIDATE_FETCH_CHUNK_SIZE
            ) {
                const chunk = employeeIds.slice(
                    i,
                    i + CONSOLIDATE_FETCH_CHUNK_SIZE,
                );

                const { data: bulkResponse } = await api.post<
                    ApiResponse<{
                        time_records_by_employee: Record<string, TimeRecord[]>;
                    }>
                >("/api/v2/time-records/bulk", {
                    employee_ids: chunk,
                    from: date_from,
                    to: date_to,
                });

                const byEmployee =
                    bulkResponse.data?.time_records_by_employee || {};
                Object.values(byEmployee).forEach((records) => {
                    allRecords.push(...records);
                });

                setFetchProgress((prev) => ({
                    done: Math.min(
                        prev.done + chunk.length,
                        employeeIds.length,
                    ),
                    total: employeeIds.length,
                }));
            }

            if (!allRecords.length) {
                toast.info("No time records found.");
                setConsolidatedData([]);
                return;
            }

            setConsolidateStage("building");

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
            setConsolidateStage("idle");
        }
    };

    const CONSOLIDATE_STEPS = [
        { key: "consolidating", label: "Consolidate records" },
        { key: "fetching", label: "Fetch timesheets" },
        { key: "building", label: "Build printable report" },
    ] as const;

    const consolidateStepIndex = CONSOLIDATE_STEPS.findIndex(
        (s) => s.key === consolidateStage,
    );

    const consolidateLoaderMessage = useMemo(() => {
        switch (consolidateStage) {
            case "consolidating":
                return "Consolidating time records for the selected cut-off...";
            case "fetching":
                return fetchProgress.total
                    ? `Fetching timesheets — ${fetchProgress.done} of ${fetchProgress.total} employees`
                    : "Fetching timesheets...";
            case "building":
                return "Building the printable report...";
            default:
                return undefined;
        }
    }, [consolidateStage, fetchProgress]);

    const fetchProgressPercent = fetchProgress.total
        ? Math.round((fetchProgress.done / fetchProgress.total) * 100)
        : 0;

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
            {isConsolidating && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-card border-border w-full max-w-sm rounded-lg border p-6 shadow-xl">
                        <div className="flex justify-center">
                            <PropagateLoader size={12} color="#eab308" />
                        </div>

                        <p className="mt-5 text-center text-sm font-medium">
                            {consolidateLoaderMessage}
                        </p>

                        {consolidateStage === "fetching" && (
                            <div className="mt-4">
                                <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                                    <div
                                        className="h-full rounded-full bg-yellow-500 transition-all duration-300"
                                        style={{
                                            width: `${fetchProgressPercent}%`,
                                        }}
                                    />
                                </div>
                                <p className="text-muted-foreground mt-1 text-center text-xs">
                                    {fetchProgressPercent}%
                                </p>
                            </div>
                        )}

                        <ol className="mt-5 space-y-2">
                            {CONSOLIDATE_STEPS.map((step, i) => {
                                const isDone = i < consolidateStepIndex;
                                const isActive = i === consolidateStepIndex;
                                return (
                                    <li
                                        key={step.key}
                                        className={`flex items-center gap-2 text-xs ${
                                            isActive
                                                ? "text-foreground font-medium"
                                                : isDone
                                                  ? "text-muted-foreground"
                                                  : "text-muted-foreground/50"
                                        }`}
                                    >
                                        <span
                                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] ${
                                                isDone
                                                    ? "bg-green-500/20 text-green-500"
                                                    : isActive
                                                      ? "bg-yellow-500/20 text-yellow-500"
                                                      : "bg-muted"
                                            }`}
                                        >
                                            {isDone ? "✓" : i + 1}
                                        </span>
                                        {step.label}
                                    </li>
                                );
                            })}
                        </ol>
                    </div>
                </div>
            )}

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
                        placeholder="All branches"
                    />

                    <Button
                        onClick={handleConsolidate}
                        disabled={!cutOffDate || isConsolidating}
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
                                    This generates a new single-use password for{" "}
                                    <span className="text-foreground font-semibold">
                                        {resetTarget?.name}
                                    </span>
                                    , shown once after you confirm so you can
                                    relay it to them.
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

            <Dialog
                open={resetResult !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setResetResult(null);
                        setPasswordCopied(false);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Password reset complete</DialogTitle>
                        <DialogDescription>
                            One-time temporary password for{" "}
                            <span className="text-foreground font-semibold">
                                {resetResult?.name}
                            </span>
                            . This is shown once — copy it now and relay it to
                            them. They must change it at next login.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex items-center gap-2">
                        <code className="border-input bg-muted flex-1 rounded-md border px-4 py-3 text-center text-lg font-bold tracking-widest select-all">
                            {resetResult?.password}
                        </code>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={handleCopyPassword}
                            aria-label="Copy password"
                            className="h-11 w-11 shrink-0"
                        >
                            {passwordCopied ? (
                                <Check className="h-4 w-4 text-green-500" />
                            ) : (
                                <Copy className="h-4 w-4" />
                            )}
                        </Button>
                    </div>

                    <DialogFooter>
                        <Button
                            onClick={() => {
                                setResetResult(null);
                                setPasswordCopied(false);
                            }}
                        >
                            Done
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
