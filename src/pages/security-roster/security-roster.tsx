import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    Ban,
    BadgeCheck,
    Download,
    FileSpreadsheet,
    Hourglass,
    Paperclip,
    Pencil,
    Plus,
    RotateCcw,
    ShieldCheck,
    Trash2,
    Upload,
    XCircle,
} from "lucide-react";
import api from "@/lib/axios";
import { ParentComponent } from "@/components/parent-container";
import FullPageLoader from "@/components/page-loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { formatToMonthDayYear } from "@/helpers/formatDates";
import { apiErrorMessage } from "@/helpers/apiErrorMessage";
import {
    downloadRosterTemplate,
    exportRoster,
} from "@/components/security-roster/roster-excel";
import {
    ApiResponse,
    SecurityRosterEntry,
    SecurityRosterImportResult,
    SecurityRosterOptions,
    SecurityRosterTotals,
} from "@/index";

const PAGE_SIZE = 25;

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
    pending: {
        label: "Pending",
        className: "bg-yellow-500/10 text-yellow-400",
    },
    claimed: { label: "Claimed", className: "bg-green-500/10 text-green-400" },
    inactive: {
        label: "Inactive",
        className: "bg-muted text-muted-foreground",
    },
};

type RowAction = "deactivate" | "reactivate" | "delete";

const ACTION_COPY: Record<
    RowAction,
    { title: string; body: string; confirm: string }
> = {
    deactivate: {
        title: "Deactivate this posting?",
        body: "The guard will no longer be able to register on the branch tablet. You can reactivate it later.",
        confirm: "Yes, deactivate",
    },
    reactivate: {
        title: "Reactivate this posting?",
        body: "The guard will be able to register on the branch tablet again.",
        confirm: "Yes, reactivate",
    },
    delete: {
        title: "Delete this roster entry?",
        body: "The guard is removed from your roster. This cannot be undone from the portal.",
        confirm: "Yes, delete",
    },
};

