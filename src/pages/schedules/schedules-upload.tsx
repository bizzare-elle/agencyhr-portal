import { useState } from "react";
import { ParentComponent } from "@/components/parent-container";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ExcelComponent } from "@/components/ui/schedule-template-xlx";
import CustomSearch from "@/components/custom-search-field";
import ScheduleSearchField from "@/components/custom-search-field-sched";
import ScheduleUploadFile, {
    UploadResult,
} from "@/components/schedule-uploader";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import * as XLSX from "xlsx";
import {
    ChevronDownIcon,
    ChevronUpIcon,
    CheckCircle2,
    AlertCircle,
    SkipForward,
    Save,
} from "lucide-react";

export default function ScheduleUpload() {
    const { data: me } = useQuery({
        queryKey: ["me"],
        queryFn: async () => {
            const res = await api.get("/api/v2/auth/me");
            return res.data.data;
        },
    });

    const employeeId = me?.hr_id;
    const [batchResult, setBatchResult] = useState<UploadResult | null>(null);
    const [employee, setEmployee] = useState<string | undefined>();
    const [schedule, setSchedule] = useState<string | undefined>();
    const [showSkipped, setShowSkipped] = useState(true);
    const [showErrors, setShowErrors] = useState(true);

    const renderBatchResult = (result: UploadResult) => {
        if (!result) return null;

        return (
            <div className="mt-6 rounded-xl border border-zinc-700 bg-zinc-800 p-5">
                <p className="mb-4 text-base font-semibold text-zinc-100">
                    {result.message}
                </p>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="flex items-center gap-2 rounded-lg bg-green-500/10 px-3 py-2">
                        <Save className="h-4 w-4 text-green-400" />
                        <div>
                            <p className="text-xs text-green-400">Inserted</p>
                            <p className="text-lg font-bold text-green-300">{result.saved}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-blue-500/10 px-3 py-2">
                        <CheckCircle2 className="h-4 w-4 text-blue-400" />
                        <div>
                            <p className="text-xs text-blue-400">Updated</p>
                            <p className="text-lg font-bold text-blue-300">{result.updated}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowSkipped(!showSkipped)}
                        className="flex items-center gap-2 rounded-lg bg-yellow-500/10 px-3 py-2 text-left transition hover:bg-yellow-500/20"
                    >
                        <SkipForward className="h-4 w-4 text-yellow-400" />
                        <div className="flex-1">
                            <p className="text-xs text-yellow-400">Skipped</p>
                            <p className="text-lg font-bold text-yellow-300">{result.skipped.length}</p>
                        </div>
                        {result.skipped.length > 0 && (
                            showSkipped
                                ? <ChevronUpIcon className="h-4 w-4 text-yellow-400" />
                                : <ChevronDownIcon className="h-4 w-4 text-yellow-400" />
                        )}
                    </button>
                    <button
                        onClick={() => setShowErrors(!showErrors)}
                        className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-left transition hover:bg-red-500/20"
                    >
                        <AlertCircle className="h-4 w-4 text-red-400" />
                        <div className="flex-1">
                            <p className="text-xs text-red-400">Errors</p>
                            <p className="text-lg font-bold text-red-300">{result.errors.length}</p>
                        </div>
                        {result.errors.length > 0 && (
                            showErrors
                                ? <ChevronUpIcon className="h-4 w-4 text-red-400" />
                                : <ChevronDownIcon className="h-4 w-4 text-red-400" />
                        )}
                    </button>
                </div>

                {showSkipped && result.skipped.length > 0 && (
                    <div className="mt-3 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-yellow-400">
                            Skipped Records
                        </p>
                        <ul className="space-y-1 text-sm text-yellow-300">
                            {result.skipped.map((s, i) => (
                                <li key={i} className="flex gap-2">
                                    <span className="shrink-0 font-medium">Line {s.line}</span>
                                    <span className="text-yellow-500">—</span>
                                    <span>Employee {s.employee_id} on {s.date}: {s.reason}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {showErrors && result.errors.length > 0 && (
                    <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-400">
                            Error Records
                        </p>
                        <ul className="space-y-1 text-sm text-red-300">
                            {result.errors.map((e, i) => (
                                <li key={i} className="flex gap-2">
                                    <span className="shrink-0 font-medium">Line {e.line}</span>
                                    <span className="text-red-500">—</span>
                                    <span>
                                        {e.employee_id ? `Employee ${e.employee_id}` : ""}
                                        {e.date ? ` on ${e.date}` : ""}: {e.reason}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        );
    };

    return (
        <ParentComponent>
            <Card className="w-full shadow-md">
                <CardHeader>
                    <div className="flex w-full flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                            <CardTitle className="text-lg font-semibold">
                                Schedule Upload
                            </CardTitle>
                            <CardDescription>
                                Batch upload employee schedules using the Excel
                                template. Insert new or update existing
                                schedules.
                            </CardDescription>
                        </div>
                        <ExcelComponent />
                    </div>
                </CardHeader>

                <CardContent>
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Left: Upload + Search */}
                        <div className="space-y-5">
                            <div>
                                <h3 className="mb-3 text-sm font-semibold text-zinc-300">
                                    Upload File
                                </h3>
                                {employeeId && (
                                    <ScheduleUploadFile
                                        coordinatorId={employeeId}
                                        onUpload={async (file: File) => {
                                            let employees: any[] = [];

                                            if (file.name.endsWith(".csv")) {
                                                const text = await file.text();
                                                const lines = text
                                                    .split("\n")
                                                    .map((line) => line.split(","));
                                                const header = lines[0];
                                                employees = lines
                                                    .slice(1)
                                                    .map((cols) => ({
                                                        employee_id: parseInt(cols[0]),
                                                        schedules: cols
                                                            .slice(3)
                                                            .map((sched, i) => ({
                                                                date: header[i + 3],
                                                                schedule_id: parseInt(sched || "0"),
                                                            })),
                                                    }));
                                            } else if (file.name.endsWith(".xlsx")) {
                                                const data = await file.arrayBuffer();
                                                const workbook = XLSX.read(data, { type: "array" });
                                                const sheetName = workbook.SheetNames[0];
                                                const sheet = workbook.Sheets[sheetName];
                                                const json: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                                                const header = json[0] as string[];
                                                employees = json
                                                    .slice(1)
                                                    .map((row) => ({
                                                        employee_id: parseInt(row[0]),
                                                        schedules: row
                                                            .slice(3)
                                                            .map((sched: any, i: any) => ({
                                                                date: header[i + 3],
                                                                schedule_id: parseInt(sched || "0"),
                                                            })),
                                                    }));
                                            }

                                            const response = await fetch(
                                                `/api/v2/upload_batch/${employeeId}`,
                                                {
                                                    method: "POST",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({ employees }),
                                                },
                                            );

                                            const data = await response.json();
                                            setBatchResult(data);
                                            if (!response.ok)
                                                throw new Error(data.message || "Upload failed.");
                                            return data;
                                        }}
                                    />
                                )}
                            </div>

                            <div className="space-y-4 rounded-xl border border-zinc-700 bg-zinc-800/50 p-4">
                                <h3 className="text-sm font-semibold text-zinc-300">
                                    Quick Lookup
                                </h3>
                                <CustomSearch
                                    label="Search Employee"
                                    apiUrl="api/v2/get_employees"
                                    value={employee}
                                    onChange={setEmployee}
                                    placeholder="Search Employee Name or ID..."
                                />
                                <ScheduleSearchField
                                    label="Search Schedule"
                                    apiUrl="api/v2/get_schedule"
                                    value={schedule}
                                    onChange={setSchedule}
                                    placeholder="Search Schedule..."
                                />
                            </div>

                            {batchResult && renderBatchResult(batchResult)}
                        </div>

                        {/* Right: Guide */}
                        <div className="space-y-5 rounded-xl border border-zinc-700 bg-zinc-800/50 p-5 text-sm">
                            <h3 className="font-semibold text-yellow-500">
                                Guide: Import CSV / XLSX to Upload Employee Schedules
                            </h3>

                            <div className="space-y-2">
                                <h4 className="font-semibold text-yellow-500">
                                    1. Accepted File Types
                                </h4>
                                <ul className="list-inside list-disc space-y-1 text-zinc-400">
                                    <li>Only .CSV and .XLSX files are supported</li>
                                    <li>Excel 2003 format (.xls) is NOT allowed</li>
                                    <li>Unsupported file types will cause the import to fail</li>
                                </ul>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-semibold text-yellow-500">
                                    2. Required File Structure
                                </h4>
                                <p className="text-zinc-400">
                                    The file must follow this exact format. Do not rename or rearrange columns.
                                </p>
                                <div className="overflow-x-auto rounded-lg border border-zinc-700">
                                    <table className="w-full min-w-[400px] text-left text-xs">
                                        <thead className="bg-zinc-700/50">
                                            <tr>
                                                <th className="border-b border-zinc-700 px-3 py-2 font-semibold text-zinc-300">Column</th>
                                                <th className="border-b border-zinc-700 px-3 py-2 font-semibold text-zinc-300">Description</th>
                                                <th className="border-b border-zinc-700 px-3 py-2 font-semibold text-zinc-300">Example</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-700/50">
                                            <tr>
                                                <td className="px-3 py-2 font-medium text-zinc-200">A</td>
                                                <td className="px-3 py-2 text-zinc-400">Employee ID (required)</td>
                                                <td className="px-3 py-2 text-zinc-500">10235</td>
                                            </tr>
                                            <tr>
                                                <td className="px-3 py-2 font-medium text-zinc-200">B</td>
                                                <td className="px-3 py-2 text-zinc-400">Employee Name (optional)</td>
                                                <td className="px-3 py-2 text-zinc-500">Juan Dela Cruz</td>
                                            </tr>
                                            <tr>
                                                <td className="px-3 py-2 font-medium text-zinc-200">C</td>
                                                <td className="px-3 py-2 text-zinc-400">Department / Notes (optional)</td>
                                                <td className="px-3 py-2 text-zinc-500">Kitchen</td>
                                            </tr>
                                            <tr>
                                                <td className="px-3 py-2 font-medium text-zinc-200">D+</td>
                                                <td className="px-3 py-2 text-zinc-400">Date columns (schedule applied here)</td>
                                                <td className="px-3 py-2 text-zinc-500">2025-01-01</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-semibold text-yellow-500">
                                    3. Sample Upload Format
                                </h4>
                                <p className="text-zinc-400">
                                    Empty cells are allowed and will be skipped automatically.
                                </p>
                                <div className="overflow-x-auto rounded-lg border border-zinc-700">
                                    <table className="w-full min-w-[400px] text-left text-xs">
                                        <thead className="bg-zinc-700/50">
                                            <tr>
                                                <th className="border-b border-zinc-700 px-3 py-2 font-semibold text-zinc-300">Employee ID</th>
                                                <th className="border-b border-zinc-700 px-3 py-2 font-semibold text-zinc-300">Name</th>
                                                <th className="border-b border-zinc-700 px-3 py-2 font-semibold text-zinc-300">Dept</th>
                                                <th className="border-b border-zinc-700 px-3 py-2 font-semibold text-zinc-300">2025-01-01</th>
                                                <th className="border-b border-zinc-700 px-3 py-2 font-semibold text-zinc-300">2025-01-02</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-700/50">
                                            <tr>
                                                <td className="px-3 py-2 text-zinc-300">10235</td>
                                                <td className="px-3 py-2 text-zinc-400">Juan Dela Cruz</td>
                                                <td className="px-3 py-2 text-zinc-400">Kitchen</td>
                                                <td className="px-3 py-2 text-zinc-500">05:00 - 14:00</td>
                                                <td className="px-3 py-2 text-zinc-500">Rest Day</td>
                                            </tr>
                                            <tr>
                                                <td className="px-3 py-2 text-zinc-300">10412</td>
                                                <td className="px-3 py-2 text-zinc-400">Maria Santos</td>
                                                <td className="px-3 py-2 text-zinc-400">Service</td>
                                                <td className="px-3 py-2 text-zinc-500">05:00 - 14:00</td>
                                                <td className="px-3 py-2 text-zinc-500">ANNUAL LEAVE</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </ParentComponent>
    );
}
