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
import { IconUsersGroup, IconAlertCircle } from "@tabler/icons-react";

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

function RootNode({
    name,
    position,
    l1Count,
    l2Count,
}: {
    name: string;
    position?: string;
    l1Count: number;
    l2Count: number;
}) {
    return (
        <div
            className="border-primary bg-primary/20 relative rounded-[10px] border-2 px-[14px] py-[10px] text-center shadow-sm"
            style={{ minWidth: 210 }}
        >
            <div className="text-muted-foreground mb-1 text-[9.5px] font-bold tracking-widest uppercase">
                ⭐ Chef / Mentor
            </div>
            <div className="text-foreground truncate text-[13.5px] font-bold">
                {name}
            </div>
            {position && (
                <div
                    className="text-muted-foreground truncate text-[10px] leading-tight"
                    title={position}
                >
                    {position}
                </div>
            )}
            <div className="mt-[7px] flex justify-center gap-2">
                <NodeBadge variant="root">{l1Count} direct</NodeBadge>
                <NodeBadge variant="root">{l2Count} indirect</NodeBadge>
            </div>
        </div>
    );
}

function L1Node({ dl, children }: { dl: Downline; children?: Downline[] }) {
    const childCount = children?.length ?? 0;
    const ok = dl.is_eligible;
    const tone = !ok
        ? dl.ineligible_reason === "ir"
            ? "border-destructive/50 bg-destructive/10"
            : "border-border bg-muted/30"
        : "border-primary/60 bg-primary/10";
    return (
        <div
            className={`relative rounded-[10px] border-[1.5px] px-[14px] py-[10px] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${tone}`}
            style={{ minWidth: 165, maxWidth: 200, opacity: ok ? 1 : 0.7 }}
        >
            <div
                className="truncate text-[12px] font-bold"
                style={{
                    color: ok
                        ? "var(--card-foreground)"
                        : "var(--muted-foreground)",
                    textDecoration: ok ? "none" : "line-through",
                }}
            >
                {dl.name}
            </div>
            {dl.position && (
                <div
                    className="text-muted-foreground truncate text-[10px] leading-tight"
                    title={dl.position}
                >
                    {dl.position}
                </div>
            )}
            <div className="mt-1 flex flex-wrap gap-1">
                <NodeBadge variant="agency">{dl.agency}</NodeBadge>
                {childCount > 0 && (
                    <NodeBadge variant="under">⬡ {childCount}</NodeBadge>
                )}
                {!ok && dl.ineligible_reason === "ir" && (
                    <NodeBadge variant="ir">⚠ IR</NodeBadge>
                )}
                {!ok && dl.ineligible_reason === "inactive" && (
                    <NodeBadge variant="inactive">Resigned</NodeBadge>
                )}
                {!ok && dl.ineligible_reason === "not_hired" && (
                    <NodeBadge variant="inactive">Not Hired</NodeBadge>
                )}
            </div>
            <div className="mt-2 flex items-center justify-between">
                <span />
                <span
                    className={`text-[11px] font-bold ${
                        ok && parseFloat(dl.bonus_amount) > 0
                            ? "text-emerald-400"
                            : "text-muted-foreground"
                    }`}
                >
                    {formatToPeso(parseFloat(dl.bonus_amount))}
                </span>
            </div>
        </div>
    );
}

