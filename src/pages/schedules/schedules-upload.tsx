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
import ScheduleUploadFile from "@/components/schedule-uploader";

const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    await fetch("/api/v2/upload_schedule", {
        method: "POST",
        body: formData,
    });
};

export default function ScheduleUpload() {
    const [employee, setEmployee] = useState<string | undefined>();
    const [schedule, setSchedule] = useState<string | undefined>();

    return (
        <ParentComponent>
            <Card className="w-full shadow-md">
                {/* Header */}
                <CardHeader>
                    <div className="flex w-full items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-semibold">
                                Schedule Upload
                            </CardTitle>
                            <CardDescription>
                                Batch upload employee schedules by filling out
                                the Excel template and importing it here.
                            </CardDescription>
                        </div>
                        <ExcelComponent />
                    </div>
                </CardHeader>

                {/* Content */}
                <CardContent className="space-y-8">
                    {/* Employee Search */}
                    <div className="flex items-start justify-around">
                        <div className="w-full max-w-md">
                            <CustomSearch
                                label="Search Employee"
                                apiUrl="api/v2/get_employees"
                                value={employee}
                                onChange={setEmployee}
                                placeholder="Search Employee Name or ID..."
                            />
                        </div>

                        {/* Schedule Search */}
                        <div className="w-full max-w-md">
                            <ScheduleSearchField
                                label="Search Schedule from the List"
                                apiUrl="api/v2/get_schedule"
                                value={schedule}
                                onChange={setSchedule}
                                placeholder="Search Schedule..."
                            />
                        </div>

                        <div className="w-full max-w-md">
                            <ScheduleUploadFile onUpload={handleUpload} />
                        </div>
                    </div>

                    {/* Guide Section */}
                    <div className="space-y-4 rounded-lg border border-gray-200 p-6">
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
                            <table className="w-full border border-gray-300 text-left">
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
                                        <td className="border px-2 py-1">A</td>
                                        <td className="border px-2 py-1">
                                            Employee ID (required)
                                        </td>
                                        <td className="border px-2 py-1">
                                            10235
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="border px-2 py-1">B</td>
                                        <td className="border px-2 py-1">
                                            Employee Name (optional / reference
                                            only)
                                        </td>
                                        <td className="border px-2 py-1">
                                            Juan Dela Cruz
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="border px-2 py-1">C</td>
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

                        <div className="space-y-2">
                            <h4 className="font-semibold text-yellow-500">
                                3. Sample Upload Format
                            </h4>
                            <p>
                                Empty cells are allowed and will be skipped
                                automatically.
                            </p>
                            <table className="w-full border border-gray-300 text-left">
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
                </CardContent>
            </Card>
        </ParentComponent>
    );
}
