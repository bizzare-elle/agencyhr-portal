import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import moment from "moment";
import { FilePlus2, FileText } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { ParentComponent } from "@/components/parent-container";
import { EmptyState } from "@/components/empty-state";
import { CardListSkeleton } from "@/components/table-skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { apiError } from "@/lib/api-error";
import { StatusBadge, type DocumentRequest } from "./shared";

interface MineResponse {
    requests: DocumentRequest[];
    types: Record<string, string>;
}

export default function MyDocumentsPage() {
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [type, setType] = useState("");
    const [purpose, setPurpose] = useState("");
    const [remarks, setRemarks] = useState("");

    const listQuery = useQuery<MineResponse>({
        queryKey: ["document-requests", "mine"],
        queryFn: async () =>
            (await api.get("/api/v2/document-requests")).data.data,
    });
    const requests = listQuery.data?.requests ?? [];
    const types = listQuery.data?.types ?? {};

    const reset = () => {
        setType("");
        setPurpose("");
        setRemarks("");
    };

    const create = useMutation({
        mutationFn: () =>
            api.post("/api/v2/document-requests", {
                document_type: type,
                purpose,
                remarks,
            }),
        onSuccess: () => {
            toast.success("Request submitted. Check this page for updates.");
            queryClient.invalidateQueries({ queryKey: ["document-requests"] });
            setOpen(false);
            reset();
        },
        onError: (err) =>
            toast.error(apiError(err, "Could not submit the request.")),
    });

    const cancel = useMutation({
        mutationFn: (id: number) =>
            api.post(`/api/v2/document-requests/${id}/cancel`),
        onSuccess: () => {
            toast.success("Request cancelled.");
            queryClient.invalidateQueries({ queryKey: ["document-requests"] });
        },
        onError: (err) =>
            toast.error(apiError(err, "Could not cancel the request.")),
    });

    const canSubmit = type !== "" && purpose.trim() !== "" && !create.isPending;

    return (
        <ParentComponent>
            <div className="mx-auto w-full max-w-3xl space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/15 text-yellow-400">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">
                                Document Requests
                            </h1>
                            <p className="text-muted-foreground text-sm">
                                Ask for a certificate or a copy, and track it
                                here.
                            </p>
                        </div>
                    </div>
                    <Button
                        className="h-11 w-full shrink-0 bg-yellow-500 text-white hover:bg-yellow-600 sm:w-auto"
                        onClick={() => setOpen(true)}
                    >
                        <FilePlus2 className="h-4 w-4" />
                        New request
                    </Button>
                </div>

                {listQuery.isLoading ? (
                    <CardListSkeleton count={3} />
                ) : listQuery.isError ? (
                    <Card className="p-4 text-sm">
                        Could not load your requests. Try again in a moment.
                    </Card>
                ) : requests.length === 0 ? (
                    <Card>
                        <EmptyState
                            icon={FileText}
                            title="No requests yet"
                            description="Request a Certificate of Employment or a payslip copy and follow its progress here."
                        />
                    </Card>
                ) : (
                    <ul className="space-y-3">
                        {requests.map((request) => (
                            <li key={request.id}>
                                <Card className="space-y-2 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-semibold">
                                                {request.document_label}
                                            </p>
                                            <p className="text-muted-foreground text-xs">
                                                Requested{" "}
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
                                    {request.response_note && (
                                        <p className="bg-muted/40 rounded-lg border p-3 text-sm">
                                            {request.response_note}
                                        </p>
                                    )}
                                    {request.status === 0 && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-10"
                                            disabled={cancel.isPending}
                                            onClick={() =>
                                                cancel.mutate(request.id)
                                            }
                                        >
                                            Cancel request
                                        </Button>
                                    )}
                                </Card>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <Dialog
                open={open}
                onOpenChange={(next) => {
                    setOpen(next);
                    if (!next) reset();
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>New document request</DialogTitle>
                        <DialogDescription>
                            Your coordinator will process it. Check this page
                            for updates.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="doc-type">Document</Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger
                                    id="doc-type"
                                    className="h-11 w-full"
                                >
                                    <SelectValue placeholder="Choose a document" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(types).map(
                                        ([key, label]) => (
                                            <SelectItem key={key} value={key}>
                                                {label}
                                            </SelectItem>
                                        ),
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="doc-purpose">Purpose</Label>
                            <Input
                                id="doc-purpose"
                                className="h-11"
                                maxLength={255}
                                placeholder="e.g. Bank loan application"
                                value={purpose}
                                onChange={(e) => setPurpose(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="doc-remarks">
                                Remarks (optional)
                            </Label>
                            <Textarea
                                id="doc-remarks"
                                maxLength={1000}
                                placeholder="Anything your coordinator should know, like a deadline."
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-2">
                        <Button
                            variant="outline"
                            className="h-11"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="h-11 bg-yellow-500 text-white hover:bg-yellow-600"
                            disabled={!canSubmit}
                            onClick={() => create.mutate()}
                        >
                            {create.isPending
                                ? "Submitting..."
                                : "Submit request"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </ParentComponent>
    );
}
