import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    CheckCircle,
    Search,
    DollarSign,
    GitBranch,
    UserCog,
    TrendingUp,
    Building2,
    LogOut,
    Plus,
    Loader2,
    XCircle,
    ClipboardCheck,
    Eye,
    Clock,
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

// ── Types ─────────────────────────────────────────────────────────────────────

type LogType =
    | "salary"
    | "position"
    | "branch"
    | "promotion"
    | "dept"
    | "resignation";

interface BaseLog {
    id: number;
    employee_name: string;
    id_number: string;
    validation_status: number;
    status_label: string;
    created_at: string;
}

interface SalaryLog extends BaseLog {
    salary_rate: string;
    previous_salary_rate: string;
    effective_date: string;
}
interface PositionLog extends BaseLog {
    position_name: string;
    previous_position_name: string;
    effective_date: string;
}
interface BranchLog extends BaseLog {
    branch_name: string;
    transfer_date: string;
}
interface PromotionLog extends BaseLog {
    position_name: string;
    previous_position_name: string;
    effective_date: string;
}
interface DeptLog extends BaseLog {
    department_name: string;
    previous_department_name: string;
    effective_date: string;
}
interface ResignationLog extends BaseLog {
    resignation_date: string;
    last_working_day: string;
}

interface SubmissionsResponse {
    salary_logs: SalaryLog[];
    position_logs: PositionLog[];
    branch_logs: BranchLog[];
    promotion_logs: PromotionLog[];
    dept_logs: DeptLog[];
    resignation_logs: ResignationLog[];
}

// ── Meta ──────────────────────────────────────────────────────────────────────

