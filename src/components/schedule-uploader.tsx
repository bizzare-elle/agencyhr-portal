import { useRef, useState } from "react";
import { UploadCloud, FileSpreadsheet, X } from "lucide-react";
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
        } catch (err) {
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
        <div className="w-full max-w-lg">
            {!file && (
                <div
                    role="button"
                    tabIndex={0}
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(e) => {
                        e.preventDefault();
                        setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition ${
                        dragging
                            ? "scale-[1.02] border-yellow-500"
                            : "border-border"
                    } hover:border-yellow-500`}
                >
                    <UploadCloud className="mx-auto mb-3 h-8 w-8 text-yellow-500 opacity-80" />
                    <p className="text-sm font-medium">
                        Click to upload or drag file here
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                        Upload the schedule template (.xlsx or .csv)
                    </p>
                </div>
            )}

            {file && (
                <div className="space-y-3 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex min-w-0 items-center gap-3">
                            <FileSpreadsheet className="h-5 w-5 shrink-0 text-yellow-500" />
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-yellow-500">
                                    {file.name}
                                </p>
                                <p className="text-muted-foreground text-xs">
                                    {(file.size / 1024).toFixed(1)} KB
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={removeFile}
                            className="p-1 opacity-70 transition hover:opacity-100"
                            aria-label="Remove file"
                        >
                            <X size={16} />
                        </button>
                    </div>
                    <button
                        onClick={handleUpload}
                        disabled={isUploading}
                        className="w-full rounded-md border px-4 py-2 text-sm font-medium transition hover:opacity-90 disabled:opacity-50"
                    >
                        {isUploading ? "Uploading..." : "Upload Schedule"}
                    </button>
                </div>
            )}

            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

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
