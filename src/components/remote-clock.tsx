import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Wifi, LogIn, LogOut, Loader2, Clock } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { ApiResponse } from "@/index";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Punch {
    id: number;
    clock_type: string;
    date_time: string;
    location: string;
}

interface RemoteStatus {
    is_clocked_in: boolean;
    next_action: "Clock-In" | "Clock-Out";
    punches: Punch[];
}

function formatTime(dt: string) {
    return new Date(dt).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });
}

export default function RemoteClock({ employeeId }: { employeeId: string | number }) {
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery<RemoteStatus>({
        queryKey: ["remote-status", employeeId],
        queryFn: async () => {
            const res = await api.get<ApiResponse<RemoteStatus>>(
                `/api/v2/remote/status/${employeeId}`,
            );
            return res.data.data!;
        },
        refetchInterval: 60_000,
    });

    const punchMutation = useMutation({
        mutationFn: (clock_type: "Clock-In" | "Clock-Out") =>
            api.post(`/api/v2/remote/punch/${employeeId}`, { clock_type }),
        onSuccess: (_, clock_type) => {
            toast.success(`${clock_type} recorded successfully.`);
            queryClient.invalidateQueries({ queryKey: ["remote-status", employeeId] });
        },
        onError: () => toast.error("Failed to record punch. Please try again."),
    });

    if (isLoading) return null;
    if (!data) return null;

    const { is_clocked_in, next_action, punches } = data;
    const todayPunches = punches.slice().reverse();

    return (
        <Card className="mb-4 border-teal-500/30 bg-teal-500/5">
            <CardHeader className="pb-3 pt-4 px-5">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold text-teal-400">
                        <Wifi className="h-4 w-4" />
                        Work Remotely
                    </CardTitle>
                    <Badge
                        className={
                            is_clocked_in
                                ? "border-0 bg-green-500/15 text-xs text-green-400"
                                : "border-0 bg-muted/40 text-xs text-muted-foreground"
                        }
                    >
                        {is_clocked_in ? "Clocked In" : "Not Clocked In"}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="px-5 pb-4">
                <div className="flex items-center gap-3">
                    <Button
                        size="sm"
                        disabled={punchMutation.isPending}
                        className={
                            next_action === "Clock-In"
                                ? "bg-teal-500 hover:bg-teal-600 text-white"
                                : "bg-rose-500 hover:bg-rose-600 text-white"
                        }
                        onClick={() => punchMutation.mutate(next_action)}
                    >
                        {punchMutation.isPending ? (
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : next_action === "Clock-In" ? (
                            <LogIn className="mr-1.5 h-3.5 w-3.5" />
                        ) : (
                            <LogOut className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        {next_action}
                    </Button>

                    {todayPunches.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {todayPunches.map((p) => (
                                <div
                                    key={p.id}
                                    className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs"
                                >
                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                    <span
                                        className={
                                            p.clock_type === "Clock-In"
                                                ? "text-green-400"
                                                : "text-rose-400"
                                        }
                                    >
                                        {p.clock_type === "Clock-In" ? "IN" : "OUT"}
                                    </span>
                                    <span className="text-muted-foreground">
                                        {formatTime(p.date_time)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
