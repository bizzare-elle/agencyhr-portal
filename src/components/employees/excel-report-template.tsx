import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { formatNumber, formatTime } from "@/helpers/formatDates";
import moment from "moment";
import { minutesToHours } from "@/helpers/computeHours";

export function exportConsolidatedToExcel(
    recordsByEmployee: any[],
    cutOffDate: Date,
) {
    const wb = XLSX.utils.book_new();
    const wsData: any[] = [];

    recordsByEmployee.forEach((emp, index) => {
        wsData.push(["Employee Name:", emp.employee_name || ""]);
        wsData.push(["Employee ID:", emp.id_number || ""]);
        wsData.push(["Branch:", emp.branch || ""]);
        wsData.push(["Agency:", emp.agency_name || ""]);
        wsData.push([]);

        wsData.push([
            "Date",
            "Schedule",
            "Time In",
            "Break Out",
            "Break In",
            "Time Out",
            "Late (hrs)",
            "Overtime (hrs)",
            "Undertime (hrs)",
            "Total Hours Worked",
        ]);

        if (emp.time_records?.length > 0) {
            emp.time_records.forEach((rec: any) => {
                const late = minutesToHours(rec.late);
                const undertime = minutesToHours(rec.undertime);
                const overtime = Number(rec.overtime) || 0;
                const hours = Number(rec.hours) || 0;

                wsData.push([
                    moment(rec.date).format("MMM DD, YYYY"),
                    rec.schedule || "",
                    formatTime(rec.time_in) || "",
                    formatTime(rec.break_out) || "",
                    formatTime(rec.break_in) || "",
                    formatTime(rec.time_out) || "",
                    formatNumber(late),
                    formatNumber(overtime),
                    formatNumber(undertime),
                    formatNumber(hours),
                ]);
            });

            const totals = emp.time_records.reduce(
                (acc: any, rec: any) => {
                    acc.late += minutesToHours(rec.late);
                    acc.overtime += Number(rec.overtime) || 0;
                    acc.undertime += minutesToHours(rec.undertime);
                    acc.hours += Number(rec.hours) || 0;
                    return acc;
                },
                {
                    late: 0,
                    overtime: 0,
                    undertime: 0,
                    hours: 0,
                },
            );

            wsData.push([]);
            wsData.push([
                "TOTALS",
                "",
                "",
                "",
                "",
                "",
                totals.late.toFixed(2),
                totals.overtime.toFixed(2),
                totals.undertime.toFixed(2),
                totals.hours.toFixed(2),
            ]);
        } else {
            wsData.push(["No time records found"]);
        }

        if (index < recordsByEmployee.length - 1) {
            wsData.push([]);
            wsData.push([]);
        }
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Consolidated Records");

    const fileName = `Consolidated_Time_Records_${moment(cutOffDate).format(
        "YYYY-MM-DD",
    )}.xlsx`;

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([wbout], { type: "application/octet-stream" }), fileName);
}
