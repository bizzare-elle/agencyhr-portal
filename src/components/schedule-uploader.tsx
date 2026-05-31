import { useRef, useState } from "react";
import { UploadCloud, FileSpreadsheet, X, ArrowUpCircle } from "lucide-react";
import * as XLSX from "xlsx";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/axios";
import { toast } from "sonner";

interface Props {
    coordinatorId: number;
    onUpload?: (file: File) => Promise<UploadResult>;
}

export interface UploadResult {
    message: string;
    saved: number;
    updated: number;
    skipped: {
        line: number;
        employee_id: number;
        date: string;
        reason: string;
    }[];
    errors: {
        line: number;
        employee_id?: number;
        date?: string;
        reason: string;
    }[];
}

export default function ScheduleUploadFile({ coordinatorId }: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);
    const [result, setResult] = useState<UploadResult | null>(null);

    const MAX_SIZE = 5 * 1024 * 1024;

    const uploadMutation = useMutation({
        mutationFn: async (payload: any) => {
            const res = await api.post(
                `/api/v2/upload_batch/${coordinatorId}`,
                payload,
            );
            return res.data;
        },
        onSuccess: (data: any) => {
            setResult({
                message: data.message || "Schedule uploaded successfully!",
                saved: data.saved || 0,
                updated: data.updated || 0,
                skipped: data.skipped || [],
                errors: data.errors || [],
            });
            toast.success(data.message || "Schedule uploaded successfully!");
            removeFile();
        },
        onError: (err: any) => {
            setError(err?.response?.data?.message || "Upload failed.");
        },
    });

    const isUploading = uploadMutation.status === "pending";

    const validateFile = (selectedFile: File) => {
        const ext = selectedFile.name.split(".").pop()?.toLowerCase();
        if (!ext || !["xlsx", "csv"].includes(ext)) {
            setError("Only .CSV and .XLSX files are allowed.");
            return false;
        }
        if (selectedFile.size > MAX_SIZE) {
            setError("File must be smaller than 5MB.");
            return false;
        }
        setError(null);
        return true;
    };

    const handleFile = (selectedFile: File) => {
        if (!validateFile(selectedFile)) return;
        setFile(selectedFile);
        setResult(null);
    };

    const parseFile = async (file: File) => {
        const ext = file.name.split(".").pop()?.toLowerCase();
        let employees: any[] = [];

        if (ext === "csv") {
            const text = await file.text();
            const lines = text.split("\n").map((line) => line.split(","));
            const headers = lines[0] || [];
            employees = lines
                .slice(1)
                .filter((row) => row.length > 0)
                .map((cols) => ({
                    employee_id: parseInt(cols[0] || "0"),
                    schedules: (cols.slice(1) || []).map((sched, i) => ({
                        date: headers[i + 1] || "",
                        schedule_id: parseInt(sched || "0"),
                    })),
                }));
        } else if (ext === "xlsx") {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet, {
                header: 1,
            }) as any[][];
            const headers = jsonData[0] || [];
            employees = jsonData
                .slice(1)
                .filter((row) => row.length > 0)
                .map((cols) => ({
                    employee_id: parseInt(cols[0] || "0"),
                    schedules: (cols.slice(1) || []).map((sched, i) => ({
                        date: headers[i + 1] || "",
                        schedule_id: parseInt(sched || "0"),
                    })),
                }));
        }

        return employees;
    };

    const handleUpload = async () => {
        if (!file) return;

        try {
            setError(null);
            setResult(null);

            const employees = await parseFile(file);
            if (employees.length === 0) {
                setError("No valid employees found in file.");
                return;
            }

            uploadMutation.mutate({ employees });
        } catch {
            setError("Failed to parse file.");
        }
    };

    const removeFile = () => {
        setFile(null);
        setError(null);
        if (inputRef.current) inputRef.current.value = "";
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const dropped = e.dataTransfer.files?.[0];
        if (dropped) handleFile(dropped);
    };

    return (
        <div className="w-full">
            {!file && (
                <div
                    role="button"
                    tabIndex={0}
                    onClick={() => inputRef.current?.click()}
                    onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
                    onDragOver={(e) => {
                        e.preventDefault();
                        setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    className={`group cursor-pointer rounded-xl border-2 border-dashed px-6 py-10 text-center transition-all ${
                        dragging
                            ? "border-yellow-500 bg-yellow-500/10"
                            : "border-border hover:border-yellow-400 hover:bg-yellow-500/5"
                    }`}
                >
                    <UploadCloud
                        className={`mx-auto mb-3 h-10 w-10 transition-colors ${
                            dragging
                                ? "text-yellow-500"
                                : "text-muted-foreground group-hover:text-yellow-400"
                        }`}
                    />
                    <p className="text-sm font-medium text-foreground">
                        Click to upload or drag & drop
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        .xlsx or .csv &mdash; max 5MB
                    </p>
                </div>
            )}

            {file && (
                <div className="rounded-xl border bg-muted p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow-500/10">
                            <FileSpreadsheet className="h-5 w-5 text-yellow-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">
                                {file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {(file.size / 1024).toFixed(1)} KB
                            </p>
                        </div>
                        <button
                            onClick={removeFile}
                            className="rounded-md p-1 text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
                            aria-label="Remove file"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <button
                        onClick={handleUpload}
                        disabled={isUploading}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-yellow-600 disabled:opacity-50"
                    >
                        {isUploading ? (
                            <>
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <ArrowUpCircle className="h-4 w-4" />
                                Upload Schedule
                            </>
                        )}
                    </button>
                </div>
            )}

            {error && (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-red-400">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-400" />
                    {error}
                </p>
            )}

            <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.csv"
                hidden
                onChange={(e) => {
                    const selectedFile = e.target.files?.[0];
                    if (selectedFile) handleFile(selectedFile);
                }}
            />
        </div>
    );
}
