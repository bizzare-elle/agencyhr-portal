import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    ShieldCheck,
    Users,
    UserCheck,
    Loader2,
    Pencil,
    Trash2,
    Plus,
    X,
    ChevronDown,
    Check,
    UserPlus,
    Eye,
    EyeOff,
    Wifi,
    WifiOff,
    Search,
    Settings,
    LayoutDashboard,
    Building2,
    Briefcase,
} from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import api from "@/lib/axios";
import { ApiResponse } from "@/index";
import { ParentComponent } from "@/components/parent-container";
import FullPageLoader from "@/components/page-loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
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
import { useQuery as useMe } from "@tanstack/react-query";
import { ALL_TABS, TabDef, STANDARD_PERMISSIONS } from "@/lib/tabs";

// ── Types ──────────────────────────────────────────────────────────────────────

interface EmployeeRow {
    id: number;
    name: string;
    email: string;
    status: string;
    is_agency_coor: number;
    is_admin: number;
    can_work_remotely: number;
    branch_id: number | null;
    branch_name: string | null;
    position_name: string | null;
    role: string;
}

interface ApproverCandidate {
    employee_id: number;
    user_id: number;
    name: string;
    branch_name: string | null;
}

interface ApproverRow {
    id: number;
    branch_id: number | null;
    branch_name: string | null;
    approver_1: string;
    approver_2: string;
    is_active: number;
    created_at: string;
    approver_1_names: { user_id: number; name: string }[];
    approver_2_names: { user_id: number; name: string }[];
}

interface BranchRow {
    id: number;
    name: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const initials = (name?: string | null) =>
    name
        ? name.trim().split(/\s+/).map((w) => w[0]).join("").toUpperCase().slice(0, 2)
        : "?";

function RoleBadge({ role, isAdmin }: { role: string; isAdmin: number }) {
    return (
        <div className="flex flex-wrap gap-1">
            {isAdmin === 1 && (
                <Badge className="border-0 bg-purple-500/15 px-2 py-0.5 text-xs text-purple-400">
                    Admin
                </Badge>
            )}
            <Badge
                className={
                    role === "agency_coordinator"
                        ? "border-0 bg-blue-500/15 px-2 py-0.5 text-xs text-blue-400"
                        : "border-0 bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground"
                }
            >
                {role === "agency_coordinator" ? "Coordinator" : "HR Employee"}
            </Badge>
        </div>
    );
}

// ── Create Account Dialog ─────────────────────────────────────────────────────

function CreateAccountDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
    const queryClient = useQueryClient();
    const [firstname, setFirstname] = useState("");
    const [lastname, setLastname] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const reset = () => {
        setFirstname(""); setLastname(""); setEmail(""); setPassword(""); setIsAdmin(false); setShowPass(false);
    };

