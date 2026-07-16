import { ParentComponent } from "@/components/parent-container";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/axios";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { ApiResponse } from "@/index";
import FullPageLoader from "@/components/page-loader";
import {
    Table,
    TableCell,
    TableBody,
    TableHeader,
    TableRow,
    TableHead,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatToPeso } from "@/helpers/formatToPeso";
import {
    isAfter,
    isBefore,
    getDay,
    format,
    getDaysInMonth,
    addMonths,
    addDays,
    subMonths,
} from "date-fns";
import { PrintSCPayslip } from "@/components/employees/print-service-charge-payslip";
import { PrintTMPayslip } from "@/components/employees/print-tm-payslip";
import { cn } from "@/lib/utils";
import {
    IconReceipt,
    IconMoneybag,
    IconUsersGroup,
    IconAlertCircle,
    IconChevronDown,
    IconChevronRight,
} from "@tabler/icons-react";

/* ─────────────────────────── shared types ─────────────────────────── */

interface MeData {
    hr_id: string;
    name: string;
    id_number?: string;
    primary_branch_name?: string;
    agency_name?: string;
}

/* ─────────────────────────── SC types ─────────────────────────── */

interface ScRecord {
    id: string;
    date: string;
    primary_branch_id: string;
    employee_id: string;
    total_billed_hours: string;
    is_late: string;
    sc_amount_gross: string;
    sc_amount_net: string;
    computation: string | null;
    created_at: string;
    branch_name: string;
    amount_net: string;
}

function parseComputation(comp: string | null) {
    if (!comp) return { pool: null, totalHrs: null };
    const match = comp.match(/[₱]([\d,]+\.?\d*)\s*÷\s*([\d,]+\.?\d*)\s*hrs/);
    if (!match) return { pool: null, totalHrs: null };
    return {
        pool: parseFloat(match[1].replace(/,/g, "")),
        totalHrs: parseFloat(match[2].replace(/,/g, "")),
    };
}

function isWeekend(dateStr: string) {
    const day = getDay(new Date(dateStr + "T00:00:00"));
    return day === 0 || day === 6;
}

/* ─────────────────────────── T&M types ─────────────────────────── */

interface TmDownline {
    id: string;
    name: string;
    agency: string;
    position: string;
    bonus_amount: string;
    is_active: boolean;
    layer: 1 | 2;
    mentor_name?: string;
}

interface TmBonusMonth {
    month_year: string;
    total_bonus: string;
    is_eligible: boolean;
    l1_count: number;
    l2_count: number;
    downlines: TmDownline[];
}

function buildMonthOptions() {
    const opts: { value: string; label: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
        const d = subMonths(now, i);
        opts.push({ value: format(d, "yyyy-MM"), label: format(d, "MMMM yyyy") });
    }
    return opts;
}

const MONTH_OPTIONS = buildMonthOptions();

/* ─────────────────────────── main component ─────────────────────────── */

