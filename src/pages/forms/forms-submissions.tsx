import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ParentComponent } from "@/components/parent-container";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DollarSign,
    GitBranch,
    UserCog,
    Plus,
    Search,
    ArrowRight,
    TrendingUp,
    Building2,
    LogOut,
} from "lucide-react";
import api from "@/lib/axios";
import { ApiResponse } from "@/index";
import { safeFormat } from "@/helpers/formatDates";
import FullPageLoader from "@/components/page-loader";

// ── Types ─────────────────────────────────────────────────────────────────────

interface StatusFields {
    validation_status: number;
    status_label: string;
    agency_validated_by: number | null;
    agency_validated_by_name: string | null;
    agency_validated_at: string | null;
    approved_by: number | null;
    approved_by_name: string | null;
    approved_at: string | null;
}

interface SalaryLog extends StatusFields {
    id: number;
    employee_id: number;
    employee_name: string;
    id_number: string;
    salary_rate: string;
    previous_salary_rate: string;
    effective_date: string;
    remarks: string | null;
    created_at: string;
}

interface PositionLog extends StatusFields {
    id: number;
    employee_id: number;
    employee_name: string;
    id_number: string;
    position_name: string;
    previous_position_name: string;
    effective_date: string;
    remarks: string | null;
    created_at: string;
}

interface BranchLog extends StatusFields {
    id: number;
    employee_id: number;
    employee_name: string;
    id_number: string;
    branch_name: string;
    transfer_date: string;
    remarks: string | null;
    created_at: string;
}

interface PromotionLog extends StatusFields {
    id: number;
    employee_id: number;
    employee_name: string;
    id_number: string;
    position_name: string;
    previous_position_name: string;
    salary_rate: string | null;
    previous_salary_rate: string | null;
    effective_date: string;
    remarks: string | null;
    created_at: string;
}

interface DeptLog extends StatusFields {
    id: number;
    employee_id: number;
    employee_name: string;
    id_number: string;
    department_name: string;
    previous_department_name: string;
    effective_date: string;
    remarks: string | null;
    created_at: string;
}

interface ResignationLog extends StatusFields {
    id: number;
    employee_id: number;
    employee_name: string;
    id_number: string;
    resignation_date: string;
    last_working_day: string;
    remarks: string | null;
    created_at: string;
}

