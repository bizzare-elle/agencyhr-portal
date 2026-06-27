import { ParentComponent } from "@/components/parent-container";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import api from "@/lib/axios";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ApiResponse } from "@/index";
import FullPageLoader from "@/components/page-loader";
import { formatToPeso } from "@/helpers/formatToPeso";
import { format, subMonths } from "date-fns";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    IconUsersGroup,
    IconUserCheck,
    IconMoneybag,
    IconChevronDown,
    IconChevronRight,
    IconAlertCircle,
} from "@tabler/icons-react";
import { useState as useLocalState } from "react";

interface Downline {
    id: string;
    name: string;
    agency: string;
    position: string;
    bonus_amount: string;
    is_active: boolean;
    layer: 1 | 2;
    mentor_name?: string;
}

interface BonusMonth {
    month_year: string;
    total_bonus: string;
    is_eligible: boolean;
    mentor_name: string;
    l1_count: number;
    l2_count: number;
    downlines: Downline[];
}

interface DownlineResponse {
    months: BonusMonth[];
}

function buildMonthOptions() {
    const opts: { value: string; label: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
        const d = subMonths(now, i);
        opts.push({
            value: format(d, "yyyy-MM"),
            label: format(d, "MMMM yyyy"),
        });
    }
    return opts;
}

const MONTH_OPTIONS = buildMonthOptions();

