import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    CheckCircle,
    XCircle,
    Search,
    Loader2,
    Eye,
    Timer,
    AlarmClock,
    ImageIcon,
    History,
    ChevronLeft,
    ChevronRight,
    Pencil,
} from "lucide-react";
import api from "@/lib/axios";
import { ApiResponse } from "@/index";
import { safeFormat } from "@/helpers/formatDates";
import { ParentComponent } from "@/components/parent-container";
import FullPageLoader from "@/components/page-loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

// ── Types ──────────────────────────────────────────────────────────────────────

interface OvertimeRecord {
    id: number;
    employee_id: number;
    employee_name: string;
    branch_id: number;
    branch_name: string;
    date: string;
    start_time: string;
    end_time: string;
    no_of_hours: string;
    remarks: string | null;
    reason_disapproval: string | null;
    image: string | null;
    status: number;
    within_cutoff: number; // 1 = within active payroll period, 0 = locked
    approved_by: number | null;
    approved_at: string | null;
    created_at: string;
}

interface LogoverrideRecord {
    id: number;
    employee_id: number;
    employee_name: string;
    branch_id: number;
    branch_name: string;
    date_time: string;
    clock_type: string;
    location: string | null;
    remarks: string | null;
    approval_reason: string | null;
    image: string | null;
    is_range: number;
    status: number;
    within_cutoff: number;
    approved_by: number | null;
    approved_at: string | null;
    created_at: string;
}

interface HistoryRecord {
    id: number;
    employee_id: number;
    employee_name: string;
    branch_name: string;
    status: number;
    approved_at: string | null;
    created_at: string;
    disapproval_reason: string | null;
    _type: "overtime" | "logoverride";
}

interface PageMeta {
    total: number;
    page: number;
    per_page: number;
    last_page: number;
    pending?: number;
    approved?: number;
    disapproved?: number;
}

interface Paginated<T> {
    items: T[];
    meta: PageMeta;
}

const EMPTY_PAGINATED = <T,>(): Paginated<T> => ({
    items: [],
    meta: { total: 0, page: 1, per_page: 25, last_page: 1, pending: 0, approved: 0, disapproved: 0 },
});

const initials = (name?: string) =>
    name
        ? name
              .trim()
              .split(/\s+/)
              .map((w) => w[0])
              .join("")
              .toUpperCase()
        : "";

function StatusBadge({ status }: { status: number }) {
    if (status === 1)
        return (
            <Badge className="border-0 bg-green-500/10 px-2 py-0.5 text-xs text-green-400">
                Approved
            </Badge>
        );
    if (status === 2)
        return (
            <Badge className="border-0 bg-red-500/10 px-2 py-0.5 text-xs text-red-400">
                Disapproved
            </Badge>
        );
    return (
        <Badge className="border-0 bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-400">
            Pending
        </Badge>
    );
}

// Shows a small chip when an acted-on record can still be changed (within cutoff)
function EditableBadge() {
    return (
        <span className="ml-1 inline-flex items-center gap-0.5 rounded border border-blue-500/30 bg-blue-500/10 px-1.5 py-0 text-[10px] font-medium text-blue-400">
            <Pencil className="h-2.5 w-2.5" />
            editable
        </span>
    );
}

// ── Pagination control ─────────────────────────────────────────────────────────

function Pagination({
    page,
    lastPage,
    total,
    perPage,
    onPageChange,
}: {
    page: number;
    lastPage: number;
    total: number;
    perPage: number;
    onPageChange: (p: number) => void;
}) {
    if (lastPage <= 1) return null;
    const start = (page - 1) * perPage + 1;
    const end = Math.min(page * perPage, total);
    return (
        <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-muted-foreground text-xs">
                {start}–{end} of {total}
            </p>
            <div className="flex items-center gap-1.5">
                <Button
                    size="sm"
                    variant="outline"
                    className="h-7 w-7 p-0"
                    onClick={() => onPageChange(page - 1)}
                    disabled={page <= 1}
                >
                    <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="text-muted-foreground text-xs">
                    {page} / {lastPage}
                </span>
                <Button
                    size="sm"
                    variant="outline"
                    className="h-7 w-7 p-0"
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= lastPage}
                >
                    <ChevronRight className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    );
}