const peso = (v?: string | number | null) =>
    v
        ? `₱${Number(v).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
        : "—";

const TYPE_META: Record<
    LogType,
    { label: string; icon: React.ElementType; cls: string; bg: string }
> = {
    salary: {
        label: "Pay Change",
        icon: DollarSign,
        cls: "text-emerald-400",
        bg: "bg-emerald-500/10",
    },
    position: {
        label: "Position Change",
        icon: UserCog,
        cls: "text-blue-400",
        bg: "bg-blue-500/10",
    },
    branch: {
        label: "Branch Transfer",
        icon: GitBranch,
        cls: "text-cyan-400",
        bg: "bg-cyan-500/10",
    },
    promotion: {
        label: "Promotion",
        icon: TrendingUp,
        cls: "text-yellow-400",
        bg: "bg-yellow-500/10",
    },
    dept: {
        label: "Dept. Transfer",
        icon: Building2,
        cls: "text-purple-400",
        bg: "bg-purple-500/10",
    },
    resignation: {
        label: "Resignation",
        icon: LogOut,
        cls: "text-red-400",
        bg: "bg-red-500/10",
    },
};

// ── Shared props ──────────────────────────────────────────────────────────────

interface ActionProps {
    logType: LogType;
    logId: number;
    agencyId: string;
    employeeName: string;
    canAct: boolean;
}

// ── Validate button ───────────────────────────────────────────────────────────

function ValidateButton({
    logType,
    logId,
    agencyId,
    employeeName,
    canAct,
}: ActionProps) {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: () =>
            api.post(`/api/v2/forms/validate/${logType}/${logId}`),
        onSuccess: () => {
            toast.success(
                `${TYPE_META[logType].label} for ${employeeName} validated.`,
            );
            queryClient.invalidateQueries({
                queryKey: ["formsSubmissions", agencyId],
            });
        },
        onError: () => toast.error("Validation failed. Please try again."),
    });

    return (
        <>
            <Button
                size="sm"
                className="bg-yellow-500 text-white hover:bg-yellow-600"
                onClick={() => setOpen(true)}
                disabled={!canAct || mutation.isPending}
            >
                {mutation.isPending ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                    <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                )}
                Validate
            </Button>

            <AlertDialog open={open} onOpenChange={setOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Validate this filing?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            You are giving final agency validation for the{" "}
                            <strong>{TYPE_META[logType].label}</strong> filing
                            of <strong>{employeeName}</strong>. This will mark
                            it as fully approved.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-yellow-500 text-white hover:bg-yellow-600"
                            onClick={() => {
                                setOpen(false);
                                mutation.mutate();
                            }}
                        >
                            Confirm Validate
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

// ── Disapprove button ─────────────────────────────────────────────────────────

function DisapproveButton({
    logType,
    logId,
    agencyId,
    employeeName,
    canAct,
}: ActionProps) {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: () =>
            api.post(`/api/v2/forms/disapprove/${logType}/${logId}`),
        onSuccess: () => {
            toast.success(`Filing for ${employeeName} disapproved.`);
            queryClient.invalidateQueries({
                queryKey: ["formsSubmissions", agencyId],
            });
        },
        onError: () => toast.error("Failed to disapprove. Please try again."),
    });

    return (
        <>
            <Button
                size="sm"
                variant="outline"
                className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-400"
                onClick={() => setOpen(true)}
                disabled={!canAct || mutation.isPending}
            >
                {mutation.isPending ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                    <XCircle className="mr-1.5 h-3.5 w-3.5" />
                )}
                Disapprove
            </Button>

            <AlertDialog open={open} onOpenChange={setOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Disapprove this filing?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            You are disapproving the{" "}
                            <strong>{TYPE_META[logType].label}</strong> filing
                            of <strong>{employeeName}</strong>. The employee
                            will need to re-file.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => {
                                setOpen(false);
                                mutation.mutate();
                            }}
                        >
                            Confirm Disapprove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: number }) {
    if (status === 1)
        return (
            <Badge className="border-0 bg-blue-500/10 px-2 py-0.5 text-xs text-blue-400">
                Head Approved
            </Badge>
        );
    if (status === 2)
        return (
            <Badge className="border-0 bg-green-500/10 px-2 py-0.5 text-xs text-green-400">
                Validated
            </Badge>
        );
    if (status === 3)
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

// ── View-details dialog ───────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value?: string | null }) {
    return (
        <div className="flex justify-between py-2.5 text-sm">
            <span className="text-muted-foreground w-2/5">{label}</span>
            <span className="w-3/5 text-right font-medium">{value || "—"}</span>
        </div>
    );
}

function ViewDetailsDialog({ kind, data }: { kind: LogType; data: BaseLog }) {
    const [open, setOpen] = useState(false);
    const meta = TYPE_META[kind];
    const Icon = meta.icon;
    const ext = data as unknown as Record<string, unknown>;
    const str = (v: unknown) => (v ? String(v) : undefined);

    const statusDesc =
        data.validation_status === 0
            ? "Pending • Awaiting head approval"
            : data.validation_status === 1
              ? "Head-approved • Awaiting your validation"
              : data.validation_status === 2
                ? "Validated • Fully approved"
                : "Disapproved";

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
                            <Icon className={`h-4 w-4 ${meta.cls}`} />
                            {meta.label} — Filing Details
                        </DialogTitle>
                        <DialogDescription>{statusDesc}</DialogDescription>
                    </DialogHeader>

                    <div className="divide-border border-border bg-muted/20 divide-y rounded-md border px-4">
                        <DetailRow
                            label="Employee"
                            value={data.employee_name}
                        />
                        <DetailRow label="ID Number" value={data.id_number} />
                        {kind !== "branch" && (
                            <DetailRow
                                label="Branch"
                                value={str(ext.branch_name)}
                            />
                        )}
                        <DetailRow
                            label="Filed On"
                            value={safeFormat(data.created_at)}
                        />
                        <DetailRow
                            label="Filed By"
                            value={str(ext.created_by_name)}
                        />

                        {kind === "salary" && (
                            <>
                                <DetailRow
                                    label="Previous Rate"
                                    value={peso(str(ext.previous_salary_rate))}
                                />
                                <DetailRow
                                    label="New Rate"
                                    value={peso(str(ext.salary_rate))}
                                />
                                <DetailRow
                                    label="Effective Date"
                                    value={safeFormat(str(ext.effective_date))}
                                />
                            </>
                        )}
                        {kind === "position" && (
                            <>
                                <DetailRow
                                    label="Previous Position"
                                    value={str(ext.previous_position_name)}
                                />
                                <DetailRow
                                    label="New Position"
                                    value={str(ext.position_name)}
                                />
                                <DetailRow
                                    label="Effective Date"
                                    value={safeFormat(str(ext.effective_date))}
                                />
                            </>
                        )}
                        {kind === "promotion" && (
                            <>
                                <DetailRow
                                    label="Previous Position"
                                    value={str(ext.previous_position_name)}
                                />
                                <DetailRow
                                    label="New Position"
                                    value={str(ext.position_name)}
                                />
                                <DetailRow
                                    label="Previous Salary"
                                    value={peso(str(ext.previous_salary_rate))}
                                />
                                <DetailRow
                                    label="New Salary"
                                    value={peso(str(ext.salary_rate))}
                                />
                                <DetailRow
                                    label="Effective Date"
                                    value={safeFormat(str(ext.effective_date))}
                                />
                            </>
                        )}
                        {kind === "branch" && (
                            <>
                                <DetailRow
                                    label="From Branch"
                                    value={str(ext.previous_branch_name)}
                                />
                                <DetailRow
                                    label="To Branch"
                                    value={str(ext.branch_name)}
                                />
                                <DetailRow
                                    label="Transfer Date"
                                    value={safeFormat(str(ext.transfer_date))}
                                />
                            </>
                        )}
                        {kind === "dept" && (
                            <>
                                <DetailRow
                                    label="Previous Department"
                                    value={str(ext.previous_department_name)}
                                />
                                <DetailRow
                                    label="New Department"
                                    value={str(ext.department_name)}
                                />
                                <DetailRow
                                    label="Effective Date"
                                    value={safeFormat(str(ext.effective_date))}
                                />
                            </>
                        )}
                        {kind === "resignation" && (
                            <>
                                <DetailRow
                                    label="Position"
                                    value={str(ext.position_name)}
                                />
                                <DetailRow
                                    label="Resignation Date"
                                    value={safeFormat(
                                        str(ext.resignation_date),
                                    )}
                                />
                                <DetailRow
                                    label="Last Working Day"
                                    value={safeFormat(
                                        str(ext.last_working_day),
                                    )}
                                />
                            </>
                        )}
                        <DetailRow label="Remarks" value={str(ext.remarks)} />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

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

// ── Main page ─────────────────────────────────────────────────────────────────

export default function FormsValidation() {
    const { id } = useParams<{ id: string }>();
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("all");

    const { data, isLoading, isError } = useQuery<SubmissionsResponse>({
        queryKey: ["formsSubmissions", id],
        queryFn: async () => {
            const res = await api.get<ApiResponse<SubmissionsResponse>>(
                `/api/v2/forms/submissions/${id}`,
            );
            return (
                res.data.data ?? {
                    salary_logs: [],
                    position_logs: [],
                    branch_logs: [],
                    promotion_logs: [],
                    dept_logs: [],
                    resignation_logs: [],
                }
            );
        },
        enabled: !!id,
        staleTime: 0,
    });

    // All filings regardless of status — buttons are disabled unless status=1
    // PHP returns DB integers as strings; coerce validation_status to number here
    const allFilings = useMemo(() => {
        const norm = <T extends BaseLog>(logs: T[]): T[] =>
            logs.map((l) => ({
                ...l,
                validation_status: Number(l.validation_status),
            }));
        return {
            salary: norm(data?.salary_logs ?? []),
            position: norm(data?.position_logs ?? []),
            branch: norm(data?.branch_logs ?? []),
            promotion: norm(data?.promotion_logs ?? []),
            dept: norm(data?.dept_logs ?? []),
            resignation: norm(data?.resignation_logs ?? []),
        };
    }, [data]);

    const q = search.trim().toLowerCase();
    const match = (r: BaseLog) =>
        !q ||
        r.employee_name.toLowerCase().includes(q) ||
        r.id_number.toLowerCase().includes(q);

    const filtered = useMemo(
        () => ({
            salary: allFilings.salary.filter(match),
            position: allFilings.position.filter(match),
            branch: allFilings.branch.filter(match),
            promotion: allFilings.promotion.filter(match),
            dept: allFilings.dept.filter(match),
            resignation: allFilings.resignation.filter(match),
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }),
        [allFilings, q],
    );

    type AllRow = { kind: LogType; data: BaseLog };

    const allRows = useMemo<AllRow[]>(() => {
        const rows: AllRow[] = [
            ...filtered.salary.map((d) => ({
                kind: "salary" as const,
                data: d,
            })),
            ...filtered.position.map((d) => ({
                kind: "position" as const,
                data: d,
            })),
            ...filtered.branch.map((d) => ({
                kind: "branch" as const,
                data: d,
            })),
            ...filtered.promotion.map((d) => ({
                kind: "promotion" as const,
                data: d,
            })),
            ...filtered.dept.map((d) => ({ kind: "dept" as const, data: d })),
            ...filtered.resignation.map((d) => ({
                kind: "resignation" as const,
                data: d,
            })),
        ];
        rows.sort(
            (a, b) =>
                new Date(b.data.created_at).getTime() -
                new Date(a.data.created_at).getTime(),
        );
        return rows;
    }, [filtered]);

    // Status totals from all unfiltered filings
    const allFlat = useMemo(
        () => Object.values(allFilings).flat(),
        [allFilings],
    );
    const countAll = allFlat.length;
    const countPending = allFlat.filter(
        (r) => r.validation_status === 0,
    ).length;
    const countHeadApproved = allFlat.filter(
        (r) => r.validation_status === 1,
    ).length;
    const countValidated = allFlat.filter(
        (r) => r.validation_status === 2,
    ).length;
    const countDisapproved = allFlat.filter(
        (r) => r.validation_status === 3,
    ).length;

    if (isLoading) return <FullPageLoader />;
    if (isError)
        return (
            <ParentComponent>
                <Card>
                    <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                        <XCircle className="h-12 w-12 text-red-400 opacity-60" />
                        <p className="font-medium">
                            Failed to load submissions.
                        </p>
                        <p className="text-muted-foreground text-sm">
                            Something went wrong while fetching filings. Please
                            refresh the page or try again later.
                        </p>
                    </CardContent>
                </Card>
            </ParentComponent>
        );

    const renderChange = (kind: LogType, row: BaseLog) => {
        switch (kind) {
            case "salary": {
                const r = row as SalaryLog;
                return `${peso(r.previous_salary_rate)} → ${peso(r.salary_rate)}`;
            }
            case "position": {
                const r = row as PositionLog;
                return `${r.previous_position_name || "—"} → ${r.position_name || "—"}`;
            }
            case "promotion": {
                const r = row as PromotionLog;
                return `${r.previous_position_name || "—"} → ${r.position_name || "—"}`;
            }
            case "branch": {
                const r = row as BranchLog;
                return r.branch_name || "—";
            }
            case "dept": {
                const r = row as DeptLog;
                return `${r.previous_department_name || "—"} → ${r.department_name || "—"}`;
            }
            case "resignation": {
                const r = row as ResignationLog;
                return safeFormat(r.resignation_date);
            }
        }
    };

    const renderTable = (rows: AllRow[]) => (
        <div className="border-border overflow-x-auto rounded-md border">
            <Table className="min-w-[860px]">
                <TableHeader className="bg-muted/40">
                    <TableRow>
                        <TableHead className="px-4 py-3 text-xs font-semibold tracking-wide uppercase">
                            Type
                        </TableHead>
                        <TableHead className="px-4 py-3 text-xs font-semibold tracking-wide uppercase">
                            Employee
                        </TableHead>
                        <TableHead className="px-4 py-3 text-xs font-semibold tracking-wide uppercase">
                            Change
                        </TableHead>
                        <TableHead className="px-4 py-3 text-xs font-semibold tracking-wide uppercase">
                            Status
                        </TableHead>
                        <TableHead className="px-4 py-3 text-center text-xs font-semibold tracking-wide uppercase">
                            Filed On
                        </TableHead>
                        <TableHead className="px-4 py-3 text-right text-xs font-semibold tracking-wide uppercase">
                            Actions
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.length > 0 ? (
                        rows.map((row) => {
                            const meta = TYPE_META[row.kind];
                            const Icon = meta.icon;
                            const canAct = row.data.validation_status === 1;
                            const initials = row.data.employee_name
                                .split(" ")
                                .slice(0, 2)
                                .map((n) => n[0] ?? "")
                                .join("")
                                .toUpperCase();

                            return (
                                <TableRow
                                    key={`${row.kind}-${row.data.id}`}
                                    className="hover:bg-muted/10 transition"
                                >
                                    <TableCell className="px-4 py-3">
                                        <Badge
                                            className={`${meta.bg} ${meta.cls} flex w-fit items-center gap-1 border-0 px-2 py-1 text-xs font-medium`}
                                        >
                                            <Icon className="h-3 w-3" />
                                            {meta.label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="px-4 py-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="bg-primary/20 text-primary flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold">
                                                {initials}
                                            </div>
                                            <div>
                                                <p className="text-sm leading-tight font-medium">
                                                    {row.data.employee_name}
                                                </p>
                                                <p className="text-muted-foreground text-xs">
                                                    {row.data.id_number}
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground px-4 py-3 text-sm">
                                        {renderChange(row.kind, row.data)}
                                    </TableCell>
                                    <TableCell className="px-4 py-3">
                                        <StatusBadge
                                            status={row.data.validation_status}
                                        />
                                    </TableCell>
                                    <TableCell className="text-muted-foreground px-4 py-3 text-center text-xs">
                                        {safeFormat(row.data.created_at)}
                                    </TableCell>
                                    <TableCell className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-2">
                                            <ViewDetailsDialog
                                                kind={row.kind}
                                                data={row.data}
                                            />
                                            <ValidateButton
                                                logType={row.kind}
                                                logId={row.data.id}
                                                agencyId={id!}
                                                employeeName={
                                                    row.data.employee_name
                                                }
                                                canAct={canAct}
                                            />
                                            <DisapproveButton
                                                logType={row.kind}
                                                logId={row.data.id}
                                                agencyId={id!}
                                                employeeName={
                                                    row.data.employee_name
                                                }
                                                canAct={canAct}
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
                                No filings in this category.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );

    return (
        <ParentComponent>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-bold sm:text-2xl">
                            EICF / MRF Validation
                        </h1>
                        <p className="text-muted-foreground mt-0.5 text-sm">
                            All filings under this agency. Head-approved filings
                            are ready for your validation.
                        </p>
                    </div>
                    <Link to={`/forms/${id}`}>
                        <Button className="bg-yellow-500 text-white hover:bg-yellow-600">
                            <Plus className="mr-1.5 h-4 w-4" />
                            File New Form
                        </Button>
                    </Link>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                    <StatCard
                        icon={ClipboardCheck}
                        iconCls="text-foreground"
                        bg="bg-muted"
                        count={countAll}
                        label="Total Filings"
                    />
                    {countPending > 0 && (
                        <StatCard
                            icon={Clock}
                            iconCls="text-yellow-400"
                            bg="bg-yellow-500/10"
                            count={countPending}
                            label="Pending Head Approval"
                        />
                    )}
                    {countHeadApproved > 0 && (
                        <StatCard
                            icon={ClipboardCheck}
                            iconCls="text-blue-400"
                            bg="bg-blue-500/10"
                            count={countHeadApproved}
                            label="Awaiting Validation"
                        />
                    )}
                    {countValidated > 0 && (
                        <StatCard
                            icon={CheckCircle}
                            iconCls="text-green-400"
                            bg="bg-green-500/10"
                            count={countValidated}
                            label="Validated"
                        />
                    )}
                    {countDisapproved > 0 && (
                        <StatCard
                            icon={XCircle}
                            iconCls="text-red-400"
                            bg="bg-red-500/10"
                            count={countDisapproved}
                            label="Disapproved"
                        />
                    )}
                </div>

                {/* Empty state */}
                {countAll === 0 && (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                            <CheckCircle className="h-12 w-12 text-green-400 opacity-60" />
                            <p className="font-medium">No filings yet.</p>
                            <p className="text-muted-foreground text-sm">
                                No forms have been filed under this agency.
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Table */}
                {countAll > 0 && (
                    <Card>
                        <CardHeader className="pb-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <CardTitle className="text-base sm:text-lg">
                                        All Filings
                                    </CardTitle>
                                    <CardDescription>
                                        {allRows.length} filing
                                        {allRows.length !== 1 ? "s" : ""}
                                        {countHeadApproved > 0
                                            ? ` · ${countHeadApproved} awaiting your validation`
                                            : ""}
                                    </CardDescription>
                                </div>
                                <div className="relative w-full sm:w-64">
                                    <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
                                    <Input
                                        placeholder="Search employee or ID…"
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                        className="pl-8"
                                    />
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="pt-0">
                            <Tabs
                                value={activeTab}
                                onValueChange={setActiveTab}
                            >
                                <TabsList className="scrollbar-none mb-4 flex h-auto w-full flex-nowrap justify-start gap-1 overflow-x-auto bg-transparent p-0">
                                    <TabsTrigger
                                        value="all"
                                        className="border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md border px-3 py-1.5 text-xs"
                                    >
                                        All ({allRows.length})
                                    </TabsTrigger>
                                    {(Object.keys(TYPE_META) as LogType[]).map(
                                        (type) =>
                                            filtered[type].length > 0 ? (
                                                <TabsTrigger
                                                    key={type}
                                                    value={type}
                                                    className="border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md border px-3 py-1.5 text-xs"
                                                >
                                                    {TYPE_META[type].label} (
                                                    {filtered[type].length})
                                                </TabsTrigger>
                                            ) : null,
                                    )}
                                </TabsList>

                                <TabsContent value="all">
                                    {renderTable(allRows)}
                                </TabsContent>
                                {(Object.keys(TYPE_META) as LogType[]).map(
                                    (type) => (
                                        <TabsContent key={type} value={type}>
                                            {renderTable(
                                                filtered[type].map((d) => ({
                                                    kind: type as LogType,
                                                    data: d,
                                                })),
                                            )}
                                        </TabsContent>
                                    ),
                                )}
                            </Tabs>
                        </CardContent>
                    </Card>
                )}
            </div>
        </ParentComponent>
    );
}
