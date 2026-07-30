import { ParentComponent } from "@/components/parent-container";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import api from "@/lib/axios";
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
    IconAlertCircle,
} from "@tabler/icons-react";

interface Downline {
    id: string;
    name: string;
    agency: string;
    position: string;
    bonus_amount: string;
    is_active: boolean;
    is_eligible: boolean;
    ineligible_reason: "ir" | "inactive" | "not_hired" | null;
    layer: 1 | 2;
    mentor_name?: string;
}

interface BonusMonth {
    month_year: string;
    total_bonus: string;
    is_eligible: boolean;
    l1_count: number;
    l2_count: number;
    downlines: Downline[];
}

interface DownlineResponse {
    months: BonusMonth[];
}

const CUTOFF = "2026-07"; // T&M incentives launched July 2026

function buildMonthOptions() {
    const opts: { value: string; label: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 24; i++) {
        const d = subMonths(now, i);
        const val = format(d, "yyyy-MM");
        if (val < CUTOFF) break;
        opts.push({ value: val, label: format(d, "MMMM yyyy") });
    }
    return opts;
}

const MONTH_OPTIONS = buildMonthOptions();

// ── Tree node components ──────────────────────────────────────────────────────

function RootNode({ name, l1Count, l2Count }: { name: string; l1Count: number; l2Count: number }) {
    return (
        <div
            className="relative rounded-[10px] px-[14px] py-[10px] text-center shadow-sm"
            style={{
                background: "linear-gradient(135deg,#1e40af,#2563eb)",
                border: "2px solid #1e3a8a",
                minWidth: 210,
            }}
        >
            <div className="mb-1 text-[9.5px] font-bold uppercase tracking-widest text-white/65">
                ⭐ Chef / Mentor
            </div>
            <div className="truncate text-[13.5px] font-bold text-white">{name}</div>
            <div className="mt-[7px] flex justify-center gap-2">
                <NodeBadge variant="root">{l1Count} direct</NodeBadge>
                <NodeBadge variant="root">{l2Count} indirect</NodeBadge>
            </div>
        </div>
    );
}

function ineligibleBorderColor(reason: Downline["ineligible_reason"]) {
    if (reason === "ir") return "#fca5a5";
    return "#cbd5e1";
}

function L1Node({ dl, children }: { dl: Downline; children?: Downline[] }) {
    const childCount = children?.length ?? 0;
    const ok         = dl.is_eligible;
    const borderCol  = ok ? "#3b82f6" : ineligibleBorderColor(dl.ineligible_reason);
    return (
        <div
            className="relative rounded-[10px] px-[14px] py-[10px] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            style={{
                background: ok ? "rgba(59,130,246,.1)" : (dl.ineligible_reason === "ir" ? "rgba(239,68,68,.08)" : "rgba(255,255,255,.04)"),
                border: `1.5px solid ${borderCol}`,
                minWidth: 165,
                maxWidth: 200,
                opacity: ok ? 1 : 0.65,
            }}
        >
            <div
                className="font-bold text-[12px] truncate"
                style={{ color: ok ? "var(--card-foreground)" : "var(--muted-foreground)", textDecoration: ok ? "none" : "line-through" }}
            >
                {dl.name}
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
                <NodeBadge variant="agency">{dl.agency}</NodeBadge>
                {childCount > 0 && <NodeBadge variant="under">⬡ {childCount}</NodeBadge>}
                {!ok && dl.ineligible_reason === "ir"       && <NodeBadge variant="ir">⚠ IR</NodeBadge>}
                {!ok && dl.ineligible_reason === "inactive"  && <NodeBadge variant="inactive">Resigned</NodeBadge>}
                {!ok && dl.ineligible_reason === "not_hired" && <NodeBadge variant="inactive">Not Hired</NodeBadge>}
            </div>
            <div className="mt-2 flex items-center justify-between">
                <span />
                <span className="text-[11px] font-bold" style={{ color: ok ? "#60a5fa" : "var(--muted-foreground)" }}>
                    {formatToPeso(parseFloat(dl.bonus_amount))}
                </span>
            </div>
        </div>
    );
}