// ── Detail row ─────────────────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value?: string | null }) {
    return (
        <div className="flex justify-between py-2.5 text-sm">
            <span className="text-muted-foreground w-2/5">{label}</span>
            <span className="w-3/5 text-right font-medium">{value || "—"}</span>
        </div>
    );
}

// ── Stat card ──────────────────────────────────────────────────────────────────

function StatCard({
    icon: Icon,
    iconCls,
    bg,
    count,
    label,
}: {
    icon: React.ElementType;
    iconCls: string;
    bg: string;
    count: number;
    label: string;
}) {
    return (
        <Card>
            <CardContent className="flex items-center gap-4 p-5">
                <div
                    className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg ${bg}`}
                >
                    <Icon className={`h-5 w-5 ${iconCls}`} />
                </div>
                <div>
                    <p className="text-2xl leading-none font-bold">{count}</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                        {label}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

// ── Approve button ─────────────────────────────────────────────────────────────

function ApproveButton({
    type,
    id,
    employeeName,
    queryKey,
    canAct,
    isChange,
}: {
    type: "overtime" | "logoverride";
    id: number;
    employeeName: string;
    queryKey: readonly unknown[];
    canAct: boolean;
    isChange?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: () => api.post(`/api/v2/approvals/${type}/${id}/approve`),
        onSuccess: () => {
            toast.success(
                isChange
                    ? `${employeeName}'s decision changed to Approved.`
                    : `${employeeName}'s request approved.`,
            );
            queryClient.invalidateQueries({ queryKey });
        },
        onError: () => toast.error("Failed to approve. Please try again."),
    });

    const label = isChange ? "Change to Approved" : "Approve";

    return (
        <>
            <Button
                size="sm"
                className="bg-green-600 text-white hover:bg-green-700"
                onClick={() => setOpen(true)}
                disabled={!canAct || mutation.isPending}
            >
                {mutation.isPending ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                    <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                )}
                {label}
            </Button>

            <AlertDialog open={open} onOpenChange={setOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {isChange
                                ? "Change decision to Approved?"
                                : "Approve this request?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {isChange ? (
                                <>
                                    You are changing the decision for{" "}
                                    <strong>{employeeName}</strong>'s{" "}
                                    <strong>
                                        {type === "overtime"
                                            ? "overtime"
                                            : "log override"}
                                    </strong>{" "}
                                    request from{" "}
                                    <strong>Disapproved</strong> to{" "}
                                    <strong>Approved</strong>. This is allowed
                                    because the record is within the active
                                    payroll cutoff.
                                </>
                            ) : (
                                <>
                                    You are approving the{" "}
                                    <strong>
                                        {type === "overtime"
                                            ? "overtime"
                                            : "log override"}
                                    </strong>{" "}
                                    request of <strong>{employeeName}</strong>.
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-green-600 text-white hover:bg-green-700"
                            onClick={() => {
                                setOpen(false);
                                mutation.mutate();
                            }}
                        >
                            {isChange ? "Yes, change to Approved" : "Confirm Approve"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

// ── Disapprove button ──────────────────────────────────────────────────────────

function DisapproveButton({
    type,
    id,
    employeeName,
    queryKey,
    canAct,
    isChange,
}: {
    type: "overtime" | "logoverride";
    id: number;
    employeeName: string;
    queryKey: readonly unknown[];
    canAct: boolean;
    isChange?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState("");
    const queryClient = useQueryClient();

    const handleClose = (wasOpen: boolean) => {
        if (!wasOpen) setReason("");
        setOpen(wasOpen);
    };

    const mutation = useMutation({
        mutationFn: () =>
            api.post(
                `/api/v2/approvals/${type}/${id}/disapprove`,
                { reason },
                { headers: { "Content-Type": "application/json" } },
            ),
        onSuccess: () => {
            toast.success(
                isChange
                    ? `${employeeName}'s decision changed to Disapproved.`
                    : `${employeeName}'s request disapproved.`,
            );
            queryClient.invalidateQueries({ queryKey });
        },
        onError: () => toast.error("Failed to disapprove. Please try again."),
    });

    return (
        <>
            <Button
                size="sm"
                variant="outline"
                className="border-red-500/40 text-red-400 hover:border-red-500 hover:bg-red-500/10"
                onClick={() => setOpen(true)}
                disabled={!canAct || mutation.isPending}
            >
                {mutation.isPending ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                    <XCircle className="mr-1.5 h-3.5 w-3.5" />
                )}
                {isChange ? "Change to Disapproved" : "Disapprove"}
            </Button>

            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {isChange
                                ? "Change decision to Disapproved?"
                                : "Disapprove request?"}
                        </DialogTitle>
                        <DialogDescription>
                            {isChange ? (
                                <>
                                    You are changing the decision for{" "}
                                    <strong>{employeeName}</strong>'s{" "}
                                    <strong>
                                        {type === "overtime"
                                            ? "overtime"
                                            : "log override"}
                                    </strong>{" "}
                                    request from <strong>Approved</strong> to{" "}
                                    <strong>Disapproved</strong>. This is
                                    allowed because the record is within the
                                    active payroll cutoff.
                                </>
                            ) : (
                                <>
                                    Disapproving the{" "}
                                    <strong>
                                        {type === "overtime"
                                            ? "overtime"
                                            : "log override"}
                                    </strong>{" "}
                                    request of <strong>{employeeName}</strong>.
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="disapprove-reason">
                                Reason{" "}
                                <span className="text-muted-foreground">
                                    (optional)
                                </span>
                            </Label>
                            <Textarea
                                id="disapprove-reason"
                                placeholder="Enter reason for disapproval..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="min-h-[90px]"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => handleClose(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                disabled={mutation.isPending}
                                onClick={() => {
                                    setOpen(false);
                                    mutation.mutate();
                                }}
                            >
                                {mutation.isPending && (
                                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                )}
                                {isChange
                                    ? "Yes, change to Disapproved"
                                    : "Confirm Disapprove"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

// ── Overtime detail dialog ─────────────────────────────────────────────────────

function OvertimeDetailsDialog({ row }: { row: OvertimeRecord }) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
                <Eye className="mr-1.5 h-3.5 w-3.5" />
                View
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Timer className="h-4 w-4 text-orange-400" />
                            Overtime Request
                        </DialogTitle>
                        <DialogDescription asChild>
                            <span>
                                <StatusBadge status={row.status} />
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="divide-border border-border bg-muted/20 divide-y rounded-md border px-4">
                        <DetailRow label="Employee" value={row.employee_name} />
                        <DetailRow label="Branch" value={row.branch_name} />
                        <DetailRow label="Date" value={safeFormat(row.date)} />
                        <DetailRow label="Start Time" value={row.start_time} />
                        <DetailRow label="End Time" value={row.end_time} />
                        <DetailRow
                            label="No. of Hours"
                            value={`${row.no_of_hours} hrs`}
                        />
                        <DetailRow label="Remarks" value={row.remarks} />
                        {row.status === 2 && (
                            <DetailRow
                                label="Disapproval Reason"
                                value={row.reason_disapproval}
                            />
                        )}
                        {row.approved_at && (
                            <DetailRow
                                label={
                                    row.status === 1
                                        ? "Approved At"
                                        : "Acted At"
                                }
                                value={safeFormat(row.approved_at)}
                            />
                        )}
                        <DetailRow
                            label="Filed On"
                            value={safeFormat(row.created_at)}
                        />
                    </div>
                    {row.image && (
                        <p className="text-muted-foreground mt-2 flex items-center gap-1.5 text-sm">
                            <ImageIcon className="h-4 w-4" />
                            Has attachment on file.
                        </p>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

// ── Log override detail dialog ─────────────────────────────────────────────────

function LogoverrideDetailsDialog({ row }: { row: LogoverrideRecord }) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
                <Eye className="mr-1.5 h-3.5 w-3.5" />
                View
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlarmClock className="h-4 w-4 text-blue-400" />
                            Log Override Request
                        </DialogTitle>
                        <DialogDescription asChild>
                            <span>
                                <StatusBadge status={row.status} />
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="divide-border border-border bg-muted/20 divide-y rounded-md border px-4">
                        <DetailRow label="Employee" value={row.employee_name} />
                        <DetailRow label="Branch" value={row.branch_name} />
                        <DetailRow
                            label="Date / Time"
                            value={safeFormat(row.date_time)}
                        />
                        <DetailRow label="Clock Type" value={row.clock_type} />
                        <DetailRow label="Location" value={row.location} />
                        <DetailRow label="Remarks" value={row.remarks} />
                        {row.status === 2 && (
                            <DetailRow
                                label="Disapproval Reason"
                                value={row.approval_reason}
                            />
                        )}
                        {row.approved_at && (
                            <DetailRow
                                label={
                                    row.status === 1
                                        ? "Approved At"
                                        : "Acted At"
                                }
                                value={safeFormat(row.approved_at)}
                            />
                        )}
                        <DetailRow
                            label="Filed On"
                            value={safeFormat(row.created_at)}
                        />
                    </div>
                    {row.image && (
                        <p className="text-muted-foreground mt-2 flex items-center gap-1.5 text-sm">
                            <ImageIcon className="h-4 w-4" />
                            Has attachment on file.
                        </p>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

// ── Status filter tabs ─────────────────────────────────────────────────────────

// "pending" → status=0, "approved" → status=1, "disapproved" → status=2, "all" → no filter
const STATUS_FILTERS = [
    { value: "pending",     label: "Pending",     apiStatus: "0" },
    { value: "approved",    label: "Approved",    apiStatus: "1" },
    { value: "disapproved", label: "Disapproved", apiStatus: "2" },
    { value: "all",         label: "All",         apiStatus: ""  },
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number]["value"];

// ── Main page ──────────────────────────────────────────────────────────────────

export default function HrApprovals() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [otSearch, setOtSearch] = useState("");
    const [loSearch, setLoSearch] = useState("");
    const [otFilter, setOtFilter] = useState<StatusFilter>("pending");
    const [loFilter, setLoFilter] = useState<StatusFilter>("pending");
    const [otPage, setOtPage] = useState(1);
    const [loPage, setLoPage] = useState(1);
    const [historyPage, setHistoryPage] = useState(1);

    const handleOtFilter = (v: StatusFilter) => { setOtFilter(v); setOtPage(1); };
    const handleLoFilter = (v: StatusFilter) => { setLoFilter(v); setLoPage(1); };

    const otApiStatus  = STATUS_FILTERS.find((f) => f.value === otFilter)?.apiStatus ?? "";
    const loApiStatus  = STATUS_FILTERS.find((f) => f.value === loFilter)?.apiStatus ?? "";

    const otQueryKey      = ["approvals-overtime",    id, otPage, otApiStatus]   as const;
    const loQueryKey      = ["approvals-logoverrides", id, loPage, loApiStatus]  as const;
    const historyQueryKey = ["approvals-history",      id, historyPage]          as const;

    const { data: approverInfo, isLoading: approverLoading } = useQuery<{
        is_approver: boolean;
        cutoff_start: string;
        cutoff_end: string;
    }>({
        queryKey: ["approvals-is-approver"],
        queryFn: async () => {
            const res = await api.get<
                ApiResponse<{ is_approver: boolean; cutoff_start: string; cutoff_end: string }>
            >("/api/v2/approvals/is-approver");
            return res.data.data ?? { is_approver: false, cutoff_start: "", cutoff_end: "" };
        },
        staleTime: 5 * 60 * 1000,
    });
    const isApprover = approverInfo?.is_approver ?? false;

    const { data: otData, isLoading: otLoading } = useQuery<Paginated<OvertimeRecord>>({
        queryKey: otQueryKey,
        queryFn: async () => {
            const params = new URLSearchParams({ page: String(otPage), per_page: "25" });
            if (otApiStatus !== "") params.set("status", otApiStatus);
            const res = await api.get<ApiResponse<Paginated<OvertimeRecord>>>(
                `/api/v2/approvals/overtime?${params}`,
            );
            const raw = res.data.data ?? EMPTY_PAGINATED<OvertimeRecord>();
            return {
                ...raw,
                items: raw.items.map((r) => ({ ...r, status: Number(r.status) })),
            };
        },
        staleTime: 0,
    });

    const { data: loData, isLoading: loLoading } = useQuery<Paginated<LogoverrideRecord>>({
        queryKey: loQueryKey,
        queryFn: async () => {
            const params = new URLSearchParams({ page: String(loPage), per_page: "25" });
            if (loApiStatus !== "") params.set("status", loApiStatus);
            const res = await api.get<ApiResponse<Paginated<LogoverrideRecord>>>(
                `/api/v2/approvals/logoverrides?${params}`,
            );
            const raw = res.data.data ?? EMPTY_PAGINATED<LogoverrideRecord>();
            return {
                ...raw,
                items: raw.items.map((r) => ({ ...r, status: Number(r.status) })),
            };
        },
        staleTime: 0,
    });

    const { data: historyData, isLoading: historyLoading } = useQuery<Paginated<HistoryRecord>>({
        queryKey: historyQueryKey,
        queryFn: async () => {
            const params = new URLSearchParams({ page: String(historyPage), per_page: "25" });
            const res = await api.get<ApiResponse<Paginated<HistoryRecord>>>(
                `/api/v2/approvals/history?${params}`,
            );
            const raw = res.data.data ?? { items: [], meta: { total: 0, page: 1, per_page: 25, last_page: 1 } };
            return {
                ...raw,
                items: raw.items.map((r) => ({ ...r, status: Number(r.status) })),
            };
        },
        staleTime: 0,
    });

    // Client-side search within the current page
    const filteredOt = useMemo(() => {
        const q = otSearch.trim().toLowerCase();
        if (!q) return otData?.items ?? [];
        return (otData?.items ?? []).filter((r) =>
            (r.employee_name ?? "").toLowerCase().includes(q),
        );
    }, [otData, otSearch]);

    const filteredLo = useMemo(() => {
        const q = loSearch.trim().toLowerCase();
        if (!q) return loData?.items ?? [];
        return (loData?.items ?? []).filter((r) =>
            (r.employee_name ?? "").toLowerCase().includes(q),
        );
    }, [loData, loSearch]);

    // Counts from meta (total across all pages / statuses)
    const otPending  = otData?.meta.pending  ?? 0;
    const otApproved = otData?.meta.approved ?? 0;
    const loPending  = loData?.meta.pending  ?? 0;
    const loApproved = loData?.meta.approved ?? 0;
    const totalPending = otPending + loPending;

    const historyTotal = historyData?.meta.total ?? 0;

    // Redirect non-approvers away as soon as the check resolves
    useEffect(() => {
        if (!approverLoading && !isApprover) {
            navigate(-1);
        }
    }, [approverLoading, isApprover, navigate]);

    if (otLoading || loLoading || approverLoading) return <FullPageLoader />;
    if (!isApprover) return null;

    return (
        <ParentComponent>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-xl font-bold sm:text-2xl">
                        HR Approvals
                    </h1>
                    <p className="text-muted-foreground mt-0.5 text-sm">
                        Overtime and log override requests from your agency
                        employees.
                    </p>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <StatCard
                        icon={Timer}
                        iconCls="text-orange-400"
                        bg="bg-orange-500/10"
                        count={otPending}
                        label="OT Pending"
                    />
                    <StatCard
                        icon={CheckCircle}
                        iconCls="text-green-400"
                        bg="bg-green-500/10"
                        count={otApproved}
                        label="OT Approved"
                    />
                    <StatCard
                        icon={AlarmClock}
                        iconCls="text-blue-400"
                        bg="bg-blue-500/10"
                        count={loPending}
                        label="Log Override Pending"
                    />
                    <StatCard
                        icon={CheckCircle}
                        iconCls="text-green-400"
                        bg="bg-green-500/10"
                        count={loApproved}
                        label="Log Override Approved"
                    />
                </div>

                {totalPending > 0 && (
                    <div className="rounded-md border border-yellow-500/30 bg-yellow-500/5 px-4 py-3 text-sm text-yellow-600 dark:text-yellow-400">
                        <strong>{totalPending}</strong> request
                        {totalPending !== 1 ? "s" : ""} pending your approval.
                    </div>
                )}

                {/* Main tabs */}
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base sm:text-lg">
                            Approval Requests
                        </CardTitle>
                        <CardDescription>
                            Review and act on pending overtime and log override
                            requests.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <Tabs defaultValue="overtime">
                            <TabsList className="mb-6 grid w-full grid-cols-3 sm:inline-flex sm:w-auto">
                                <TabsTrigger
                                    value="overtime"
                                    className="flex items-center gap-1.5"
                                >
                                    <Timer className="h-3.5 w-3.5" />
                                    Overtime
                                    {otPending > 0 && (
                                        <Badge className="ml-1 border-0 bg-yellow-500/20 px-1.5 py-0 text-xs text-yellow-500">
                                            {otPending}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger
                                    value="logoverrides"
                                    className="flex items-center gap-1.5"
                                >
                                    <AlarmClock className="h-3.5 w-3.5" />
                                    Log Overrides
                                    {loPending > 0 && (
                                        <Badge className="ml-1 border-0 bg-yellow-500/20 px-1.5 py-0 text-xs text-yellow-500">
                                            {loPending}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger
                                    value="history"
                                    className="flex items-center gap-1.5"
                                >
                                    <History className="h-3.5 w-3.5" />
                                    History
                                    {historyTotal > 0 && (
                                        <Badge className="ml-1 border-0 bg-muted px-1.5 py-0 text-xs text-muted-foreground">
                                            {historyTotal}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                            </TabsList>

                            {/* ── Overtime tab ── */}
                            <TabsContent value="overtime" className="space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="relative flex-1 sm:max-w-xs">
                                        <Search className="text-muted-foreground absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2" />
                                        <Input
                                            placeholder="Search employee..."
                                            value={otSearch}
                                            onChange={(e) =>
                                                setOtSearch(e.target.value)
                                            }
                                            className="h-8 pl-8 text-sm"
                                        />
                                    </div>
                                    <div className="flex gap-1.5">
                                        {STATUS_FILTERS.map((f) => (
                                            <button
                                                key={f.value}
                                                onClick={() =>
                                                    handleOtFilter(f.value)
                                                }
                                                className={[
                                                    "rounded-md border px-3 py-1.5 text-xs font-medium transition-all",
                                                    otFilter === f.value
                                                        ? "bg-primary text-primary-foreground border-primary"
                                                        : "border-border text-muted-foreground hover:border-muted-foreground/40",
                                                ].join(" ")}
                                            >
                                                {f.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <OvertimeTable
                                    rows={filteredOt}
                                    queryKey={otQueryKey}
                                    isApprover={isApprover}
                                    page={otPage}
                                    lastPage={otData?.meta.last_page ?? 1}
                                    total={otData?.meta.total ?? 0}
                                    perPage={25}
                                    onPageChange={setOtPage}
                                />
                            </TabsContent>

                            {/* ── Log overrides tab ── */}
                            <TabsContent value="logoverrides" className="space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="relative flex-1 sm:max-w-xs">
                                        <Search className="text-muted-foreground absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2" />
                                        <Input
                                            placeholder="Search employee..."
                                            value={loSearch}
                                            onChange={(e) =>
                                                setLoSearch(e.target.value)
                                            }
                                            className="h-8 pl-8 text-sm"
                                        />
                                    </div>
                                    <div className="flex gap-1.5">
                                        {STATUS_FILTERS.map((f) => (
                                            <button
                                                key={f.value}
                                                onClick={() =>
                                                    handleLoFilter(f.value)
                                                }
                                                className={[
                                                    "rounded-md border px-3 py-1.5 text-xs font-medium transition-all",
                                                    loFilter === f.value
                                                        ? "bg-primary text-primary-foreground border-primary"
                                                        : "border-border text-muted-foreground hover:border-muted-foreground/40",
                                                ].join(" ")}
                                            >
                                                {f.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <LogoverrideTable
                                    rows={filteredLo}
                                    queryKey={loQueryKey}
                                    isApprover={isApprover}
                                    page={loPage}
                                    lastPage={loData?.meta.last_page ?? 1}
                                    total={loData?.meta.total ?? 0}
                                    perPage={25}
                                    onPageChange={setLoPage}
                                />
                            </TabsContent>

                            {/* ── History tab ── */}
                            <TabsContent value="history" className="space-y-3">
                                {historyLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
                                    </div>
                                ) : (historyData?.items ?? []).length === 0 ? (
                                    <div className="text-muted-foreground py-12 text-center text-sm">
                                        No approval history yet.
                                    </div>
                                ) : (
                                    <>
                                        <div className="divide-border divide-y rounded-md border">
                                            {(historyData?.items ?? []).map((r) => (
                                                <div
                                                    key={`${r._type}-${r.id}`}
                                                    className="flex items-start gap-3 px-4 py-3"
                                                >
                                                    <div className="mt-0.5 flex-shrink-0">
                                                        {r.status === 1 ? (
                                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                                        ) : (
                                                            <XCircle className="h-4 w-4 text-red-500" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="text-sm font-medium">
                                                                {r.employee_name ?? "—"}
                                                            </span>
                                                            <Badge
                                                                variant="outline"
                                                                className="px-1.5 py-0 text-xs"
                                                            >
                                                                {r._type === "overtime"
                                                                    ? "Overtime"
                                                                    : "Log Override"}
                                                            </Badge>
                                                            <StatusBadge status={r.status} />
                                                        </div>
                                                        <div className="text-muted-foreground mt-0.5 flex flex-wrap gap-x-3 text-xs">
                                                            <span>{r.branch_name ?? "—"}</span>
                                                            <span>
                                                                Filed:{" "}
                                                                {safeFormat(r.created_at)}
                                                            </span>
                                                            {r.approved_at && (
                                                                <span>
                                                                    Acted:{" "}
                                                                    {safeFormat(r.approved_at)}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {r.status === 2 && r.disapproval_reason && (
                                                            <p className="mt-1 text-xs text-red-400">
                                                                Reason: {r.disapproval_reason}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <Pagination
                                            page={historyPage}
                                            lastPage={historyData?.meta.last_page ?? 1}
                                            total={historyData?.meta.total ?? 0}
                                            perPage={25}
                                            onPageChange={setHistoryPage}
                                        />
                                    </>
                                )}
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </ParentComponent>
    );
}

// ── Table components ───────────────────────────────────────────────────────────

function OvertimeTable({
    rows,
    queryKey,
    isApprover,
    page,
    lastPage,
    total,
    perPage,
    onPageChange,
}: {
    rows: OvertimeRecord[];
    queryKey: readonly unknown[];
    isApprover: boolean;
    page: number;
    lastPage: number;
    total: number;
    perPage: number;
    onPageChange: (p: number) => void;
}) {
    return (
        <div className="border-border overflow-x-auto rounded-md border">
            <Table className="min-w-[820px]">
                <TableHeader className="bg-muted/40">
                    <TableRow>
                        <TableHead className="px-4 py-3 text-xs font-semibold tracking-wide uppercase">
                            Employee
                        </TableHead>
                        <TableHead className="px-4 py-3 text-xs font-semibold tracking-wide uppercase">
                            Date
                        </TableHead>
                        <TableHead className="px-4 py-3 text-xs font-semibold tracking-wide uppercase">
                            Time
                        </TableHead>
                        <TableHead className="px-4 py-3 text-xs font-semibold tracking-wide uppercase">
                            Hours
                        </TableHead>
                        <TableHead className="px-4 py-3 text-xs font-semibold tracking-wide uppercase">
                            Branch
                        </TableHead>
                        <TableHead className="px-4 py-3 text-xs font-semibold tracking-wide uppercase">
                            Status
                        </TableHead>
                        <TableHead className="px-4 py-3 text-right text-xs font-semibold tracking-wide uppercase">
                            Actions
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.length > 0 ? (
                        rows.map((row) => {
                            const isActed = row.status !== 0;
                            const withinCutoff = row.within_cutoff === 1;
                            // Can approve: pending, OR already disapproved and within cutoff
                            const canApprove = isApprover && (row.status === 0 || (withinCutoff && row.status === 2));
                            // Can disapprove: pending, OR already approved and within cutoff
                            const canDisapprove = isApprover && (row.status === 0 || (withinCutoff && row.status === 1));
                            return (
                                <TableRow
                                    key={row.id}
                                    className="hover:bg-muted/10 transition"
                                >
                                    <TableCell className="px-4 py-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="bg-primary/20 text-primary flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold">
                                                {initials(row.employee_name)}
                                            </div>
                                            <p className="text-sm leading-tight font-medium">
                                                {row.employee_name}
                                            </p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-sm">
                                        {safeFormat(row.date)}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground px-4 py-3 text-sm">
                                        {row.start_time} – {row.end_time}
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-sm font-medium">
                                        {row.no_of_hours} hrs
                                    </TableCell>
                                    <TableCell className="text-muted-foreground px-4 py-3 text-sm">
                                        {row.branch_name || "—"}
                                    </TableCell>
                                    <TableCell className="px-4 py-3">
                                        <div className="flex flex-wrap items-center gap-1">
                                            <StatusBadge status={row.status} />
                                            {isActed && withinCutoff && (
                                                <EditableBadge />
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-2">
                                            <OvertimeDetailsDialog row={row} />
                                            <ApproveButton
                                                type="overtime"
                                                id={row.id}
                                                employeeName={row.employee_name}
                                                queryKey={queryKey}
                                                canAct={canApprove}
                                                isChange={isActed && withinCutoff}
                                            />
                                            <DisapproveButton
                                                type="overtime"
                                                id={row.id}
                                                employeeName={row.employee_name}
                                                queryKey={queryKey}
                                                canAct={canDisapprove}
                                                isChange={isActed && withinCutoff}
                                            />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    ) : (
                        <TableRow>
                            <TableCell
                                colSpan={7}
                                className="text-muted-foreground py-10 text-center"
                            >
                                No overtime requests found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            <Pagination
                page={page}
                lastPage={lastPage}
                total={total}
                perPage={perPage}
                onPageChange={onPageChange}
            />
        </div>
    );
}

function LogoverrideTable({
    rows,
    queryKey,
    isApprover,
    page,
    lastPage,
    total,
    perPage,
    onPageChange,
}: {
    rows: LogoverrideRecord[];
    queryKey: readonly unknown[];
    isApprover: boolean;
    page: number;
    lastPage: number;
    total: number;
    perPage: number;
    onPageChange: (p: number) => void;
}) {
    return (
        <div className="border-border overflow-x-auto rounded-md border">
            <Table className="min-w-[760px]">
                <TableHeader className="bg-muted/40">
                    <TableRow>
                        <TableHead className="px-4 py-3 text-xs font-semibold tracking-wide uppercase">
                            Employee
                        </TableHead>
                        <TableHead className="px-4 py-3 text-xs font-semibold tracking-wide uppercase">
                            Date / Time
                        </TableHead>
                        <TableHead className="px-4 py-3 text-xs font-semibold tracking-wide uppercase">
                            Clock Type
                        </TableHead>
                        <TableHead className="px-4 py-3 text-xs font-semibold tracking-wide uppercase">
                            Branch
                        </TableHead>
                        <TableHead className="px-4 py-3 text-xs font-semibold tracking-wide uppercase">
                            Status
                        </TableHead>
                        <TableHead className="px-4 py-3 text-right text-xs font-semibold tracking-wide uppercase">
                            Actions
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.length > 0 ? (
                        rows.map((row) => {
                            const isActed = row.status !== 0;
                            const withinCutoff = row.within_cutoff === 1;
                            const canApprove = isApprover && (row.status === 0 || (withinCutoff && row.status === 2));
                            const canDisapprove = isApprover && (row.status === 0 || (withinCutoff && row.status === 1));
                            return (
                                <TableRow
                                    key={row.id}
                                    className="hover:bg-muted/10 transition"
                                >
                                    <TableCell className="px-4 py-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="bg-primary/20 text-primary flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold">
                                                {initials(row.employee_name)}
                                            </div>
                                            <p className="text-sm leading-tight font-medium">
                                                {row.employee_name}
                                            </p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-sm">
                                        {safeFormat(row.date_time)}
                                    </TableCell>
                                    <TableCell className="px-4 py-3">
                                        <Badge className="border-0 bg-blue-500/10 px-2 py-0.5 text-xs text-blue-400">
                                            {row.clock_type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground px-4 py-3 text-sm">
                                        {row.branch_name || "—"}
                                    </TableCell>
                                    <TableCell className="px-4 py-3">
                                        <div className="flex flex-wrap items-center gap-1">
                                            <StatusBadge status={row.status} />
                                            {isActed && withinCutoff && (
                                                <EditableBadge />
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-2">
                                            <LogoverrideDetailsDialog
                                                row={row}
                                            />
                                            <ApproveButton
                                                type="logoverride"
                                                id={row.id}
                                                employeeName={row.employee_name}
                                                queryKey={queryKey}
                                                canAct={canApprove}
                                                isChange={isActed && withinCutoff}
                                            />
                                            <DisapproveButton
                                                type="logoverride"
                                                id={row.id}
                                                employeeName={row.employee_name}
                                                queryKey={queryKey}
                                                canAct={canDisapprove}
                                                isChange={isActed && withinCutoff}
                                            />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    ) : (
                        <TableRow>
                            <TableCell
                                colSpan={6}
                                className="text-muted-foreground py-10 text-center"
                            >
                                No log override requests found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            <Pagination
                page={page}
                lastPage={lastPage}
                total={total}
                perPage={perPage}
                onPageChange={onPageChange}
            />
        </div>
    );
}
