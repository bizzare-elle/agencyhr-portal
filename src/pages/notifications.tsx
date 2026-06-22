import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useNotifications, NotificationItem, NotifType } from "@/hooks/use-notifications";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ParentComponent } from "@/components/parent-container";

// ── Type config ───────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, {
    label: string; glow: string; dot: string;
    iconFg: string; iconBg: string; tag: string; tagBg: string; tagRing: string;
}> = {
    training:    { label: "Training",     glow: "rgba(96,165,250,0.18)",   dot: "bg-blue-400",   iconFg: "text-blue-400",   iconBg: "bg-blue-500/15",   tag: "text-blue-400",   tagBg: "bg-blue-500/10",   tagRing: "ring-blue-500/20" },
    video:       { label: "Video",        glow: "rgba(45,212,191,0.18)",   dot: "bg-teal-400",   iconFg: "text-teal-400",   iconBg: "bg-teal-500/15",   tag: "text-teal-400",   tagBg: "bg-teal-500/10",   tagRing: "ring-teal-500/20" },
    logoverride: { label: "Log Override", glow: "rgba(167,139,250,0.18)",  dot: "bg-violet-400", iconFg: "text-violet-400", iconBg: "bg-violet-500/15", tag: "text-violet-400", tagBg: "bg-violet-500/10", tagRing: "ring-violet-500/20" },
    overtime:    { label: "Overtime",     glow: "rgba(251,146,60,0.18)",   dot: "bg-orange-400", iconFg: "text-orange-400", iconBg: "bg-orange-500/15", tag: "text-orange-400", tagBg: "bg-orange-500/10", tagRing: "ring-orange-500/20" },
};

const FALLBACK = TYPE_CONFIG["training"];
function cfg(type: string) { return TYPE_CONFIG[type] ?? FALLBACK; }

// ── Icons ─────────────────────────────────────────────────────────────────────

