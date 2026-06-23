import React, { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import { ApiResponse } from "@/index";
import { Badge } from "@/components/ui/badge";
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

function getMimeLabel(mime: string | null): string {
    if (!mime) return "FILE";
    if (mime.includes("mp4"))          return "MP4";
    if (mime.includes("webm"))         return "WebM";
    if (mime.includes("ogg"))          return "OGG";
    if (mime.includes("quicktime") || mime.includes("mov")) return "MOV";
    if (mime.includes("avi"))          return "AVI";
    if (mime.includes("mkv"))          return "MKV";
    if (mime.includes("pdf"))          return "PDF";
    if (mime.includes("jpeg") || mime.includes("jpg")) return "JPG";
    if (mime.includes("png"))          return "PNG";
    if (mime.includes("gif"))          return "GIF";
    if (mime.includes("webp"))         return "WEBP";
    if (mime.includes("word") || mime === "application/msword") return "DOC";
    if (mime.includes("spreadsheet") || mime.includes("excel")) return "XLS";
    if (mime.includes("presentation") || mime.includes("powerpoint")) return "PPT";
    if (mime.includes("zip"))          return "ZIP";
    if (mime.startsWith("text/"))      return "TXT";
    return "FILE";
}

function getFileTheme(mime: string | null): {
    bg: string;
    color: string;
    isVideo: boolean;
} {
    const m = mime ?? "";
    if (!m || m.startsWith("video/"))
        return { bg: "linear-gradient(135deg,#0f172a 0%,#1e293b 100%)", color: "text-primary", isVideo: true };
    if (m.startsWith("image/"))
        return { bg: "linear-gradient(135deg,#1e1240 0%,#3b1f7a 100%)", color: "text-violet-400", isVideo: false };
    if (m === "application/pdf")
        return { bg: "linear-gradient(135deg,#2d0f0f 0%,#5c1a1a 100%)", color: "text-red-400", isVideo: false };
    if (m.includes("word") || m === "application/msword")
        return { bg: "linear-gradient(135deg,#0f1f3a 0%,#1a3d7a 100%)", color: "text-blue-400", isVideo: false };
    if (m.includes("spreadsheet") || m.includes("excel"))
        return { bg: "linear-gradient(135deg,#0f2a0f 0%,#1a5a1a 100%)", color: "text-green-400", isVideo: false };
    if (m.includes("presentation") || m.includes("powerpoint"))
        return { bg: "linear-gradient(135deg,#2d1a0f 0%,#5c2f0f 100%)", color: "text-orange-400", isVideo: false };
    if (m.includes("zip"))
        return { bg: "linear-gradient(135deg,#2a2a0f 0%,#4a4a0f 100%)", color: "text-yellow-400", isVideo: false };
    if (m.startsWith("text/"))
        return { bg: "linear-gradient(135deg,#0f2a2a 0%,#0f4a4a 100%)", color: "text-teal-400", isVideo: false };
    return { bg: "linear-gradient(135deg,#1a1a2e 0%,#2a2a3e 100%)", color: "text-slate-400", isVideo: false };
}

function FileIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="currentColor" viewBox="0 0 16 16">
            <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z" />
        </svg>
    );
}

function PlayIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
        </svg>
    );
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

