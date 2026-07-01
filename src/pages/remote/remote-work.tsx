import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import {
    Wifi, LogIn, LogOut, Loader2, Clock, MapPin,
    Camera, X, RefreshCw, Check, Trash2,
} from "lucide-react";
import api from "@/lib/axios";
import { ApiResponse } from "@/index";
import { ParentComponent } from "@/components/parent-container";

// ── Types ──────────────────────────────────────────────────────────────────────

type ClockType = "Clock-In" | "Clock-Out" | "Break-Out" | "Break-In";

interface Punch {
    id: number;
    clock_type: ClockType;
    date_time: string;
    location: string;
    image_url?: string | null;
}

interface RemoteStatus {
    is_clocked_in: boolean;
    is_on_break: boolean;
    next_action: ClockType;
    punches: Punch[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function pad(n: number) { return String(n).padStart(2, "0"); }

function formatTime(dt: string) {
    return new Date(dt).toLocaleTimeString("en-US", {
        hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
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

const CLOCK_META: Record<ClockType, { label: string; color: string; ring: string; icon: React.ElementType; bg: string }> = {
    "Clock-In":  { label: "Clock In",   color: "text-teal-400",  ring: "ring-teal-500/50",  icon: LogIn,    bg: "bg-teal-500/10 border-teal-500/30" },
    "Clock-Out": { label: "Clock Out",  color: "text-rose-400",  ring: "ring-rose-500/50",  icon: LogOut,   bg: "bg-rose-500/10 border-rose-500/30" },
    "Break-Out": { label: "Break Out",  color: "text-amber-400", ring: "ring-amber-500/50", icon: Clock,    bg: "bg-amber-500/10 border-amber-500/30" },
    "Break-In":  { label: "Break In",   color: "text-blue-400",  ring: "ring-blue-500/50",  icon: RefreshCw, bg: "bg-blue-500/10 border-blue-500/30" },
};

// ── Sub-components ─────────────────────────────────────────────────────────────

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
                <span className="text-5xl font-bold tracking-tight">{pad(hh)}:{mm}</span>
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

// ── Camera modal ───────────────────────────────────────────────────────────────

interface CameraModalProps {
    clockType: ClockType;
    onConfirm: (blob: Blob) => void;
    onCancel: () => void;
}

function CameraModal({ clockType, onConfirm, onCancel }: CameraModalProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
    const [camError, setCamError] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

    const meta = CLOCK_META[clockType];

    const startCamera = useCallback(async (facing: "user" | "environment") => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false,
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
            setCamError(null);
        } catch {
            setCamError("Camera access denied. Please allow camera permission and try again.");
        }
    }, []);

    useEffect(() => {
        setPreview(null);
        setCapturedBlob(null);
        startCamera(facingMode);
        return () => {
            streamRef.current?.getTracks().forEach((t) => t.stop());
        };
    }, []);

    const flipCamera = () => {
        const next = facingMode === "user" ? "environment" : "user";
        setFacingMode(next);
        setPreview(null);
        setCapturedBlob(null);
        startCamera(next);
    };

    const capture = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        if (facingMode === "user") {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
            if (!blob) return;
            setCapturedBlob(blob);
            setPreview(canvas.toDataURL("image/jpeg", 0.85));
            streamRef.current?.getTracks().forEach((t) => t.stop());
        }, "image/jpeg", 0.85);
    };

    const retake = () => {
        setPreview(null);
        setCapturedBlob(null);
        startCamera(facingMode);
    };

    const confirm = () => {
        if (capturedBlob) onConfirm(capturedBlob);
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/90">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-black/60">
                <div className="flex items-center gap-2">
                    <meta.icon className={`h-4 w-4 ${meta.color}`} />
                    <span className={`text-sm font-semibold ${meta.color}`}>{meta.label}</span>
                </div>
                <button onClick={onCancel} className="text-white/60 hover:text-white transition-colors">
                    <X className="h-5 w-5" />
                </button>
            </div>

            {/* Camera view */}
            <div className="relative flex-1 flex items-center justify-center overflow-hidden">
                {camError ? (
                    <div className="text-center px-8">
                        <Camera className="h-10 w-10 text-white/30 mx-auto mb-3" />
                        <p className="text-white/70 text-sm">{camError}</p>
                        <button
                            onClick={() => startCamera(facingMode)}
                            className="mt-4 rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                ) : preview ? (
                    <img src={preview} alt="captured" className="h-full w-full object-cover" />
                ) : (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="h-full w-full object-cover"
                        style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
                    />
                )}
                <canvas ref={canvasRef} className="hidden" />

                {/* Overlay guide ring */}
                {!preview && !camError && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className={`h-48 w-48 rounded-full border-2 opacity-30 ${meta.color.replace("text-", "border-")}`} />
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-around px-8 py-6 bg-black/60">
                {preview ? (
                    <>
                        <button
                            onClick={retake}
                            className="flex flex-col items-center gap-1.5 text-white/70 hover:text-white transition-colors"
                        >
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                                <RefreshCw className="h-5 w-5" />
                            </div>
                            <span className="text-xs">Retake</span>
                        </button>

                        <button
                            onClick={confirm}
                            className={`flex flex-col items-center gap-1.5`}
                        >
                            <div className={`flex h-16 w-16 items-center justify-center rounded-full bg-teal-500 shadow-lg shadow-teal-500/30`}>
                                <Check className="h-7 w-7 text-white" />
                            </div>
                            <span className="text-xs text-white">Submit</span>
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={flipCamera}
                            className="flex flex-col items-center gap-1.5 text-white/70 hover:text-white transition-colors"
                        >
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                                <RefreshCw className="h-5 w-5" />
                            </div>
                            <span className="text-xs">Flip</span>
                        </button>

                        <button
                            onClick={capture}
                            disabled={!!camError}
                            className="flex flex-col items-center gap-1.5"
                        >
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg disabled:opacity-50">
                                <Camera className="h-7 w-7 text-black" />
                            </div>
                            <span className="text-xs text-white">Capture</span>
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function RemoteWork() {
    const { id } = useParams<{ id: string }>();
    const queryClient = useQueryClient();
    const [selectedType, setSelectedType] = useState<ClockType | null>(null);
    const [cameraOpen, setCameraOpen] = useState(false);

    const { data, isLoading } = useQuery<RemoteStatus>({
        queryKey: ["remote-status", id],
        queryFn: async () => {
            const res = await api.get<ApiResponse<RemoteStatus>>(`/api/v2/remote/status/${id}`);
            return res.data.data!;
        },
        refetchInterval: 30_000,
    });

    const deletePunchMutation = useMutation({
        mutationFn: (punchId: number) =>
            api.post(`/api/v2/remote/punch/${punchId}/delete`, {}),
        onSuccess: () => {
            toast.success("Entry removed.");
            queryClient.invalidateQueries({ queryKey: ["remote-status", id] });
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message ?? "Failed to remove entry.");
        },
    });

    const punchMutation = useMutation({
        mutationFn: ({ clock_type, image }: { clock_type: ClockType; image: Blob }) => {
            const form = new FormData();
            form.append("clock_type", clock_type);
            form.append("image", image, "selfie.jpg");
            return api.post(`/api/v2/remote/punch/${id}`, form);
        },
        onSuccess: (_, { clock_type }) => {
            toast.success(`${clock_type} recorded.`);
            queryClient.invalidateQueries({ queryKey: ["remote-status", id] });
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message ?? "Failed to record punch.");
        },
    });

    const handleSelectType = (type: ClockType) => {
        setSelectedType(type);
        setCameraOpen(true);
    };

    const handleCameraConfirm = (blob: Blob) => {
        setCameraOpen(false);
        if (selectedType) {
            punchMutation.mutate({ clock_type: selectedType, image: blob });
        }
        setSelectedType(null);
    };

    const handleCameraCancel = () => {
        setCameraOpen(false);
        setSelectedType(null);
    };

    const lastIn = data
        ? [...(data.punches ?? [])].reverse().find((p) => p.clock_type === "Clock-In")
        : null;

    const location = data?.punches.length
        ? data.punches[data.punches.length - 1].location
        : "Remote";

    return (
        <>
            {cameraOpen && selectedType && (
                <CameraModal
                    clockType={selectedType}
                    onConfirm={handleCameraConfirm}
                    onCancel={handleCameraCancel}
                />
            )}

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
                            {/* Status strip */}
                            <div className={`rounded-2xl border px-5 py-4 flex items-center justify-between ${
                                data.is_clocked_in
                                    ? data.is_on_break
                                        ? "border-amber-500/25 bg-amber-500/5"
                                        : "border-green-500/25 bg-green-500/5"
                                    : "border-border bg-muted/5"
                            }`}>
                                <div className="flex items-center gap-2.5">
                                    <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                                        data.is_clocked_in
                                            ? data.is_on_break
                                                ? "bg-amber-400 shadow-[0_0_6px_2px_rgba(251,191,36,0.4)]"
                                                : "bg-green-400 shadow-[0_0_6px_2px_rgba(74,222,128,0.4)]"
                                            : "bg-muted-foreground/40"
                                    }`} />
                                    <div>
                                        <p className={`text-sm font-semibold ${
                                            data.is_clocked_in
                                                ? data.is_on_break ? "text-amber-400" : "text-green-400"
                                                : "text-muted-foreground"
                                        }`}>
                                            {data.is_clocked_in
                                                ? data.is_on_break ? "On Break" : "Clocked In"
                                                : "Not Clocked In"}
                                        </p>
                                        <p className="text-muted-foreground flex items-center gap-1 text-[11px]">
                                            <MapPin className="h-3 w-3" />
                                            {location}
                                        </p>
                                    </div>
                                </div>
                                {data.is_clocked_in && lastIn && (
                                    <div className="text-right">
                                        <p className="text-lg font-bold tabular-nums">
                                            <ElapsedTimer since={lastIn.date_time} />
                                        </p>
                                        <p className="text-muted-foreground text-[11px]">elapsed</p>
                                    </div>
                                )}
                            </div>

                            {/* Clock type selector */}
                            <div>
                                <p className="text-muted-foreground mb-3 text-[11px] font-semibold uppercase tracking-wider">
                                    Select Action
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    {(["Clock-In", "Break-Out", "Break-In", "Clock-Out"] as ClockType[]).map((type) => {
                                        const meta = CLOCK_META[type];
                                        const Icon = meta.icon;
                                        const isNext = data.next_action === type ||
                                            (type === "Break-Out" && data.is_clocked_in && !data.is_on_break) ||
                                            (type === "Break-In" && data.is_on_break);
                                        return (
                                            <button
                                                key={type}
                                                disabled={punchMutation.isPending}
                                                onClick={() => handleSelectType(type)}
                                                className={`relative flex flex-col items-center gap-2.5 rounded-2xl border py-5 px-3 text-center transition-all active:scale-95 disabled:opacity-50 hover:brightness-110 ${meta.bg}`}
                                            >
                                                {isNext && (
                                                    <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-current opacity-70 ring-2 ring-current/20" />
                                                )}
                                                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${meta.bg}`}>
                                                    {punchMutation.isPending && selectedType === type
                                                        ? <Loader2 className={`h-5 w-5 animate-spin ${meta.color}`} />
                                                        : <Icon className={`h-5 w-5 ${meta.color}`} />
                                                    }
                                                </div>
                                                <span className={`text-sm font-semibold ${meta.color}`}>{meta.label}</span>
                                                <span className="text-muted-foreground text-[10px]">
                                                    <Camera className="inline h-3 w-3 mr-0.5 opacity-60" />
                                                    Take selfie
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
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
                                        <div className="space-y-1.5">
                                            {[...data.punches].reverse().map((p) => {
                                                const m = CLOCK_META[p.clock_type] ?? CLOCK_META["Clock-In"];
                                                const Icon = m.icon;
                                                return (
                                                    <div key={p.id} className="flex items-center gap-3 pl-1">
                                                        <div className={`relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 ${m.bg}`}>
                                                            <Icon className={`h-3.5 w-3.5 ${m.color}`} />
                                                        </div>
                                                        <div className="flex flex-1 items-center justify-between rounded-xl border px-4 py-3 mb-0.5 gap-3">
                                                            <div className="min-w-0 flex-1">
                                                                <p className={`text-xs font-semibold ${m.color}`}>{m.label}</p>
                                                                <p className="text-muted-foreground mt-0.5 flex items-center gap-1 text-[11px]">
                                                                    <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
                                                                    <span className="truncate">{p.location}</span>
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                                {p.image_url && (
                                                                    <img
                                                                        src={p.image_url}
                                                                        alt="selfie"
                                                                        className="h-8 w-8 rounded-lg object-cover border border-border/50"
                                                                    />
                                                                )}
                                                                <p className="text-sm font-semibold tabular-nums">
                                                                    {formatTime(p.date_time)}
                                                                </p>
                                                                <button
                                                                    onClick={() => deletePunchMutation.mutate(p.id)}
                                                                    disabled={deletePunchMutation.isPending}
                                                                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/40 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-30"
                                                                    title="Remove entry"
                                                                >
                                                                    {deletePunchMutation.isPending
                                                                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                        : <Trash2 className="h-3.5 w-3.5" />
                                                                    }
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </ParentComponent>
        </>
    );
}