function L2Node({ dl, mentorEligible }: { dl: Downline; mentorEligible: boolean }) {
    const ok        = dl.is_eligible && mentorEligible;
    const reason    = !dl.is_eligible ? dl.ineligible_reason : (!mentorEligible ? "mentor" : null);
    const borderCol = dl.ineligible_reason === "ir" ? "#f87171" : (ok ? "#a78bfa" : "rgba(255,255,255,.15)");
    return (
        <div
            className="relative rounded-[10px] px-[14px] py-[10px] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            style={{
                background: dl.ineligible_reason === "ir" ? "rgba(239,68,68,.08)" : (ok ? "rgba(139,92,246,.1)" : "rgba(255,255,255,.04)"),
                border: `1.5px solid ${borderCol}`,
                minWidth: 150,
                maxWidth: 185,
                opacity: ok ? 1 : 0.6,
            }}
        >
            <div
                className="font-bold truncate"
                style={{ fontSize: 11.5, color: ok ? "var(--card-foreground)" : "var(--muted-foreground)", textDecoration: ok ? "none" : "line-through" }}
            >
                {dl.name}
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
                <NodeBadge variant="direct">{dl.agency}</NodeBadge>
                {reason === "ir"       && <NodeBadge variant="ir">⚠ IR</NodeBadge>}
                {reason === "inactive"  && <NodeBadge variant="inactive">Resigned</NodeBadge>}
                {reason === "not_hired" && <NodeBadge variant="inactive">Not Hired</NodeBadge>}
                {reason === "mentor"    && <NodeBadge variant="inactive">Mentor ✗</NodeBadge>}
            </div>
            <div className="mt-2 flex items-center justify-between">
                <span />
                <span className="text-[10px] font-bold" style={{ color: ok ? "#a78bfa" : "var(--muted-foreground)" }}>
                    {formatToPeso(parseFloat(dl.bonus_amount))}
                </span>
            </div>
        </div>
    );
}

type BadgeVariant = "root" | "agency" | "direct" | "under" | "inactive" | "ir";

function NodeBadge({ variant, children }: { variant: BadgeVariant; children: React.ReactNode }) {
    const styles: Record<BadgeVariant, React.CSSProperties> = {
        root:     { background: "rgba(255,255,255,.18)", color: "#fff",    border: "1px solid rgba(255,255,255,.3)" },
        agency:   { background: "rgba(59,130,246,.15)",  color: "#93c5fd", border: "1px solid rgba(59,130,246,.3)" },
        direct:   { background: "rgba(34,197,94,.12)",   color: "#86efac", border: "1px solid rgba(34,197,94,.3)" },
        under:    { background: "rgba(139,92,246,.15)",  color: "#c4b5fd", border: "1px solid rgba(139,92,246,.3)" },
        inactive: { background: "rgba(255,255,255,.06)", color: "#94a3b8", border: "1px solid rgba(255,255,255,.12)" },
        ir:       { background: "rgba(239,68,68,.15)",   color: "#fca5a5", border: "1px solid rgba(239,68,68,.35)" },
    };
    return (
        <span
            className="inline-flex items-center gap-[3px] whitespace-nowrap rounded-full px-[6px] py-[1px]"
            style={{ fontSize: 8.5, fontWeight: 700, ...styles[variant] }}
        >
            {children}
        </span>
    );
}

// ── Scrollable tree wrapper — centers scroll after paint ─────────────────────

function TreeScroll({ children }: { children: React.ReactNode }) {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        // rAF ensures the browser has computed the final scrollWidth
        const id = requestAnimationFrame(() => {
            el.scrollLeft = Math.max(0, (el.scrollWidth - el.clientWidth) / 2);
        });
        return () => cancelAnimationFrame(id);
    // re-center whenever the tree data changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [children]);
    return (
        <div
            ref={ref}
            style={{ overflowX: "auto", paddingBottom: 32 }}
        >
            <div style={{ width: "max-content", minWidth: "100%" }}>
                {children}
            </div>
        </div>
    );
}

// ── Horizontal bar drawn via ResizeObserver + ref ─────────────────────────────