interface SubmissionsResponse {
    salary_logs: SalaryLog[];
    position_logs: PositionLog[];
    branch_logs: BranchLog[];
    promotion_logs: PromotionLog[];
    dept_logs: DeptLog[];
    resignation_logs: ResignationLog[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const peso = (v?: string | number | null) =>
    v ? `₱${Number(v).toLocaleString("en-PH", { minimumFractionDigits: 2 })}` : "—";


function StatusBadge({ status }: { status: string }) {
    const cls =
        status === "Agency Validated"
            ? "bg-green-500/10 text-green-400"
            : status === "Head Approved"
              ? "bg-blue-500/10 text-blue-400"
              : status === "Disapproved"
                ? "bg-red-500/10 text-red-400"
                : "bg-yellow-500/10 text-yellow-400";
    return <Badge className={`${cls} px-2 py-0.5 text-xs`}>{status}</Badge>;
}

function AuditStamp({ label, name, at }: { label: string; name?: string | null; at?: string | null }) {
    if (!name && !at) return null;
    return (
        <div className="flex items-start justify-between gap-4">
            <span className="shrink-0 text-muted-foreground">{label}</span>
            <div className="text-right">
                {name && <p className="text-xs font-medium">{name}</p>}
                {at && <p className="text-xs text-muted-foreground">{safeFormat(at)}</p>}
            </div>
        </div>
    );
}

function TypeBadge({ type }: { type: "salary" | "position" | "branch" | "promotion" | "dept" | "resignation" }) {
    const map = {
        salary:      { label: "Pay Change",       cls: "bg-emerald-500/10 text-emerald-400", icon: DollarSign },
        position:    { label: "Position Change",  cls: "bg-blue-500/10 text-blue-400",       icon: UserCog },
        branch:      { label: "Branch Transfer",  cls: "bg-cyan-500/10 text-cyan-400",       icon: GitBranch },
        promotion:   { label: "Promotion",        cls: "bg-yellow-500/10 text-yellow-400",   icon: TrendingUp },
        dept:        { label: "Dept. Transfer",   cls: "bg-purple-500/10 text-purple-400",   icon: Building2 },
        resignation: { label: "Resignation",      cls: "bg-red-500/10 text-red-400",         icon: LogOut },
    };
    const { label, cls, icon: Icon } = map[type];
    return (
        <Badge className={`${cls} flex w-fit items-center gap-1 px-2 py-0.5 text-xs`}>
            <Icon className="h-3 w-3" />
            {label}
        </Badge>
    );
}

function usePagination(data: unknown[], pageSize: number) {
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
    const paginated = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const reset = () => setCurrentPage(1);

    const pageNumbers = useMemo(() => {
        if (totalPages <= 1) return [];
        const pages: (number | "…")[] = [];
        const max = 3;
        let start = Math.max(currentPage - 1, 1);
        let end   = Math.min(start + max - 1, totalPages);
        if (end - start + 1 < max) start = Math.max(end - max + 1, 1);
        if (start > 1) { pages.push(1); if (start > 2) pages.push("…"); }
        for (let i = start; i <= end; i++) pages.push(i);
        if (end < totalPages) { if (end < totalPages - 1) pages.push("…"); pages.push(totalPages); }
        return pages;
    }, [currentPage, totalPages]);

    return { currentPage, setCurrentPage, totalPages, paginated, reset, pageNumbers };
}

function Pagination({
    currentPage,
    setCurrentPage,
    totalPages,
    pageNumbers,
    pageSize,
    setPageSize,
    onPageSizeChange,
}: {
    currentPage: number;
    setCurrentPage: (n: number) => void;
    totalPages: number;
    pageNumbers: (number | "…")[];
    pageSize: number;
    setPageSize: (n: number) => void;
    onPageSizeChange: () => void;
}) {
    return (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">Rows per page:</Label>
                <Select
                    value={String(pageSize)}
                    onValueChange={(v) => { setPageSize(Number(v)); onPageSizeChange(); }}
                >
                    <SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {[5, 10, 20, 50].map((s) => (
                            <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex items-center gap-2">
                <Button
                    size="sm"
                    variant="outline"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                >
                    Previous
                </Button>
                {pageNumbers.map((p, i) =>
                    p === "…" ? (
                        <span key={`e${i}`} className="px-1 text-muted-foreground">…</span>
                    ) : (
                        <Button
                            key={p}
                            size="sm"
                            variant={currentPage === p ? "default" : "outline"}
                            onClick={() => setCurrentPage(p)}
                        >
                            {p}
                        </Button>
                    ),
                )}
                <Button
                    size="sm"
                    variant="outline"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                >
                    Next
                </Button>
            </div>
        </div>
    );
}

// ── Detail Dialogs ────────────────────────────────────────────────────────────

function SalaryDetail({ log }: { log: SalaryLog }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline">View</Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Pay Change Details</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 text-sm">
                    {[
                        { label: "Employee",       value: `${log.employee_name} (${log.id_number})` },
                        { label: "Previous Rate",  value: peso(log.previous_salary_rate) },
                        { label: "New Rate",       value: peso(log.salary_rate) },
                        { label: "Effective Date", value: safeFormat(log.effective_date) },
                        { label: "Status",         value: <StatusBadge status={log.status_label} /> },
                        { label: "Remarks",        value: log.remarks || "—" },
                        { label: "Submitted On",   value: safeFormat(log.created_at) },
                    ].map(({ label, value }) => (
                        <div key={label} className="flex items-start justify-between gap-4">
                            <span className="shrink-0 text-muted-foreground">{label}</span>
                            <span className="text-right font-medium">{value}</span>
                        </div>
                    ))}
                    <AuditStamp label="Dept. Head Approved By" name={log.approved_by_name}           at={log.approved_at} />
                    <AuditStamp label="Agency Validated By"   name={log.agency_validated_by_name} at={log.agency_validated_at} />
                </div>
            </DialogContent>
        </Dialog>
    );
}

function PositionDetail({ log }: { log: PositionLog }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline">View</Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Position Change Details</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 text-sm">
                    {[
                        { label: "Employee",          value: `${log.employee_name} (${log.id_number})` },
                        { label: "Previous Position", value: log.previous_position_name || "—" },
                        { label: "New Position",      value: log.position_name || "—" },
                        { label: "Effective Date",    value: safeFormat(log.effective_date) },
                        { label: "Status",            value: <StatusBadge status={log.status_label} /> },
                        { label: "Remarks",           value: log.remarks || "—" },
                        { label: "Submitted On",      value: safeFormat(log.created_at) },
                    ].map(({ label, value }) => (
                        <div key={label} className="flex items-start justify-between gap-4">
                            <span className="shrink-0 text-muted-foreground">{label}</span>
                            <span className="text-right font-medium">{value}</span>
                        </div>
                    ))}
                    <AuditStamp label="Dept. Head Approved By" name={log.approved_by_name}           at={log.approved_at} />
                    <AuditStamp label="Agency Validated By"   name={log.agency_validated_by_name} at={log.agency_validated_at} />
                </div>
            </DialogContent>
        </Dialog>
    );
}

function BranchDetail({ log }: { log: BranchLog }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline">View</Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Branch Transfer Details</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 text-sm">
                    {[
                        { label: "Employee",      value: `${log.employee_name} (${log.id_number})` },
                        { label: "New Branch",    value: log.branch_name || "—" },
                        { label: "Transfer Date", value: safeFormat(log.transfer_date) },
                        { label: "Status",        value: <StatusBadge status={log.status_label} /> },
                        { label: "Remarks",       value: log.remarks || "—" },
                        { label: "Submitted On",  value: safeFormat(log.created_at) },
                    ].map(({ label, value }) => (
                        <div key={label} className="flex items-start justify-between gap-4">
                            <span className="shrink-0 text-muted-foreground">{label}</span>
                            <span className="text-right font-medium">{value}</span>
                        </div>
                    ))}
                    <AuditStamp label="Dept. Head Approved By" name={log.approved_by_name}           at={log.approved_at} />
                    <AuditStamp label="Agency Validated By"   name={log.agency_validated_by_name} at={log.agency_validated_at} />
                </div>
            </DialogContent>
        </Dialog>
    );
}

function PromotionDetail({ log }: { log: PromotionLog }) {
    return (
        <Dialog>
            <DialogTrigger asChild><Button size="sm" variant="outline">View</Button></DialogTrigger>
            <DialogContent className="max-w-sm">
                <DialogHeader><DialogTitle>Promotion Details</DialogTitle></DialogHeader>
                <div className="space-y-3 text-sm">
                    {[
                        { label: "Employee",          value: `${log.employee_name} (${log.id_number})` },
                        { label: "Previous Position", value: log.previous_position_name || "—" },
                        { label: "New Position",      value: log.position_name || "—" },
                        { label: "Previous Rate",     value: peso(log.previous_salary_rate) },
                        { label: "New Rate",          value: peso(log.salary_rate) },
                        { label: "Effective Date",    value: safeFormat(log.effective_date) },
                        { label: "Status",            value: <StatusBadge status={log.status_label} /> },
                        { label: "Remarks",           value: log.remarks || "—" },
                        { label: "Submitted On",      value: safeFormat(log.created_at) },
                    ].map(({ label, value }) => (
                        <div key={label} className="flex items-start justify-between gap-4">
                            <span className="shrink-0 text-muted-foreground">{label}</span>
                            <span className="text-right font-medium">{value}</span>
                        </div>
                    ))}
                    <AuditStamp label="Dept. Head Approved By" name={log.approved_by_name}           at={log.approved_at} />
                    <AuditStamp label="Agency Validated By"   name={log.agency_validated_by_name} at={log.agency_validated_at} />
                </div>
            </DialogContent>
        </Dialog>
    );
}

function DeptDetail({ log }: { log: DeptLog }) {
    return (
        <Dialog>
            <DialogTrigger asChild><Button size="sm" variant="outline">View</Button></DialogTrigger>
            <DialogContent className="max-w-sm">
                <DialogHeader><DialogTitle>Department Transfer Details</DialogTitle></DialogHeader>
                <div className="space-y-3 text-sm">
                    {[
                        { label: "Employee",            value: `${log.employee_name} (${log.id_number})` },
                        { label: "Previous Department", value: log.previous_department_name || "—" },
                        { label: "New Department",      value: log.department_name || "—" },
                        { label: "Effective Date",      value: safeFormat(log.effective_date) },
                        { label: "Status",              value: <StatusBadge status={log.status_label} /> },
                        { label: "Remarks",             value: log.remarks || "—" },
                        { label: "Submitted On",        value: safeFormat(log.created_at) },
                    ].map(({ label, value }) => (
                        <div key={label} className="flex items-start justify-between gap-4">
                            <span className="shrink-0 text-muted-foreground">{label}</span>
                            <span className="text-right font-medium">{value}</span>
                        </div>
                    ))}
                    <AuditStamp label="Dept. Head Approved By" name={log.approved_by_name}           at={log.approved_at} />
                    <AuditStamp label="Agency Validated By"   name={log.agency_validated_by_name} at={log.agency_validated_at} />
                </div>
            </DialogContent>
        </Dialog>
    );
}

function ResignationDetail({ log }: { log: ResignationLog }) {
    return (
        <Dialog>
            <DialogTrigger asChild><Button size="sm" variant="outline">View</Button></DialogTrigger>
            <DialogContent className="max-w-sm">
                <DialogHeader><DialogTitle>Resignation Details</DialogTitle></DialogHeader>
                <div className="space-y-3 text-sm">
                    {[
                        { label: "Employee",         value: `${log.employee_name} (${log.id_number})` },
                        { label: "Resignation Date", value: safeFormat(log.resignation_date) },
                        { label: "Last Working Day", value: safeFormat(log.last_working_day) },
                        { label: "Status",           value: <StatusBadge status={log.status_label} /> },
                        { label: "Reason / Details", value: log.remarks || "—" },
                        { label: "Submitted On",     value: safeFormat(log.created_at) },
                    ].map(({ label, value }) => (
                        <div key={label} className="flex items-start justify-between gap-4">
                            <span className="shrink-0 text-muted-foreground">{label}</span>
                            <span className="text-right font-medium">{value}</span>
                        </div>
                    ))}
                    <AuditStamp label="Dept. Head Approved By" name={log.approved_by_name}           at={log.approved_at} />
                    <AuditStamp label="Agency Validated By"   name={log.agency_validated_by_name} at={log.agency_validated_at} />
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function FormsSubmissions() {
    const { id } = useParams<{ id: string }>();

    const [search, setSearch]       = useState("");
    const [activeTab, setActiveTab] = useState("all");
    const [pageSize, setPageSize]   = useState(10);

    const { data, isLoading, isError } = useQuery<SubmissionsResponse>({
        queryKey: ["formsSubmissions", id],
        queryFn: async () => {
            const res = await api.get<ApiResponse<SubmissionsResponse>>(
                `/api/v2/forms/submissions/${id}`,
            );
            return res.data.data ?? { salary_logs: [], position_logs: [], branch_logs: [] };
        },
        enabled: !!id,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });

    const salaryLogs      = data?.salary_logs      ?? [];
    const positionLogs    = data?.position_logs    ?? [];
    const branchLogs      = data?.branch_logs      ?? [];
    const promotionLogs   = data?.promotion_logs   ?? [];
    const deptLogs        = data?.dept_logs        ?? [];
    const resignationLogs = data?.resignation_logs ?? [];

    const q = search.trim().toLowerCase();
    const matchEmp = (r: { employee_name: string; id_number: string }) =>
        !q || r.employee_name.toLowerCase().includes(q) || r.id_number.toLowerCase().includes(q);

    const filteredSalary      = useMemo(() => salaryLogs.filter(matchEmp),      [salaryLogs, q]);
    const filteredPosition    = useMemo(() => positionLogs.filter(matchEmp),    [positionLogs, q]);
    const filteredBranch      = useMemo(() => branchLogs.filter(matchEmp),      [branchLogs, q]);
    const filteredPromotion   = useMemo(() => promotionLogs.filter(matchEmp),   [promotionLogs, q]);
    const filteredDept        = useMemo(() => deptLogs.filter(matchEmp),        [deptLogs, q]);
    const filteredResignation = useMemo(() => resignationLogs.filter(matchEmp), [resignationLogs, q]);

    type AllRow =
        | { kind: "salary";      data: SalaryLog }
        | { kind: "position";    data: PositionLog }
        | { kind: "branch";      data: BranchLog }
        | { kind: "promotion";   data: PromotionLog }
        | { kind: "dept";        data: DeptLog }
        | { kind: "resignation"; data: ResignationLog };

    const allRows = useMemo<AllRow[]>(() => {
        const rows: AllRow[] = [
            ...filteredSalary.map((d): AllRow      => ({ kind: "salary",      data: d })),
            ...filteredPosition.map((d): AllRow    => ({ kind: "position",    data: d })),
            ...filteredBranch.map((d): AllRow      => ({ kind: "branch",      data: d })),
            ...filteredPromotion.map((d): AllRow   => ({ kind: "promotion",   data: d })),
            ...filteredDept.map((d): AllRow        => ({ kind: "dept",        data: d })),
            ...filteredResignation.map((d): AllRow => ({ kind: "resignation", data: d })),
        ];
        rows.sort((a, b) => new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime());
        return rows;
    }, [filteredSalary, filteredPosition, filteredBranch, filteredPromotion, filteredDept, filteredResignation]);

    const salaryPag      = usePagination(filteredSalary,      pageSize);
    const positionPag    = usePagination(filteredPosition,    pageSize);
    const branchPag      = usePagination(filteredBranch,      pageSize);
    const promotionPag   = usePagination(filteredPromotion,   pageSize);
    const deptPag        = usePagination(filteredDept,        pageSize);
    const resignationPag = usePagination(filteredResignation, pageSize);
    const allPag         = usePagination(allRows,             pageSize);

    const resetAll = () => {
        salaryPag.reset(); positionPag.reset(); branchPag.reset();
        promotionPag.reset(); deptPag.reset(); resignationPag.reset(); allPag.reset();
    };

    const summaryCards = [
        { label: "Promotions",        count: promotionLogs.length,   icon: TrendingUp, cls: "text-yellow-400",  bg: "bg-yellow-500/10" },
        { label: "Pay Changes",       count: salaryLogs.length,      icon: DollarSign, cls: "text-emerald-400", bg: "bg-emerald-500/10" },
        { label: "Position Changes",  count: positionLogs.length,    icon: UserCog,    cls: "text-blue-400",    bg: "bg-blue-500/10" },
        { label: "Dept. Transfers",   count: deptLogs.length,        icon: Building2,  cls: "text-purple-400",  bg: "bg-purple-500/10" },
        { label: "Branch Transfers",  count: branchLogs.length,      icon: GitBranch,  cls: "text-cyan-400",    bg: "bg-cyan-500/10" },
        { label: "Resignations",      count: resignationLogs.length, icon: LogOut,     cls: "text-red-400",     bg: "bg-red-500/10" },
    ];

    if (isLoading) return <FullPageLoader />;
    if (isError)
        return (
            <ParentComponent>
                <div className="text-center text-red-500">Failed to load submissions.</div>
            </ParentComponent>
        );

    return (
        <ParentComponent>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-bold sm:text-2xl">EICF Submissions</h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            All employee information change requests filed under your agency.
                        </p>
                    </div>
                    <Link to={`/forms/${id}`}>
                        <Button className="bg-yellow-500 text-white hover:bg-yellow-600">
                            <Plus className="mr-1.5 h-4 w-4" />
                            File New Form
                        </Button>
                    </Link>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                    {summaryCards.map(({ label, count, icon: Icon, cls, bg }) => (
                        <Card key={label} className="p-4">
                            <div className="flex items-center gap-3">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bg}`}>
                                    <Icon className={`h-5 w-5 ${cls}`} />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{count}</p>
                                    <p className="text-xs text-muted-foreground">{label}</p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Table card */}
                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <CardTitle className="text-base sm:text-lg">Submitted Forms</CardTitle>
                                <CardDescription>
                                    {allRows.length} total submission{allRows.length !== 1 ? "s" : ""}
                                </CardDescription>
                            </div>
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search by employee name or ID…"
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); resetAll(); }}
                                    className="pl-8"
                                />
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <Tabs
                            value={activeTab}
                            onValueChange={(v) => { setActiveTab(v); resetAll(); }}
                        >
                            <TabsList className="scrollbar-none mb-4 flex w-full flex-nowrap justify-start gap-2 overflow-x-auto">
                                <TabsTrigger value="all">All ({allRows.length})</TabsTrigger>
                                <TabsTrigger value="promotion">Promotions ({filteredPromotion.length})</TabsTrigger>
                                <TabsTrigger value="salary">Pay Changes ({filteredSalary.length})</TabsTrigger>
                                <TabsTrigger value="position">Position ({filteredPosition.length})</TabsTrigger>
                                <TabsTrigger value="dept">Dept. Transfer ({filteredDept.length})</TabsTrigger>
                                <TabsTrigger value="branch">Branch Transfer ({filteredBranch.length})</TabsTrigger>
                                <TabsTrigger value="resignation">Resignation ({filteredResignation.length})</TabsTrigger>
                            </TabsList>

                            {/* ── ALL ── */}
                            <TabsContent value="all">
                                <div className="overflow-x-auto rounded-md border border-border">
                                    <Table className="min-w-[750px] text-xs sm:text-sm">
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead className="px-3 py-3">Type</TableHead>
                                                <TableHead className="px-3 py-3">Employee</TableHead>
                                                <TableHead className="px-3 py-3">Change</TableHead>
                                                <TableHead className="px-3 py-3 text-center">Effective Date</TableHead>
                                                <TableHead className="px-3 py-3 text-center">Status</TableHead>
                                                <TableHead className="px-3 py-3 text-center">Submitted On</TableHead>
                                                <TableHead className="px-3 py-3 text-center">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(allPag.paginated as AllRow[]).length > 0 ? (
                                                (allPag.paginated as AllRow[]).map((row) => {
                                                    if (row.kind === "salary") {
                                                        const r = row.data;
                                                        return (
                                                            <TableRow key={`s${r.id}`} className="transition hover:bg-muted/10">
                                                                <TableCell className="px-3 py-3"><TypeBadge type="salary" /></TableCell>
                                                                <TableCell className="px-3 py-3">
                                                                    <p className="font-medium">{r.employee_name}</p>
                                                                    <p className="text-xs text-muted-foreground">{r.id_number}</p>
                                                                </TableCell>
                                                                <TableCell className="px-3 py-3">
                                                                    <span className="flex items-center gap-1 text-xs">
                                                                        <span className="text-muted-foreground">{peso(r.previous_salary_rate)}</span>
                                                                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                                                        <span className="font-medium">{peso(r.salary_rate)}</span>
                                                                    </span>
                                                                </TableCell>
                                                                <TableCell className="px-3 py-3 text-center">{safeFormat(r.effective_date)}</TableCell>
                                                                <TableCell className="px-3 py-3 text-center"><StatusBadge status={r.status_label} /></TableCell>
                                                                <TableCell className="px-3 py-3 text-center text-muted-foreground">{safeFormat(r.created_at)}</TableCell>
                                                                <TableCell className="px-3 py-3 text-center"><SalaryDetail log={r} /></TableCell>
                                                            </TableRow>
                                                        );
                                                    }
                                                    if (row.kind === "position") {
                                                        const r = row.data;
                                                        return (
                                                            <TableRow key={`p${r.id}`} className="transition hover:bg-muted/10">
                                                                <TableCell className="px-3 py-3"><TypeBadge type="position" /></TableCell>
                                                                <TableCell className="px-3 py-3">
                                                                    <p className="font-medium">{r.employee_name}</p>
                                                                    <p className="text-xs text-muted-foreground">{r.id_number}</p>
                                                                </TableCell>
                                                                <TableCell className="px-3 py-3">
                                                                    <span className="flex items-center gap-1 text-xs">
                                                                        <span className="text-muted-foreground">{r.previous_position_name || "—"}</span>
                                                                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                                                        <span className="font-medium">{r.position_name || "—"}</span>
                                                                    </span>
                                                                </TableCell>
                                                                <TableCell className="px-3 py-3 text-center">{safeFormat(r.effective_date)}</TableCell>
                                                                <TableCell className="px-3 py-3 text-center"><StatusBadge status={r.status_label} /></TableCell>
                                                                <TableCell className="px-3 py-3 text-center text-muted-foreground">{safeFormat(r.created_at)}</TableCell>
                                                                <TableCell className="px-3 py-3 text-center"><PositionDetail log={r} /></TableCell>
                                                            </TableRow>
                                                        );
                                                    }
                                                    if (row.kind === "branch") {
                                                        const r = row.data as BranchLog;
                                                        return (
                                                            <TableRow key={`b${r.id}`} className="transition hover:bg-muted/10">
                                                                <TableCell className="px-3 py-3"><TypeBadge type="branch" /></TableCell>
                                                                <TableCell className="px-3 py-3">
                                                                    <p className="font-medium">{r.employee_name}</p>
                                                                    <p className="text-xs text-muted-foreground">{r.id_number}</p>
                                                                </TableCell>
                                                                <TableCell className="px-3 py-3 text-xs font-medium">{r.branch_name || "—"}</TableCell>
                                                                <TableCell className="px-3 py-3 text-center">{safeFormat(r.transfer_date)}</TableCell>
                                                                <TableCell className="px-3 py-3 text-center"><StatusBadge status={r.status_label} /></TableCell>
                                                                <TableCell className="px-3 py-3 text-center text-muted-foreground">{safeFormat(r.created_at)}</TableCell>
                                                                <TableCell className="px-3 py-3 text-center"><BranchDetail log={r} /></TableCell>
                                                            </TableRow>
                                                        );
                                                    }
                                                    if (row.kind === "promotion") {
                                                        const r = row.data as PromotionLog;
                                                        return (
                                                            <TableRow key={`pr${r.id}`} className="transition hover:bg-muted/10">
                                                                <TableCell className="px-3 py-3"><TypeBadge type="promotion" /></TableCell>
                                                                <TableCell className="px-3 py-3">
                                                                    <p className="font-medium">{r.employee_name}</p>
                                                                    <p className="text-xs text-muted-foreground">{r.id_number}</p>
                                                                </TableCell>
                                                                <TableCell className="px-3 py-3">
                                                                    <span className="flex items-center gap-1 text-xs">
                                                                        <span className="text-muted-foreground">{r.previous_position_name || "—"}</span>
                                                                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                                                        <span className="font-medium">{r.position_name || "—"}</span>
                                                                    </span>
                                                                </TableCell>
                                                                <TableCell className="px-3 py-3 text-center">{safeFormat(r.effective_date)}</TableCell>
                                                                <TableCell className="px-3 py-3 text-center"><StatusBadge status={r.status_label} /></TableCell>
                                                                <TableCell className="px-3 py-3 text-center text-muted-foreground">{safeFormat(r.created_at)}</TableCell>
                                                                <TableCell className="px-3 py-3 text-center"><PromotionDetail log={r} /></TableCell>
                                                            </TableRow>
                                                        );
                                                    }
                                                    if (row.kind === "dept") {
                                                        const r = row.data as DeptLog;
                                                        return (
                                                            <TableRow key={`d${r.id}`} className="transition hover:bg-muted/10">
                                                                <TableCell className="px-3 py-3"><TypeBadge type="dept" /></TableCell>
                                                                <TableCell className="px-3 py-3">
                                                                    <p className="font-medium">{r.employee_name}</p>
                                                                    <p className="text-xs text-muted-foreground">{r.id_number}</p>
                                                                </TableCell>
                                                                <TableCell className="px-3 py-3">
                                                                    <span className="flex items-center gap-1 text-xs">
                                                                        <span className="text-muted-foreground">{r.previous_department_name || "—"}</span>
                                                                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                                                        <span className="font-medium">{r.department_name || "—"}</span>
                                                                    </span>
                                                                </TableCell>
                                                                <TableCell className="px-3 py-3 text-center">{safeFormat(r.effective_date)}</TableCell>
                                                                <TableCell className="px-3 py-3 text-center"><StatusBadge status={r.status_label} /></TableCell>
                                                                <TableCell className="px-3 py-3 text-center text-muted-foreground">{safeFormat(r.created_at)}</TableCell>
                                                                <TableCell className="px-3 py-3 text-center"><DeptDetail log={r} /></TableCell>
                                                            </TableRow>
                                                        );
                                                    }
                                                    const r = row.data as ResignationLog;
                                                    return (
                                                        <TableRow key={`res${r.id}`} className="transition hover:bg-muted/10">
                                                            <TableCell className="px-3 py-3"><TypeBadge type="resignation" /></TableCell>
                                                            <TableCell className="px-3 py-3">
                                                                <p className="font-medium">{r.employee_name}</p>
                                                                <p className="text-xs text-muted-foreground">{r.id_number}</p>
                                                            </TableCell>
                                                            <TableCell className="px-3 py-3 text-xs text-muted-foreground">{r.remarks?.split("\n")[0] || "—"}</TableCell>
                                                            <TableCell className="px-3 py-3 text-center">{safeFormat(r.resignation_date)}</TableCell>
                                                            <TableCell className="px-3 py-3 text-center"><StatusBadge status={r.status_label} /></TableCell>
                                                            <TableCell className="px-3 py-3 text-center text-muted-foreground">{safeFormat(r.created_at)}</TableCell>
                                                            <TableCell className="px-3 py-3 text-center"><ResignationDetail log={r} /></TableCell>
                                                        </TableRow>
                                                    );
                                                })
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                                                        No submissions found.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                                <Pagination
                                    currentPage={allPag.currentPage}
                                    setCurrentPage={allPag.setCurrentPage}
                                    totalPages={allPag.totalPages}
                                    pageNumbers={allPag.pageNumbers}
                                    pageSize={pageSize}
                                    setPageSize={setPageSize}
                                    onPageSizeChange={resetAll}
                                />
                            </TabsContent>

                            {/* ── SALARY ── */}
                            <TabsContent value="salary">
                                <div className="overflow-x-auto rounded-md border border-border">
                                    <Table className="min-w-[700px] text-xs sm:text-sm">
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead className="px-3 py-3">Employee</TableHead>
                                                <TableHead className="px-3 py-3 text-center">Previous Rate</TableHead>
                                                <TableHead className="px-3 py-3 text-center">New Rate</TableHead>
                                                <TableHead className="px-3 py-3 text-center">Effective Date</TableHead>
                                                <TableHead className="px-3 py-3 text-center">Status</TableHead>
                                                <TableHead className="px-3 py-3 text-center">Submitted On</TableHead>
                                                <TableHead className="px-3 py-3 text-center">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(salaryPag.paginated as SalaryLog[]).length > 0 ? (
                                                (salaryPag.paginated as SalaryLog[]).map((r) => (
                                                    <TableRow key={r.id} className="transition hover:bg-muted/10">
                                                        <TableCell className="px-3 py-3">
                                                            <p className="font-medium">{r.employee_name}</p>
                                                            <p className="text-xs text-muted-foreground">{r.id_number}</p>
                                                        </TableCell>
                                                        <TableCell className="px-3 py-3 text-center text-muted-foreground">{peso(r.previous_salary_rate)}</TableCell>
                                                        <TableCell className="px-3 py-3 text-center font-medium">{peso(r.salary_rate)}</TableCell>
                                                        <TableCell className="px-3 py-3 text-center">{safeFormat(r.effective_date)}</TableCell>
                                                        <TableCell className="px-3 py-3 text-center"><StatusBadge status={r.status_label} /></TableCell>
                                                        <TableCell className="px-3 py-3 text-center text-muted-foreground">{safeFormat(r.created_at)}</TableCell>
                                                        <TableCell className="px-3 py-3 text-center"><SalaryDetail log={r} /></TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                                                        No pay change submissions found.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                                <Pagination
                                    currentPage={salaryPag.currentPage}
                                    setCurrentPage={salaryPag.setCurrentPage}
                                    totalPages={salaryPag.totalPages}
                                    pageNumbers={salaryPag.pageNumbers}
                                    pageSize={pageSize}
                                    setPageSize={setPageSize}
                                    onPageSizeChange={resetAll}
                                />
                            </TabsContent>

                            {/* ── POSITION ── */}
                            <TabsContent value="position">
                                <div className="overflow-x-auto rounded-md border border-border">
                                    <Table className="min-w-[700px] text-xs sm:text-sm">
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead className="px-3 py-3">Employee</TableHead>
                                                <TableHead className="px-3 py-3">Previous Position</TableHead>
                                                <TableHead className="px-3 py-3">New Position</TableHead>
                                                <TableHead className="px-3 py-3 text-center">Effective Date</TableHead>
                                                <TableHead className="px-3 py-3 text-center">Submitted On</TableHead>
                                                <TableHead className="px-3 py-3 text-center">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(positionPag.paginated as PositionLog[]).length > 0 ? (
                                                (positionPag.paginated as PositionLog[]).map((r) => (
                                                    <TableRow key={r.id} className="transition hover:bg-muted/10">
                                                        <TableCell className="px-3 py-3">
                                                            <p className="font-medium">{r.employee_name}</p>
                                                            <p className="text-xs text-muted-foreground">{r.id_number}</p>
                                                        </TableCell>
                                                        <TableCell className="px-3 py-3 text-muted-foreground">{r.previous_position_name || "—"}</TableCell>
                                                        <TableCell className="px-3 py-3 font-medium">{r.position_name || "—"}</TableCell>
                                                        <TableCell className="px-3 py-3 text-center">{safeFormat(r.effective_date)}</TableCell>
                                                        <TableCell className="px-3 py-3 text-center text-muted-foreground">{safeFormat(r.created_at)}</TableCell>
                                                        <TableCell className="px-3 py-3 text-center"><PositionDetail log={r} /></TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                                                        No position change submissions found.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                                <Pagination
                                    currentPage={positionPag.currentPage}
                                    setCurrentPage={positionPag.setCurrentPage}
                                    totalPages={positionPag.totalPages}
                                    pageNumbers={positionPag.pageNumbers}
                                    pageSize={pageSize}
                                    setPageSize={setPageSize}
                                    onPageSizeChange={resetAll}
                                />
                            </TabsContent>

                            {/* ── BRANCH ── */}
                            <TabsContent value="branch">
                                <div className="overflow-x-auto rounded-md border border-border">
                                    <Table className="min-w-[600px] text-xs sm:text-sm">
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead className="px-3 py-3">Employee</TableHead>
                                                <TableHead className="px-3 py-3">New Branch</TableHead>
                                                <TableHead className="px-3 py-3 text-center">Transfer Date</TableHead>
                                                <TableHead className="px-3 py-3 text-center">Submitted On</TableHead>
                                                <TableHead className="px-3 py-3 text-center">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(branchPag.paginated as BranchLog[]).length > 0 ? (
                                                (branchPag.paginated as BranchLog[]).map((r) => (
                                                    <TableRow key={r.id} className="transition hover:bg-muted/10">
                                                        <TableCell className="px-3 py-3">
                                                            <p className="font-medium">{r.employee_name}</p>
                                                            <p className="text-xs text-muted-foreground">{r.id_number}</p>
                                                        </TableCell>
                                                        <TableCell className="px-3 py-3 font-medium">{r.branch_name || "—"}</TableCell>
                                                        <TableCell className="px-3 py-3 text-center">{safeFormat(r.transfer_date)}</TableCell>
                                                        <TableCell className="px-3 py-3 text-center text-muted-foreground">{safeFormat(r.created_at)}</TableCell>
                                                        <TableCell className="px-3 py-3 text-center"><BranchDetail log={r} /></TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                                                        No branch transfer submissions found.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                                <Pagination
                                    currentPage={branchPag.currentPage}
                                    setCurrentPage={branchPag.setCurrentPage}
                                    totalPages={branchPag.totalPages}
                                    pageNumbers={branchPag.pageNumbers}
                                    pageSize={pageSize}
                                    setPageSize={setPageSize}
                                    onPageSizeChange={resetAll}
                                />
                            </TabsContent>

                            {/* ── PROMOTION ── */}
                            <TabsContent value="promotion">
                                <div className="overflow-x-auto rounded-md border border-border">
                                    <Table className="min-w-[700px] text-xs sm:text-sm">
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead className="px-3 py-3">Employee</TableHead>
                                                <TableHead className="px-3 py-3">Previous Position</TableHead>
                                                <TableHead className="px-3 py-3">New Position</TableHead>
                                                <TableHead className="px-3 py-3 text-center">Salary Change</TableHead>
                                                <TableHead className="px-3 py-3 text-center">Effective Date</TableHead>
                                                <TableHead className="px-3 py-3 text-center">Submitted On</TableHead>
                                                <TableHead className="px-3 py-3 text-center">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(promotionPag.paginated as PromotionLog[]).length > 0 ? (
                                                (promotionPag.paginated as PromotionLog[]).map((r) => (
                                                    <TableRow key={r.id} className="transition hover:bg-muted/10">
                                                        <TableCell className="px-3 py-3">
                                                            <p className="font-medium">{r.employee_name}</p>
                                                            <p className="text-xs text-muted-foreground">{r.id_number}</p>
                                                        </TableCell>
                                                        <TableCell className="px-3 py-3 text-muted-foreground">{r.previous_position_name || "—"}</TableCell>
                                                        <TableCell className="px-3 py-3 font-medium">{r.position_name || "—"}</TableCell>
                                                        <TableCell className="px-3 py-3 text-center">
                                                            {r.salary_rate ? (
                                                                <span className="flex items-center justify-center gap-1 text-xs">
                                                                    <span className="text-muted-foreground">{peso(r.previous_salary_rate)}</span>
                                                                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                                                    <span className="font-medium">{peso(r.salary_rate)}</span>
                                                                </span>
                                                            ) : (
                                                                <span className="text-muted-foreground">—</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="px-3 py-3 text-center">{safeFormat(r.effective_date)}</TableCell>
                                                        <TableCell className="px-3 py-3 text-center text-muted-foreground">{safeFormat(r.created_at)}</TableCell>
                                                        <TableCell className="px-3 py-3 text-center"><PromotionDetail log={r} /></TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                                                        No promotion submissions found.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                                <Pagination
                                    currentPage={promotionPag.currentPage}
                                    setCurrentPage={promotionPag.setCurrentPage}
                                    totalPages={promotionPag.totalPages}
                                    pageNumbers={promotionPag.pageNumbers}
                                    pageSize={pageSize}
                                    setPageSize={setPageSize}
                                    onPageSizeChange={resetAll}
                                />
                            </TabsContent>

                            {/* ── DEPT ── */}
                            <TabsContent value="dept">
                                <div className="overflow-x-auto rounded-md border border-border">
                                    <Table className="min-w-[650px] text-xs sm:text-sm">
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead className="px-3 py-3">Employee</TableHead>
                                                <TableHead className="px-3 py-3">Previous Department</TableHead>
                                                <TableHead className="px-3 py-3">New Department</TableHead>
                                                <TableHead className="px-3 py-3 text-center">Effective Date</TableHead>
                                                <TableHead className="px-3 py-3 text-center">Submitted On</TableHead>
                                                <TableHead className="px-3 py-3 text-center">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(deptPag.paginated as DeptLog[]).length > 0 ? (
                                                (deptPag.paginated as DeptLog[]).map((r) => (
                                                    <TableRow key={r.id} className="transition hover:bg-muted/10">
                                                        <TableCell className="px-3 py-3">
                                                            <p className="font-medium">{r.employee_name}</p>
                                                            <p className="text-xs text-muted-foreground">{r.id_number}</p>
                                                        </TableCell>
                                                        <TableCell className="px-3 py-3 text-muted-foreground">{r.previous_department_name || "—"}</TableCell>
                                                        <TableCell className="px-3 py-3 font-medium">{r.department_name || "—"}</TableCell>
                                                        <TableCell className="px-3 py-3 text-center">{safeFormat(r.effective_date)}</TableCell>
                                                        <TableCell className="px-3 py-3 text-center text-muted-foreground">{safeFormat(r.created_at)}</TableCell>
                                                        <TableCell className="px-3 py-3 text-center"><DeptDetail log={r} /></TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                                                        No department transfer submissions found.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                                <Pagination
                                    currentPage={deptPag.currentPage}
                                    setCurrentPage={deptPag.setCurrentPage}
                                    totalPages={deptPag.totalPages}
                                    pageNumbers={deptPag.pageNumbers}
                                    pageSize={pageSize}
                                    setPageSize={setPageSize}
                                    onPageSizeChange={resetAll}
                                />
                            </TabsContent>

                            {/* ── RESIGNATION ── */}
                            <TabsContent value="resignation">
                                <div className="overflow-x-auto rounded-md border border-border">
                                    <Table className="min-w-[650px] text-xs sm:text-sm">
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead className="px-3 py-3">Employee</TableHead>
                                                <TableHead className="px-3 py-3">Reason</TableHead>
                                                <TableHead className="px-3 py-3 text-center">Resignation Date</TableHead>
                                                <TableHead className="px-3 py-3 text-center">Last Working Day</TableHead>
                                                <TableHead className="px-3 py-3 text-center">Submitted On</TableHead>
                                                <TableHead className="px-3 py-3 text-center">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(resignationPag.paginated as ResignationLog[]).length > 0 ? (
                                                (resignationPag.paginated as ResignationLog[]).map((r) => (
                                                    <TableRow key={r.id} className="transition hover:bg-muted/10">
                                                        <TableCell className="px-3 py-3">
                                                            <p className="font-medium">{r.employee_name}</p>
                                                            <p className="text-xs text-muted-foreground">{r.id_number}</p>
                                                        </TableCell>
                                                        <TableCell className="px-3 py-3 max-w-[200px] truncate text-muted-foreground">
                                                            {r.remarks?.split("\n")[0] || "—"}
                                                        </TableCell>
                                                        <TableCell className="px-3 py-3 text-center">{safeFormat(r.resignation_date)}</TableCell>
                                                        <TableCell className="px-3 py-3 text-center">{safeFormat(r.last_working_day)}</TableCell>
                                                        <TableCell className="px-3 py-3 text-center text-muted-foreground">{safeFormat(r.created_at)}</TableCell>
                                                        <TableCell className="px-3 py-3 text-center"><ResignationDetail log={r} /></TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                                                        No resignation submissions found.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                                <Pagination
                                    currentPage={resignationPag.currentPage}
                                    setCurrentPage={resignationPag.setCurrentPage}
                                    totalPages={resignationPag.totalPages}
                                    pageNumbers={resignationPag.pageNumbers}
                                    pageSize={pageSize}
                                    setPageSize={setPageSize}
                                    onPageSizeChange={resetAll}
                                />
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </ParentComponent>
    );
}
