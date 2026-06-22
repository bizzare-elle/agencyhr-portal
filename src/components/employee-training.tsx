import React, { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import { ApiResponse } from "@/index";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TrainingRecord {
    id: number;
    training_name: string | null;
    training_description: string | null;
    training_date_formatted: string;
    status: string;
    status_label: string;
    examination_score: string | null;
    remarks: string | null;
}

interface VideoRecord {
    id: number;
    title: string;
    description: string | null;
    mime_type: string | null;
    file_size_display: string;
    training_name: string | null;
    folder_id: number | null;
    folder_name: string | null;
}

interface TrainingData {
    trainings: TrainingRecord[];
    videos: VideoRecord[];
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ label }: { label: string }) {
    const cls =
        label === "Completed"
            ? "bg-green-500/10 text-green-400"
            : label === "Failed"
              ? "bg-red-500/10 text-red-400"
              : "bg-yellow-500/10 text-yellow-400";
    return <Badge className={cn("px-3 py-1", cls)}>{label}</Badge>;
}

// ── Video player modal ────────────────────────────────────────────────────────

function VideoPlayerModal({
    video,
    employeeId,
    onClose,
}: {
    video: VideoRecord;
    employeeId: string;
    onClose: () => void;
}) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [url, setUrl] = useState<string | null>(null);
    const [mimeType, setMimeType] = useState<string>("video/mp4");
    const [error, setError] = useState<string | null>(null);

    React.useEffect(() => {
        let cancelled = false;

        api.get<ApiResponse<{ url: string; mime_type: string; title: string }>>(
            `/api/v2/videos/${video.id}/url`,
            { params: { employee_id: employeeId } },
        )
            .then((res) => {
                if (cancelled) return;
                const d = res.data?.data;
                if (d?.url) {
                    setMimeType(d.mime_type || "video/mp4");
                    setUrl(d.url);
                } else {
                    setError("Could not load video.");
                }
            })
            .catch((err) => {
                if (cancelled) return;
                const status = err?.response?.status;
                if (status === 403) {
                    setError("You don't have access to this video.");
                } else {
                    setError("Could not load video. Please try again.");
                }
            });

        return () => {
            cancelled = true;
            // Fully release the video resource so the browser stops downloading
            const vid = videoRef.current;
            if (vid) {
                vid.pause();
                vid.removeAttribute("src");
                vid.load();
            }
        };
    }, [video.id, employeeId]);

    return (
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            <DialogContent
                className="max-w-3xl overflow-hidden p-0"
                style={{ background: "#0f172a" }}
            >
                <DialogHeader
                    className="px-5 py-3"
                    style={{ background: "#1e293b" }}
                >
                    <DialogTitle className="text-base text-white">
                        {video.title}
                    </DialogTitle>
                    {video.training_name && (
                        <p className="text-xs text-slate-400">
                            {video.training_name}
                        </p>
                    )}
                </DialogHeader>

                <div
                    className="flex min-h-[200px] items-center justify-center"
                    style={{ background: "#000" }}
                >
                    {error && (
                        <p className="p-6 text-center text-sm text-red-400">
                            {error}
                        </p>
                    )}
                    {!error && !url && (
                        <div className="flex items-center gap-2 p-6 text-sm text-slate-400">
                            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Loading video…
                        </div>
                    )}
                    {!error && url && (
                        <video
                            ref={videoRef}
                            key={url}
                            src={url}
                            className="w-full"
                            style={{ maxHeight: "70vh" }}
                            controls
                            controlsList="nodownload"
                            preload="metadata"
                            onError={() =>
                                setError(
                                    "Failed to play video. The file may be unavailable.",
                                )
                            }
                        >
                            {/* fallback for browsers that don't support the src attribute approach */}
                            <source src={url} type={mimeType} />
                        </video>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function EmployeeTraining({
    employeeId,
}: {
    employeeId: string;
}) {
    const [activeVideo, setActiveVideo] = useState<VideoRecord | null>(null);

    const { data, isLoading, isError } = useQuery<TrainingData>({
        queryKey: ["employeeTraining", employeeId],
        queryFn: async () => {
            const res = await api.get<ApiResponse<TrainingData>>(
                `/api/v2/employees/${employeeId}/training`,
            );
            return res.data.data ?? { trainings: [], videos: [] };
        },
        enabled: !!employeeId,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });

    if (isLoading) {
        return (
            <Card className="mt-6 p-6 shadow-sm">
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Loading training data…
                </div>
            </Card>
        );
    }

    if (isError) {
        return (
            <Card className="mt-6 p-6 shadow-sm">
                <p className="py-10 text-center text-sm text-red-400">
                    Failed to load training data.
                </p>
            </Card>
        );
    }

    const trainings = data?.trainings ?? [];
    const videos = data?.videos ?? [];

    // Group videos by folder
    const folderMap = new Map<string, VideoRecord[]>();
    videos.forEach((v) => {
        const key = v.folder_name ?? "Uncategorized";
        if (!folderMap.has(key)) folderMap.set(key, []);
        folderMap.get(key)!.push(v);
    });
    // Folders with a name first (sorted), then Uncategorized last
    const folderKeys = Array.from(folderMap.keys()).sort((a, b) => {
        if (a === "Uncategorized") return 1;
        if (b === "Uncategorized") return -1;
        return a.localeCompare(b);
    });

    return (
        <div className="mt-6 space-y-6">
            {/* ── Video Assessments ──────────────────────────────────────── */}
            <Card className="p-4 shadow-sm sm:p-6">
                <CardHeader className="p-0 pb-4">
                    <CardTitle>Video Assessments</CardTitle>
                    <CardDescription>
                        Training videos assigned to you.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {videos.length === 0 ? (
                        <Card className="mt-2 p-6 text-center text-sm text-muted-foreground">
                            No video assessments assigned to you yet.
                        </Card>
                    ) : (
                        <div className="space-y-6">
                            {folderKeys.map((folderName) => (
                                <div key={folderName}>
                                    <div className="mb-3 flex items-center gap-2">
                                        <span className="text-base">📁</span>
                                        <h3 className="text-sm font-semibold text-foreground">
                                            {folderName}
                                        </h3>
                                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                            {folderMap.get(folderName)!.length}
                                        </span>
                                        <div className="h-px flex-1 bg-border" />
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        {folderMap.get(folderName)!.map((v) => (
                                            <Card
                                                key={v.id}
                                                className="flex flex-col gap-3 p-4 shadow-sm"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-semibold leading-snug">
                                                            {v.title}
                                                        </p>
                                                        {v.training_name && (
                                                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                                                {v.training_name}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <Badge
                                                        variant="outline"
                                                        className="shrink-0 text-xs"
                                                    >
                                                        {v.file_size_display}
                                                    </Badge>
                                                </div>

                                                {v.description && (
                                                    <p className="line-clamp-2 text-xs text-muted-foreground">
                                                        {v.description}
                                                    </p>
                                                )}

                                                <Button
                                                    size="sm"
                                                    className="mt-auto w-full"
                                                    onClick={() => setActiveVideo(v)}
                                                >
                                                    ▶&nbsp;Watch
                                                </Button>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── Training History ───────────────────────────────────────── */}
            <Card className="p-4 shadow-sm sm:p-6">
                <CardHeader className="p-0 pb-4">
                    <CardTitle>Training History</CardTitle>
                    <CardDescription>
                        Your previous and ongoing training records.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {trainings.length === 0 ? (
                        <Card className="mt-2 p-6 text-center text-sm text-muted-foreground">
                            No training records found.
                        </Card>
                    ) : (
                        <div className="overflow-x-auto rounded-md border">
                            <Table className="min-w-[600px]">
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="px-4 py-3">
                                            Training
                                        </TableHead>
                                        <TableHead className="px-4 py-3">
                                            Date
                                        </TableHead>
                                        <TableHead className="px-4 py-3 text-center">
                                            Status
                                        </TableHead>
                                        <TableHead className="px-4 py-3 text-center">
                                            Score
                                        </TableHead>
                                        <TableHead className="px-4 py-3">
                                            Remarks
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {trainings.map((t) => (
                                        <TableRow
                                            key={t.id}
                                            className="hover:bg-primary/5 transition-colors"
                                        >
                                            <TableCell className="px-4 py-3 font-medium">
                                                {t.training_name ?? "—"}
                                            </TableCell>
                                            <TableCell className="px-4 py-3 whitespace-nowrap">
                                                {t.training_date_formatted}
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-center">
                                                <StatusBadge
                                                    label={t.status_label}
                                                />
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-center">
                                                {t.examination_score ?? "—"}
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-muted-foreground">
                                                {t.remarks ?? "—"}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── Video player modal ─────────────────────────────────────── */}
            {activeVideo && (
                <VideoPlayerModal
                    video={activeVideo}
                    employeeId={employeeId}
                    onClose={() => setActiveVideo(null)}
                />
            )}
        </div>
    );
}