export default function DownlinePage() {
    const [selectedMonth, setSelectedMonth] = useState(MONTH_OPTIONS[1].value);
    const [expandedL1, setExpandedL1] = useLocalState<Set<string>>(new Set());

    const meQuery = useQuery({
        queryKey: ["me"],
        queryFn: async () => {
            const res = await api.get<ApiResponse<{
                hr_id: string;
                name: string;
                id_number?: string;
                primary_branch_name?: string;
                agency_name?: string;
            }>>("/api/v2/auth/me");
            return res.data.data;
        },
    });

    const employeeId = meQuery.data?.hr_id;

    const downlineQuery = useQuery({
        queryKey: ["chef-downlines", employeeId, selectedMonth],
        queryFn: async () => {
            const res = await api.get<ApiResponse<DownlineResponse>>(
                `/api/v2/chef-bonus/my-downlines/${employeeId}`,
                { params: { month: selectedMonth } },
            );
            return res.data.data ?? { months: [] };
        },
        enabled: !!employeeId,
    });

    const monthData: BonusMonth | null =
        downlineQuery.data?.months?.find((m) => m.month_year === selectedMonth) ?? null;

    const l1s = monthData?.downlines.filter((d) => d.layer === 1) ?? [];
    const l2s = monthData?.downlines.filter((d) => d.layer === 2) ?? [];

    const totalBonus = parseFloat(monthData?.total_bonus ?? "0");

    const toggleL1 = (name: string) => {
        setExpandedL1((prev) => {
            const next = new Set(prev);
            if (next.has(name)) next.delete(name);
            else next.add(name);
            return next;
        });
    };

    if (meQuery.isLoading) return <FullPageLoader />;

    const me = meQuery.data;

    return (
        <ParentComponent>
            {/* Header card */}
            <div className="mb-5 w-full px-3 sm:px-0">
                <Card className="rounded-xl border p-4 shadow-sm sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-center sm:text-left">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-yellow-500/20 text-lg font-bold text-yellow-400 sm:h-16 sm:w-16 sm:text-2xl">
                                {me?.name?.charAt(0) ?? "?"}
                            </div>
                            <div>
                                <div className="flex flex-col items-center gap-1 sm:flex-row sm:gap-2">
                                    <h1 className="text-base font-bold tracking-wide sm:text-lg md:text-xl">
                                        {me?.name ?? "N/A"}
                                    </h1>
                                    {me?.agency_name && (
                                        <Badge className="text-xs sm:text-sm">{me.agency_name}</Badge>
                                    )}
                                    <Badge variant="outline" className="border-yellow-500/40 text-yellow-400 text-xs">
                                        Chef / Mentor
                                    </Badge>
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                                    ID: {me?.id_number ?? "N/A"} &bull; {me?.primary_branch_name ?? "N/A"}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col items-center sm:items-end">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                                Bonus Earned
                            </p>
                            <p className="text-2xl font-bold text-green-400 sm:text-3xl">
                                {formatToPeso(totalBonus)}
                            </p>
                            {monthData && !monthData.is_eligible && (
                                <p className="mt-1 text-xs font-semibold text-red-400">
                                    Disqualified — Incident Report
                                </p>
                            )}
                        </div>
                    </div>
                </Card>
            </div>

            <div className="w-full px-3 sm:px-0 space-y-5">
                {/* Period selector */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h2 className="flex items-center gap-2 text-base font-semibold sm:text-lg">
                            <IconUsersGroup className="size-5 text-primary" />
                            My Downline
                        </h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Chef Train &amp; Maintain bonus breakdown
                        </p>
                    </div>
                    <div className="w-full sm:w-auto">
                        <label className="mb-1 block text-sm font-medium">Period</label>
                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                            <SelectTrigger className="w-full sm:w-[200px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {MONTH_OPTIONS.map((o) => (
                                    <SelectItem key={o.value} value={o.value}>
                                        {o.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* KPI tiles */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <KpiTile
                        label="1st Layer"
                        value={String(l1s.length)}
                        sub="₱250 each"
                        color="blue"
                    />
                    <KpiTile
                        label="2nd Layer"
                        value={String(l2s.length)}
                        sub="₱100 each"
                        color="purple"
                    />
                    <KpiTile
                        label="L1 Total"
                        value={formatToPeso(l1s.length * 250)}
                        sub="gross bonus"
                        color="green"
                    />
                    <KpiTile
                        label="L2 Total"
                        value={formatToPeso(l2s.length * 100)}
                        sub="gross bonus"
                        color="yellow"
                    />
                </div>

                {/* Eligibility notice */}
                {monthData && !monthData.is_eligible && (
                    <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
                        <IconAlertCircle className="mt-0.5 size-4 shrink-0" />
                        <div>
                            <p className="font-semibold">Disqualified for this period</p>
                            <p className="mt-0.5 text-red-400/80">
                                An active Incident Report was filed during this period. No bonus is earned.
                            </p>
                        </div>
                    </div>
                )}

                {/* Downline list */}
                {downlineQuery.isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                ) : l1s.length === 0 ? (
                    <Card className="border bg-card">
                        <CardContent className="py-12 text-center text-muted-foreground">
                            <IconUsersGroup className="mx-auto mb-3 size-10 opacity-30" />
                            <p className="font-medium">No downline data for this period.</p>
                            <p className="mt-1 text-sm">Bonus data appears once the period is computed.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="border bg-card">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold">
                                Downline Breakdown — {MONTH_OPTIONS.find((o) => o.value === selectedMonth)?.label}
                            </CardTitle>
                            <CardDescription className="text-xs">
                                {l1s.length} first-layer &bull; {l2s.length} second-layer downlines
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2 p-3 pt-0">
                            {l1s.map((l1) => {
                                const children = l2s.filter(
                                    (l2) => l2.mentor_name === l1.name,
                                );
                                const isOpen = expandedL1.has(l1.name);

                                return (
                                    <div key={l1.id} className="rounded-lg border border-border overflow-hidden">
                                        {/* L1 row */}
                                        <button
                                            type="button"
                                            onClick={() => toggleL1(l1.name)}
                                            className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/10 transition-colors"
                                        >
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-xs font-bold text-blue-400">
                                                {l1.name.charAt(0)}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <span className="text-sm font-semibold truncate">
                                                        {l1.name}
                                                    </span>
                                                    <span className="rounded border border-blue-500/30 bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-bold text-blue-400">
                                                        1st Layer
                                                    </span>
                                                    {!l1.is_active && (
                                                        <span className="rounded border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold text-red-400">
                                                            Excluded
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                                    {l1.position} &bull; {l1.agency}
                                                    {children.length > 0 && ` &bull; ${children.length} L2`}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                                <span className={`text-sm font-bold ${l1.is_active ? "text-green-400" : "text-muted-foreground line-through"}`}>
                                                    {formatToPeso(parseFloat(l1.bonus_amount))}
                                                </span>
                                                {children.length > 0 ? (
                                                    isOpen
                                                        ? <IconChevronDown className="size-4 text-muted-foreground" />
                                                        : <IconChevronRight className="size-4 text-muted-foreground" />
                                                ) : (
                                                    <span className="w-4" />
                                                )}
                                            </div>
                                        </button>

                                        {/* L2 children */}
                                        {isOpen && children.length > 0 && (
                                            <div className="border-t border-border bg-muted/5">
                                                {children.map((l2) => (
                                                    <div
                                                        key={l2.id}
                                                        className="flex items-center gap-3 px-4 py-2.5 pl-14 border-b border-border/50 last:border-0"
                                                    >
                                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-500/15 text-[10px] font-bold text-purple-400">
                                                            {l2.name.charAt(0)}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex flex-wrap items-center gap-1.5">
                                                                <span className="text-xs font-semibold truncate">
                                                                    {l2.name}
                                                                </span>
                                                                <span className="rounded border border-purple-500/30 bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-bold text-purple-400">
                                                                    2nd Layer
                                                                </span>
                                                                {!l2.is_active && (
                                                                    <span className="rounded border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold text-red-400">
                                                                        Excluded
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                                                                {l2.position} &bull; {l2.agency}
                                                            </p>
                                                        </div>
                                                        <span className={`text-xs font-bold shrink-0 ${l2.is_active ? "text-green-400" : "text-muted-foreground line-through"}`}>
                                                            {formatToPeso(parseFloat(l2.bonus_amount))}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Grand total */}
                            <div className="mt-2 flex items-center justify-between rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <IconMoneybag className="size-4 text-green-400" />
                                    <span className="text-sm font-semibold">Total Bonus Earned</span>
                                </div>
                                <span className="text-lg font-bold text-green-400">
                                    {formatToPeso(totalBonus)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </ParentComponent>
    );
}

function KpiTile({
    label,
    value,
    sub,
    color,
}: {
    label: string;
    value: string;
    sub: string;
    color: "blue" | "purple" | "green" | "yellow";
}) {
    const colors = {
        blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        green: "bg-green-500/10 text-green-400 border-green-500/20",
        yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    };

    return (
        <div className={`rounded-lg border p-3 text-center ${colors[color]}`}>
            <p className="text-[10px] font-semibold uppercase tracking-widest opacity-70">{label}</p>
            <p className="mt-1 text-xl font-bold sm:text-2xl">{value}</p>
            <p className="mt-0.5 text-[10px] opacity-60">{sub}</p>
        </div>
    );
}