function HRow({ isL2, children }: { isL2?: boolean; children: React.ReactNode }) {
    const rowRef = useRef<HTMLDivElement>(null);
    const barRef = useRef<HTMLDivElement>(null);

    const drawBar = useCallback(() => {
        const row = rowRef.current;
        if (!row) return;
        const cols = Array.from(row.children).filter(
            (el) => (el as HTMLElement).dataset.col === "1"
        ) as HTMLElement[];
        if (cols.length < 2) {
            if (barRef.current) barRef.current.style.display = "none";
            return;
        }
        const rowRect  = row.getBoundingClientRect();
        const first    = cols[0].getBoundingClientRect();
        const last     = cols[cols.length - 1].getBoundingClientRect();
        const left     = first.left - rowRect.left + first.width / 2;
        const right    = last.left  - rowRect.left + last.width  / 2;
        const bar      = barRef.current;
        if (!bar) return;
        bar.style.left    = `${left}px`;
        bar.style.width   = `${right - left}px`;
        bar.style.display = "block";
    }, []);

    useEffect(() => {
        drawBar();
        const el = rowRef.current;
        if (!el) return;
        const ro = new ResizeObserver(drawBar);
        ro.observe(el);
        return () => ro.disconnect();
    }, [drawBar]);

    return (
        <div ref={rowRef} className="relative flex items-start">
            <div
                ref={barRef}
                className="pointer-events-none absolute top-0 hidden"
                style={{ height: 2, background: isL2 ? "rgba(255,255,255,.15)" : "rgba(255,255,255,.25)" }}
            />
            {children}
        </div>
    );
}

