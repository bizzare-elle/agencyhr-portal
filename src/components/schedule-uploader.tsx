import { useRef, useState } from "react";
import { UploadCloud, FileSpreadsheet, X } from "lucide-react";

interface Props {
    onUpload: (file: File) => void;
}

export default function ScheduleUploadFile({ onUpload }: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);

    const allowedTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/csv",
    ];

    const validateFile = (selectedFile: File) => {
        if (!allowedTypes.includes(selectedFile.type)) {
            setError("Only .CSV and .XLSX files are allowed.");
            return false;
        }

        setError(null);
        return true;
    };

    const handleFile = (selectedFile: File) => {
        if (!validateFile(selectedFile)) return;
        setFile(selectedFile);
    };

    const handleUpload = () => {
        if (!file) return;
        onUpload(file);
    };

    const removeFile = () => {
        setFile(null);
        setError(null);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);

        const dropped = e.dataTransfer.files?.[0];
        if (dropped) handleFile(dropped);
    };

    return (
        <div className="m-2 w-full max-w-lg">
            {!file && (
                <div
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(e) => {
                        e.preventDefault();
                        setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition ${dragging ? "border-primary scale-[1.01]" : "border-border"} hover:border-primary`}
                >
                    <UploadCloud className="mx-auto mb-3 h-8 w-8 text-yellow-500 opacity-80" />

                    <p className="text-sm font-medium">
                        Click to upload or drag file here
                    </p>

                    <p className="text-muted-foreground mt-1 text-xs">
                        CSV or XLSX only
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
                        className="w-full rounded-md border px-4 py-2 text-sm font-medium transition hover:opacity-90"
                    >
                        Upload Schedule
                    </button>
                </div>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}

            <input
                ref={inputRef}
                type="file"
                accept=".csv,.xlsx"
                hidden
                onChange={(e) => {
                    const selectedFile = e.target.files?.[0];
                    if (selectedFile) handleFile(selectedFile);
                }}
            />
        </div>
    );
}