// ── File preview page ─────────────────────────────────────────────────────────

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
    const [mimeType, setMimeType] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    React.useEffect(() => {
        let cancelled = false;
        setUrl(null);
        setMimeType(null);
        setError(null);

        api.get<ApiResponse<{ url: string; mime_type: string; title: string }>>(
            `/api/v2/videos/${video.id}/url`,
            { params: { employee_id: employeeId } },
        )
            .then((res) => {
                if (cancelled) return;
                const d = res.data?.data;
                if (d?.url) {
                    setMimeType(d.mime_type || null);
                    setUrl(d.url);
                } else {
                    setError("Could not load file.");
                }
            })
            .catch((err) => {
                if (cancelled) return;
                const status = err?.response?.status;
                if (status === 403) {
                    setError("You don't have access to this file.");
                } else {
                    setError("Could not load file. Please try again.");
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

    const theme   = getFileTheme(video.mime_type);
    const related = allVideos.filter(
        (v) => v.id !== video.id && v.folder_id === video.folder_id,
    );

    const isVideo = !!mimeType && mimeType.startsWith("video/");
    const isImage = !!mimeType && mimeType.startsWith("image/");
    const isPdf   = mimeType === "application/pdf";
    const isOther = !!url && !isVideo && !isImage && !isPdf;

    return (
        <div className="flex flex-col gap-5">
            {/* Back nav */}
            <button
                onClick={onClose}
                className="flex items-center gap-1.5 self-start text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Files
            </button>

            <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
                <div className="flex flex-col gap-4">

                    {/* File header card */}
                    <div className="flex items-start gap-4 rounded-xl border bg-card p-4">
                        <div
                            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl"
                            style={{ background: theme.bg }}
                        >
                            {theme.isVideo
                                ? <PlayIcon className="h-7 w-7 text-primary" />
                                : <FileIcon className={cn("h-7 w-7", theme.color)} />
                            }
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-base font-semibold leading-snug truncate">
                                {video.title}
                            </h2>
                            <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold">
                                    {getMimeLabel(video.mime_type)}
                                </span>
                                {video.training_name && (
                                    <Badge variant="secondary" className="text-xs font-normal">
                                        {video.training_name}
                                    </Badge>
                                )}
                                {video.folder_name && (
                                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                        📁 {video.folder_name}
                                    </span>
                                )}
                                <span className="ml-auto text-xs text-muted-foreground">
                                    {video.file_size_display}
                                </span>
                            </div>
                            {video.description && (
                                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                                    {video.description}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Viewer */}
                    <div className="overflow-hidden rounded-xl border bg-card">
                        {/* Loading */}
                        {!url && !error && (
                            <div className="flex flex-col items-center justify-center gap-3 py-24">
                                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                <p className="text-xs text-muted-foreground">Loading…</p>
                            </div>
                        )}
                        {/* Error */}
                        {error && (
                            <div className="flex flex-col items-center justify-center gap-3 py-24">
                                <svg className="h-10 w-10 text-red-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                        d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                </svg>
                                <p className="text-sm text-red-400 text-center max-w-xs">{error}</p>
                            </div>
                        )}
                        {/* Video */}
                        {!error && url && isVideo && (
                            <video
                                ref={videoRef}
                                key={url}
                                src={url}
                                className="w-full"
                                style={{ background: "#000", display: "block", maxHeight: "65vh" }}
                                controls
                                controlsList="nodownload"
                                preload="metadata"
                                onError={() => setError("Failed to play. The file may be unavailable.")}
                            >
                                <source src={url} type={mimeType ?? undefined} />
                            </video>
                        )}
                        {/* Image */}
                        {!error && url && isImage && (
                            <div className="flex items-center justify-center bg-muted/30 p-6" style={{ minHeight: "200px" }}>
                                <img
                                    src={url}
                                    alt={video.title}
                                    className="max-w-full rounded-lg object-contain shadow-md"
                                    style={{ maxHeight: "65vh" }}
                                />
                            </div>
                        )}
                        {/* PDF */}
                        {!error && url && isPdf && (
                            <iframe
                                src={url}
                                title={video.title}
                                className="w-full border-none block"
                                style={{ height: "72vh" }}
                            />
                        )}
                        {/* Download fallback */}
                        {!error && url && isOther && (
                            <div className="flex flex-col items-center justify-center gap-5 py-20 px-6">
                                <div
                                    className="flex h-24 w-24 items-center justify-center rounded-2xl shadow-sm"
                                    style={{ background: theme.bg }}
                                >
                                    <FileIcon className={cn("h-12 w-12", theme.color)} />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-medium text-foreground">{video.title}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        This file type cannot be previewed in the browser.
                                    </p>
                                </div>
                                <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
                                >
                                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16">
                                        <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                                        <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 1-.708.708l3 3z"/>
                                    </svg>
                                    Open / Download
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar: related files */}
                {related.length > 0 && (
                    <div className="flex flex-col gap-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            More in this folder
                        </h3>
                        <div className="flex flex-col gap-2">
                            {related.map((v) => {
                                const t = getFileTheme(v.mime_type);
                                return (
                                    <button
                                        key={v.id}
                                        onClick={() => onSelect(v)}
                                        className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-left hover:border-primary/40 hover:bg-primary/5 transition-colors"
                                    >
                                        <div
                                            className="shrink-0 flex h-10 w-12 items-center justify-center rounded-lg"
                                            style={{ background: t.bg }}
                                        >
                                            {t.isVideo
                                                ? <PlayIcon className="h-4 w-4 text-primary/70" />
                                                : <FileIcon className={cn("h-4 w-4 opacity-70", t.color)} />
                                            }
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="line-clamp-2 text-xs font-medium leading-snug">
                                                {v.title}
                                            </p>
                                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                                                {getMimeLabel(v.mime_type)} · {v.file_size_display}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Accent colour extracted from theme ───────────────────────────────────────

function accentFromTheme(color: string): string {
    if (color.includes("primary"))  return "rgba(99,102,241,0.55)";
    if (color.includes("violet"))   return "rgba(167,139,250,0.55)";
    if (color.includes("red"))      return "rgba(248,113,113,0.55)";
    if (color.includes("blue"))     return "rgba(96,165,250,0.55)";
    if (color.includes("green"))    return "rgba(74,222,128,0.55)";
    if (color.includes("orange"))   return "rgba(251,146,60,0.55)";
    if (color.includes("yellow"))   return "rgba(250,204,21,0.55)";
    if (color.includes("teal"))     return "rgba(45,212,191,0.55)";
    return "rgba(148,163,184,0.45)";
}

// ── File tile ─────────────────────────────────────────────────────────────────

function VideoTile({
    video,
    onWatch,
}: {
    video: VideoRecord;
    onWatch: (v: VideoRecord) => void;
}) {
    const theme  = getFileTheme(video.mime_type);
    const accent = accentFromTheme(theme.color);
    const label  = getMimeLabel(video.mime_type);

    return (
        <button
            onClick={() => onWatch(video)}
            className="group flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-card text-left shadow hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
            {/* Thumbnail */}
            <div
                className="relative flex w-full items-center justify-center overflow-hidden"
                style={{ background: theme.bg, aspectRatio: "16/9" }}
            >
                {/* Radial glow behind icon */}
                <div
                    className="pointer-events-none absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity duration-300"
                    style={{ background: `radial-gradient(circle at 50% 60%, ${accent} 0%, transparent 65%)` }}
                />

                {/* Icon */}
                {theme.isVideo ? (
                    <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20 group-hover:bg-white/20 group-hover:ring-white/30 shadow-lg transition-all duration-200">
                        <PlayIcon className="h-6 w-6 translate-x-0.5 text-white/90" />
                    </div>
                ) : (
                    <div className="relative z-10">
                        <FileIcon
                            className={cn("h-12 w-12 drop-shadow-lg transition-transform duration-200 group-hover:scale-110", theme.color)}
                        />
                    </div>
                )}

                {/* File type badge — top left */}
                <span className="absolute left-2.5 top-2.5 z-20 rounded-md bg-black/55 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white/90 backdrop-blur-sm">
                    {label}
                </span>

                {/* Hover "Open" overlay */}
                <div className="absolute inset-0 z-10 flex items-end justify-end bg-black/0 group-hover:bg-black/25 transition-colors duration-200 p-2.5">
                    <span className="flex items-center gap-1 rounded-full bg-white/0 px-2.5 py-1 text-[11px] font-medium text-white/0 opacity-0 translate-y-1 group-hover:bg-white/15 group-hover:text-white group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334q.002-.211-.006-.422A6.7 6.7 0 0 0 16 3.542a6.7 6.7 0 0 1-1.889.518 3.3 3.3 0 0 0 1.447-1.817 6.5 6.5 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.32 9.32 0 0 1-6.767-3.429 3.29 3.29 0 0 0 1.018 4.382A3.3 3.3 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.2 3.2 0 0 1-.865.115 3 3 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.6 6.6 0 0 1 .78 13.58a6 6 0 0 1-.78-.045A9.34 9.34 0 0 0 5.026 15"/>
                        </svg>
                        Open
                    </span>
                </div>
            </div>

            {/* Card body */}
            <div className="flex flex-col gap-1 px-3 pb-3 pt-2.5">
                <p className="line-clamp-1 text-sm font-semibold leading-snug text-foreground group-hover:text-primary transition-colors duration-150">
                    {video.title}
                </p>
                {video.description && (
                    <p className="line-clamp-1 text-xs leading-relaxed text-muted-foreground">
                        {video.description}
                    </p>
                )}
                <div className="mt-1.5 flex items-center gap-1.5">
                    {video.training_name && (
                        <span className="truncate rounded-sm bg-muted px-1.5 py-px text-[10px] font-medium text-muted-foreground">
                            {video.training_name}
                        </span>
                    )}
                    <span className="ml-auto shrink-0 tabular-nums text-[10px] text-muted-foreground/60">
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
            <span className="text-xl">{active ? "📂" : "📁"}</span>
            <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{name}</p>
                <p className={cn("text-xs", active ? "text-primary/70" : "text-muted-foreground")}>
                    {count} file{count !== 1 ? "s" : ""}
                </p>
            </div>
        </button>
    );
}

// ── Training Files tab (default export) ───────────────────────────────────────

export default function EmployeeTraining({ employeeId }: { employeeId: string }) {
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
                    Loading training files…
                </div>
            </Card>
        );
    }

    if (isError) {
        return (
            <Card className="mt-6 p-6 shadow-sm">
                <p className="py-10 text-center text-sm text-red-400">Failed to load training files.</p>
            </Card>
        );
    }

    const videos = data?.videos ?? [];

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

    const displayedVideos = activeFolder ? (folderMap.get(activeFolder) ?? []) : videos;

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
        <Card className="mt-6 overflow-hidden shadow-sm">
            <CardHeader className="border-b border-border px-5 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-base">Training Files</CardTitle>
                        <CardDescription className="mt-0.5 text-xs">
                            Training files assigned to you
                        </CardDescription>
                    </div>
                    {videos.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                            {videos.length} file{videos.length !== 1 ? "s" : ""}
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-5">
                {videos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                        <span className="text-4xl opacity-30">📁</span>
                        <p className="text-sm text-muted-foreground">
                            No training files assigned to you yet.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        {folderKeys.length > 1 && (
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-2">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        Folders
                                    </p>
                                    {activeFolder && (
                                        <button
                                            onClick={() => setActiveFolder(null)}
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
                                            count={folderMap.get(name)!.length}
                                            active={activeFolder === name}
                                            onClick={() =>
                                                setActiveFolder(activeFolder === name ? null : name)
                                            }
                                        />
                                    ))}
                                </div>
                                <div className="h-px bg-border" />
                            </div>
                        )}

                        {activeFolder && (
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 text-sm">
                                    📂
                                </div>
                                <h3 className="text-sm font-semibold">{activeFolder}</h3>
                                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] tabular-nums text-muted-foreground">
                                    {displayedVideos.length}
                                </span>
                            </div>
                        )}

                        {folderKeys.length === 1 && (
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 text-sm">
                                    📁
                                </div>
                                <h3 className="text-sm font-semibold">{folderKeys[0]}</h3>
                                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] tabular-nums text-muted-foreground">
                                    {videos.length}
                                </span>
                            </div>
                        )}

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {displayedVideos.map((v) => (
                                <VideoTile key={v.id} video={v} onWatch={setActiveVideo} />
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// ── Training History tab (named export) ───────────────────────────────────────

export function TrainingHistory({ employeeId }: { employeeId: string }) {
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
                    Loading training history…
                </div>
            </Card>
        );
    }

    if (isError) {
        return (
            <Card className="mt-6 p-6 shadow-sm">
                <p className="py-10 text-center text-sm text-red-400">Failed to load training history.</p>
            </Card>
        );
    }

    const trainings = data?.trainings ?? [];

    return (
        <Card className="mt-6 overflow-hidden shadow-sm">
            <CardHeader className="border-b border-border px-5 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-base">Training History</CardTitle>
                        <CardDescription className="mt-0.5 text-xs">
                            Your previous and ongoing training records
                        </CardDescription>
                    </div>
                    {trainings.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                            {trainings.length} record{trainings.length !== 1 ? "s" : ""}
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-5">
                {trainings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                        <span className="text-4xl opacity-30">📋</span>
                        <p className="text-sm text-muted-foreground">No training records found.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg border border-border">
                        <Table className="min-w-[600px]">
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="px-4 py-3 text-xs">Training</TableHead>
                                    <TableHead className="px-4 py-3 text-xs">Date</TableHead>
                                    <TableHead className="px-4 py-3 text-center text-xs">Status</TableHead>
                                    <TableHead className="px-4 py-3 text-center text-xs">Score</TableHead>
                                    <TableHead className="px-4 py-3 text-xs">Remarks</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {trainings.map((t) => (
                                    <TableRow key={t.id} className="hover:bg-primary/5 transition-colors">
                                        <TableCell className="px-4 py-3 text-sm font-medium">
                                            {t.training_name ?? "—"}
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-sm whitespace-nowrap text-muted-foreground">
                                            {t.training_date_formatted}
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-center">
                                            <StatusBadge label={t.status_label} />
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
    );
}