export default function PayslipCombined() {
    /* SC state */
    const [scPage, setScPage] = useState(1);
    const [scPageSize, setScPageSize] = useState(25);
    const [scSort, setScSort] = useState("oldest");
    const [scCutoff, setScCutoff] = useState("all");

    /* T&M state */
    const [tmMonth, setTmMonth] = useState(MONTH_OPTIONS[1].value);
    const [expandedL1, setExpandedL1] = useState<Set<string>>(new Set());

    /* shared me query */
    const meQuery = useQuery({
        queryKey: ["me"],
        queryFn: async () => {
            const res = await api.get<ApiResponse<MeData>>("/api/v2/auth/me");
            return res.data.data;
        },
    });

    const employeeId = meQuery.data?.hr_id;

    /* SC data */
    const scQuery = useQuery({
        queryKey: ["scPayslip", employeeId],
        queryFn: async () => {
            const res = await api.get<ApiResponse<{ sc_data: ScRecord[] }>>(
                `/api/v2/sc-payslip-records/${employeeId}`,
            );
            return res.data.data ?? { sc_data: [] };
        },
        enabled: !!employeeId,
    });

    /* T&M data */
    const tmQuery = useQuery({
        queryKey: ["chef-downlines", employeeId, tmMonth],
        queryFn: async () => {
            const res = await api.get<ApiResponse<{ months: TmBonusMonth[] }>>(
                `/api/v2/chef-bonus/my-downlines/${employeeId}`,
                { params: { month: tmMonth } },
            );
            return res.data.data ?? { months: [] };
        },
        enabled: !!employeeId,
    });

    /* ── SC derived ── */
    const scRecords: ScRecord[] = scQuery.data?.sc_data ?? [];

    const cutoffPeriods = useMemo(() => {
        const months = new Set<string>();
        scRecords.forEach((r) => {
            months.add(format(new Date(r.date + "T00:00:00"), "yyyy-MM"));
        });
        const periods: { value: string; label: string; from: string; to: string }[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        Array.from(months)
            .sort()
            .reverse()
            .forEach((ym) => {
                const [y, m] = ym.split("-").map(Number);
                const daysInMonth = getDaysInMonth(new Date(y, m - 1));
                const pad = (n: number) => String(n).padStart(2, "0");
                const monthName = format(new Date(y, m - 1), "MMMM");

                const end1 = new Date(y, m - 1, 15);
                if (!isAfter(addDays(addMonths(end1, 2), 1), today)) {
                    periods.push({
                        value: `${ym}-1`,
                        label: `${monthName} 1-15, ${y}`,
                        from: `${ym}-01`,
                        to: `${ym}-15`,
                    });
                }
                const end2 = new Date(y, m - 1, daysInMonth);
                if (!isAfter(addDays(addMonths(end2, 2), 1), today)) {
                    periods.push({
                        value: `${ym}-2`,
                        label: `${monthName} 16-${daysInMonth}, ${y}`,
                        from: `${ym}-16`,
                        to: `${ym}-${pad(daysInMonth)}`,
                    });
                }
            });
        return periods;
    }, [scRecords]);

    const selectedPeriod = cutoffPeriods.find((p) => p.value === scCutoff);

    const scFiltered = useMemo(() => {
        let data = [...scRecords];
        if (scCutoff !== "all" && selectedPeriod) {
            const from = new Date(selectedPeriod.from + "T00:00:00");
            const to = new Date(selectedPeriod.to + "T00:00:00");
            data = data.filter((r) => {
                const d = new Date(r.date + "T00:00:00");
                return !isBefore(d, from) && !isAfter(d, to);
            });
        }
        if (scSort === "newest") data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        else if (scSort === "oldest") data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        else if (scSort === "highest") data.sort((a, b) => parseFloat(b.sc_amount_gross) - parseFloat(a.sc_amount_gross));
        else if (scSort === "lowest") data.sort((a, b) => parseFloat(a.sc_amount_gross) - parseFloat(b.sc_amount_gross));
        return data;
    }, [scRecords, scSort, scCutoff, selectedPeriod]);

    const scTotalNet = useMemo(
        () => scFiltered.reduce((s, r) => s + parseFloat(r.sc_amount_net || "0"), 0),
        [scFiltered],
    );
    const scTotalHrs = useMemo(
        () => scFiltered.reduce((s, r) => s + parseFloat(r.total_billed_hours || "0"), 0),
        [scFiltered],
    );
    const scTotalPages = Math.ceil(scFiltered.length / scPageSize);
    const scPaginated = scFiltered.slice((scPage - 1) * scPageSize, scPage * scPageSize);

    /* ── T&M derived ── */
    const tmMonthData: TmBonusMonth | null =
        tmQuery.data?.months?.find((m) => m.month_year === tmMonth) ?? null;

    const tmL1s = tmMonthData?.downlines.filter((d) => d.layer === 1) ?? [];
    const tmL2s = tmMonthData?.downlines.filter((d) => d.layer === 2) ?? [];
    const tmTotalBonus = parseFloat(tmMonthData?.total_bonus ?? "0");

    const toggleL1 = (name: string) => {
        setExpandedL1((prev) => {
            const next = new Set(prev);
            next.has(name) ? next.delete(name) : next.add(name);
            return next;
        });
    };

    /* ── SC pagination helper ── */
    const renderScPages = () => {
        if (scTotalPages <= 1) return null;
        const pages: (number | string)[] = [];
        const max = 3;
        let start = Math.max(scPage - 2, 1);
        let end = Math.min(start + max - 1, scTotalPages);
        if (end - start + 1 < max) start = Math.max(end - max + 1, 1);
        if (start > 1) { pages.push(1); if (start > 2) pages.push("..."); }
        for (let i = start; i <= end; i++) pages.push(i);
        if (end < scTotalPages) { if (end < scTotalPages - 1) pages.push("..."); pages.push(scTotalPages); }
        return pages.map((p, idx) =>
            typeof p === "number" ? (
                <Button key={p} size="sm" variant={scPage === p ? "default" : "outline"} onClick={() => setScPage(p)}>{p}</Button>
            ) : (
                <span key={"e" + idx} className="px-2">{p}</span>
            ),
        );
    };

    const me = meQuery.data;

    if (meQuery.isLoading) return <FullPageLoader />;

    return (
        <ParentComponent>
            {/* Employee header */}
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
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                                    ID: {me?.id_number ?? "N/A"} &bull; {me?.primary_branch_name ?? "N/A"}
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Tabs */}
            <div className="w-full px-3 sm:px-0">
                <Tabs defaultValue="sc">
                    <TabsList className="mb-4 w-full sm:w-auto">
                        <TabsTrigger value="sc" className="flex items-center gap-1.5">
                            <IconReceipt className="size-4" />
                            Service Charge
                        </TabsTrigger>
                        <TabsTrigger value="tm" className="flex items-center gap-1.5">
                            <IconUsersGroup className="size-4" />
                            Train &amp; Maintain
                        </TabsTrigger>
                    </TabsList>

                    {/* ═══════════════ SERVICE CHARGE TAB ═══════════════ */}
                    <TabsContent value="sc">
                        {scQuery.isLoading ? (
                            <div className="flex justify-center py-16">
                                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            </div>
                        ) : (
                            <Card className="p-3 sm:p-5">
                                <CardHeader className="pb-5">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                                        <div>
                                            <CardTitle className="text-base sm:text-lg">Service Charge Records</CardTitle>
                                            <CardDescription>Daily service charge breakdown</CardDescription>
                                        </div>

                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                                            <div className="w-full sm:w-auto">
                                                <label className="mb-1 block text-sm font-medium">Payout Period</label>
                                                <Select value={scCutoff} onValueChange={(v) => { setScCutoff(v); setScPage(1); }}>
                                                    <SelectTrigger className="w-full sm:w-[240px]">
                                                        <SelectValue placeholder="Select cut-off..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Records</SelectItem>
                                                        {cutoffPeriods.map((p) => (
                                                            <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="w-full sm:w-auto">
                                                <label className="mb-1 block text-sm font-medium">Sort By</label>
                                                <Select value={scSort} onValueChange={(v) => { setScSort(v); setScPage(1); }}>
                                                    <SelectTrigger className="w-full sm:w-[155px]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectGroup>
                                                            <SelectLabel>By Date</SelectLabel>
                                                            <SelectItem value="newest">Newest First</SelectItem>
                                                            <SelectItem value="oldest">Oldest First</SelectItem>
                                                        </SelectGroup>
                                                        <SelectGroup>
                                                            <SelectLabel>By Amount</SelectLabel>
                                                            <SelectItem value="highest">Highest Amount</SelectItem>
                                                            <SelectItem value="lowest">Lowest Amount</SelectItem>
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="w-full sm:w-auto sm:self-end">
                                                <PrintSCPayslip
                                                    tableId="sc-payslip-table"
                                                    employeeName={me?.name ?? ""}
                                                    isHrEmployee={true}
                                                    idNumber={me?.id_number ?? null}
                                                    agencyName={me?.agency_name}
                                                    branchName={me?.primary_branch_name}
                                                    queryFrom={selectedPeriod?.from}
                                                    queryTo={selectedPeriod?.to}
                                                    records={scFiltered}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* SC summary strip */}
                                    {scFiltered.length > 0 && (
                                        <div className="mt-4 flex flex-wrap gap-3">
                                            <div className="rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-2 text-center">
                                                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Total Net SC</p>
                                                <p className="text-lg font-bold text-green-400">{formatToPeso(scTotalNet)}</p>
                                            </div>
                                            <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-2 text-center">
                                                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Total Hours</p>
                                                <p className="text-lg font-bold text-primary">{scTotalHrs.toFixed(2)}</p>
                                            </div>
                                            <div className="rounded-lg border border-border bg-muted/10 px-4 py-2 text-center">
                                                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Days</p>
                                                <p className="text-lg font-bold">{scFiltered.length}</p>
                                            </div>
                                        </div>
                                    )}
                                </CardHeader>

                                <CardContent className="overflow-x-auto">
                                    <div className="border-border w-full overflow-x-auto rounded-md border">
                                        <Table id="sc-payslip-table" className="min-w-[920px] text-xs sm:text-sm">
                                            <TableHeader className="bg-muted/50">
                                                <TableRow>
                                                    <TableHead className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wider">Date</TableHead>
                                                    <TableHead className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wider">Branch / Allocation</TableHead>
                                                    <TableHead className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wider">Daily SC Pool</TableHead>
                                                    <TableHead className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wider">Total Day Hrs</TableHead>
                                                    <TableHead className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wider">Employee Hrs</TableHead>
                                                    <TableHead className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wider">Computation</TableHead>
                                                    <TableHead className="px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-wider">SC Payout</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {scPaginated.length > 0 ? (
                                                    scPaginated.map((r) => {
                                                        const { pool, totalHrs } = parseComputation(r.computation);
                                                        const weekend = isWeekend(r.date);
                                                        const dayLabel = format(new Date(r.date + "T00:00:00"), "EEE, MMM d");
                                                        return (
                                                            <TableRow key={r.id} className={cn("transition", weekend ? "bg-yellow-500/5 hover:bg-yellow-500/10" : "hover:bg-muted/10")}>
                                                                <TableCell className="px-3 py-3 text-center">
                                                                    <div className="font-medium">{dayLabel}</div>
                                                                    {weekend && <div className="text-[10px] font-semibold text-yellow-500">weekend</div>}
                                                                </TableCell>
                                                                <TableCell className="px-3 py-3 text-center font-semibold">
                                                                    {r.branch_name && r.branch_name !== "N/A" ? r.branch_name : (me?.agency_name ?? "---")}
                                                                </TableCell>
                                                                <TableCell className="px-3 py-3 text-center text-primary">
                                                                    {pool !== null ? formatToPeso(pool) : "---"}
                                                                </TableCell>
                                                                <TableCell className="px-3 py-3 text-center">
                                                                    {totalHrs !== null ? totalHrs.toFixed(2) : "---"}
                                                                </TableCell>
                                                                <TableCell className="px-3 py-3 text-center">
                                                                    {parseFloat(r.total_billed_hours).toFixed(2)}
                                                                </TableCell>
                                                                <TableCell className="px-3 py-3 text-center text-muted-foreground">
                                                                    {r.computation ?? "---"}
                                                                </TableCell>
                                                                <TableCell className="px-3 py-3 text-right font-semibold">
                                                                    {formatToPeso(parseFloat(r.sc_amount_net))}
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                                                            No records found.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                            {scFiltered.length > 0 && (
                                                <tfoot>
                                                    <TableRow className="border-t-2 bg-muted/30">
                                                        <TableCell className="px-3 py-3 font-bold" colSpan={4}>
                                                            Total ({scFiltered.length} day{scFiltered.length !== 1 ? "s" : ""})
                                                        </TableCell>
                                                        <TableCell className="px-3 py-3 text-center font-bold text-green-400">
                                                            {scTotalHrs.toFixed(2)}
                                                        </TableCell>
                                                        <TableCell className="px-3 py-3" />
                                                        <TableCell className="px-3 py-3 text-right font-bold text-green-400">
                                                            {formatToPeso(scTotalNet)}
                                                        </TableCell>
                                                    </TableRow>
                                                </tfoot>
                                            )}
                                        </Table>
                                    </div>

                                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex items-center justify-center gap-2 sm:justify-start">
                                            <Label className="text-sm text-muted-foreground">Rows per page:</Label>
                                            <Select value={String(scPageSize)} onValueChange={(v) => { setScPageSize(Number(v)); setScPage(1); }}>
                                                <SelectTrigger className="w-[80px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {[10, 25, 50, 100].map((s) => (
                                                        <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex items-center justify-center gap-2 sm:justify-end">
                                            <Button size="sm" variant="outline" disabled={scPage === 1} onClick={() => setScPage((p) => p - 1)}>Previous</Button>
                                            {renderScPages()}
                                            <Button size="sm" variant="outline" disabled={scPage === scTotalPages || scTotalPages === 0} onClick={() => setScPage((p) => p + 1)}>Next</Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* ═══════════════ TRAIN & MAINTAIN TAB ═══════════════ */}
                    <TabsContent value="tm">
                        <div className="space-y-5">
                            {/* Period selector + heading */}
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <h2 className="flex items-center gap-2 text-base font-semibold sm:text-lg">
                                        <IconMoneybag className="size-5 text-primary" />
                                        Train &amp; Maintain Bonus
                                    </h2>
                                    <p className="mt-0.5 text-sm text-muted-foreground">
                                        Monthly chef bonus &amp; downline breakdown
                                    </p>
                                </div>
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                                    <div className="w-full sm:w-auto">
                                        <label className="mb-1 block text-sm font-medium">Period</label>
                                        <Select value={tmMonth} onValueChange={setTmMonth}>
                                            <SelectTrigger className="w-full sm:w-[200px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {MONTH_OPTIONS.map((o) => (
                                                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="w-full sm:w-auto sm:self-end">
                                        <PrintTMPayslip
                                            employeeName={me?.name ?? ""}
                                            idNumber={me?.id_number ?? null}
                                            agencyName={me?.agency_name}
                                            branchName={me?.primary_branch_name}
                                            monthLabel={MONTH_OPTIONS.find((o) => o.value === tmMonth)?.label ?? tmMonth}
                                            totalBonus={tmTotalBonus}
                                            isEligible={tmMonthData?.is_eligible ?? true}
                                            l1s={tmL1s}
                                            l2s={tmL2s}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* KPI tiles */}
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                <TmKpi label="1st Layer" value={String(tmL1s.length)} sub="₱250 each" color="blue" />
                                <TmKpi label="2nd Layer" value={String(tmL2s.length)} sub="₱100 each" color="purple" />
                                <TmKpi label="L1 Subtotal" value={formatToPeso(tmL1s.length * 250)} sub="gross" color="green" />
                                <TmKpi label="L2 Subtotal" value={formatToPeso(tmL2s.length * 100)} sub="gross" color="yellow" />
                            </div>

                            {/* Eligibility alert */}
                            {tmMonthData && !tmMonthData.is_eligible && (
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
                            {tmQuery.isLoading ? (
                                <div className="flex justify-center py-12">
                                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                </div>
                            ) : tmL1s.length === 0 ? (
                                <Card className="border bg-card">
                                    <CardContent className="py-12 text-center text-muted-foreground">
                                        <IconUsersGroup className="mx-auto mb-3 size-10 opacity-30" />
                                        <p className="font-medium">No bonus data for this period.</p>
                                        <p className="mt-1 text-sm">Data appears once the period is computed by HR.</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card className="border bg-card">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-semibold">
                                            Downline Breakdown — {MONTH_OPTIONS.find((o) => o.value === tmMonth)?.label}
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            {tmL1s.length} first-layer &bull; {tmL2s.length} second-layer downlines
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-2 p-3 pt-0">
                                        {tmL1s.map((l1) => {
                                            const children = tmL2s.filter((l2) => l2.mentor_name === l1.name);
                                            const isOpen = expandedL1.has(l1.name);
                                            return (
                                                <div key={l1.id} className="overflow-hidden rounded-lg border border-border">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleL1(l1.name)}
                                                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/10"
                                                    >
                                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-xs font-bold text-blue-400">
                                                            {l1.name.charAt(0)}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex flex-wrap items-center gap-1.5">
                                                                <span className="truncate text-sm font-semibold">{l1.name}</span>
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
                                                                {children.length > 0 && ` • ${children.length} L2`}
                                                            </p>
                                                        </div>
                                                        <div className="flex shrink-0 items-center gap-2">
                                                            <span className={`text-sm font-bold ${l1.is_active ? "text-green-400" : "text-muted-foreground line-through"}`}>
                                                                {formatToPeso(parseFloat(l1.bonus_amount))}
                                                            </span>
                                                            {children.length > 0 ? (
                                                                isOpen
                                                                    ? <IconChevronDown className="size-4 text-muted-foreground" />
                                                                    : <IconChevronRight className="size-4 text-muted-foreground" />
                                                            ) : <span className="w-4" />}
                                                        </div>
                                                    </button>

                                                    {isOpen && children.length > 0 && (
                                                        <div className="border-t border-border bg-muted/5">
                                                            {children.map((l2) => (
                                                                <div key={l2.id} className="flex items-center gap-3 border-b border-border/50 px-4 py-2.5 pl-14 last:border-0">
                                                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-500/15 text-[10px] font-bold text-purple-400">
                                                                        {l2.name.charAt(0)}
                                                                    </div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="flex flex-wrap items-center gap-1.5">
                                                                            <span className="truncate text-xs font-semibold">{l2.name}</span>
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
                                                                    <span className={`shrink-0 text-xs font-bold ${l2.is_active ? "text-green-400" : "text-muted-foreground line-through"}`}>
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
                                                {formatToPeso(tmTotalBonus)}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            <style>{`
                @media print {
                    [data-sidebar="sidebar"], [data-sidebar="trigger"], [data-sidebar="rail"] { display: none !important; }
                    [data-slot="sidebar-inset"] { margin: 0 !important; padding: 0 !important; width: 100% !important; }
                    body, html { background: white !important; }
                    h1, h2, h3, p, span, div, td, th, label { color: black !important; }
                    .text-green-400 { color: #166534 !important; }
                    .text-yellow-500 { color: #92400e !important; }
                    .text-muted-foreground { color: #6b7280 !important; }
                    .text-primary { color: #1d4ed8 !important; }
                    .bg-card, .bg-muted, .bg-accent { background: white !important; }
                    .border, .border-border { border-color: #d1d5db !important; }
                    .shadow-sm, .shadow { box-shadow: none !important; }
                    table { font-size: 10px !important; width: 100% !important; }
                    th, td { padding: 5px 8px !important; }
                }
            `}</style>
        </ParentComponent>
    );
}

function TmKpi({ label, value, sub, color }: { label: string; value: string; sub: string; color: "blue" | "purple" | "green" | "yellow" }) {
    const palette = {
        blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        green: "bg-green-500/10 text-green-400 border-green-500/20",
        yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    };
    return (
        <div className={`rounded-lg border p-3 text-center ${palette[color]}`}>
            <p className="text-[10px] font-semibold uppercase tracking-widest opacity-70">{label}</p>
            <p className="mt-1 text-xl font-bold sm:text-2xl">{value}</p>
            <p className="mt-0.5 text-[10px] opacity-60">{sub}</p>
        </div>
    );
}
