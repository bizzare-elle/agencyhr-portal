import { useCallback, useEffect, useRef, useState } from "react";
import * as faceapi from "@vladmandic/face-api";

// Same CDN model path the backoffice hr_facial_recognition module loads
// from, and the same 128-float descriptor format — an enrollment captured
// here is readable by anything that already reads hr_face_enrollments.
const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model";

let modelsLoadPromise: Promise<void> | null = null;

function loadModels() {
    if (!modelsLoadPromise) {
        modelsLoadPromise = (async () => {
            await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
            await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
            await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        })();
    }
    return modelsLoadPromise;
}

export type FaceCaptureStatus =
    | "loading"
    | "ready"
    | "no-camera"
    | "error"
    | "captured";

interface UseFaceCaptureResult {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
    status: FaceCaptureStatus;
    statusMessage: string;
    captured: boolean;
    /** Front-cam "flash" (screen fill-light) is on: enabled AND actively scanning. */
    flashActive: boolean;
    flashEnabled: boolean;
    setFlashEnabled: (enabled: boolean) => void;
    /** Advisory only — a face too small/off-center/dark still CAN be captured. */
    qualityWarning: string | null;
    descriptor: number[] | null;
    snapshotBlob: Blob | null;
    snapshotUrl: string | null;
    capture: () => Promise<void>;
    retake: () => void;
    stop: () => void;
}

// Quality checks run every Nth preview frame — a getImageData readback for
// brightness on every animation frame would be wasteful.
const QUALITY_CHECK_INTERVAL = 10;

