import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { Wifi, LogIn, LogOut, Loader2, Clock, MapPin, Calendar } from "lucide-react";
import api from "@/lib/axios";
import { ApiResponse } from "@/index";
import { ParentComponent } from "@/components/parent-container";
import { Badge } from "@/components/ui/badge";

interface Punch {
    id: number;
    clock_type: "Clock-In" | "Clock-Out";
    date_time: string;
    location: string;
}

interface RemoteStatus {
    is_clocked_in: boolean;
    next_action: "Clock-In" | "Clock-Out";
    punches: Punch[];
}

function pad(n: number) {
    return String(n).padStart(2, "0");
}

function formatTime(dt: string) {
    return new Date(dt).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
    });
}

function elapsedSince(dt: string): string {
    const diff = Math.max(0, Math.floor((Date.now() - new Date(dt).getTime()) / 1000));
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    if (h > 0) return `${h}h ${pad(m)}m ${pad(s)}s`;
    if (m > 0) return `${m}m ${pad(s)}s`;
    return `${s}s`;
}

function LiveClock() {
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const hh = now.getHours() % 12 || 12;
    const mm = pad(now.getMinutes());
    const ss = pad(now.getSeconds());
    const ampm = now.getHours() < 12 ? "AM" : "PM";
    const dateStr = now.toLocaleDateString("en-US", {
        weekday: "long", month: "long", day: "numeric", year: "numeric",
    });

    return (
        <div className="text-center">
            <div className="flex items-end justify-center gap-1 tabular-nums">
                <span className="text-5xl font-bold tracking-tight">
                    {pad(hh)}:{mm}
                </span>
                <span className="mb-1 text-2xl font-semibold text-muted-foreground">:{ss}</span>
                <span className="mb-1.5 text-base font-medium text-muted-foreground">{ampm}</span>
            </div>
            <p className="text-muted-foreground mt-1 text-xs">{dateStr}</p>
        </div>
    );
}

function ElapsedTimer({ since }: { since: string }) {
    const [elapsed, setElapsed] = useState(() => elapsedSince(since));
    useEffect(() => {
        const t = setInterval(() => setElapsed(elapsedSince(since)), 1000);
        return () => clearInterval(t);
    }, [since]);
    return <span className="tabular-nums">{elapsed}</span>;
}

