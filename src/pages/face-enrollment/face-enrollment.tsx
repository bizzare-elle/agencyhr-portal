import { useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { IconFaceId } from "@tabler/icons-react";
import {
    AlertTriangle,
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    Camera,
    Check,
    DatabaseZap,
    ChevronLeft,
    ChevronRight,
    Eye,
    History,
    Loader2,
    RotateCcw,
    Search,
    ShieldAlert,
    Sparkles,
    Trash2,
    UserRoundX,
    Users,
    Zap,
    ZapOff,
} from "lucide-react";

import api from "@/lib/axios";
import { ParentComponent } from "@/components/parent-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
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
import { useFaceCapture } from "@/hooks/use-face-capture";

interface EmployeeEnrollmentRow {
    // null for a security guard who has no employee record until their face is enrolled
    id: number | null;
    roster_id?: number | null;
    can_enroll?: boolean;
    enroll_blocked_reason?: string | null;
    // security guards only: their employee record carries the roster details
    hr_synced?: boolean;
    name: string;
    enrollment_id: number | null;
    enrolled_at: string | null;
    enrolled: boolean;
    offboarding_flagged?: boolean;
}

type SortKey = "name" | "enrolled" | "enrolled_at";
type SortDir = "asc" | "desc";

function formatEnrolledAt(value: string | null) {
    if (!value) return null;
    const date = new Date(value.replace(" ", "T"));
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

function initialsOf(name: string) {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("");
}

export default function FaceEnrollmentPage() {
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<
        "all" | "enrolled" | "not_enrolled"
    >("all");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [sortKey, setSortKey] = useState<SortKey>("name");
    const [sortDir, setSortDir] = useState<SortDir>("asc");
    const [enrollTarget, setEnrollTarget] =
        useState<EmployeeEnrollmentRow | null>(null);
    const [deleteTarget, setDeleteTarget] =
        useState<EmployeeEnrollmentRow | null>(null);
    const [viewTarget, setViewTarget] = useState<EmployeeEnrollmentRow | null>(
        null,
    );
    const [historyTarget, setHistoryTarget] =
        useState<EmployeeEnrollmentRow | null>(null);

    const { data, isLoading } = useQuery<EmployeeEnrollmentRow[]>({
        queryKey: ["face-enrollments"],
        queryFn: async () => {
            const res = await api.get("/api/v2/face-enrollments");
            return res.data?.data ?? [];
        },
    });

    const employees = data ?? [];

    // Deep-link from Employee List/Profile — /face-enrollment?employee=123
    // opens straight into that employee's enroll dialog once the roster loads.
    useEffect(() => {
        const employeeParam = searchParams.get("employee");
        if (!employeeParam || employees.length === 0) return;

        const match = employees.find((e) => String(e.id) === employeeParam);
        if (match) {
            setEnrollTarget(match);
        }
        const next = new URLSearchParams(searchParams);
        next.delete("employee");
        setSearchParams(next, { replace: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [employees]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortDir("asc");
        }
        setPage(1);
    };

    const filtered = employees
        .filter((e) => {
            if (!e.name?.toLowerCase().includes(search.toLowerCase())) {
                return false;
            }
            if (statusFilter === "enrolled") return e.enrolled;
            if (statusFilter === "not_enrolled") return !e.enrolled;
            return true;
        })
        .sort((a, b) => {
            let cmp = 0;
            if (sortKey === "name") {
                cmp = a.name.localeCompare(b.name);
            } else if (sortKey === "enrolled") {
                cmp = Number(a.enrolled) - Number(b.enrolled);
            } else {
                cmp =
                    (a.enrolled_at ? new Date(a.enrolled_at).getTime() : 0) -
                    (b.enrolled_at ? new Date(b.enrolled_at).getTime() : 0);
            }
            return sortDir === "asc" ? cmp : -cmp;
        });
    const enrolledCount = employees.filter((e) => e.enrolled).length;
    const pendingCount = employees.length - enrolledCount;

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const pageStart =
        filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const pageEnd = Math.min(currentPage * pageSize, filtered.length);
    const paged = filtered.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize,
    );

    const handleSearchChange = (value: string) => {
        setSearch(value);
        setPage(1);
    };

    const handleStatusFilterChange = (
        value: "all" | "enrolled" | "not_enrolled",
    ) => {
        setStatusFilter(value);
        setPage(1);
    };

    const deleteMutation = useMutation({
        mutationFn: (row: EmployeeEnrollmentRow) =>
            api.post(`/api/v2/face-enrollments/${row.enrollment_id}`),
        onSuccess: () => {
            toast.success("Face enrollment removed.");
            queryClient.invalidateQueries({ queryKey: ["face-enrollments"] });
            setDeleteTarget(null);
        },
        onError: (err: any) => {
            toast.error(
                err?.response?.data?.message ?? err?.message ?? "Failed.",
            );
        },
    });

    return (
        <ParentComponent>
            <div className="space-y-6 px-6 py-6">
                <div>
                    <h1 className="flex items-center gap-2 text-xl font-semibold">
                        <IconFaceId className="h-5 w-5 text-yellow-400" />
                        Face Enrollment
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Enroll and manage face profiles for your agency's
                        employees.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Card className="bg-card border">
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="bg-primary/10 text-primary rounded-full p-2">
                                <Users className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold">
                                    {employees.length}
                                </p>
                                <p className="text-muted-foreground text-xs">
                                    Total Employees
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-card border">
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="rounded-full bg-green-500/10 p-2 text-green-400">
                                <Check className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold">
                                    {enrolledCount}
                                </p>
                                <p className="text-muted-foreground text-xs">
                                    Enrolled
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-card border">
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="rounded-full bg-yellow-500/10 p-2 text-yellow-400">
                                <UserRoundX className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold">
                                    {pendingCount}
                                </p>
                                <p className="text-muted-foreground text-xs">
                                    Not Enrolled
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="py-0">
                    <CardHeader className="bg-primary/5 border-b px-6 py-6">
                        <CardTitle className="flex items-center justify-between text-base">
                            <span>Employees</span>
                            <span className="text-muted-foreground text-xs font-normal">
                                {filtered.length === 0
                                    ? "0 of 0 shown"
                                    : `${pageStart}-${pageEnd} of ${filtered.length} shown`}
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 p-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                            <div className="flex flex-col gap-3 sm:flex-1 sm:flex-row sm:flex-wrap sm:items-center">
                                <div className="relative w-full sm:max-w-sm sm:flex-1">
                                    <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                    <Input
                                        placeholder="Search employee name…"
                                        value={search}
                                        onChange={(e) =>
                                            handleSearchChange(e.target.value)
                                        }
                                        className="pl-9"
                                    />
                                </div>

                                <Select
                                    value={statusFilter}
                                    onValueChange={(value) =>
                                        handleStatusFilterChange(
                                            value as
                                                | "all"
                                                | "enrolled"
                                                | "not_enrolled",
                                        )
                                    }
                                >
                                    <SelectTrigger className="w-full sm:w-[160px]">
                                        <SelectValue placeholder="Filter status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All statuses
                                        </SelectItem>
                                        <SelectItem value="enrolled">
                                            Enrolled
                                        </SelectItem>
                                        <SelectItem value="not_enrolled">
                                            Not enrolled
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center justify-between gap-2 sm:justify-start">
                                <Label
                                    htmlFor="face-enroll-page-size"
                                    className="text-muted-foreground text-xs whitespace-nowrap"
                                >
                                    Rows per page
                                </Label>
                                <Select
                                    value={String(pageSize)}
                                    onValueChange={(value) => {
                                        setPageSize(Number(value));
                                        setPage(1);
                                    }}
                                >
                                    <SelectTrigger
                                        id="face-enroll-page-size"
                                        className="w-[80px]"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[10, 25, 50, 100].map((size) => (
                                            <SelectItem
                                                key={size}
                                                value={String(size)}
                                            >
                                                {size}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>
                                            <button
                                                type="button"
                                                className="flex items-center gap-1 select-none"
                                                onClick={() =>
                                                    handleSort("name")
                                                }
                                            >
                                                Employee
                                                {sortKey === "name" ? (
                                                    sortDir === "asc" ? (
                                                        <ArrowUp className="h-3 w-3" />
                                                    ) : (
                                                        <ArrowDown className="h-3 w-3" />
                                                    )
                                                ) : (
                                                    <ArrowUpDown className="text-muted-foreground h-3 w-3" />
                                                )}
                                            </button>
                                        </TableHead>
                                        <TableHead>
                                            <button
                                                type="button"
                                                className="flex items-center gap-1 select-none"
                                                onClick={() =>
                                                    handleSort("enrolled")
                                                }
                                            >
                                                Status
                                                {sortKey === "enrolled" ? (
                                                    sortDir === "asc" ? (
                                                        <ArrowUp className="h-3 w-3" />
                                                    ) : (
                                                        <ArrowDown className="h-3 w-3" />
                                                    )
                                                ) : (
                                                    <ArrowUpDown className="text-muted-foreground h-3 w-3" />
                                                )}
                                            </button>
                                        </TableHead>
                                        <TableHead className="hidden sm:table-cell">
                                            <button
                                                type="button"
                                                className="flex items-center gap-1 select-none"
                                                onClick={() =>
                                                    handleSort("enrolled_at")
                                                }
                                            >
                                                Enrolled
                                                {sortKey === "enrolled_at" ? (
                                                    sortDir === "asc" ? (
                                                        <ArrowUp className="h-3 w-3" />
                                                    ) : (
                                                        <ArrowDown className="h-3 w-3" />
                                                    )
                                                ) : (
                                                    <ArrowUpDown className="text-muted-foreground h-3 w-3" />
                                                )}
                                            </button>
                                        </TableHead>
                                        <TableHead className="text-right">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={4}
                                                className="py-10 text-center"
                                            >
                                                <div className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Loading employees…
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {!isLoading && filtered.length === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={4}
                                                className="py-10 text-center"
                                            >
                                                <div className="text-muted-foreground flex flex-col items-center gap-2 text-sm">
                                                    <Search className="h-6 w-6 opacity-50" />
                                                    No employees found.
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {paged.map((row) => (
                                        <TableRow
                                            key={
                                                row.roster_id
                                                    ? `r${row.roster_id}`
                                                    : `e${row.id}`
                                            }
                                        >
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                                                            row.enrolled
                                                                ? "bg-green-500/15 text-green-400"
                                                                : "bg-muted text-muted-foreground"
                                                        }`}
                                                    >
                                                        {initialsOf(row.name)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span>{row.name}</span>
                                                        {row.enroll_blocked_reason && (
                                                            <span className="text-muted-foreground text-xs">
                                                                {
                                                                    row.enroll_blocked_reason
                                                                }
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    {row.enrolled ? (
                                                        <Badge className="bg-green-500/10 text-green-400">
                                                            Enrolled
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-yellow-500/10 text-yellow-400">
                                                            Not enrolled
                                                        </Badge>
                                                    )}
                                                    {row.hr_synced && (
                                                        <Badge
                                                            className="bg-blue-500/10 text-blue-400"
                                                            title="The roster details are saved on this guard's employee record."
                                                        >
                                                            <DatabaseZap className="mr-1 h-3 w-3" />
                                                            Synced to HR
                                                        </Badge>
                                                    )}
                                                    {row.offboarding_flagged && (
                                                        <Badge
                                                            className="bg-red-500/10 text-red-400"
                                                            title="Employee is no longer active — review and remove this enrollment."
                                                        >
                                                            <AlertTriangle className="mr-1 h-3 w-3" />
                                                            Review
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground hidden text-sm sm:table-cell">
                                                {formatEnrolledAt(
                                                    row.enrolled_at,
                                                ) ?? "—"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant={
                                                            row.enrolled
                                                                ? "outline"
                                                                : "default"
                                                        }
                                                        className={
                                                            row.enrolled
                                                                ? ""
                                                                : "bg-yellow-500 text-white hover:bg-yellow-600"
                                                        }
                                                        disabled={
                                                            row.can_enroll ===
                                                            false
                                                        }
                                                        title={
                                                            row.enroll_blocked_reason ??
                                                            undefined
                                                        }
                                                        onClick={() =>
                                                            setEnrollTarget(row)
                                                        }
                                                        aria-label={
                                                            row.enrolled
                                                                ? "Re-enroll"
                                                                : "Enroll"
                                                        }
                                                    >
                                                        <Camera className="h-4 w-4 sm:mr-1" />
                                                        <span className="hidden sm:inline">
                                                            {row.enrolled
                                                                ? "Re-enroll"
                                                                : "Enroll"}
                                                        </span>
                                                    </Button>
                                                    {row.enrolled && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                aria-label="View enrolled face"
                                                                onClick={() =>
                                                                    setViewTarget(
                                                                        row,
                                                                    )
                                                                }
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                aria-label="Enrollment history"
                                                                onClick={() =>
                                                                    setHistoryTarget(
                                                                        row,
                                                                    )
                                                                }
                                                            >
                                                                <History className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-red-400"
                                                                aria-label="Remove enrollment"
                                                                onClick={() =>
                                                                    setDeleteTarget(
                                                                        row,
                                                                    )
                                                                }
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {filtered.length > 0 && (
                            <div className="flex flex-col-reverse items-center gap-2 pt-2 sm:flex-row sm:justify-between">
                                <span className="text-muted-foreground text-sm">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <div className="flex w-full items-center gap-2 sm:w-auto">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 sm:flex-none"
                                        disabled={currentPage === 1}
                                        onClick={() =>
                                            setPage((p) => Math.max(p - 1, 1))
                                        }
                                    >
                                        <ChevronLeft className="mr-1 h-4 w-4" />
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 sm:flex-none"
                                        disabled={currentPage === totalPages}
                                        onClick={() =>
                                            setPage((p) =>
                                                Math.min(p + 1, totalPages),
                                            )
                                        }
                                    >
                                        Next
                                        <ChevronRight className="ml-1 h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {enrollTarget && (
                <EnrollDialog
                    employee={enrollTarget}
                    onClose={() => setEnrollTarget(null)}
                    onSaved={() => {
                        setEnrollTarget(null);
                        queryClient.invalidateQueries({
                            queryKey: ["face-enrollments"],
                        });
                    }}
                />
            )}

            {viewTarget && (
                <ViewFaceDialog
                    employee={viewTarget}
                    onClose={() => setViewTarget(null)}
                />
            )}

            {historyTarget && (
                <HistoryDialog
                    employee={historyTarget}
                    onClose={() => setHistoryTarget(null)}
                />
            )}

            <AlertDialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-400" />
                            Remove face enrollment?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This removes {deleteTarget?.name}'s stored face
                            profile. They will need to be re-enrolled before
                            face attendance works for them again.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-500 text-white hover:bg-red-600"
                            disabled={deleteMutation.isPending}
                            onClick={() =>
                                deleteTarget &&
                                deleteMutation.mutate(deleteTarget)
                            }
                        >
                            {deleteMutation.isPending ? "Removing…" : "Remove"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </ParentComponent>
    );
}

function EnrollDialog({
    employee,
    onClose,
    onSaved,
}: {
    employee: EmployeeEnrollmentRow;
    onClose: () => void;
    onSaved: () => void;
}) {
    const {
        videoRef,
        canvasRef,
        status,
        statusMessage,
        captured,
        flashActive,
        flashEnabled,
        setFlashEnabled,
        qualityWarning,
        descriptor,
        snapshotBlob,
        snapshotUrl,
        capture,
        retake,
    } = useFaceCapture(true);

    const [consentGiven, setConsentGiven] = useState(false);
    const [duplicateWarning, setDuplicateWarning] = useState<{
        name: string;
        distance: number;
    } | null>(null);

    const saveMutation = useMutation({
        mutationFn: async (confirmDuplicate: boolean) => {
            const form = new FormData();
            if (employee.roster_id) {
                form.append("roster_id", String(employee.roster_id));
            }
            if (employee.id) {
                form.append("employee_id", String(employee.id));
            }
            if (employee.enrollment_id) {
                form.append("id", String(employee.enrollment_id));
            }
            if (descriptor) {
                form.append("descriptor", JSON.stringify(descriptor));
            }
            if (snapshotBlob) {
                form.append("snapshot", snapshotBlob, "snapshot.jpg");
            }
            form.append("consent", consentGiven ? "1" : "0");
            if (confirmDuplicate) {
                form.append("confirm_duplicate", "1");
            }
            return api.post("/api/v2/face-enrollments", form);
        },
        onSuccess: (res) => {
            const sync = res.data?.data?.hr_sync as
                | {
                      synced: boolean;
                      employee_id: number;
                      employee_created: boolean;
                      message: string;
                  }
                | null
                | undefined;

            if (!sync) {
                toast.success("Face enrollment saved.");
            } else if (sync.synced) {
                toast.success("Face enrollment saved and synced to HR.", {
                    description: sync.employee_created
                        ? `A new employee record (#${sync.employee_id}) was created from the security roster.`
                        : `Employee record #${sync.employee_id} was updated from the security roster.`,
                });
            } else {
                toast.warning("Face enrollment saved, but not synced to HR.", {
                    description: sync.message,
                });
            }
            onSaved();
        },
        onError: (err: any) => {
            const payload = err?.response?.data?.data;
            if (err?.response?.status === 422 && payload?.possible_duplicate) {
                setDuplicateWarning({
                    name: payload.matched_employee_name,
                    distance: payload.distance,
                });
                return;
            }
            toast.error(
                err?.response?.data?.message ?? err?.message ?? "Failed.",
            );
        },
    });

    const statusTone: Record<string, { icon: ReactNode; classes: string }> = {
        loading: {
            icon: <Loader2 className="h-4 w-4 shrink-0 animate-spin" />,
            classes: "bg-blue-500/10 text-blue-300",
        },
        ready: {
            icon: <Camera className="h-4 w-4 shrink-0" />,
            classes: "bg-muted text-muted-foreground",
        },
        captured: {
            icon: <Check className="h-4 w-4 shrink-0" />,
            classes: "bg-green-500/10 text-green-400",
        },
        "no-camera": {
            icon: <ShieldAlert className="h-4 w-4 shrink-0" />,
            classes: "bg-red-500/10 text-red-400",
        },
        error: {
            icon: <ShieldAlert className="h-4 w-4 shrink-0" />,
            classes: "bg-red-500/10 text-red-400",
        },
    };
    const tone = statusTone[status] ?? statusTone.ready;

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-yellow-500/15 text-sm font-semibold text-yellow-400">
                            {initialsOf(employee.name)}
                        </div>
                        <div className="min-w-0">
                            <p className="truncate">{employee.name}</p>
                            <p className="text-muted-foreground text-xs font-normal">
                                {employee.enrolled
                                    ? "Re-enrolling face profile"
                                    : "New face enrollment"}
                            </p>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                    <div className="bg-muted/50 flex items-center justify-between rounded-md border px-3 py-2">
                        <div className="flex items-center gap-2">
                            {flashEnabled ? (
                                <Zap className="h-4 w-4 text-yellow-400" />
                            ) : (
                                <ZapOff className="text-muted-foreground h-4 w-4" />
                            )}
                            <Label
                                htmlFor="face-flash-toggle"
                                className="text-sm"
                            >
                                Front flash
                            </Label>
                        </div>
                        <Switch
                            id="face-flash-toggle"
                            checked={flashEnabled}
                            onCheckedChange={setFlashEnabled}
                            disabled={captured}
                        />
                    </div>

                    <div
                        className={`rounded-lg p-2 transition-colors duration-300 ${
                            flashActive
                                ? "bg-white shadow-[0_0_28px_6px_rgba(255,255,255,0.55)]"
                                : "bg-muted"
                        }`}
                    >
                        <div className="relative aspect-video overflow-hidden rounded-md bg-black">
                            <video
                                ref={videoRef}
                                className="h-full w-full object-cover transition-[filter] duration-300"
                                style={{
                                    transform: captured ? "none" : "scaleX(-1)",
                                    display: captured ? "none" : "block",
                                    filter: flashActive
                                        ? "brightness(1.2)"
                                        : "none",
                                }}
                                muted
                                playsInline
                            />
                            <canvas
                                ref={canvasRef}
                                className="pointer-events-none absolute inset-0 h-full w-full"
                                style={{
                                    transform: "scaleX(-1)",
                                    display: captured ? "none" : "block",
                                }}
                            />
                            {captured && snapshotUrl && (
                                <>
                                    <img
                                        src={snapshotUrl}
                                        alt="Captured face"
                                        className="h-full w-full object-cover"
                                    />
                                    <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-green-500/90 px-2 py-1 text-xs font-medium text-white shadow">
                                        <Check className="h-3.5 w-3.5" />
                                        Captured
                                    </div>
                                </>
                            )}

                            {/* Front-cam "flash" — screens have no physical flash, so a
                                bright, low-opacity wash simulates fill light on the face
                                for as long as the camera is actively scanning. */}
                            <div
                                className="pointer-events-none absolute inset-0 bg-white transition-opacity duration-300"
                                style={{ opacity: flashActive ? 0.12 : 0 }}
                            />
                        </div>
                    </div>

                    <div
                        className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${tone.classes}`}
                    >
                        {tone.icon}
                        <span>{statusMessage}</span>
                    </div>

                    {!captured && status === "ready" && qualityWarning && (
                        <div className="flex items-center gap-2 rounded-md bg-yellow-500/10 px-3 py-2 text-sm text-yellow-400">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <span>{qualityWarning}</span>
                        </div>
                    )}

                    <div className="flex flex-col items-center gap-2">
                        {!captured ? (
                            <Button
                                onClick={capture}
                                disabled={status !== "ready"}
                                className="bg-yellow-500 text-white hover:bg-yellow-600"
                            >
                                <Camera className="mr-1 h-4 w-4" />
                                Capture Face
                            </Button>
                        ) : (
                            <div className="flex flex-col items-center gap-1">
                                <Button
                                    variant="outline"
                                    onClick={retake}
                                    className="border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10 hover:text-yellow-400"
                                >
                                    <RotateCcw className="mr-1 h-4 w-4" />
                                    Retake
                                </Button>
                                <span className="text-muted-foreground text-xs">
                                    Not a clear shot? You can retake it before
                                    saving.
                                </span>
                            </div>
                        )}
                    </div>

                    {captured && (
                        <div className="flex items-start gap-2 rounded-md border px-3 py-2">
                            <Checkbox
                                id="face-consent"
                                checked={consentGiven}
                                onCheckedChange={(checked) =>
                                    setConsentGiven(checked === true)
                                }
                                className="mt-0.5"
                            />
                            <Label
                                htmlFor="face-consent"
                                className="text-muted-foreground text-sm font-normal"
                            >
                                I confirm the employee has been informed and
                                consents to this biometric face enrollment, used
                                for attendance purposes only.
                            </Label>
                        </div>
                    )}

                    {duplicateWarning && (
                        <div className="space-y-2 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                <span>
                                    This face closely matches{" "}
                                    <strong>{duplicateWarning.name}</strong>
                                    's enrollment (distance{" "}
                                    {duplicateWarning.distance}). Enroll anyway
                                    only if you're sure this is a different
                                    person.
                                </span>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setDuplicateWarning(null)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    className="bg-red-500 text-white hover:bg-red-600"
                                    disabled={saveMutation.isPending}
                                    onClick={() => {
                                        setDuplicateWarning(null);
                                        saveMutation.mutate(true);
                                    }}
                                >
                                    Enroll Anyway
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        disabled={
                            !captured || !consentGiven || saveMutation.isPending
                        }
                        onClick={() => saveMutation.mutate(false)}
                        className="bg-yellow-500 text-white hover:bg-yellow-600"
                    >
                        {saveMutation.isPending ? "Saving…" : "Save"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function ViewFaceDialog({
    employee,
    onClose,
}: {
    employee: EmployeeEnrollmentRow;
    onClose: () => void;
}) {
    const { data, isLoading, isError } = useQuery<string | null>({
        queryKey: ["face-enrollment-image", employee.enrollment_id],
        queryFn: async () => {
            const res = await api.get(
                `/api/v2/face-enrollments/${employee.enrollment_id}/image`,
            );
            return res.data?.data?.url ?? null;
        },
        enabled: !!employee.enrollment_id,
        staleTime: 20 * 1000,
    });

    const enrolledLabel = formatEnrolledAt(employee.enrolled_at);

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-400" />
                        {employee.name} — Enrolled Face
                    </DialogTitle>
                </DialogHeader>

                <div className="bg-muted flex aspect-video items-center justify-center overflow-hidden rounded-md border ring-1 ring-green-500/20">
                    {isLoading && (
                        <div className="text-muted-foreground flex items-center gap-2 text-sm">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading…
                        </div>
                    )}
                    {!isLoading && (isError || !data) && (
                        <div className="text-muted-foreground flex flex-col items-center gap-2 text-sm">
                            <Sparkles className="h-6 w-6 opacity-50" />
                            No image available for this enrollment.
                        </div>
                    )}
                    {!isLoading && data && (
                        <img
                            src={data}
                            alt={`${employee.name}'s enrolled face`}
                            className="h-full w-full object-cover"
                        />
                    )}
                </div>

                {enrolledLabel && (
                    <p className="text-muted-foreground -mt-1 text-xs">
                        Enrolled on {enrolledLabel}
                    </p>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

interface EnrollmentVersionRow {
    id: number;
    action: "created" | "updated" | "deleted" | "purged_offboarding";
    created_at: string;
    actor_name: string | null;
}

const VERSION_ACTION_LABEL: Record<EnrollmentVersionRow["action"], string> = {
    created: "Enrolled",
    updated: "Re-enrolled (previous capture replaced)",
    deleted: "Removed",
    purged_offboarding: "Flagged — employee offboarded",
};

function HistoryDialog({
    employee,
    onClose,
}: {
    employee: EmployeeEnrollmentRow;
    onClose: () => void;
}) {
    const { data, isLoading } = useQuery<EnrollmentVersionRow[]>({
        queryKey: ["face-enrollment-versions", employee.enrollment_id],
        queryFn: async () => {
            const res = await api.get(
                `/api/v2/face-enrollments/${employee.enrollment_id}/versions`,
            );
            return res.data?.data ?? [];
        },
        enabled: !!employee.enrollment_id,
    });

    const versions = data ?? [];

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <History className="h-4 w-4" />
                        {employee.name} — Enrollment History
                    </DialogTitle>
                </DialogHeader>

                <div className="max-h-80 space-y-3 overflow-y-auto">
                    {isLoading && (
                        <div className="text-muted-foreground flex items-center gap-2 py-6 text-sm">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading…
                        </div>
                    )}
                    {!isLoading && versions.length === 0 && (
                        <p className="text-muted-foreground py-6 text-center text-sm">
                            No prior versions — this is the original enrollment.
                        </p>
                    )}
                    {versions.map((v) => (
                        <div
                            key={v.id}
                            className="border-l-2 border-yellow-500/40 py-1 pl-3"
                        >
                            <p className="text-sm font-medium">
                                {VERSION_ACTION_LABEL[v.action] ?? v.action}
                            </p>
                            <p className="text-muted-foreground text-xs">
                                {formatEnrolledAt(v.created_at) ?? v.created_at}
                                {v.actor_name ? ` · by ${v.actor_name}` : ""}
                            </p>
                        </div>
                    ))}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
