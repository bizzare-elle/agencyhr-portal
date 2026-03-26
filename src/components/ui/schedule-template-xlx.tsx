import { formatDate } from "@/helpers/formatDates";
import { Button } from "./button";
import * as XLSX from "xlsx";

export function ExcelComponent() {
    const downloadTemplate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();

        let startDate: Date;
        let endDate: Date;

        if (today.getDate() <= 15) {
            startDate = new Date(year, month, 1);
            endDate = new Date(year, month, 15);
        } else {
            startDate = new Date(year, month, 16);
            endDate = new Date(year, month + 1, 0);
        }

        const dateColumns: string[] = [];
        const current = new Date(startDate);

        while (current <= endDate) {
            dateColumns.push(formatDate(current));
            current.setDate(current.getDate() + 1);
        }

        const headers = [
            "Employee ID",
            "Employee Name",
            "Department",
            ...dateColumns,
        ];

        // Create worksheet
        const ws = XLSX.utils.aoa_to_sheet([headers]);

        ws["!cols"] = [
            { wch: 15 }, // Employee ID
            { wch: 25 }, // Employee Name
            { wch: 20 }, // Department
            ...dateColumns.map(() => ({ wch: 12 })), // Dates
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Schedule Template");

        XLSX.writeFile(wb, "schedule_template.xlsx");
    };

    return (
        <Button onClick={downloadTemplate} className="bg-yellow-500">
            Download Excel Template
        </Button>
    );
}