export default function RemoteWork() {
    const { id } = useParams<{ id: string }>();
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery<RemoteStatus>({
        queryKey: ["remote-status", id],
        queryFn: async () => {
            const res = await api.get<ApiResponse<RemoteStatus>>(
                `/api/v2/remote/status/${id}`,
            );
            return res.data.data!;
        },
        refetchInterval: 30_000,
    });

    const punchMutation = useMutation({
        mutationFn: (clock_type: "Clock-In" | "Clock-Out") =>
            api.post(`/api/v2/remote/punch/${id}`, { clock_type }),
        onSuccess: (_, clock_type) => {
            toast.success(`${clock_type} recorded successfully.`);
            queryClient.invalidateQueries({ queryKey: ["remote-status", id] });
        },
        onError: () => toast.error("Failed to record punch. Please try again."),
    });

    const lastIn = data
        ? [...(data.punches ?? [])].reverse().find((p) => p.clock_type === "Clock-In")
        : null;

    const location = data?.punches.length
        ? data.punches[data.punches.length - 1].location
        : "Remote";

    return (
        <ParentComponent>
            <div className="mx-auto max-w-md px-4 py-8 space-y-5">

                {/* Live clock */}
                <div className="rounded-2xl border bg-muted/10 px-6 py-6">
                    <LiveClock />
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
                    </div>
                ) : !data ? (
                    <p className="text-muted-foreground text-center text-sm">Unable to load status.</p>
                ) : (
                    <>
                        {/* Action card */}
                        <div className={`rounded-2xl border px-6 py-6 text-center transition-colors ${
                            data.is_clocked_in
                                ? "border-green-500/25 bg-green-500/5"
                                : "border-border bg-muted/5"
                        }`}>

                            {/* Status pill */}
                            <div className="mb-4 flex items-center justify-center gap-2">
                                <span className={`inline-block h-2 w-2 rounded-full ${
                                    data.is_clocked_in
                                        ? "bg-green-400 shadow-[0_0_6px_2px_rgba(74,222,128,0.4)]"
                                        : "bg-muted-foreground/40"
                                }`} />
                                <span className={`text-xs font-semibold uppercase tracking-wider ${
                                    data.is_clocked_in ? "text-green-400" : "text-muted-foreground"
                                }`}>
                                    {data.is_clocked_in ? "Clocked In" : "Not Clocked In"}
                                </span>
                            </div>

                            {/* Elapsed time */}
                            {data.is_clocked_in && lastIn && (
                                <div className="mb-4">
                                    <p className="text-3xl font-bold tabular-nums">
                                        <ElapsedTimer since={lastIn.date_time} />
                                    </p>
                                    <p className="text-muted-foreground mt-0.5 text-xs">
                                        since {formatTime(lastIn.date_time)}
                                    </p>
                                </div>
                            )}

                            {/* Punch button */}
                            <button
                                disabled={punchMutation.isPending}
                                onClick={() => punchMutation.mutate(data.next_action)}
                                className={`inline-flex w-full items-center justify-center gap-2.5 rounded-xl py-3.5 text-sm font-semibold text-white shadow-lg transition-all active:scale-95 disabled:opacity-60 ${
                                    data.next_action === "Clock-In"
                                        ? "bg-teal-500 hover:bg-teal-600 shadow-teal-500/20"
                                        : "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20"
                                }`}
                            >
                                {punchMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : data.next_action === "Clock-In" ? (
                                    <LogIn className="h-4 w-4" />
                                ) : (
                                    <LogOut className="h-4 w-4" />
                                )}
                                {punchMutation.isPending ? "Recording…" : data.next_action}
                            </button>

                            {/* Location */}
                            <p className="text-muted-foreground mt-4 flex items-center justify-center gap-1 text-xs">
                                <MapPin className="h-3 w-3" />
                                {location}
                            </p>
                        </div>

                        {/* Today's log */}
                        <div>
                            <p className="text-muted-foreground mb-3 text-[11px] font-semibold uppercase tracking-wider">
                                Today's Log
                            </p>

                            {data.punches.length === 0 ? (
                                <div className="rounded-xl border border-dashed py-10 text-center">
                                    <Clock className="text-muted-foreground mx-auto mb-2 h-5 w-5 opacity-30" />
                                    <p className="text-muted-foreground text-xs">No punches recorded today</p>
                                </div>
                            ) : (
                                <div className="relative">
                                    <div className="absolute left-[19px] top-4 bottom-4 w-px bg-border/60" />
                                    <div className="space-y-1">
                                        {[...data.punches].reverse().map((p) => (
                                            <div key={p.id} className="flex items-center gap-3 pl-1">
                                                <div className={`relative z-10 mt-0 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                                                    p.clock_type === "Clock-In"
                                                        ? "border-green-500/40 bg-green-500/10 text-green-400"
                                                        : "border-rose-500/40 bg-rose-500/10 text-rose-400"
                                                }`}>
                                                    {p.clock_type === "Clock-In"
                                                        ? <LogIn className="h-3.5 w-3.5" />
                                                        : <LogOut className="h-3.5 w-3.5" />
                                                    }
                                                </div>
                                                <div className="flex flex-1 items-center justify-between rounded-xl border px-4 py-3 mb-1">
                                                    <div>
                                                        <p className={`text-xs font-semibold ${
                                                            p.clock_type === "Clock-In" ? "text-green-400" : "text-rose-400"
                                                        }`}>
                                                            {p.clock_type}
                                                        </p>
                                                        <p className="text-muted-foreground mt-0.5 flex items-center gap-1 text-[11px]">
                                                            <MapPin className="h-2.5 w-2.5" />
                                                            {p.location}
                                                        </p>
                                                    </div>
                                                    <p className="text-sm font-semibold tabular-nums">
                                                        {formatTime(p.date_time)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </ParentComponent>
    );
}