function VStem({ height, color }: { height: number; color: string }) {
    return <div style={{ width: 2, height, background: color, flexShrink: 0 }} />;
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DownlinePage() {
    const { id } = useParams<{ id: string }>();
    const [selectedMonth, setSelectedMonth] = useState(MONTH_OPTIONS[0].value);

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

    const employeeId = id || meQuery.data?.hr_id;

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

    const totalBonus  = parseFloat(monthData?.total_bonus ?? "0");
    const me          = meQuery.data;
    const periodLabel = MONTH_OPTIONS.find((o) => o.value === selectedMonth)?.label;

    if (meQuery.isLoading) return <FullPageLoader />;

    return (
        <ParentComponent>
            {/* ── Header card ── */}
            <div className="mb-5 w-full px-3 sm:px-0">
                <div className="overflow-hidden rounded-xl border border-border shadow-sm">
                    {/* Blue header bar */}
                    <div
                        className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                        style={{ background: "linear-gradient(135deg,#1e40af,#2563eb)" }}
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-bold text-blue-700"
                                style={{ background: "rgba(255,255,255,.2)", color: "#fff" }}
                            >
                                {me?.name?.charAt(0) ?? "?"}
                            </div>
                            <div>
                                <div className="text-[9.5px] font-bold uppercase tracking-widest text-white/65">
                                    Chef / Mentor
                                </div>
                                <div className="text-base font-bold text-white sm:text-lg">
                                    {me?.name ?? "N/A"}
                                </div>
                                <div className="mt-0.5 text-[10px] text-white/60">
                                    ID: {me?.id_number ?? "N/A"} · {me?.primary_branch_name ?? "N/A"}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-1">
                            {me?.agency_name && (
                                <span
                                    className="rounded-full border px-[10px] py-[3px] text-[11px] font-semibold"
                                    style={{ background: "rgba(255,255,255,.18)", color: "#fff", borderColor: "rgba(255,255,255,.3)" }}
                                >
                                    {me.agency_name}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Stats bar */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border bg-card px-5 py-3">
                        <Stat label="1st Layer"  value={String(l1s.length)}   className="text-primary" />
                        <Stat label="2nd Layer"  value={String(l2s.length)}   className="text-purple-400" />
                        <Stat label="Total Bonus" value={formatToPeso(totalBonus)} className="text-emerald-400" />
                        <div className="ml-auto">
                            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                <SelectTrigger className="h-7 w-[160px] text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {MONTH_OPTIONS.map((o) => (
                                        <SelectItem key={o.value} value={o.value} className="text-xs">
                                            {o.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Tree card ── */}
            <div className="w-full px-3 sm:px-0">
                <div className="overflow-hidden rounded-xl border border-border shadow-sm">
                    {/* Card header */}
                    <div
                        className="flex flex-wrap items-center justify-between gap-2 px-5 py-3"
                        style={{ background: "#1e40af" }}
                    >
                        <div className="flex items-center gap-2">
                            <IconUsersGroup className="size-4 text-white" />
                            <span className="text-sm font-bold text-white">Downline Tree</span>
                            {periodLabel && (
                                <span
                                    className="rounded-full px-[8px] py-[2px] text-[10px] font-semibold"
                                    style={{ background: "rgba(255,255,255,.18)", color: "#fff" }}
                                >
                                    {periodLabel}
                                </span>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <span
                                className="rounded-full px-[10px] py-[3px] text-[10px] font-semibold"
                                style={{ background: "rgba(255,255,255,.18)", color: "#fff", border: "1px solid rgba(255,255,255,.3)" }}
                            >
                                👥 {l1s.length + l2s.length} total
                            </span>
                            <span
                                className="rounded-full px-[10px] py-[3px] text-[10px] font-semibold"
                                style={{ background: "#dbeafe", color: "#1e40af", border: "1px solid #93c5fd" }}
                            >
                                {l1s.length} 1st layer
                            </span>
                            <span
                                className="rounded-full px-[10px] py-[3px] text-[10px] font-semibold"
                                style={{ background: "#ede9fe", color: "#6b21a8", border: "1px solid #c4b5fd" }}
                            >
                                {l2s.length} 2nd layer
                            </span>
                        </div>
                    </div>

                    {/* Card body */}
                    <div className="bg-card px-6 py-6">
                        {/* Eligibility notice */}
                        {monthData && !monthData.is_eligible && (
                            <div
                                className="mb-5 flex items-start gap-3 rounded-lg border p-3 text-sm"
                                style={{ background: "#fef2f2", borderColor: "#fca5a5", color: "#991b1b" }}
                            >
                                <IconAlertCircle className="mt-0.5 size-4 shrink-0" />
                                <div>
                                    <p className="font-semibold">Disqualified for this period</p>
                                    <p className="mt-0.5 text-xs opacity-80">
                                        An active Incident Report was filed. No bonus is earned.
                                    </p>
                                </div>
                            </div>
                        )}

                        {downlineQuery.isLoading ? (
                            <div className="flex justify-center py-16">
                                <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                            </div>
                        ) : l1s.length === 0 ? (
                            <div className="py-14 text-center" style={{ color: "#94a3b8" }}>
                                <IconUsersGroup className="mx-auto mb-3 size-12 opacity-25" />
                                <p className="font-semibold">No downlines for this period.</p>
                                <p className="mt-1 text-sm opacity-70">Bonus data appears once the period is computed.</p>
                            </div>
                        ) : (
                            /* ── Visual tree ── */
                            <TreeScroll>
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 8 }}>

                                    {/* Root node */}
                                    <RootNode
                                        name={me?.name ?? ""}
                                        l1Count={l1s.length}
                                        l2Count={l2s.length}
                                    />
                                    <VStem height={28} color="rgba(255,255,255,.25)" />

                                    {/* L1 row */}
                                    <HRow>
                                        {l1s.map((l1) => {
                                            const children = l2s.filter((l2) => l2.mentor_name === l1.name);
                                            return (
                                                <div
                                                    key={l1.id}
                                                    data-col="1"
                                                    style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 12px" }}
                                                >
                                                    {/* Bar → L1 stem */}
                                                    <VStem height={24} color="rgba(255,255,255,.25)" />

                                                    <L1Node dl={l1} children={children} />

                                                    {children.length > 0 && (
                                                        <>
                                                            {/* L1 → L2 stem */}
                                                            <VStem height={20} color="rgba(255,255,255,.15)" />

                                                            {/* L2 row */}
                                                            <HRow isL2>
                                                                {children.map((l2) => (
                                                                    <div
                                                                        key={l2.id}
                                                                        data-col="1"
                                                                        style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 12px" }}
                                                                    >
                                                                        <VStem height={20} color="rgba(255,255,255,.15)" />
                                                                        <L2Node dl={l2} mentorEligible={l1.is_eligible} />
                                                                    </div>
                                                                ))}
                                                            </HRow>
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </HRow>

                                </div>
                            </TreeScroll>
                        )}
                    </div>
                </div>
            </div>
        </ParentComponent>
    );
}

function Stat({ label, value, className }: { label: string; value: string; className?: string }) {
    return (
        <div>
            <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{label}</div>
            <div className={`text-sm font-bold ${className ?? "text-foreground"}`}>{value}</div>
        </div>
    );
}