    const mutation = useMutation({
        mutationFn: () =>
            api.post("/api/v2/admin/accounts", {
                firstname,
                lastname,
                email,
                password,
                is_admin: isAdmin ? 1 : 0,
            }),
        onSuccess: () => {
            toast.success("Account created.");
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
            reset();
            onClose();
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || "Failed to create account.");
        },
    });

    const handleClose = () => { reset(); onClose(); };
    const valid = firstname.trim() && lastname.trim() && email.trim() && password.length >= 6;

    return (
        <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4" />
                        Create Account
                    </DialogTitle>
                    <DialogDescription>
                        Creates a new agency account. Employment status will be set to inactive — the account is for portal access only.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">First Name <span className="text-destructive">*</span></label>
                            <input
                                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                                value={firstname}
                                onChange={(e) => setFirstname(e.target.value)}
                                placeholder="Juan"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Last Name <span className="text-destructive">*</span></label>
                            <input
                                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                                value={lastname}
                                onChange={(e) => setLastname(e.target.value)}
                                placeholder="Dela Cruz"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Email <span className="text-destructive">*</span></label>
                        <input
                            type="email"
                            className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="juan@example.com"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Password <span className="text-destructive">*</span></label>
                        <div className="relative">
                            <input
                                type={showPass ? "text" : "password"}
                                className="border-input bg-background w-full rounded-md border px-3 py-2 pr-10 text-sm"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Min. 6 characters"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass(!showPass)}
                                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                                tabIndex={-1}
                            >
                                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-muted/10 transition">
                        <input
                            type="checkbox"
                            className="h-4 w-4 accent-purple-500"
                            checked={isAdmin}
                            onChange={(e) => setIsAdmin(e.target.checked)}
                        />
                        <div>
                            <p className="text-sm font-medium">Grant Admin Access</p>
                            <p className="text-muted-foreground text-xs">This account will have full access to the Admin Panel.</p>
                        </div>
                    </label>

                    <div className="flex justify-end gap-2 pt-1">
                        <Button variant="outline" onClick={handleClose}>Cancel</Button>
                        <Button
                            disabled={!valid || mutation.isPending}
                            onClick={() => mutation.mutate()}
                        >
                            {mutation.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                            Create Account
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ── Access lists tab ───────────────────────────────────────────────────────────

const ACCESS_PAGE_SIZE = 5;

function PaginatedAccessCard({
    label,
    icon: Icon,
    bg,
    iconBg,
    badgeColor,
    items,
}: {
    label: string;
    icon: React.ElementType;
    bg: string;
    iconBg: string;
    badgeColor: string;
    items: EmployeeRow[];
}) {
    const [page, setPage] = useState(1);
    const totalPages = Math.max(1, Math.ceil(items.length / ACCESS_PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const slice = items.slice((safePage - 1) * ACCESS_PAGE_SIZE, safePage * ACCESS_PAGE_SIZE);

    return (
        <Card className={`border ${bg} flex flex-col`}>
            <CardHeader className="pb-3 pt-4 px-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg}`}>
                            <Icon className="h-4 w-4" />
                        </div>
                        <CardTitle className="text-sm font-semibold">{label}</CardTitle>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badgeColor}`}>
                        {items.length}
                    </span>
                </div>
            </CardHeader>

            <CardContent className="flex flex-1 flex-col px-4 pb-4">
                {items.length === 0 ? (
                    <p className="text-muted-foreground py-4 text-center text-xs">None assigned</p>
                ) : (
                    <>
                        <ul className="flex-1 divide-y divide-border/40">
                            {slice.map((u) => (
                                <li key={u.id} className="flex items-center gap-2.5 py-2.5">
                                    <div className="bg-primary/15 text-primary flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
                                        {u.name.split(",").map((p: string) => p.trim()[0]).join("").slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-xs font-medium leading-tight">{u.name}</p>
                                        <p className="text-muted-foreground truncate text-[11px]">
                                            {u.branch_name || "No branch"}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        {totalPages > 1 && (
                            <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-3">
                                <button
                                    disabled={safePage === 1}
                                    onClick={() => setPage((p) => p - 1)}
                                    className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed text-xs px-1"
                                >
                                    ← Prev
                                </button>
                                <span className="text-muted-foreground text-xs">
                                    {safePage} / {totalPages}
                                </span>
                                <button
                                    disabled={safePage === totalPages}
                                    onClick={() => setPage((p) => p + 1)}
                                    className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed text-xs px-1"
                                >
                                    Next →
                                </button>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}

function AccessListsTab() {
    const { data: users = [], isLoading } = useQuery<EmployeeRow[]>({
        queryKey: ["admin-users"],
        queryFn: async () => {
            const res = await api.get<ApiResponse<EmployeeRow[]>>("/api/v2/admin/users");
            return res.data.data ?? [];
        },
    });

    const coordinators  = useMemo(() => users.filter((u) => u.is_agency_coor   === 1), [users]);
    const admins        = useMemo(() => users.filter((u) => u.is_admin          === 1), [users]);
    const remoteWorkers = useMemo(() => users.filter((u) => u.can_work_remotely === 1), [users]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
            </div>
        );
    }

    const sections = [
        { key: "coors",  label: "Coordinators",   icon: UserCheck,  bg: "bg-blue-500/10 border-blue-500/20",   iconBg: "bg-blue-500/15 text-blue-400",   badgeColor: "bg-blue-500/15 text-blue-400",   items: coordinators  },
        { key: "admins", label: "Admins",          icon: ShieldCheck, bg: "bg-violet-500/10 border-violet-500/20", iconBg: "bg-violet-500/15 text-violet-400", badgeColor: "bg-violet-500/15 text-violet-400", items: admins        },
        { key: "remote", label: "Remote Workers",  icon: Wifi,       bg: "bg-teal-500/10 border-teal-500/20",   iconBg: "bg-teal-500/15 text-teal-400",   badgeColor: "bg-teal-500/15 text-teal-400",   items: remoteWorkers },
    ];

    return (
        <div className="grid gap-4 sm:grid-cols-3">
            {sections.map((s) => (
                <PaginatedAccessCard {...s} />
            ))}
        </div>
    );
}

// ── Searchable select ──────────────────────────────────────────────────────────

function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = "Select…",
    emptyLabel = "— None —",
}: {
    options: { id: number; name: string }[];
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    emptyLabel?: string;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return options;
        return options.filter((o) => o.name.toLowerCase().includes(q));
    }, [options, query]);

    const selected = options.find((o) => String(o.id) === value);

    return (
        <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setQuery(""); }}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className="bg-background border-border flex w-full items-center justify-between rounded-lg border px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                >
                    <span className={selected ? "text-foreground" : "text-muted-foreground"}>
                        {selected ? selected.name : placeholder}
                    </span>
                    <ChevronDown className="text-muted-foreground h-3.5 w-3.5 flex-shrink-0" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                align="start"
                className="w-[--radix-popover-trigger-width] p-0"
                style={{ width: "var(--radix-popover-trigger-width)" }}
            >
                {/* Search input */}
                <div className="border-b px-2 py-1.5">
                    <div className="flex items-center gap-1.5">
                        <Search className="text-muted-foreground h-3.5 w-3.5 flex-shrink-0" />
                        <input
                            autoFocus
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search branch…"
                            className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                        />
                        {query && (
                            <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground">
                                <X className="h-3 w-3" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Options */}
                <div className="max-h-48 overflow-y-auto py-1">
                    {/* None option */}
                    <button
                        type="button"
                        onClick={() => { onChange(""); setOpen(false); setQuery(""); }}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-muted/40"
                    >
                        <Check className={`h-3.5 w-3.5 flex-shrink-0 ${!value ? "opacity-100 text-primary" : "opacity-0"}`} />
                        <span className="text-muted-foreground italic">{emptyLabel}</span>
                    </button>

                    {filtered.length === 0 ? (
                        <p className="text-muted-foreground px-3 py-2 text-xs">No results</p>
                    ) : (
                        filtered.map((o) => (
                            <button
                                key={o.id}
                                type="button"
                                onClick={() => { onChange(String(o.id)); setOpen(false); setQuery(""); }}
                                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-muted/40"
                            >
                                <Check className={`h-3.5 w-3.5 flex-shrink-0 ${String(o.id) === value ? "opacity-100 text-primary" : "opacity-0"}`} />
                                <span>{o.name}</span>
                            </button>
                        ))
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}

// ── Employee detail drawer ─────────────────────────────────────────────────────

function AccessToggleCard({
    icon: Icon,
    label,
    description,
    active,
    activeLabel,
    inactiveLabel,
    disabled,
    onClick,
    danger,
}: {
    icon: React.ElementType;
    label: string;
    description: string;
    active: boolean;
    activeLabel: string;
    inactiveLabel: string;
    disabled: boolean;
    onClick: () => void;
    danger?: boolean;
}) {
    return (
        <button
            disabled={disabled}
            onClick={onClick}
            className={`w-full rounded-xl border p-3.5 text-left transition-all hover:border-primary/40 hover:bg-muted/10 disabled:opacity-50 disabled:cursor-not-allowed ${
                active && danger ? "border-red-500/30 bg-red-500/5" : active ? "border-primary/30 bg-primary/5" : "border-border"
            }`}
        >
            <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
                    active && danger ? "bg-red-500/15 text-red-400" : active ? "bg-primary/15 text-primary" : "bg-muted/40 text-muted-foreground"
                }`}>
                    {disabled ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-tight">{label}</p>
                    <p className="text-muted-foreground mt-0.5 text-xs">{description}</p>
                </div>
                <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    active && danger
                        ? "bg-red-500/15 text-red-400"
                        : active
                        ? "bg-green-500/15 text-green-400"
                        : "bg-muted/40 text-muted-foreground"
                }`}>
                    {active ? activeLabel : inactiveLabel}
                </span>
            </div>
        </button>
    );
}

function EmployeeDrawer({
    user,
    meId,
    onClose,
    roleMutation,
    adminMutation,
    remoteMutation,
    branchMutation,
}: {
    user: EmployeeRow | null;
    meId: number;
    onClose: () => void;
    roleMutation: any;
    adminMutation: any;
    remoteMutation: any;
    branchMutation: any;
}) {
    const [pendingBranch, setPendingBranch] = useState<string>("");

    const { data: branches = [] } = useQuery<{ id: number; name: string }[]>({
        queryKey: ["admin-branches"],
        queryFn: async () => {
            const res = await api.get<ApiResponse<{ id: number; name: string }[]>>("/api/v2/admin/branches");
            return res.data.data ?? [];
        },
        staleTime: 5 * 60 * 1000,
    });

    // Sync local select value when user or branches change
    React.useEffect(() => {
        setPendingBranch(user?.branch_id ? String(user.branch_id) : "");
    }, [user?.id, user?.branch_id]);

    if (!user) return null;

    const handleBranchSave = () => {
        branchMutation.mutate({
            id: user.id,
            branch_id: pendingBranch ? Number(pendingBranch) : null,
        });
    };

    const branchDirty = pendingBranch !== (user.branch_id ? String(user.branch_id) : "");

    return (
        <Sheet open={!!user} onOpenChange={(o) => !o && onClose()}>
            <SheetContent side="right" className="flex w-80 flex-col gap-0 p-0 sm:w-96">

                {/* Header */}
                <div className="border-b bg-muted/20 px-5 pb-5 pt-6">
                    <SheetHeader className="mb-0">
                        <SheetTitle className="sr-only">{user.name}</SheetTitle>
                        <SheetDescription className="sr-only">{user.email}</SheetDescription>
                    </SheetHeader>
                    <div className="flex items-center gap-3.5">
                        <div className="bg-primary/20 text-primary flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl text-base font-bold">
                            {initials(user.name)}
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-base font-semibold leading-tight">{user.name}</p>
                            <p className="text-muted-foreground mt-0.5 truncate text-xs">{user.email}</p>
                            <div className="mt-1.5">
                                <RoleBadge role={user.role} isAdmin={user.is_admin} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info */}
                <div className="border-b px-5 py-4">
                    <p className="text-muted-foreground mb-3 text-[11px] font-semibold uppercase tracking-wider">Details</p>
                    <div className="divide-y divide-border/50">
                        <div className="flex items-center justify-between py-2">
                            <span className="text-muted-foreground text-xs">Branch</span>
                            <span className="text-xs font-medium">{user.branch_name || "—"}</span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <span className="text-muted-foreground text-xs">Position</span>
                            <span className="text-xs font-medium">{user.position_name || "—"}</span>
                        </div>
                    </div>
                </div>

                {/* Access controls */}
                <div className="flex-1 overflow-y-auto px-5 py-4">
                    <p className="text-muted-foreground mb-3 text-[11px] font-semibold uppercase tracking-wider">Access Controls</p>
                    <div className="space-y-2.5">
                        <AccessToggleCard
                            icon={UserCheck}
                            label="Coordinator Role"
                            description="Can manage agency employees and schedules"
                            active={!!user.is_agency_coor}
                            activeLabel="Coordinator"
                            inactiveLabel="Employee"
                            disabled={roleMutation.isPending}
                            onClick={() => roleMutation.mutate({ id: user.id, is_agency_coor: user.is_agency_coor ? 0 : 1 })}
                        />

                        {user.id !== meId && (
                            <AccessToggleCard
                                icon={ShieldCheck}
                                label="Admin Access"
                                description="Full access to the Admin Panel and settings"
                                active={!!user.is_admin}
                                activeLabel="Admin"
                                inactiveLabel="Off"
                                disabled={adminMutation.isPending}
                                onClick={() => adminMutation.mutate(user.id)}
                                danger
                            />
                        )}

                        <AccessToggleCard
                            icon={user.can_work_remotely ? Wifi : WifiOff}
                            label="Remote Work"
                            description="Clock in/out remotely without a log override"
                            active={!!user.can_work_remotely}
                            activeLabel="Enabled"
                            inactiveLabel="Off"
                            disabled={remoteMutation.isPending}
                            onClick={() => remoteMutation.mutate(user.id)}
                        />

                        {/* Branch assignment — only shown when remote work is on */}
                        {!!user.can_work_remotely && (
                            <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-3.5">
                                <div className="mb-2.5 flex items-center gap-2">
                                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-teal-500/15 text-teal-400">
                                        <UserCheck className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium leading-tight">Remote Branch</p>
                                        <p className="text-muted-foreground text-xs">Assign the branch this employee works at remotely</p>
                                    </div>
                                </div>
                                <SearchableSelect
                                    options={branches}
                                    value={pendingBranch}
                                    onChange={setPendingBranch}
                                    placeholder="— No branch assigned —"
                                    emptyLabel="— No branch assigned —"
                                />
                                {branchDirty && (
                                    <button
                                        disabled={branchMutation.isPending}
                                        onClick={handleBranchSave}
                                        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-teal-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-600 disabled:opacity-50"
                                    >
                                        {branchMutation.isPending
                                            ? <><Loader2 className="h-3 w-3 animate-spin" /> Saving…</>
                                            : "Save Branch"
                                        }
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}

// ── Users Tab ──────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

function UsersTab({ meId }: { meId: number }) {
    const queryClient = useQueryClient();
    const [createOpen, setCreateOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<EmployeeRow | null>(null);

    const { data: users = [], isLoading } = useQuery<EmployeeRow[]>({
        queryKey: ["admin-users"],
        queryFn: async () => {
            const res = await api.get<ApiResponse<EmployeeRow[]>>("/api/v2/admin/users");
            return res.data.data ?? [];
        },
    });

    const roleMutation = useMutation({
        mutationFn: ({ id, is_agency_coor }: { id: number; is_agency_coor: number }) =>
            api.post(`/api/v2/admin/users/${id}/role`, { is_agency_coor }),
        onSuccess: () => {
            toast.success("Role updated.");
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
        },
        onError: () => toast.error("Failed to update role."),
    });

    const adminMutation = useMutation({
        mutationFn: (id: number) => api.post(`/api/v2/admin/users/${id}/toggle-admin`, {}),
        onSuccess: (_, id) => {
            const user = users.find((u) => u.id === id);
            toast.success(user?.is_admin ? "Admin revoked." : "Admin granted.");
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
        },
        onError: () => toast.error("Failed to update admin status."),
    });

    const remoteMutation = useMutation({
        mutationFn: (id: number) => api.post(`/api/v2/admin/users/${id}/toggle-remote`, {}),
        onSuccess: (res) => {
            const granted = res.data?.data?.can_work_remotely === 1 || res.data?.can_work_remotely === 1;
            toast.success(granted ? "Remote access granted." : "Remote access revoked.");
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
        },
        onError: () => toast.error("Failed to update remote access."),
    });

    const branchMutation = useMutation({
        mutationFn: ({ id, branch_id }: { id: number; branch_id: number | null }) =>
            api.post(`/api/v2/admin/users/${id}/branch`, { branch_id }),
        onSuccess: () => {
            toast.success("Branch updated.");
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
        },
        onError: () => toast.error("Failed to update branch."),
    });

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return users;
        return users.filter(
            (u) =>
                u.name.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q) ||
                (u.branch_name ?? "").toLowerCase().includes(q) ||
                (u.position_name ?? "").toLowerCase().includes(q),
        );
    }, [users, search]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    // Sync selected with latest data after mutations
    const selectedLive = selected ? (users.find((u) => u.id === selected.id) ?? null) : null;

    const handleSearch = (v: string) => { setSearch(v); setPage(1); };

    if (isLoading) return <FullPageLoader />;

    return (
        <>
        <Card>
            <CardHeader className="bg-primary/5 border-b px-6 py-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Users className="h-4 w-4" />
                        All Employees ({filtered.length}{search ? ` of ${users.length}` : ""})
                    </CardTitle>
                    <Button size="sm" onClick={() => setCreateOpen(true)}>
                        <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                        Create Account
                    </Button>
                </div>

                {/* Search bar */}
                <div className="relative mt-3">
                    <Search className="text-muted-foreground absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2" />
                    <input
                        className="border-input bg-background w-full rounded-md border py-2 pl-8 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Search by name, email, branch or position…"
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                    {search && (
                        <button
                            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                            onClick={() => handleSearch("")}
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="px-5 py-3 text-xs font-semibold uppercase">Employee</TableHead>
                            <TableHead className="px-4 py-3 text-xs font-semibold uppercase">Branch</TableHead>
                            <TableHead className="px-4 py-3 text-xs font-semibold uppercase">Position</TableHead>
                            <TableHead className="px-4 py-3 text-xs font-semibold uppercase">Role</TableHead>
                            <TableHead className="px-4 py-3 text-xs font-semibold uppercase text-right">Manage</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paged.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-muted-foreground py-10 text-center text-sm">
                                    No employees match your search.
                                </TableCell>
                            </TableRow>
                        ) : paged.map((u) => (
                            <TableRow
                                key={u.id}
                                className="hover:bg-muted/10 cursor-pointer transition"
                                onClick={() => setSelected(u)}
                            >
                                <TableCell className="px-5 py-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="bg-primary/20 text-primary flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold">
                                            {initials(u.name)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium leading-tight">{u.name}</p>
                                            <p className="text-muted-foreground text-xs">{u.email}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground px-4 py-3 text-sm">
                                    {u.branch_name || "—"}
                                </TableCell>
                                <TableCell className="text-muted-foreground px-4 py-3 text-sm">
                                    {u.position_name || "—"}
                                </TableCell>
                                <TableCell className="px-4 py-3">
                                    <RoleBadge role={u.role} isAdmin={u.is_admin} />
                                </TableCell>
                                <TableCell className="px-4 py-3 text-right">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 w-7 p-0"
                                        onClick={(e) => { e.stopPropagation(); setSelected(u); }}
                                    >
                                        <Settings className="h-3.5 w-3.5" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t px-5 py-3">
                        <p className="text-muted-foreground text-xs">
                            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                        </p>
                        <div className="flex items-center gap-1">
                            <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-xs" disabled={page === 1} onClick={() => setPage(1)}>«</Button>
                            <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-xs" disabled={page === 1} onClick={() => setPage(page - 1)}>‹</Button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                                .reduce<(number | "…")[]>((acc, p, i, arr) => {
                                    if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push("…");
                                    acc.push(p);
                                    return acc;
                                }, [])
                                .map((p, i) =>
                                    p === "…" ? (
                                        <span key={`ellipsis-${i}`} className="text-muted-foreground px-1 text-xs">…</span>
                                    ) : (
                                        <Button key={p} size="sm" variant={p === page ? "default" : "outline"} className="h-7 w-7 p-0 text-xs" onClick={() => setPage(p as number)}>{p}</Button>
                                    )
                                )}
                            <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-xs" disabled={page === totalPages} onClick={() => setPage(page + 1)}>›</Button>
                            <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-xs" disabled={page === totalPages} onClick={() => setPage(totalPages)}>»</Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>

        <CreateAccountDialog open={createOpen} onClose={() => { setCreateOpen(false); setPage(1); }} />

        <EmployeeDrawer
            user={selectedLive}
            meId={meId}
            onClose={() => setSelected(null)}
            roleMutation={roleMutation}
            adminMutation={adminMutation}
            remoteMutation={remoteMutation}
            branchMutation={branchMutation}
        />
        </>
    );
}

// ── Approver form dialog ───────────────────────────────────────────────────────

function ApproverFormDialog({
    open,
    onClose,
    editing,
    branches,
    candidates,
}: {
    open: boolean;
    onClose: () => void;
    editing: ApproverRow | null;
    branches: BranchRow[];
    candidates: ApproverCandidate[];
}) {
    const queryClient = useQueryClient();
    const [branchId, setBranchId] = useState<string>(
        editing?.branch_id ? String(editing.branch_id) : "",
    );
    const [a1Ids, setA1Ids] = useState<number[]>(
        editing?.approver_1_names.map((x) => x.user_id) ?? [],
    );
    const [a2Ids, setA2Ids] = useState<number[]>(
        editing?.approver_2_names.map((x) => x.user_id) ?? [],
    );

    const mutation = useMutation({
        mutationFn: () => {
            const form = new FormData();
            if (editing) form.append("id", String(editing.id));
            if (branchId) form.append("branch_id", branchId);
            a1Ids.forEach((id) => form.append("approver_1_user_ids[]", String(id)));
            a2Ids.forEach((id) => form.append("approver_2_user_ids[]", String(id)));
            return api.post("/api/v2/admin/approvers", form);
        },
        onSuccess: () => {
            toast.success(editing ? "Approver updated." : "Approver created.");
            queryClient.invalidateQueries({ queryKey: ["admin-approvers"] });
            onClose();
        },
        onError: () => toast.error("Failed to save."),
    });

    const toggleId = (list: number[], setList: (v: number[]) => void, id: number) => {
        setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
    };

    const nameOf = (userId: number) =>
        candidates.find((c) => c.user_id === userId)?.name ?? `User #${userId}`;

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{editing ? "Edit Approver" : "Add Approver"}</DialogTitle>
                    <DialogDescription>
                        Configure who can approve overtime and log override requests.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Branch */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Branch</label>
                        <select
                            className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                            value={branchId}
                            onChange={(e) => setBranchId(e.target.value)}
                        >
                            <option value="">— Global (all branches) —</option>
                            {branches.map((b) => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Approver 1 */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Approver 1</label>
                        <div className="flex flex-wrap gap-1 mb-1">
                            {a1Ids.map((id) => (
                                <span key={id} className="inline-flex items-center gap-1 rounded border bg-blue-500/10 px-2 py-0.5 text-xs text-blue-400">
                                    {nameOf(id)}
                                    <X className="h-3 w-3 cursor-pointer" onClick={() => toggleId(a1Ids, setA1Ids, id)} />
                                </span>
                            ))}
                        </div>
                        <select
                            className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                            value=""
                            onChange={(e) => {
                                const v = parseInt(e.target.value);
                                if (v) toggleId(a1Ids, setA1Ids, v);
                            }}
                        >
                            <option value="">+ Add approver 1…</option>
                            {candidates
                                .filter((c) => !a1Ids.includes(c.user_id))
                                .map((c) => (
                                    <option key={c.user_id} value={c.user_id}>
                                        {c.name} {c.branch_name ? `(${c.branch_name})` : ""}
                                    </option>
                                ))}
                        </select>
                    </div>

                    {/* Approver 2 */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Approver 2</label>
                        <div className="flex flex-wrap gap-1 mb-1">
                            {a2Ids.map((id) => (
                                <span key={id} className="inline-flex items-center gap-1 rounded border bg-green-500/10 px-2 py-0.5 text-xs text-green-400">
                                    {nameOf(id)}
                                    <X className="h-3 w-3 cursor-pointer" onClick={() => toggleId(a2Ids, setA2Ids, id)} />
                                </span>
                            ))}
                        </div>
                        <select
                            className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                            value=""
                            onChange={(e) => {
                                const v = parseInt(e.target.value);
                                if (v) toggleId(a2Ids, setA2Ids, v);
                            }}
                        >
                            <option value="">+ Add approver 2…</option>
                            {candidates
                                .filter((c) => !a2Ids.includes(c.user_id))
                                .map((c) => (
                                    <option key={c.user_id} value={c.user_id}>
                                        {c.name} {c.branch_name ? `(${c.branch_name})` : ""}
                                    </option>
                                ))}
                        </select>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                        <Button
                            disabled={mutation.isPending}
                            onClick={() => mutation.mutate()}
                        >
                            {mutation.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                            {editing ? "Save Changes" : "Create"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ── Approvers Tab ──────────────────────────────────────────────────────────────

function ApproversTab() {
    const queryClient = useQueryClient();
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<ApproverRow | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const { data: approvers = [], isLoading: apLoading } = useQuery<ApproverRow[]>({
        queryKey: ["admin-approvers"],
        queryFn: async () => {
            const res = await api.get<ApiResponse<ApproverRow[]>>("/api/v2/admin/approvers");
            return res.data.data ?? [];
        },
    });

    const { data: candidates = [] } = useQuery<ApproverCandidate[]>({
        queryKey: ["admin-approver-candidates"],
        queryFn: async () => {
            const res = await api.get<ApiResponse<ApproverCandidate[]>>("/api/v2/admin/approvers/eligible");
            return res.data.data ?? [];
        },
    });

    const { data: branches = [] } = useQuery<BranchRow[]>({
        queryKey: ["admin-branches"],
        queryFn: async () => {
            const res = await api.get<ApiResponse<BranchRow[]>>("/api/v2/admin/branches");
            return res.data.data ?? [];
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => api.post(`/api/v2/admin/approvers/${id}/delete`, {}),
        onSuccess: () => {
            toast.success("Approver removed.");
            queryClient.invalidateQueries({ queryKey: ["admin-approvers"] });
            setDeleteId(null);
        },
        onError: () => toast.error("Failed to remove."),
    });

    const openAdd = () => { setEditing(null); setFormOpen(true); };
    const openEdit = (row: ApproverRow) => { setEditing(row); setFormOpen(true); };

    return (
        <>
            <Card>
                <CardHeader className="bg-primary/5 border-b px-6 py-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <UserCheck className="h-4 w-4" />
                            Approval Assignments ({approvers.length})
                        </CardTitle>
                        <Button size="sm" onClick={openAdd}>
                            <Plus className="mr-1.5 h-3.5 w-3.5" />
                            Add Approver
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {apLoading ? (
                        <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                    ) : approvers.length === 0 ? (
                        <p className="text-muted-foreground py-10 text-center text-sm">No approvers configured yet.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="px-5 py-3 text-xs font-semibold uppercase">Branch</TableHead>
                                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase">Approver 1</TableHead>
                                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase">Approver 2</TableHead>
                                    <TableHead className="px-4 py-3 text-xs font-semibold uppercase text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {approvers.map((row) => (
                                    <TableRow key={row.id} className="hover:bg-muted/10 transition">
                                        <TableCell className="px-5 py-3 text-sm font-medium">
                                            {row.branch_name ?? (
                                                <span className="text-muted-foreground italic">Global</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {row.approver_1_names.length ? row.approver_1_names.map((a) => (
                                                    <Badge key={a.user_id} className="border-0 bg-blue-500/10 text-xs text-blue-400">{a.name}</Badge>
                                                )) : <span className="text-muted-foreground text-xs">—</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {row.approver_2_names.length ? row.approver_2_names.map((a) => (
                                                    <Badge key={a.user_id} className="border-0 bg-green-500/10 text-xs text-green-400">{a.name}</Badge>
                                                )) : <span className="text-muted-foreground text-xs">—</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openEdit(row)}>
                                                    <Pencil className="mr-1 h-3 w-3" /> Edit
                                                </Button>
                                                <Button size="sm" variant="outline" className="h-7 border-red-500/40 text-red-400 text-xs hover:bg-red-500/10" onClick={() => setDeleteId(row.id)}>
                                                    <Trash2 className="mr-1 h-3 w-3" /> Remove
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <ApproverFormDialog
                open={formOpen}
                onClose={() => setFormOpen(false)}
                editing={editing}
                branches={branches}
                candidates={candidates}
            />

            <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove this approver?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove the approver assignment. Existing approved/disapproved records are not affected.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                        >
                            {deleteMutation.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

// ── Tab Access Management ─────────────────────────────────────────────────────

type TargetType = "employee" | "position";

interface PositionRow { id: number; name: string; }

function TabToggleRow({
    tab,
    enabled,
    onChange,
}: {
    tab: TabDef;
    enabled: boolean;
    onChange: (enabled: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between rounded-lg border px-4 py-2.5">
            <div>
                <p className="text-sm font-medium">{tab.label}</p>
                <p className="text-[11px] text-muted-foreground">{tab.section}</p>
            </div>
            <button
                onClick={() => onChange(!enabled)}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                    enabled ? "bg-primary" : "bg-muted"
                }`}
            >
                <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        enabled ? "translate-x-4" : "translate-x-0"
                    }`}
                />
            </button>
        </div>
    );
}

function TabAccessTab() {
    const queryClient = useQueryClient();
    const [targetType, setTargetType] = React.useState<TargetType>("position");
    const [selectedId, setSelectedId] = React.useState<number | null>(null);
    const [permissions, setPermissions] = React.useState<Record<string, boolean>>({});
    const [dirty, setDirty] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [search, setSearch] = React.useState("");

    const { data: users } = useQuery<EmployeeRow[]>({
        queryKey: ["admin-users"],
        queryFn: async () => {
            const res = await api.get<ApiResponse<EmployeeRow[]>>("/api/v2/admin/users");
            return res.data.data ?? [];
        },
    });

    const { data: positions } = useQuery<PositionRow[]>({
        queryKey: ["admin-positions"],
        queryFn: async () => {
            const res = await api.get<ApiResponse<PositionRow[]>>("/api/v2/admin/positions");
            return res.data.data ?? [];
        },
    });

    const { data: savedPerms, isFetching } = useQuery<Record<string, number>>({
        queryKey: ["tab-permissions", targetType, selectedId],
        queryFn: async () => {
            const res = await api.get<ApiResponse<Record<string, number>>>(
                `/api/v2/admin/tab-permissions?target_type=${targetType}&target_id=${selectedId}`,
            );
            return res.data.data ?? {};
        },
        enabled: !!selectedId,
    });

    React.useEffect(() => {
        if (!selectedId) return;
        const map: Record<string, boolean> = {};
        ALL_TABS.forEach((t) => {
            const standard = (STANDARD_PERMISSIONS[t.key] ?? 1) === 1;
            map[t.key] = savedPerms && t.key in savedPerms
                ? savedPerms[t.key] === 1
                : standard;
        });
        setPermissions(map);
        setDirty(false);
    }, [savedPerms, selectedId]);

    const handleResetToStandard = () => {
        const map: Record<string, boolean> = {};
        ALL_TABS.forEach((t) => { map[t.key] = (STANDARD_PERMISSIONS[t.key] ?? 1) === 1; });
        setPermissions(map);
        setDirty(true);
    };

    const handleToggle = (key: string, val: boolean) => {
        setPermissions((p) => ({ ...p, [key]: val }));
        setDirty(true);
    };

    const handleSave = async () => {
        if (!selectedId) return;
        setSaving(true);
        try {
            const payload: Record<string, number> = {};
            ALL_TABS.forEach((t) => { payload[t.key] = permissions[t.key] ? 1 : 0; });
            await api.post("/api/v2/admin/tab-permissions", {
                target_type: targetType,
                target_id: selectedId,
                permissions: payload,
            });
            queryClient.invalidateQueries({ queryKey: ["tab-permissions", targetType, selectedId] });
            queryClient.invalidateQueries({ queryKey: ["me"] });
            setDirty(false);
            toast.success("Tab access saved.");
        } catch {
            toast.error("Failed to save.");
        } finally {
            setSaving(false);
        }
    };

    const sections = Array.from(new Set(ALL_TABS.map((t) => t.section)));
    const allTargets = targetType === "position"
        ? (positions ?? []).map((p) => ({ id: p.id, label: p.name }))
        : (users ?? [])
              .filter((u) => u.role !== "agency_coordinator")
              .map((u) => ({ id: u.id, label: u.name }));

    const targetList = search.trim()
        ? allTargets.filter((t) => t.label.toLowerCase().includes(search.trim().toLowerCase()))
        : allTargets;

    return (
        <div className="grid gap-5 md:grid-cols-[280px_1fr]">
            {/* Left — target picker */}
            <div className="space-y-3">
                <div className="flex rounded-lg border p-1 gap-1">
                    {(["position", "employee"] as TargetType[]).map((t) => (
                        <button
                            key={t}
                            onClick={() => { setTargetType(t); setSelectedId(null); setDirty(false); setSearch(""); }}
                            className={`flex-1 rounded-md py-1.5 text-xs font-semibold capitalize transition-colors ${
                                targetType === t
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                <div className="rounded-lg border overflow-hidden">
                    <div className="border-b px-3 py-2 flex items-center gap-2">
                        <Search className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={`Search ${targetType}s…`}
                            className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                        />
                        {search && (
                            <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground">
                                <X className="h-3 w-3" />
                            </button>
                        )}
                    </div>
                    <div className="max-h-[380px] overflow-y-auto divide-y">
                        {targetList.length === 0 ? (
                            <p className="px-4 py-6 text-center text-xs text-muted-foreground">
                                {search ? "No matches found." : `No ${targetType}s found.`}
                            </p>
                        ) : targetList.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setSelectedId(item.id)}
                                className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                                    selectedId === item.id
                                        ? "bg-primary/10 text-primary font-semibold"
                                        : "hover:bg-muted/30 text-foreground"
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right — toggles */}
            <div>
                {!selectedId ? (
                    <div className="flex h-48 items-center justify-center rounded-xl border border-dashed">
                        <p className="text-sm text-muted-foreground">
                            Select a {targetType} to manage tab access
                        </p>
                    </div>
                ) : isFetching ? (
                    <div className="flex h-48 items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="space-y-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold">
                                    {targetList.find((t) => t.id === selectedId)?.label}
                                </p>
                                <p className="text-xs text-muted-foreground capitalize">{targetType}-level permissions · unset tabs follow standard defaults</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline" onClick={handleResetToStandard} disabled={saving}>
                                    Reset to Standard
                                </Button>
                                {dirty && (
                                    <Button size="sm" onClick={handleSave} disabled={saving}>
                                        {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                                        Save
                                    </Button>
                                )}
                            </div>
                        </div>

                        {sections.map((section) => (
                            <div key={section}>
                                <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                                    {section}
                                </p>
                                <div className="space-y-1.5">
                                    {ALL_TABS.filter((t) => t.section === section).map((tab) => (
                                        <TabToggleRow
                                            key={tab.key}
                                            tab={tab}
                                            enabled={permissions[tab.key] ?? true}
                                            onChange={(v) => handleToggle(tab.key, v)}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

function StatTile({
    label,
    value,
    icon: Icon,
    iconBg,
    iconColor,
    sub,
}: {
    label: string;
    value: number | string;
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
    sub?: string;
}) {
    return (
        <Card>
            <CardContent className="flex items-center gap-4 p-5">
                <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
                    <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>
                <div className="min-w-0">
                    <p className="text-muted-foreground text-xs font-medium">{label}</p>
                    <p className="text-2xl font-bold leading-tight tabular-nums">{value}</p>
                    {sub && <p className="text-muted-foreground mt-0.5 text-[11px]">{sub}</p>}
                </div>
            </CardContent>
        </Card>
    );
}

function DistributionList({
    title,
    icon: Icon,
    items,
    total,
    emptyLabel,
}: {
    title: string;
    icon: React.ElementType;
    items: { label: string; count: number }[];
    total: number;
    emptyLabel: string;
}) {
    const sorted = [...items].sort((a, b) => b.count - a.count).slice(0, 8);
    const max = sorted[0]?.count ?? 1;

    return (
        <Card className="flex flex-col">
            <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary/15">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-sm font-semibold">{title}</span>
            </div>
            <CardContent className="flex-1 px-5 py-4">
                {sorted.length === 0 ? (
                    <p className="text-muted-foreground py-6 text-center text-xs">{emptyLabel}</p>
                ) : (
                    <ul className="space-y-3">
                        {sorted.map((item) => {
                            const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
                            const barPct = max > 0 ? (item.count / max) * 100 : 0;
                            return (
                                <li key={item.label}>
                                    <div className="mb-1 flex items-center justify-between gap-2">
                                        <span className="truncate text-xs font-medium">{item.label || "—"}</span>
                                        <span className="text-muted-foreground flex-shrink-0 text-xs tabular-nums">
                                            {item.count} <span className="opacity-50">({pct}%)</span>
                                        </span>
                                    </div>
                                    <div className="bg-muted/40 h-1.5 w-full overflow-hidden rounded-full">
                                        <div
                                            className="bg-primary/60 h-full rounded-full transition-all duration-500"
                                            style={{ width: `${barPct}%` }}
                                        />
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}

function OverviewTab() {
    const { data: users = [], isLoading } = useQuery<EmployeeRow[]>({
        queryKey: ["admin-users"],
        queryFn: async () => {
            const res = await api.get<ApiResponse<EmployeeRow[]>>("/api/v2/admin/users");
            return res.data.data ?? [];
        },
        staleTime: 60 * 1000,
    });

    const stats = useMemo(() => {
        const total          = users.length;
        const active         = users.filter((u) => String(u.status) === "1").length;
        const coordinators   = users.filter((u) => u.is_agency_coor  === 1).length;
        const admins         = users.filter((u) => u.is_admin         === 1).length;
        const remoteWorkers  = users.filter((u) => u.can_work_remotely === 1).length;
        const employees      = users.filter((u) => u.is_agency_coor  === 0).length;

        const branchMap: Record<string, number> = {};
        const positionMap: Record<string, number> = {};
        for (const u of users) {
            const b = u.branch_name   || "No Branch";
            const p = u.position_name || "No Position";
            branchMap[b]   = (branchMap[b]   ?? 0) + 1;
            positionMap[p] = (positionMap[p] ?? 0) + 1;
        }

        const byBranch   = Object.entries(branchMap).map(([label, count]) => ({ label, count }));
        const byPosition = Object.entries(positionMap).map(([label, count]) => ({ label, count }));

        return { total, active, coordinators, admins, remoteWorkers, employees, byBranch, byPosition };
    }, [users]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
            </div>
        );
    }

    const tiles = [
        { label: "Total Accounts",  value: stats.total,         icon: Users,      iconBg: "bg-blue-500/10",   iconColor: "text-blue-400",   sub: `${stats.active} active` },
        { label: "HR Employees",    value: stats.employees,     icon: UserCheck,  iconBg: "bg-teal-500/10",   iconColor: "text-teal-400",   sub: undefined },
        { label: "Coordinators",    value: stats.coordinators,  icon: Briefcase,  iconBg: "bg-green-500/10",  iconColor: "text-green-400",  sub: undefined },
        { label: "Admins",          value: stats.admins,        icon: ShieldCheck, iconBg: "bg-violet-500/10", iconColor: "text-violet-400", sub: undefined },
        { label: "Remote Workers",  value: stats.remoteWorkers, icon: Wifi,       iconBg: "bg-orange-500/10", iconColor: "text-orange-400", sub: undefined },
    ];

    return (
        <div className="space-y-6">
            {/* KPI tiles */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {tiles.map((t) => (
                    <StatTile key={t.label} {...t} />
                ))}
            </div>

            {/* Distribution */}
            <div className="grid gap-4 md:grid-cols-2">
                <DistributionList
                    title="Employees by Branch"
                    icon={Building2}
                    items={stats.byBranch}
                    total={stats.total}
                    emptyLabel="No branch data."
                />
                <DistributionList
                    title="Employees by Position"
                    icon={Briefcase}
                    items={stats.byPosition}
                    total={stats.total}
                    emptyLabel="No position data."
                />
            </div>

            {/* Role breakdown */}
            <Card>
                <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary/15">
                        <Users className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-sm font-semibold">Access Overview</span>
                </div>
                <CardContent className="grid gap-px divide-y divide-border/40 p-0">
                    {[
                        { label: "Agency Coordinators", count: stats.coordinators, color: "bg-blue-500" },
                        { label: "Admin Accounts",      count: stats.admins,        color: "bg-violet-500" },
                        { label: "Remote Work Enabled", count: stats.remoteWorkers, color: "bg-orange-500" },
                    ].map(({ label, count, color }) => {
                        const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                        return (
                            <div key={label} className="flex items-center gap-4 px-5 py-3.5">
                                <div className={`h-2 w-2 flex-shrink-0 rounded-full ${color}/70`} />
                                <span className="flex-1 text-sm">{label}</span>
                                <span className="text-muted-foreground text-xs tabular-nums">{count} of {stats.total}</span>
                                <div className="bg-muted/40 h-1.5 w-24 overflow-hidden rounded-full">
                                    <div className={`${color}/50 h-full rounded-full`} style={{ width: `${pct}%` }} />
                                </div>
                                <span className="text-muted-foreground w-8 text-right text-xs tabular-nums">{pct}%</span>
                            </div>
                        );
                    })}
                </CardContent>
            </Card>
        </div>
    );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function AdminPanel() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: me, isLoading } = useMe({
        queryKey: ["me"],
        queryFn: async () => {
            const res = await api.get<ApiResponse<{ id: number; name: string; is_admin?: number }>>("/api/v2/auth/me");
            return res.data.data;
        },
    });

    if (isLoading) return <FullPageLoader />;

    if (!me || !me.is_admin) {
        navigate(-1);
        return null;
    }

    return (
        <ParentComponent>
            <div className="space-y-6 px-6 py-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/15">
                        <ShieldCheck className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">Admin Panel</h1>
                        <p className="text-muted-foreground text-sm">
                            Manage user roles and approval assignments.
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="overview">
                    <TabsList className="mb-4">
                        <TabsTrigger value="overview">
                            <LayoutDashboard className="mr-1.5 h-3.5 w-3.5" />
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="users">
                            <Users className="mr-1.5 h-3.5 w-3.5" />
                            Users
                        </TabsTrigger>
                        <TabsTrigger value="access">
                            <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                            Access Lists
                        </TabsTrigger>
                        <TabsTrigger value="approvers">
                            <UserCheck className="mr-1.5 h-3.5 w-3.5" />
                            Approvers
                        </TabsTrigger>
                        <TabsTrigger value="tab-access">
                            <Settings className="mr-1.5 h-3.5 w-3.5" />
                            Tab Access
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview">
                        <OverviewTab />
                    </TabsContent>

                    <TabsContent value="users">
                        <UsersTab meId={me.id} />
                    </TabsContent>

                    <TabsContent value="access">
                        <AccessListsTab />
                    </TabsContent>

                    <TabsContent value="approvers">
                        <ApproversTab />
                    </TabsContent>

                    <TabsContent value="tab-access">
                        <TabAccessTab />
                    </TabsContent>
                </Tabs>
            </div>
        </ParentComponent>
    );
}