function L2Node({
    dl,
    mentorEligible,
}: {
    dl: Downline;
    mentorEligible: boolean;
}) {
    const ok = dl.is_eligible && mentorEligible;
    const reason = !dl.is_eligible
        ? dl.ineligible_reason
        : !mentorEligible
          ? "mentor"
          : null;
    const tone =
        dl.ineligible_reason === "ir"
            ? "border-destructive/50 bg-destructive/10"
            : ok
              ? "border-primary/30 bg-primary/5"
              : "border-border bg-muted/30";
    return (
        <div
            className={`relative rounded-[10px] border-[1.5px] px-[14px] py-[10px] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${tone}`}
            style={{ minWidth: 150, maxWidth: 185, opacity: ok ? 1 : 0.7 }}
        >
            <div
                className="truncate font-bold"
                style={{
                    fontSize: 11.5,
                    color: ok
                        ? "var(--card-foreground)"
                        : "var(--muted-foreground)",
                    textDecoration: ok ? "none" : "line-through",
                }}
            >
                {dl.name}
            </div>
            {dl.position && (
                <div
                    className="text-muted-foreground truncate text-[9.5px] leading-tight"
                    title={dl.position}
                >
                    {dl.position}
                </div>
            )}
            <div className="mt-1 flex flex-wrap gap-1">
                <NodeBadge variant="direct">{dl.agency}</NodeBadge>
                {reason === "ir" && <NodeBadge variant="ir">⚠ IR</NodeBadge>}
                {reason === "inactive" && (
                    <NodeBadge variant="inactive">Resigned</NodeBadge>
                )}
                {reason === "not_hired" && (
                    <NodeBadge variant="inactive">Not Hired</NodeBadge>
                )}
                {reason === "mentor" && (
                    <NodeBadge variant="inactive">Mentor ✗</NodeBadge>
                )}
            </div>
            <div className="mt-2 flex items-center justify-between">
                <span />
                <span
                    className={`text-[10px] font-bold ${
                        ok && parseFloat(dl.bonus_amount) > 0
                            ? "text-emerald-400"
                            : "text-muted-foreground"
                    }`}
                >
                    {formatToPeso(parseFloat(dl.bonus_amount))}
                </span>
            </div>
        </div>
    );
}

type BadgeVariant = "root" | "agency" | "direct" | "under" | "inactive" | "ir";

function NodeBadge({
    variant,
    children,
}: {
    variant: BadgeVariant;
    children: React.ReactNode;
}) {
    const styles: Record<BadgeVariant, React.CSSProperties> = {
        root: {
            background: "color-mix(in oklch, var(--primary) 30%, transparent)",
            color: "var(--foreground)",
            border: "1px solid color-mix(in oklch, var(--primary) 55%, transparent)",
        },
        agency: {
            background: "color-mix(in oklch, var(--primary) 18%, transparent)",
            color: "var(--foreground)",
            border: "1px solid color-mix(in oklch, var(--primary) 40%, transparent)",
        },
        direct: {
            background: "color-mix(in oklch, var(--primary) 12%, transparent)",
            color: "var(--muted-foreground)",
            border: "1px solid color-mix(in oklch, var(--primary) 28%, transparent)",
        },
        under: {
            background: "var(--muted)",
            color: "var(--muted-foreground)",
            border: "1px solid var(--border)",
        },
        inactive: {
            background: "var(--muted)",
            color: "var(--muted-foreground)",
            border: "1px solid var(--border)",
        },
        ir: {
            background:
                "color-mix(in oklch, var(--destructive) 18%, transparent)",
            color: "var(--destructive)",
            border: "1px solid color-mix(in oklch, var(--destructive) 45%, transparent)",
        },
    };
    return (
        <span
            className="inline-flex items-center gap-[3px] rounded-full px-[6px] py-[1px] whitespace-nowrap"
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
        <div ref={ref} style={{ overflowX: "auto", paddingBottom: 32 }}>
            <div style={{ width: "max-content", minWidth: "100%" }}>
                {children}
            </div>
        </div>
    );
}

// ── Horizontal bar drawn via ResizeObserver + ref ─────────────────────────────

