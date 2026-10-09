import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import moment from "moment";
import { Laptop, LogOut, ShieldCheck, Smartphone } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { ParentComponent } from "@/components/parent-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useAuthStore } from "@/hooks/use-auth";

interface DeviceSession {
    id: string;
    device: string;
    ip_address: string | null;
    signed_in_at: string;
    last_active_at: string;
    is_current: boolean;
}

function errorMessage(err: unknown, fallback: string): string {
    const e = err as {
        response?: { data?: { message?: string } };
        message?: string;
    };
    return e?.response?.data?.message ?? e?.message ?? fallback;
}

function DevicesCard() {
    const queryClient = useQueryClient();
    const logout = useAuthStore((s) => s.logout);
    const [confirmOthers, setConfirmOthers] = useState(false);

    const sessionsQuery = useQuery<DeviceSession[]>({
        queryKey: ["sessions"],
        queryFn: async () => {
            const res = await api.get("/api/v2/auth/sessions");
            return res.data?.data ?? [];
        },
    });
    const sessions = sessionsQuery.data ?? [];
    const others = sessions.filter((s) => !s.is_current);

    const revoke = useMutation({
        mutationFn: async (session: DeviceSession) => {
            await api.post(`/api/v2/auth/sessions/${session.id}/revoke`);
            return session;
        },
        onSuccess: (session) => {
            toast.success("Device signed out.");
            if (session.is_current) {
                logout();
                return;
            }
            queryClient.invalidateQueries({ queryKey: ["sessions"] });
        },
        onError: (err) =>
            toast.error(errorMessage(err, "Could not sign out that device.")),
    });

    const revokeOthers = useMutation({
        mutationFn: () => api.post("/api/v2/auth/sessions/revoke-others"),
        onSuccess: () => {
            toast.success("Signed out of all other devices.");
            queryClient.invalidateQueries({ queryKey: ["sessions"] });
        },
        onError: (err) =>
            toast.error(errorMessage(err, "Could not sign out other devices.")),
    });

    return (
        <Card className="space-y-4 p-4 sm:p-6">
            <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-500/15 text-yellow-400">
                    <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                    <h2 className="text-base font-semibold">
                        Signed-in devices
                    </h2>
                    <p className="text-muted-foreground text-sm">
                        Sign out of any device you no longer use or don't
                        recognize. A signed-out device loses access right away.
                    </p>
                </div>
            </div>

            {sessionsQuery.isLoading && (
                <div className="space-y-2">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </div>
            )}

            {sessionsQuery.isError && (
                <p className="rounded-lg border p-3 text-sm">
                    Could not load your devices. Try again in a moment.
                </p>
            )}

            <ul className="space-y-2">
                {sessions.map((session) => {
                    const mobile = /Android|iOS/.test(session.device);
                    const Icon = mobile ? Smartphone : Laptop;
                    return (
                        <li
                            key={session.id}
                            className="flex items-center gap-3 rounded-lg border p-3"
                        >
                            <Icon className="text-muted-foreground h-5 w-5 shrink-0" />
                            <div className="min-w-0 flex-1">
                                <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                                    {session.device}
                                    {session.is_current && (
                                        <Badge className="bg-green-600 text-white">
                                            This device
                                        </Badge>
                                    )}
                                </p>
                                <p className="text-muted-foreground text-xs break-words">
                                    Signed in{" "}
                                    {moment(session.signed_in_at).fromNow()}
                                    {session.ip_address
                                        ? ` · ${session.ip_address}`
                                        : ""}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-10 shrink-0"
                                aria-label={`Sign out ${session.device}`}
                                disabled={revoke.isPending}
                                onClick={() => revoke.mutate(session)}
                            >
                                <LogOut className="h-4 w-4" />
                                <span className="hidden sm:inline">
                                    Sign out
                                </span>
                            </Button>
                        </li>
                    );
                })}
            </ul>

            {others.length > 0 && (
                <Button
                    variant="destructive"
                    className="h-11 w-full sm:w-auto"
                    disabled={revokeOthers.isPending}
                    onClick={() => setConfirmOthers(true)}
                >
                    Sign out all other devices
                </Button>
            )}

            <AlertDialog open={confirmOthers} onOpenChange={setConfirmOthers}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Sign out other devices?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {others.length} other device
                            {others.length === 1 ? "" : "s"} will be signed out
                            immediately. This device stays signed in.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => revokeOthers.mutate()}
                            className="bg-red-600 text-white hover:bg-red-700"
                        >
                            Sign them out
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}

export default function DevicesPage() {
    return (
        <ParentComponent>
            <div className="mx-auto w-full max-w-2xl space-y-4">
                <div>
                    <h1 className="text-xl font-bold">Signed-in devices</h1>
                    <p className="text-muted-foreground text-sm">
                        See where you are signed in and sign out of devices you
                        no longer use.
                    </p>
                </div>
                <DevicesCard />
            </div>
        </ParentComponent>
    );
}