function TypeIcon({ type }: { type: string }) {
    if (type === "video") return (
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
        </svg>
    );
    if (type === "logoverride") return (
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
    if (type === "overtime") return (
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
        </svg>
    );
    return (
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
    );
}

function StatusPill({ label }: { label: string }) {
    const s = label === "Completed" || label === "Approved"
        ? "bg-emerald-500/15 text-emerald-400 ring-emerald-500/25"
        : label === "Failed" || label === "Disapproved"
          ? "bg-red-500/15 text-red-400 ring-red-500/25"
          : "bg-amber-500/15 text-amber-400 ring-amber-500/25";
    return <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset", s)}>{label}</span>;
}

// ── Grouping ──────────────────────────────────────────────────────────────────

function groupByDate(items: NotificationItem[]) {
    const order: string[] = [];
    const buckets: Record<string, NotificationItem[]> = {};
    for (const item of items) {
        const key = item.created_at_date && item.created_at_date !== "—" ? item.created_at_date : "Unknown Date";
        if (!buckets[key]) { buckets[key] = []; order.push(key); }
        buckets[key].push(item);
    }
    order.sort((a, b) => {
        if (a === "Unknown Date") return 1;
        if (b === "Unknown Date") return -1;
        const da = new Date(a).getTime(), db = new Date(b).getTime();
        return isNaN(da) || isNaN(db) ? 0 : db - da;
    });
    return order.map((label) => ({ label, items: buckets[label] }));
}

function relativeLabel(s: string) {
    try {
        const d = new Date(s);
        if (isNaN(d.getTime())) return s;
        const now = new Date(), yest = new Date(now);
        yest.setDate(now.getDate() - 1);
        const same = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
        if (same(d, now)) return "Today";
        if (same(d, yest)) return "Yesterday";
    } catch { /* noop */ }
    return s;
}

// ── Timeline item ─────────────────────────────────────────────────────────────

function TimelineItem({ item, isRead, isLast, onClick }: {
    item: NotificationItem; isRead: boolean; isLast: boolean; onClick: () => void;
}) {
    const c = cfg(item.type);
    return (
        <div className="relative flex gap-3">
            {!isLast && <span className="absolute left-[13px] top-7 bottom-0 w-px bg-white/6" />}
            <div
                className="relative z-10 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/8 bg-[#0f1117]"
                style={!isRead ? { boxShadow: `0 0 0 3px ${c.glow}` } : undefined}
            >
                <span className={cn("flex h-5 w-5 items-center justify-center rounded-full", isRead ? "bg-white/5 text-white/20" : `${c.iconBg} ${c.iconFg}`)}>
                    <TypeIcon type={item.type} />
                </span>
            </div>
            <button
                onClick={onClick}
                className={cn(
                    "group mb-3 flex-1 rounded-xl border px-4 py-3 text-left transition-all",
                    isRead
                        ? "border-white/5 bg-white/[0.015] opacity-40 hover:opacity-60"
                        : "border-white/8 bg-white/[0.04] hover:border-white/15 hover:bg-white/[0.06]",
                )}
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            {!isRead && <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", c.dot)} />}
                            <p className={cn("truncate text-sm font-semibold", isRead ? "text-muted-foreground/50" : "text-foreground")}>
                                {item.title}
                            </p>
                        </div>
                        {item.subtitle && (
                            <p className="mt-0.5 truncate text-xs text-muted-foreground/50">{item.subtitle}</p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset", c.tagBg, c.tag, c.tagRing)}>
                                {c.label}
                            </span>
                            {item.status_label && <StatusPill label={item.status_label} />}
                        </div>
                    </div>
                    {!isRead && (
                        <span className={cn("mt-0.5 shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold", c.tagBg, c.tag)}>
                            New
                        </span>
                    )}
                </div>
            </button>
        </div>
    );
}

function DateSection({ label, items, readIds, onClickItem }: {
    label: string; items: NotificationItem[]; readIds: Set<string>;
    onClickItem: (item: NotificationItem) => void;
}) {
    return (
        <div className="mb-5">
            <div className="mb-3 flex items-center gap-3">
                <span className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/40">
                    {relativeLabel(label)}
                </span>
                <span className="h-px w-full bg-white/5" />
            </div>
            <div className="pl-1">
                {items.map((item, idx) => (
                    <TimelineItem key={item.id} item={item} isRead={readIds.has(item.id)}
                        isLast={idx === items.length - 1} onClick={() => onClickItem(item)} />
                ))}
            </div>
        </div>
    );
}

// ── Sidebar summary ───────────────────────────────────────────────────────────

const TYPES: NotifType[] = ["training", "video", "logoverride", "overtime"];

function SummarySidebar({ items, unreadCount, readIds, onMarkAll }: {
    items: NotificationItem[]; unreadCount: number;
    readIds: Set<string>; onMarkAll: () => void;
}) {
    const countByType = TYPES.reduce<Record<string, { total: number; unread: number }>>((acc, t) => {
        const typeItems = items.filter((i) => i.type === t);
        acc[t] = { total: typeItems.length, unread: typeItems.filter((i) => !readIds.has(i.id)).length };
        return acc;
    }, {} as Record<string, { total: number; unread: number }>);

    return (
        <aside className="w-64 shrink-0">
            {/* Unread summary card */}
            <div className="mb-4 rounded-xl border border-white/8 bg-white/[0.03] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/40 mb-3">Summary</p>
                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-3xl font-bold tabular-nums text-foreground">{unreadCount}</p>
                        <p className="text-xs text-muted-foreground/60 mt-0.5">unread</p>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-semibold tabular-nums text-muted-foreground/50">{items.length}</p>
                        <p className="text-xs text-muted-foreground/40">total</p>
                    </div>
                </div>
                {unreadCount > 0 && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onMarkAll}
                        className="mt-4 w-full h-7 rounded-lg border-white/10 bg-white/5 text-xs hover:bg-white/10"
                    >
                        Mark all as read
                    </Button>
                )}
            </div>

            {/* By type */}
            <div className="rounded-xl border border-white/8 bg-white/[0.03] overflow-hidden">
                <p className="px-4 pt-3 pb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/40">By Type</p>
                {TYPES.map((t) => {
                    const c = cfg(t);
                    const counts = countByType[t] ?? { total: 0, unread: 0 };
                    return (
                        <div key={t} className="flex items-center gap-3 border-t border-white/5 px-4 py-2.5">
                            <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px]", c.iconBg, c.iconFg)}>
                                <TypeIcon type={t} />
                            </span>
                            <span className="flex-1 text-xs text-muted-foreground/70">{c.label}</span>
                            <div className="flex items-center gap-1.5">
                                {counts.unread > 0 && (
                                    <span className={cn("flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold", c.tagBg, c.tag)}>
                                        {counts.unread}
                                    </span>
                                )}
                                <span className="text-xs tabular-nums text-muted-foreground/30">{counts.total}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </aside>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Notifications() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { items, unreadCount, isLoading, markAllRead, markOneRead, readIds } = useNotifications(id);

    const handleClick = (item: NotificationItem) => {
        markOneRead(item.id);
        if (item.type === "logoverride") navigate(`/logoverrides/${id}`);
        else if (item.type === "overtime") navigate(`/overtime/${id}`);
        else navigate(`/employees/${id}`);
    };

    const groups = groupByDate(items);

    return (
        <ParentComponent>
            {/* header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-lg font-bold tracking-tight">Notifications</h1>
                        {unreadCount > 0 && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-teal-500 px-1.5 text-[11px] font-bold text-white">
                                {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                        )}
                    </div>
                    <p className="mt-0.5 text-[11px] uppercase tracking-widest text-muted-foreground/40">
                        Training · Video · Log Override · Overtime
                    </p>
                </div>
            </div>

            {/* two-column body */}
            <div className="flex gap-6">
                {/* ── timeline feed ── */}
                <div className="flex-1 min-w-0">
                    {/* loading */}
                    {isLoading && (
                        <div className="flex flex-col gap-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="flex gap-3">
                                    <div className="mt-1 h-7 w-7 shrink-0 animate-pulse rounded-full bg-white/5" />
                                    <div className="h-16 flex-1 animate-pulse rounded-xl bg-white/[0.03]" />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* empty */}
                    {!isLoading && items.length === 0 && (
                        <div className="flex flex-col items-center gap-3 py-24 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/5 bg-white/[0.03] text-white/10">
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                        d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                                </svg>
                            </div>
                            <p className="text-sm text-muted-foreground/50">No notifications yet</p>
                        </div>
                    )}

                    {/* timeline groups */}
                    {!isLoading && groups.map(({ label, items: gi }) => (
                        <DateSection key={label} label={label} items={gi} readIds={readIds} onClickItem={handleClick} />
                    ))}
                </div>

                {/* ── sidebar ── */}
                {!isLoading && items.length > 0 && (
                    <SummarySidebar
                        items={items}
                        unreadCount={unreadCount}
                        readIds={readIds}
                        onMarkAll={markAllRead}
                    />
                )}
            </div>
        </ParentComponent>
    );
}
