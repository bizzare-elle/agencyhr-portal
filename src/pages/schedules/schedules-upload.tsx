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
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

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
            <div className="mt-4 space-y-3 rounded-lg border bg-yellow-50 p-4 text-sm">
                <p className="text-lg font-semibold">{result.message}</p>
                <div className="flex flex-wrap gap-4">
                    <span className="rounded-md bg-green-100 px-2 py-1 text-green-800">
                        Inserted: {result.saved}
                    </span>
                    <span className="rounded-md bg-blue-100 px-2 py-1 text-blue-800">
                        Updated: {result.updated}
                    </span>
                    {result.skipped.length > 0 && (
                        <span
                            className="cursor-pointer rounded-md bg-yellow-100 px-2 py-1 text-yellow-800"
                            onClick={() => setShowSkipped(!showSkipped)}
                        >
                            Skipped: {result.skipped.length}{" "}
                            {showSkipped ? (
                                <ChevronUpIcon className="inline h-4 w-4" />
                            ) : (
                                <ChevronDownIcon className="inline h-4 w-4" />
                            )}
                        </span>
                    )}
                    {result.errors.length > 0 && (
                        <span
                            className="cursor-pointer rounded-md bg-red-100 px-2 py-1 text-red-800"
                            onClick={() => setShowErrors(!showErrors)}
                        >
                            Errors: {result.errors.length}{" "}
                            {showErrors ? (
                                <ChevronUpIcon className="inline h-4 w-4" />
                            ) : (
                                <ChevronDownIcon className="inline h-4 w-4" />
                            )}
                        </span>
                    )}
                </div>

                {showSkipped && result.skipped.length > 0 && (
                    <div className="mt-2 rounded border border-yellow-200 bg-yellow-50 p-2">
                        <ul className="ml-5 list-disc text-yellow-800">
                            {result.skipped.map((s, i) => (
                                <li key={i}>
                                    Line {s.line} - Employee {s.employee_id} on{" "}
                                    {s.date}: {s.reason}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {showErrors && result.errors.length > 0 && (
                    <div className="mt-2 rounded border border-red-200 bg-red-50 p-2">
                        <ul className="ml-5 list-disc text-red-600">
                            {result.errors.map((e, i) => (
                                <li key={i}>
                                    Line {e.line} -{" "}
                                    {e.employee_id
                                        ? `Employee ${e.employee_id}`
                                        : ""}{" "}
                                    {e.date ? `on ${e.date}` : ""}: {e.reason}
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

                <CardContent className="mt-5 flex justify-around">
                    <div className="flex flex-col items-center gap-6 rounded-lg border border-gray-200 pr-6 pl-4 sm:p-6">
                        <div className="w-full sm:max-w-md">
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
                                                    employee_id: parseInt(
                                                        cols[0],
                                                    ),
                                                    schedules: cols
                                                        .slice(3)
                                                        .map((sched, i) => ({
                                                            date: header[i + 3],
                                                            schedule_id:
                                                                parseInt(
                                                                    sched ||
                                                                        "0",
                                                                ),
                                                        })),
                                                }));
                                        } else if (
                                            file.name.endsWith(".xlsx")
                                        ) {
                                            const data =
                                                await file.arrayBuffer();
                                            const workbook = XLSX.read(data, {
                                                type: "array",
                                            });
                                            const sheetName =
                                                workbook.SheetNames[0];
                                            const sheet =
                                                workbook.Sheets[sheetName];
                                            const json: any[] =
                                                XLSX.utils.sheet_to_json(
                                                    sheet,
                                                    { header: 1 },
                                                );
                                            const header = json[0] as string[];
                                            employees = json
                                                .slice(1)
                                                .map((row) => ({
                                                    employee_id: parseInt(
                                                        row[0],
                                                    ),
                                                    schedules: row
                                                        .slice(3)
                                                        .map(
                                                            (
                                                                sched: any,
                                                                i: any,
                                                            ) => ({
                                                                date: header[
                                                                    i + 3
                                                                ],
                                                                schedule_id:
                                                                    parseInt(
                                                                        sched ||
                                                                            "0",
                                                                    ),
                                                            }),
                                                        ),
                                                }));
                                        }

                                        const response = await fetch(
                                            `/api/v2/upload_batch/${employeeId}`,
                                            {
                                                method: "POST",
                                                headers: {
                                                    "Content-Type":
                                                        "application/json",
                                                },
                                                body: JSON.stringify({
                                                    employees,
                                                }),
                                            },
                                        );

                                        const data = await response.json();
                                        setBatchResult(data);
                                        if (!response.ok)
                                            throw new Error(
                                                data.message ||
                                                    "Upload failed.",
                                            );
                                        return data;
                                    }}
                                />
                            )}
                        </div>
                        <div className="w-full sm:max-w-md">
                            <CustomSearch
                                label="Search Employee"
                                apiUrl="api/v2/get_employees"
                                value={employee}
                                onChange={setEmployee}
                                placeholder="Search Employee Name or ID..."
                            />
                        </div>

                        <div className="w-full sm:max-w-md">
                            <ScheduleSearchField
                                label="Search Schedule"
                                apiUrl="api/v2/get_schedule"
                                value={schedule}
                                onChange={setSchedule}
                                placeholder="Search Schedule..."
                            />
                        </div>
                    </div>

                    {/* Guide Section */}
                    <div className="space-y-4 rounded-lg border border-gray-200 p-4 sm:p-6">
                        <h3 className="text-md font-semibold text-yellow-500">
                            Guide: Import CSV to Upload Employee Schedule
                        </h3>
                        <p>
                            This guide explains how to upload employee schedules
                            using the import file. The system supports insert
                            and update of schedule dates.
                        </p>

                        <div className="space-y-2">
                            <h4 className="font-semibold text-yellow-500">
                                1. Accepted File Type
                            </h4>
                            <ul className="list-inside list-disc">
                                <li>Only .CSV and .XLSX files are supported</li>
                                <li>
                                    Excel 2003 format (.xls – old version) is
                                    NOT allowed
                                </li>
                                <li>
                                    Uploading an unsupported file type will
                                    cause the import to fail
                                </li>
                            </ul>
                        </div>

                        <div className="space-y-2">
                            <h4 className="font-semibold text-yellow-500">
                                2. Required File Structure
                            </h4>
                            <p>
                                The file must follow the exact format below. Do
                                not rename or rearrange columns.
                            </p>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[500px] border border-gray-300 text-left">
                                    <thead className="bg-muted-foreground/20">
                                        <tr>
                                            <th className="border px-2 py-1">
                                                Column
                                            </th>
                                            <th className="border px-2 py-1">
                                                Description
                                            </th>
                                            <th className="border px-2 py-1">
                                                Example
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="border px-2 py-1">
                                                A
                                            </td>
                                            <td className="border px-2 py-1">
                                                Employee ID (required)
                                            </td>
                                            <td className="border px-2 py-1">
                                                10235
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="border px-2 py-1">
                                                B
                                            </td>
                                            <td className="border px-2 py-1">
                                                Employee Name (optional /
                                                reference only)
                                            </td>
                                            <td className="border px-2 py-1">
                                                Juan Dela Cruz
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="border px-2 py-1">
                                                C
                                            </td>
                                            <td className="border px-2 py-1">
                                                Department / Notes (optional)
                                            </td>
                                            <td className="border px-2 py-1">
                                                Kitchen
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="border px-2 py-1">
                                                D onward
                                            </td>
                                            <td className="border px-2 py-1">
                                                Date columns (schedule will be
                                                applied here)
                                            </td>
                                            <td className="border px-2 py-1">
                                                2025-01-01, 2025-01-02
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h4 className="font-semibold text-yellow-500">
                                3. Sample Upload Format
                            </h4>
                            <p>
                                Empty cells are allowed and will be skipped
                                automatically.
                            </p>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[500px] border border-gray-300 text-left">
                                    <thead className="bg-muted-foreground/20">
                                        <tr>
                                            <th className="border px-2 py-1">
                                                Employee ID
                                            </th>
                                            <th className="border px-2 py-1">
                                                Name
                                            </th>
                                            <th className="border px-2 py-1">
                                                Dept
                                            </th>
                                            <th className="border px-2 py-1">
                                                2025-01-01
                                            </th>
                                            <th className="border px-2 py-1">
                                                2025-01-02
                                            </th>
                                            <th className="border px-2 py-1">
                                                2025-01-03
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="border px-2 py-1">
                                                10235
                                            </td>
                                            <td className="border px-2 py-1">
                                                Juan Dela Cruz
                                            </td>
                                            <td className="border px-2 py-1">
                                                Kitchen
                                            </td>
                                            <td className="border px-2 py-1">
                                                05:00 - 14:00
                                            </td>
                                            <td className="border px-2 py-1">
                                                Rest Day
                                            </td>
                                            <td className="border px-2 py-1">
                                                04:00 - 13:00
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="border px-2 py-1">
                                                10412
                                            </td>
                                            <td className="border px-2 py-1">
                                                Maria Santos
                                            </td>
                                            <td className="border px-2 py-1">
                                                Service
                                            </td>
                                            <td className="border px-2 py-1">
                                                05:00 - 14:00
                                            </td>
                                            <td className="border px-2 py-1"></td>
                                            <td className="border px-2 py-1">
                                                ANNUAL LEAVE
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </ParentComponent>
    );
}
