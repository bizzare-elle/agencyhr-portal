import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import moment from "moment";
import { ClipboardCheck } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { ParentComponent } from "@/components/parent-container";
import { EmptyState } from "@/components/empty-state";
import { CardListSkeleton } from "@/components/table-skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { apiError } from "@/lib/api-error";
import { StatusBadge, type DocumentRequest } from "./shared";

const FILTERS: { label: string; value: string }[] = [
    { label: "Pending", value: "0" },
    { label: "Processing", value: "1" },
    { label: "Ready", value: "2" },
    { label: "Declined", value: "3" },
    { label: "All", value: "" },
];

type Decision = "processing" | "ready" | "declined";

interface Pending {
    request: DocumentRequest;
    decision: Decision;
}

const DECISION_COPY: Record<
    Decision,
    { title: string; confirm: string; noteLabel: string; noteRequired: boolean }
> = {
    processing: {
        title: "Start processing",
        confirm: "Start processing",
        noteLabel: "Note for the employee (optional)",
        noteRequired: false,
    },
    ready: {
        title: "Mark as ready",
        confirm: "Mark ready",
        noteLabel: "Pick-up or delivery details (optional)",
        noteRequired: false,
    },
    declined: {
        title: "Decline request",
        confirm: "Decline",
        noteLabel: "Reason (required)",
        noteRequired: true,
    },
};

export default function DocumentRequestsManagePage() {
    const queryClient = useQueryClient();
    const [filter, setFilter] = useState("0");
    const [pending, setPending] = useState<Pending | null>(null);
    const [note, setNote] = useState("");

    const listQuery = useQuery<{ requests: DocumentRequest[]; total: number }>({
        queryKey: ["document-requests", "manage", filter],
        queryFn: async () =>
            (
                await api.get(
                    `/api/v2/document-requests/manage?status=${filter}&limit=50`,
                )
            ).data.data,
    });
    const requests = listQuery.data?.requests ?? [];

    const close = () => {
        setPending(null);
        setNote("");
    };

    const update = useMutation({
        mutationFn: ({ request, decision }: Pending) =>
            api.post(`/api/v2/document-requests/${request.id}/status`, {
                status: decision,
                response_note: note,
            }),
        onSuccess: () => {
            toast.success(
                "Request updated. The employee will see the new status.",
            );
            queryClient.invalidateQueries({ queryKey: ["document-requests"] });
            close();
        },
        onError: (err) =>
            toast.error(apiError(err, "Could not update the request.")),
    });

    const copy = pending ? DECISION_COPY[pending.decision] : null;
    const canConfirm =
        !!pending &&
        !!copy &&
        (!copy.noteRequired || note.trim() !== "") &&
        !update.isPending;

    return (
        <ParentComponent>
            <div className="mx-auto w-full max-w-3xl space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/15 text-yellow-400">
                        <ClipboardCheck className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">Document Requests</h1>
                        <p className="text-muted-foreground text-sm">
                            Requests from employees in your agency.
                        </p>
                    </div>
                </div>

                <div
                    className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
                    role="tablist"
                >
                    {FILTERS.map((item) => (
                        <Button
                            key={item.label}
                            role="tab"
                            aria-selected={filter === item.value}
                            variant={
                                filter === item.value ? "default" : "outline"
                            }
                            size="sm"
                            className="h-10 shrink-0"
                            onClick={() => setFilter(item.value)}
                        >
                            {item.label}
                        </Button>
                    ))}
                </div>

                {listQuery.isLoading ? (
                    <CardListSkeleton count={3} />
                ) : listQuery.isError ? (
                    <Card className="p-4 text-sm">
                        Could not load requests. Try again in a moment.
                    </Card>
                ) : requests.length === 0 ? (
                    <Card>
                        <EmptyState
                            icon={ClipboardCheck}
                            title="Nothing here"
                            description="No requests match this filter."
                        />
                    </Card>
                ) : (
                    <ul className="space-y-3">
                        {requests.map((request) => (
                            <li key={request.id}>
                                <Card className="space-y-2 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate font-semibold">
                                                {request.employee_name ??
                                                    `Employee #${request.employee_id}`}
                                            </p>
                                            <p className="text-muted-foreground text-xs">
                                                {request.document_label} ·{" "}
                                                {moment(
                                                    request.created_at,
                                                ).format("MMM D, YYYY h:mm A")}
                                            </p>
                                        </div>
                                        <StatusBadge request={request} />
                                    </div>
                                    <p className="text-sm">
                                        <span className="text-muted-foreground">
                                            Purpose:{" "}
                                        </span>
                                        {request.purpose}
                                    </p>
                                    {request.remarks && (
                                        <p className="text-muted-foreground text-sm">
                                            {request.remarks}
                                        </p>
                                    )}
                                    {request.response_note && (
                                        <p className="bg-muted/40 rounded-lg border p-3 text-sm">
                                            {request.response_note}
                                        </p>
                                    )}
                                    {(request.status === 0 ||
                                        request.status === 1) && (
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {request.status === 0 && (
                                                <Button
                                                    size="sm"
                                                    className="h-10"
                                                    onClick={() =>
                                                        setPending({
                                                            request,
                                                            decision:
                                                                "processing",
                                                        })
                                                    }
                                                >
                                                    Start processing
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                className="h-10 bg-green-600 text-white hover:bg-green-700"
                                                onClick={() =>
                                                    setPending({
                                                        request,
                                                        decision: "ready",
                                                    })
                                                }
                                            >
                                                Mark ready
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-10"
                                                onClick={() =>
                                                    setPending({
                                                        request,
                                                        decision: "declined",
                                                    })
                                                }
                                            >
                                                Decline
                                            </Button>
                                        </div>
                                    )}
                                </Card>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <Dialog open={!!pending} onOpenChange={(next) => !next && close()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{copy?.title}</DialogTitle>
                        <DialogDescription>
                            {pending
                                ? `${pending.request.document_label} for ${pending.request.employee_name ?? "the employee"}. The employee will see this on their Documents page.`
                                : ""}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="decision-note">{copy?.noteLabel}</Label>
                        <Textarea
                            id="decision-note"
                            maxLength={500}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </div>
                    <DialogFooter className="gap-2 sm:gap-2">
                        <Button
                            variant="outline"
                            className="h-11"
                            onClick={close}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="h-11 bg-yellow-500 text-white hover:bg-yellow-600"
                            disabled={!canConfirm}
                            onClick={() => pending && update.mutate(pending)}
                        >
                            {update.isPending ? "Saving..." : copy?.confirm}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </ParentComponent>
    );
}
