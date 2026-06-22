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

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatBytes(display: string) {
    return display;
}

function getMimeLabel(mime: string | null) {
    if (!mime) return "Video";
    if (mime.includes("mp4")) return "MP4";
    if (mime.includes("webm")) return "WebM";
    if (mime.includes("ogg")) return "OGG";
    return "Video";
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ label }: { label: string }) {
    const cls =
        label === "Completed"
            ? "bg-green-500/10 text-green-400 border-green-500/20"
            : label === "Failed"
              ? "bg-red-500/10 text-red-400 border-red-500/20"
              : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    return (
        <Badge className={cn("px-3 py-1 border text-xs font-medium", cls)}>
            {label}
        </Badge>
    );
}

// ── Video preview page ────────────────────────────────────────────────────────

function VideoPreviewPage({
    video,
    employeeId,
    allVideos,
    onClose,
    onSelect,
}: {
    video: VideoRecord;
    employeeId: string;
    allVideos: VideoRecord[];
    onClose: () => void;
    onSelect: (v: VideoRecord) => void;
}) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [url, setUrl] = useState<string | null>(null);
    const [mimeType, setMimeType] = useState<string>("video/mp4");
    const [error, setError] = useState<string | null>(null);

    React.useEffect(() => {
        let cancelled = false;
        setUrl(null);
        setError(null);

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
            const vid = videoRef.current;
            if (vid) {
                vid.pause();
                vid.removeAttribute("src");
                vid.load();
            }
        };
    }, [video.id, employeeId]);

    // Related videos = same folder, excluding current
    const related = allVideos.filter(
        (v) => v.id !== video.id && v.folder_id === video.folder_id,
    );

    return (
        <div className="flex flex-col gap-6">
            {/* Back nav */}
            <div className="flex items-center gap-2">
                <button
                    onClick={onClose}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                    Back to Videos
                </button>
                {video.folder_name && (
                    <>
                        <span className="text-muted-foreground/40">›</span>
                        <span className="text-sm text-muted-foreground">
                            {video.folder_name}
                        </span>
                        <span className="text-muted-foreground/40">›</span>
                        <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
                            {video.title}
                        </span>
                    </>
                )}
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
                {/* ── Player ───────────────────────────────────────── */}
                <div className="flex flex-col gap-4">
                    {/* Video player */}
                    <div
                        className="relative w-full overflow-hidden rounded-xl"
                        style={{
                            background: "#000",
                            aspectRatio: "16/9",
                        }}
                    >
                        {error && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
                                <svg
                                    className="h-10 w-10 text-red-400/60"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                                    />
                                </svg>
                                <p className="text-sm text-red-400">{error}</p>
                            </div>
                        )}
                        {!error && !url && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                <p className="text-xs text-slate-400">
                                    Loading video…
                                </p>
                            </div>
                        )}
                        {!error && url && (
                            <video
                                ref={videoRef}
                                key={url}
                                src={url}
                                className="h-full w-full"
                                controls
                                controlsList="nodownload"
                                preload="metadata"
                                onError={() =>
                                    setError(
                                        "Failed to play video. The file may be unavailable.",
                                    )
                                }
                            >
                                <source src={url} type={mimeType} />
                            </video>
                        )}
                    </div>

                    {/* Video info */}
                    <div className="flex flex-col gap-2">
                        <h2 className="text-lg font-semibold leading-snug">
                            {video.title}
                        </h2>
                        <div className="flex flex-wrap items-center gap-2">
                            {video.training_name && (
                                <Badge
                                    variant="secondary"
                                    className="text-xs font-normal"
                                >
                                    {video.training_name}
                                </Badge>
                            )}
                            {video.folder_name && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <span>📁</span>
                                    {video.folder_name}
                                </span>
                            )}
                            <span className="ml-auto text-xs text-muted-foreground">
                                {getMimeLabel(video.mime_type)} ·{" "}
                                {video.file_size_display}
                            </span>
                        </div>
                        {video.description && (
                            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                                {video.description}
                            </p>
                        )}
                    </div>
                </div>

                {/* ── Sidebar: related videos ───────────────────────── */}
                {related.length > 0 && (
                    <div className="flex flex-col gap-3">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                            More in this folder
                        </h3>
                        <div className="flex flex-col gap-2">
                            {related.map((v) => (
                                <button
                                    key={v.id}
                                    onClick={() => onSelect(v)}
                                    className="flex items-start gap-3 rounded-lg border border-border p-3 text-left hover:border-primary/40 hover:bg-primary/5 transition-colors"
                                >
                                    {/* Mini thumb */}
                                    <div
                                        className="shrink-0 h-12 w-20 rounded-md flex items-center justify-center"
                                        style={{ background: "#0f172a" }}
                                    >
                                        <svg
                                            className="h-5 w-5 text-primary/60"
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="line-clamp-2 text-xs font-medium leading-snug">
                                            {v.title}
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {v.file_size_display}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Video tile ────────────────────────────────────────────────────────────────

function VideoTile({
    video,
    onWatch,
}: {
    video: VideoRecord;
    onWatch: (v: VideoRecord) => void;
}) {
    return (
        <button
            onClick={() => onWatch(video)}
            className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card text-left shadow-sm hover:border-primary/50 hover:shadow-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
            {/* Thumbnail area */}
            <div
                className="relative flex w-full items-center justify-center"
                style={{
                    background: "linear-gradient(135deg,#0f172a 0%,#1e293b 100%)",
                    aspectRatio: "16/9",
                }}
            >
                {/* Play button */}
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 ring-2 ring-primary/40 group-hover:bg-primary/30 group-hover:ring-primary/60 transition-all duration-200">
                    <svg
                        className="h-5 w-5 translate-x-0.5 text-primary"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path d="M8 5v14l11-7z" />
                    </svg>
                </div>

                {/* Format badge */}
                <span className="absolute bottom-2 right-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white/80 backdrop-blur-sm">
                    {getMimeLabel(video.mime_type)}
                </span>
            </div>

            {/* Info */}
            <div className="flex flex-1 flex-col gap-2 p-3">
                <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
                    {video.title}
                </p>
                {video.description && (
                    <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                        {video.description}
                    </p>
                )}
                <div className="mt-auto flex items-center justify-between pt-1">
                    {video.training_name ? (
                        <span className="truncate text-xs text-muted-foreground">
                            {video.training_name}
                        </span>
                    ) : (
                        <span />
                    )}
                    <span className="ml-2 shrink-0 text-xs text-muted-foreground/70">
                        {video.file_size_display}
                    </span>
                </div>
            </div>
        </button>
    );
}

// ── Folder tile ───────────────────────────────────────────────────────────────

function FolderTile({
    name,
    count,
    active,
    onClick,
}: {
    name: string;
    count: number;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-3 rounded-xl border px-4 py-3 text-left shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                active
                    ? "border-primary/60 bg-primary/10 text-primary shadow-primary/10"
                    : "border-border bg-card hover:border-primary/40 hover:bg-primary/5 text-foreground",
            )}
        >
            <span className="text-xl">
                {active ? "📂" : "📁"}
            </span>
            <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{name}</p>
                <p
                    className={cn(
                        "text-xs",
                        active ? "text-primary/70" : "text-muted-foreground",
                    )}
                >
                    {count} video{count !== 1 ? "s" : ""}
                </p>
            </div>
        </button>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function EmployeeTraining({
    employeeId,
}: {
    employeeId: string;
}) {
    const [activeVideo, setActiveVideo] = useState<VideoRecord | null>(null);
    const [activeFolder, setActiveFolder] = useState<string | null>(null);

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

    // Build folder map: folder_name → videos[]
    const folderMap = new Map<string, VideoRecord[]>();
    videos.forEach((v) => {
        const key = v.folder_name ?? "Uncategorized";
        if (!folderMap.has(key)) folderMap.set(key, []);
        folderMap.get(key)!.push(v);
    });
    const folderKeys = Array.from(folderMap.keys()).sort((a, b) => {
        if (a === "Uncategorized") return 1;
        if (b === "Uncategorized") return -1;
        return a.localeCompare(b);
    });

    // Videos to display (filtered by active folder, or all)
    const displayedVideos = activeFolder
        ? (folderMap.get(activeFolder) ?? [])
        : videos;

    // ── Video preview page ────────────────────────────────────────────────────
    if (activeVideo) {
        return (
            <div className="mt-6">
                <VideoPreviewPage
                    video={activeVideo}
                    employeeId={employeeId}
                    allVideos={videos}
                    onClose={() => setActiveVideo(null)}
                    onSelect={(v) => setActiveVideo(v)}
                />
            </div>
        );
    }

    return (
        <div className="mt-6 space-y-6">
            {/* ── Video Assessments ─────────────────────────────────────────── */}
            <Card className="overflow-hidden shadow-sm">
                <CardHeader className="border-b border-border px-5 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-base">
                                Video Assessments
                            </CardTitle>
                            <CardDescription className="mt-0.5 text-xs">
                                Training videos assigned to you
                            </CardDescription>
                        </div>
                        {videos.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                                {videos.length} video
                                {videos.length !== 1 ? "s" : ""}
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-5">
                    {videos.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                            <span className="text-4xl opacity-30">🎬</span>
                            <p className="text-sm text-muted-foreground">
                                No video assessments assigned to you yet.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6">
                            {/* Folder tiles */}
                            {folderKeys.length > 1 && (
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Folders
                                        </p>
                                        {activeFolder && (
                                            <button
                                                onClick={() =>
                                                    setActiveFolder(null)
                                                }
                                                className="text-xs text-primary hover:underline"
                                            >
                                                Show all
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                                        {folderKeys.map((name) => (
                                            <FolderTile
                                                key={name}
                                                name={name}
                                                count={
                                                    folderMap.get(name)!.length
                                                }
                                                active={activeFolder === name}
                                                onClick={() =>
                                                    setActiveFolder(
                                                        activeFolder === name
                                                            ? null
                                                            : name,
                                                    )
                                                }
                                            />
                                        ))}
                                    </div>
                                    <div className="h-px bg-border" />
                                </div>
                            )}

                            {/* Active folder label */}
                            {activeFolder && (
                                <div className="flex items-center gap-2">
                                    <span className="text-base">📂</span>
                                    <h3 className="text-sm font-semibold">
                                        {activeFolder}
                                    </h3>
                                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                        {displayedVideos.length}
                                    </span>
                                </div>
                            )}

                            {/* Single-folder layout (no chips needed) */}
                            {folderKeys.length === 1 && (
                                <div className="flex items-center gap-2">
                                    <span className="text-base">📁</span>
                                    <h3 className="text-sm font-semibold">
                                        {folderKeys[0]}
                                    </h3>
                                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                        {videos.length}
                                    </span>
                                </div>
                            )}

                            {/* Video tiles grid */}
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {displayedVideos.map((v) => (
                                    <VideoTile
                                        key={v.id}
                                        video={v}
                                        onWatch={setActiveVideo}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── Training History ──────────────────────────────────────────── */}
            <Card className="overflow-hidden shadow-sm">
                <CardHeader className="border-b border-border px-5 py-4">
                    <CardTitle className="text-base">Training History</CardTitle>
                    <CardDescription className="mt-0.5 text-xs">
                        Your previous and ongoing training records
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-5">
                    {trainings.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                            <span className="text-4xl opacity-30">📋</span>
                            <p className="text-sm text-muted-foreground">
                                No training records found.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-lg border border-border">
                            <Table className="min-w-[600px]">
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="px-4 py-3 text-xs">
                                            Training
                                        </TableHead>
                                        <TableHead className="px-4 py-3 text-xs">
                                            Date
                                        </TableHead>
                                        <TableHead className="px-4 py-3 text-center text-xs">
                                            Status
                                        </TableHead>
                                        <TableHead className="px-4 py-3 text-center text-xs">
                                            Score
                                        </TableHead>
                                        <TableHead className="px-4 py-3 text-xs">
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
                                            <TableCell className="px-4 py-3 text-sm font-medium">
                                                {t.training_name ?? "—"}
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-sm whitespace-nowrap text-muted-foreground">
                                                {t.training_date_formatted}
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-center">
                                                <StatusBadge
                                                    label={t.status_label}
                                                />
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-center text-sm text-muted-foreground">
                                                {t.examination_score ?? "—"}
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-sm text-muted-foreground">
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
        </div>
    );
}