export function useFaceCapture(active: boolean): UseFaceCaptureResult {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const rafRef = useRef<number | null>(null);

    const [status, setStatus] = useState<FaceCaptureStatus>("loading");
    const [statusMessage, setStatusMessage] = useState(
        "Loading face detection models…",
    );
    const [descriptor, setDescriptor] = useState<number[] | null>(null);
    const [snapshotBlob, setSnapshotBlob] = useState<Blob | null>(null);
    const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);
    // Front cameras have no physical flash, so we simulate a fill light by
    // brightening the screen around the preview — on for the whole time the
    // camera is actively scanning (not just the instant capture is clicked),
    // and toggleable since it can be too intense in an already-bright room.
    const [flashEnabled, setFlashEnabled] = useState(true);
    const [qualityWarning, setQualityWarning] = useState<string | null>(null);
    const qualityCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const frameCountRef = useRef(0);

    const stop = useCallback(() => {
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
    }, []);

    // Advisory quality read on the current frame + the single largest detected
    // face: too small (far away), off-center, or too dark. Never blocks
    // capture — just tells the coordinator why a shot might not match later.
    const assessQuality = useCallback(
        (video: HTMLVideoElement, box: { x: number; y: number; width: number; height: number }, frameW: number, frameH: number) => {
            const sizeRatio = box.width / frameW;
            if (sizeRatio < 0.18) {
                return "Face looks far away — move closer.";
            }
            if (sizeRatio > 0.85) {
                return "Face is very close — move back slightly.";
            }

            const centerX = box.x + box.width / 2;
            const centerY = box.y + box.height / 2;
            const offsetX = Math.abs(centerX - frameW / 2) / frameW;
            const offsetY = Math.abs(centerY - frameH / 2) / frameH;
            if (offsetX > 0.2 || offsetY > 0.2) {
                return "Off-center — center the face in the frame.";
            }

            if (!qualityCanvasRef.current) {
                qualityCanvasRef.current = document.createElement("canvas");
            }
            const sample = qualityCanvasRef.current;
            const sampleSize = 32;
            sample.width = sampleSize;
            sample.height = sampleSize;
            const sctx = sample.getContext("2d", { willReadFrequently: true });
            if (sctx) {
                sctx.drawImage(video, 0, 0, sampleSize, sampleSize);
                try {
                    const { data } = sctx.getImageData(0, 0, sampleSize, sampleSize);
                    let total = 0;
                    for (let i = 0; i < data.length; i += 4) {
                        // Perceived luminance
                        total += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                    }
                    const avgLuminance = total / (data.length / 4);
                    if (avgLuminance < 60) {
                        return "Lighting is dim — turn on the front flash or move to better light.";
                    }
                } catch {
                    // Canvas read can fail on some browsers/permissions — skip silently.
                }
            }

            return null;
        },
        [],
    );

    const runPreviewLoop = useCallback(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        const opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 320 });

        const loop = async () => {
            if (!streamRef.current || status === "captured") return;
            try {
                const dets = await faceapi.detectAllFaces(video, opts);
                canvas.width = video.videoWidth || 480;
                canvas.height = video.videoHeight || 360;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    dets.forEach((d) => {
                        ctx.strokeStyle = "#00b4d8";
                        ctx.lineWidth = 3;
                        ctx.strokeRect(
                            d.box.x,
                            d.box.y,
                            d.box.width,
                            d.box.height,
                        );
                    });
                }

                frameCountRef.current += 1;
                if (dets.length === 0) {
                    setQualityWarning(null);
                } else if (frameCountRef.current % QUALITY_CHECK_INTERVAL === 0) {
                    const largest = dets.reduce((a, b) =>
                        a.box.width * a.box.height > b.box.width * b.box.height
                            ? a
                            : b,
                    );
                    setQualityWarning(
                        assessQuality(
                            video,
                            largest.box,
                            canvas.width,
                            canvas.height,
                        ),
                    );
                }
            } catch {
                // ignore per-frame detection errors
            }
            rafRef.current = requestAnimationFrame(loop);
        };
        loop();
        // status is read fresh on each frame via streamRef, not a dependency here
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [assessQuality]);

    const start = useCallback(async () => {
        setStatus("loading");
        setStatusMessage("Loading face detection models…");
        try {
            await loadModels();
        } catch {
            setStatus("error");
            setStatusMessage(
                "Failed to load face detection models. Check your internet connection.",
            );
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user" },
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
            setStatus("ready");
            setStatusMessage("Center the employee's face and capture.");
            runPreviewLoop();
        } catch {
            setStatus("no-camera");
            setStatusMessage(
                "Unable to access the camera. Please allow camera permission.",
            );
        }
    }, [runPreviewLoop]);

    const capture = useCallback(async () => {
        const video = videoRef.current;
        if (!video) return;

        const opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 320 });
        const det = await faceapi
            .detectSingleFace(video, opts)
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (!det) {
            setStatusMessage("No face detected. Center the face and try again.");
            return;
        }

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
            // Mirror the snapshot to match the (mirrored) selfie-style preview
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(video, 0, 0);
        }

        const blob: Blob | null = await new Promise((resolve) =>
            canvas.toBlob((b) => resolve(b), "image/jpeg", 0.7),
        );

        const roundedDescriptor = Array.from(det.descriptor).map((v) =>
            parseFloat(v.toFixed(8)),
        );

        setDescriptor(roundedDescriptor);
        setSnapshotBlob(blob);
        setSnapshotUrl(blob ? URL.createObjectURL(blob) : null);
        setStatus("captured");
        setStatusMessage("Face captured. Retake if it's not a clear shot.");
        setQualityWarning(null);

        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
    }, []);

    const retake = useCallback(() => {
        setDescriptor(null);
        setSnapshotBlob(null);
        setSnapshotUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
        });
        setStatus("ready");
        setStatusMessage("Center the employee's face and capture.");
        setQualityWarning(null);
        runPreviewLoop();
    }, [runPreviewLoop]);

    useEffect(() => {
        if (active) {
            start();
        } else {
            stop();
        }
        return () => stop();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active]);

    useEffect(() => {
        return () => {
            if (snapshotUrl) URL.revokeObjectURL(snapshotUrl);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        videoRef,
        canvasRef,
        status,
        statusMessage,
        captured: status === "captured",
        flashActive: flashEnabled && status === "ready",
        flashEnabled,
        setFlashEnabled,
        qualityWarning,
        descriptor,
        snapshotBlob,
        snapshotUrl,
        capture,
        retake,
        stop,
    };
}