function HRow({
    isL2,
    children,
}: {
    isL2?: boolean;
    children: React.ReactNode;
}) {
    const rowRef = useRef<HTMLDivElement>(null);
    const barRef = useRef<HTMLDivElement>(null);

    const drawBar = useCallback(() => {
        const row = rowRef.current;
        if (!row) return;
        const cols = Array.from(row.children).filter(
            (el) => (el as HTMLElement).dataset.col === "1",
        ) as HTMLElement[];
        if (cols.length < 2) {
            if (barRef.current) barRef.current.style.display = "none";
            return;
        }
        const rowRect = row.getBoundingClientRect();
        const first = cols[0].getBoundingClientRect();
        const last = cols[cols.length - 1].getBoundingClientRect();
        const left = first.left - rowRect.left + first.width / 2;
        const right = last.left - rowRect.left + last.width / 2;
        const bar = barRef.current;
        if (!bar) return;
        bar.style.left = `${left}px`;
        bar.style.width = `${right - left}px`;
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
                style={{
                    height: 2,
                    background: isL2
                        ? "color-mix(in oklch, var(--border) 60%, transparent)"
                        : "var(--border)",
                }}
            />
            {children}
        </div>
    );
}

function VStem({ height, color }: { height: number; color: string }) {
    return (
        <div style={{ width: 2, height, background: color, flexShrink: 0 }} />
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DownlinePage() {
    const { id } = useParams<{ id: string }>();
    const [selectedMonth, setSelectedMonth] = useState(MONTH_OPTIONS[0].value);

    const meQuery = useQuery({
        queryKey: ["me"],
        queryFn: async () => {
            const res = await api.get<
                ApiResponse<{
                    hr_id: string;
                    name: string;
                    id_number?: string;
                    position?: string;
                    primary_branch_name?: string;
                    agency_name?: string;
                }>
            >("/api/v2/auth/me");
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
        downlineQuery.data?.months?.find(
            (m) => m.month_year === selectedMonth,
        ) ?? null;

    const l1s = monthData?.downlines.filter((d) => d.layer === 1) ?? [];
    const l2s = monthData?.downlines.filter((d) => d.layer === 2) ?? [];

    const totalBonus = parseFloat(monthData?.total_bonus ?? "0");
    const me = meQuery.data;
    const periodLabel = MONTH_OPTIONS.find(
        (o) => o.value === selectedMonth,
    )?.label;

    if (meQuery.isLoading) return <FullPageLoader />;

    return (
        <ParentComponent>
            {/* ── Header card ── */}
            <div className="mb-5 w-full px-3 sm:px-0">
                <div className="border-border overflow-hidden rounded-xl border shadow-sm">
                    {/* Identity bar — sits on the card surface; primary is an
                        accent here, not a full-bleed slab. */}
                    <div className="bg-card flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/15 text-primary ring-primary/25 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-bold ring-1">
                                {me?.name?.charAt(0) ?? "?"}
                            </div>
                            <div className="min-w-0">
                                <div className="text-muted-foreground text-[9.5px] font-bold tracking-widest uppercase">
                                    Chef / Mentor
                                </div>
                                <div className="text-foreground truncate text-base font-bold sm:text-lg">
                                    {me?.name ?? "N/A"}
                                </div>
                                {me?.position && (
                                    <div className="text-foreground/80 mt-0.5 truncate text-[11px] font-medium">
                                        {me.position}
                                    </div>
                                )}
                                <div className="text-muted-foreground mt-0.5 text-[10px]">
                                    ID: {me?.id_number ?? "N/A"} ·{" "}
                                    {me?.primary_branch_name ?? "N/A"}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-1">
                            {me?.agency_name && (
                                <span className="border-primary/25 bg-primary/10 text-primary rounded-full border px-[10px] py-[3px] text-[11px] font-semibold">
                                    {me.agency_name}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Stats bar */}
                    <div className="border-border bg-muted/30 flex flex-wrap items-center gap-x-6 gap-y-2 border-t px-5 py-3">
                        <Stat
                            label="1st Layer"
                            value={String(l1s.length)}
                            className="text-primary"
                        />
                        <Stat
                            label="2nd Layer"
                            value={String(l2s.length)}
                            className="text-foreground"
                        />
                        <Stat
                            label="Total Bonus"
                            value={formatToPeso(totalBonus)}
                            className="text-emerald-400"
                        />
                        <div className="ml-auto">
                            <Select
                                value={selectedMonth}
                                onValueChange={setSelectedMonth}
                            >
                                <SelectTrigger className="h-7 w-[160px] text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {MONTH_OPTIONS.map((o) => (
                                        <SelectItem
                                            key={o.value}
                                            value={o.value}
                                            className="text-xs"
                                        >
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
                <div className="border-border overflow-hidden rounded-xl border shadow-sm">
                    {/* Card header */}
                    <div className="border-border bg-muted/30 flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3">
                        <div className="flex items-center gap-2">
                            <IconUsersGroup className="text-primary size-4" />
                            <span className="text-foreground text-sm font-bold">
                                Downline Tree
                            </span>
                            {periodLabel && (
                                <span className="bg-muted text-muted-foreground border-border rounded-full border px-[8px] py-[2px] text-[10px] font-semibold">
                                    {periodLabel}
                                </span>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <span className="bg-muted text-muted-foreground border-border rounded-full border px-[10px] py-[3px] text-[10px] font-semibold">
                                👥 {l1s.length + l2s.length} total
                            </span>
                            <span className="bg-primary/15 text-primary border-primary/30 rounded-full border px-[10px] py-[3px] text-[10px] font-semibold">
                                {l1s.length} 1st layer
                            </span>
                            <span className="bg-primary/8 text-muted-foreground border-border rounded-full border px-[10px] py-[3px] text-[10px] font-semibold">
                                {l2s.length} 2nd layer
                            </span>
                        </div>
                    </div>

                    {/* Card body */}
                    <div className="bg-card px-6 py-6">
                        {/* Eligibility notice */}
                        {monthData && !monthData.is_eligible && (
                            <div className="border-destructive/40 bg-destructive/10 text-destructive mb-5 flex items-start gap-3 rounded-lg border p-3 text-sm">
                                <IconAlertCircle className="mt-0.5 size-4 shrink-0" />
                                <div>
                                    <p className="font-semibold">
                                        Disqualified for this period
                                    </p>
                                    <p className="mt-0.5 text-xs opacity-80">
                                        An active Incident Report was filed. No
                                        bonus is earned.
                                    </p>
                                </div>
                            </div>
                        )}

                        {downlineQuery.isLoading ? (
                            <div className="flex justify-center py-16">
                                <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
                            </div>
                        ) : l1s.length === 0 ? (
                            <div className="text-muted-foreground py-14 text-center">
                                <IconUsersGroup className="mx-auto mb-3 size-12 opacity-25" />
                                <p className="font-semibold">
                                    No downlines for this period.
                                </p>
                                <p className="mt-1 text-sm opacity-70">
                                    Bonus data appears once the period is
                                    computed.
                                </p>
                            </div>
                        ) : (
                            /* ── Visual tree ── */
                            <TreeScroll>
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        paddingTop: 8,
                                    }}
                                >
                                    {/* Root node */}
                                    <RootNode
                                        name={me?.name ?? ""}
                                        position={me?.position}
                                        l1Count={l1s.length}
                                        l2Count={l2s.length}
                                    />
                                    <VStem height={28} color="var(--border)" />

                                    {/* L1 row */}
                                    <HRow>
                                        {l1s.map((l1) => {
                                            const children = l2s.filter(
                                                (l2) =>
                                                    l2.mentor_name === l1.name,
                                            );
                                            return (
                                                <div
                                                    key={l1.id}
                                                    data-col="1"
                                                    style={{
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        alignItems: "center",
                                                        padding: "0 12px",
                                                    }}
                                                >
                                                    {/* Bar → L1 stem */}
                                                    <VStem
                                                        height={24}
                                                        color="var(--border)"
                                                    />

                                                    <L1Node
                                                        dl={l1}
                                                        children={children}
                                                    />

                                                    {children.length > 0 && (
                                                        <>
                                                            {/* L1 → L2 stem */}
                                                            <VStem
                                                                height={20}
                                                                color="color-mix(in oklch, var(--border) 60%, transparent)"
                                                            />

                                                            {/* L2 row */}
                                                            <HRow isL2>
                                                                {children.map(
                                                                    (l2) => (
                                                                        <div
                                                                            key={
                                                                                l2.id
                                                                            }
                                                                            data-col="1"
                                                                            style={{
                                                                                display:
                                                                                    "flex",
                                                                                flexDirection:
                                                                                    "column",
                                                                                alignItems:
                                                                                    "center",
                                                                                padding:
                                                                                    "0 12px",
                                                                            }}
                                                                        >
                                                                            <VStem
                                                                                height={
                                                                                    20
                                                                                }
                                                                                color="color-mix(in oklch, var(--border) 60%, transparent)"
                                                                            />
                                                                            <L2Node
                                                                                dl={
                                                                                    l2
                                                                                }
                                                                                mentorEligible={
                                                                                    l1.is_eligible
                                                                                }
                                                                            />
                                                                        </div>
                                                                    ),
                                                                )}
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

function Stat({
    label,
    value,
    className,
}: {
    label: string;
    value: string;
    className?: string;
}) {
    return (
        <div>
            <div className="text-muted-foreground text-[9px] font-bold tracking-widest uppercase">
                {label}
            </div>
            <div
                className={`text-sm font-bold ${className ?? "text-foreground"}`}
            >
                {value}
            </div>
        </div>
    );
}