export default function SecurityRoster() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(0);
    const [pending, setPending] = useState<{
        action: RowAction;
        row: SecurityRosterEntry;
    } | null>(null);
    const [importOpen, setImportOpen] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importResult, setImportResult] =
        useState<SecurityRosterImportResult | null>(null);

    const rosterQuery = useQuery({
        queryKey: ["security-roster"],
        queryFn: async () => {
            const res = await api.get<
                ApiResponse<{
                    rows: SecurityRosterEntry[];
                    totals: SecurityRosterTotals;
                }>
            >("/api/v2/security-roster");
            return res.data.data;
        },
    });

    const optionsQuery = useQuery({
        queryKey: ["security-roster-options"],
        queryFn: async () => {
            const res = await api.get<ApiResponse<SecurityRosterOptions>>(
                "/api/v2/security-roster/options",
            );
            return res.data.data;
        },
        staleTime: 5 * 60 * 1000,
    });

    const actionMutation = useMutation({
        mutationFn: ({
            action,
            row,
        }: {
            action: RowAction;
            row: SecurityRosterEntry;
        }) =>
            api.post<ApiResponse<null>>(
                `/api/v2/security-roster/${row.id}/${action}`,
            ),
        onSuccess: (res) => {
            toast.success(res.data?.message ?? "Saved.");
            queryClient.invalidateQueries({ queryKey: ["security-roster"] });
        },
        onError: (err) =>
            toast.error(apiErrorMessage(err, "Something went wrong.")),
        onSettled: () => setPending(null),
    });

    const importMutation = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append("file", file);
            const res = await api.post<ApiResponse<SecurityRosterImportResult>>(
                "/api/v2/security-roster/import",
                formData,
            );
            return res.data.data;
        },
        onSuccess: (result) => {
            setImportResult(result);
            if (result.inserted > 0) {
                queryClient.invalidateQueries({
                    queryKey: ["security-roster"],
                });
            }
        },
        onError: (err) => toast.error(apiErrorMessage(err, "Import failed.")),
    });

    const rows = useMemo(
        () => rosterQuery.data?.rows ?? [],
        [rosterQuery.data],
    );
    const totals = rosterQuery.data?.totals;

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return rows;
        return rows.filter((r) =>
            [r.full_name, r.license_number, r.mobile_number].some((v) =>
                (v ?? "").toLowerCase().includes(term),
            ),
        );
    }, [rows, search]);

    const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(page, pageCount - 1);
    const visible = filtered.slice(
        currentPage * PAGE_SIZE,
        (currentPage + 1) * PAGE_SIZE,
    );

    const closeImport = () => {
        setImportOpen(false);
        setImportFile(null);
        setImportResult(null);
    };

    const handleTemplate = async () => {
        if (!optionsQuery.data) {
            toast.error(
                "Branch and schedule lists are still loading. Try again in a moment.",
            );
            return;
        }
        await downloadRosterTemplate(optionsQuery.data);
    };

    const handleExport = async () => {
        if (!rows.length) {
            toast.error("There are no guards on your roster to export.");
            return;
        }
        await exportRoster(rows);
    };

    if (rosterQuery.isLoading) return <FullPageLoader />;

    if (rosterQuery.isError) {
        return (
            <ParentComponent>
                <div className="text-center text-lg font-semibold text-red-400">
                    {apiErrorMessage(
                        rosterQuery.error,
                        "Error loading the security roster.",
                    )}
                </div>
            </ParentComponent>
        );
    }

    const tiles = [
        {
            label: "Pending",
            value: totals?.pending,
            icon: Hourglass,
            tone: "bg-yellow-500/10 text-yellow-400",
        },
        {
            label: "Claimed",
            value: totals?.claimed,
            icon: BadgeCheck,
            tone: "bg-green-500/10 text-green-400",
        },
        {
            label: "Inactive",
            value: totals?.inactive,
            icon: XCircle,
            tone: "bg-muted text-muted-foreground",
        },
        {
            label: "Total on Roster",
            value: totals?.total,
            icon: ShieldCheck,
            tone: "bg-blue-500/10 text-blue-400",
        },
    ];

    return (
        <ParentComponent>
            <Card className="flex flex-col gap-4 rounded-xl border p-4 shadow-sm sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-yellow-500/20 text-yellow-400">
                        <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold sm:text-xl">
                            Security Roster
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Guards you've posted to Wildflour branches. A guard
                            registers on the branch tablet using their license
                            number once their posting is set.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="h-4 w-4" />
                        Export
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setImportOpen(true)}
                    >
                        <Upload className="h-4 w-4" />
                        Import
                    </Button>
                    <Link to="/security-roster/form">
                        <Button className="w-full bg-yellow-500 text-white hover:bg-yellow-600 sm:w-auto">
                            <Plus className="h-4 w-4" />
                            Add Guard
                        </Button>
                    </Link>
                </div>
            </Card>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {tiles.map((t) => (
                    <Card
                        key={t.label}
                        className="flex flex-row items-center gap-3 p-4"
                    >
                        <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${t.tone}`}
                        >
                            <t.icon className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold">
                                {t.value ?? 0}
                            </div>
                            <div className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                                {t.label}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader className="flex flex-col gap-3 border-b px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle className="text-base">Roster</CardTitle>
                        <CardDescription>
                            Only pending postings can be edited. A guard who has
                            already registered is managed by Atlas HR.
                        </CardDescription>
                    </div>
                    <Input
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(0);
                        }}
                        placeholder="Search name, license #, mobile"
                        className="sm:w-72"
                    />
                </CardHeader>

                <CardContent className="p-0">
                    <div className="w-full overflow-x-auto">
                        <Table className="min-w-[900px] text-xs sm:text-sm">
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="px-3 py-3">
                                        Full Name
                                    </TableHead>
                                    <TableHead className="px-3 py-3">
                                        License No.
                                    </TableHead>
                                    <TableHead className="px-3 py-3">
                                        Mobile No.
                                    </TableHead>
                                    <TableHead className="px-3 py-3">
                                        Branch
                                    </TableHead>
                                    <TableHead className="px-3 py-3">
                                        Schedule
                                    </TableHead>
                                    <TableHead className="px-3 py-3 text-center">
                                        Status
                                    </TableHead>
                                    <TableHead className="px-3 py-3 text-center">
                                        Added
                                    </TableHead>
                                    <TableHead className="px-3 py-3 text-center">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {visible.length > 0 ? (
                                    visible.map((r) => {
                                        const badge = STATUS_BADGE[r.status];
                                        return (
                                            <TableRow
                                                key={r.id}
                                                className="hover:bg-muted/10"
                                            >
                                                <TableCell className="px-3 py-3 font-medium">
                                                    {r.full_name}
                                                </TableCell>
                                                <TableCell className="px-3 py-3">
                                                    {r.license_number}
                                                </TableCell>
                                                <TableCell className="px-3 py-3">
                                                    {r.mobile_number}
                                                </TableCell>
                                                <TableCell className="px-3 py-3">
                                                    {r.branch_name ?? (
                                                        <span className="text-muted-foreground">
                                                            Not set
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="px-3 py-3">
                                                    {r.schedule_name ?? (
                                                        <span className="text-muted-foreground">
                                                            Not set
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="px-3 py-3 text-center">
                                                    <Badge
                                                        className={
                                                            badge?.className
                                                        }
                                                    >
                                                        {badge?.label ??
                                                            r.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="px-3 py-3 text-center">
                                                    {r.created_at
                                                        ? formatToMonthDayYear(
                                                              r.created_at,
                                                          )
                                                        : "N/A"}
                                                </TableCell>
                                                <TableCell className="px-3 py-3">
                                                    <div className="flex justify-center gap-1">
                                                        {r.can_edit && (
                                                            <Link
                                                                to={`/security-roster/form/${r.id}`}
                                                            >
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    title="Edit posting"
                                                                >
                                                                    <Pencil className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                        )}
                                                        {r.can_deactivate && (
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                title="Deactivate posting"
                                                                onClick={() =>
                                                                    setPending({
                                                                        action: "deactivate",
                                                                        row: r,
                                                                    })
                                                                }
                                                            >
                                                                <Ban className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        {r.can_reactivate && (
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                title="Reactivate posting"
                                                                onClick={() =>
                                                                    setPending({
                                                                        action: "reactivate",
                                                                        row: r,
                                                                    })
                                                                }
                                                            >
                                                                <RotateCcw className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        {r.can_delete && (
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                title="Delete"
                                                                className="text-red-400 hover:text-red-300"
                                                                onClick={() =>
                                                                    setPending({
                                                                        action: "delete",
                                                                        row: r,
                                                                    })
                                                                }
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={8}
                                            className="text-muted-foreground py-8 text-center"
                                        >
                                            {rows.length
                                                ? "No guards match your search."
                                                : "No guards on your roster yet."}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {filtered.length > PAGE_SIZE && (
                        <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
                            <span className="text-muted-foreground">
                                {currentPage * PAGE_SIZE + 1}–
                                {Math.min(
                                    (currentPage + 1) * PAGE_SIZE,
                                    filtered.length,
                                )}{" "}
                                of {filtered.length}
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={currentPage === 0}
                                    onClick={() => setPage(currentPage - 1)}
                                >
                                    Previous
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={currentPage >= pageCount - 1}
                                    onClick={() => setPage(currentPage + 1)}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <AlertDialog
                open={!!pending}
                onOpenChange={(open) => !open && setPending(null)}
            >
                <AlertDialogContent>
                    {pending && (
                        <>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    {ACTION_COPY[pending.action].title}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    <span className="text-foreground font-medium">
                                        {pending.row.full_name}
                                    </span>{" "}
                                    ({pending.row.license_number}).{" "}
                                    {ACTION_COPY[pending.action].body}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    disabled={actionMutation.isPending}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        actionMutation.mutate(pending);
                                    }}
                                >
                                    {actionMutation.isPending ? (
                                        <Spinner className="h-4 w-4" />
                                    ) : (
                                        ACTION_COPY[pending.action].confirm
                                    )}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </>
                    )}
                </AlertDialogContent>
            </AlertDialog>

            <Dialog
                open={importOpen}
                onOpenChange={(open) =>
                    open ? setImportOpen(true) : closeImport()
                }
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Import Roster</DialogTitle>
                        <DialogDescription>
                            Upload a .xlsx, .xls, or .csv file with one guard
                            per row. Branch and Schedule are matched by name, so
                            start from the template — its second sheet lists the
                            accepted values.
                        </DialogDescription>
                    </DialogHeader>

                    <Button
                        variant="outline"
                        className="w-fit"
                        onClick={handleTemplate}
                    >
                        <FileSpreadsheet className="h-4 w-4" />
                        Download blank template
                    </Button>

                    <label className="border-input hover:border-primary/50 flex cursor-pointer items-center gap-2 rounded-md border border-dashed px-4 py-3 text-sm transition-colors">
                        <Paperclip className="h-4 w-4 shrink-0" />
                        <span className="text-muted-foreground truncate">
                            {importFile
                                ? importFile.name
                                : "Click to choose the filled-in template..."}
                        </span>
                        <input
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            className="hidden"
                            onChange={(e) => {
                                setImportFile(e.target.files?.[0] ?? null);
                                setImportResult(null);
                            }}
                        />
                    </label>

                    {importResult && (
                        <div
                            className={`rounded-md p-3 text-sm ${
                                importResult.skipped > 0
                                    ? "bg-yellow-500/10 text-yellow-400"
                                    : "bg-green-500/10 text-green-400"
                            }`}
                        >
                            <p>
                                <strong>{importResult.inserted}</strong>{" "}
                                guard(s) added to the roster.
                                {importResult.skipped > 0 && (
                                    <>
                                        {" "}
                                        <strong>
                                            {importResult.skipped}
                                        </strong>{" "}
                                        row(s) skipped:
                                    </>
                                )}
                            </p>
                            {importResult.details.length > 0 && (
                                <ul className="mt-1 max-h-40 list-disc overflow-y-auto pl-5">
                                    {importResult.details.map((d) => (
                                        <li key={d}>{d}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={closeImport}>
                            {importResult ? "Close" : "Cancel"}
                        </Button>
                        <Button
                            className="bg-yellow-500 text-white hover:bg-yellow-600"
                            disabled={!importFile || importMutation.isPending}
                            onClick={() =>
                                importFile && importMutation.mutate(importFile)
                            }
                        >
                            {importMutation.isPending ? (
                                <>
                                    <Spinner className="h-4 w-4" />
                                    Importing...
                                </>
                            ) : (
                                <>
                                    <Upload className="h-4 w-4" />
                                    Upload &amp; Import
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </ParentComponent>
    );
}
