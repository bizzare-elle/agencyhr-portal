import ExcelJS from "exceljs";
import moment from "moment";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import { formatTime, formatNumber } from "@/helpers/formatDates";

export const handleExportExcel = async (
    records: any[],
    employeeName: string,
    queryFrom?: string,
    queryTo?: string,
) => {
    if (!records || records.length === 0) {
        toast.error("No records to export");
        return;
    }

    const employee = employeeName || "Employee";
    const dateRange =
        queryFrom && queryTo
            ? `Date Range: ${moment(queryFrom).format("MMM DD, YYYY")} to ${moment(
                  queryTo,
              ).format("MMM DD, YYYY")}`
            : "";

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Time Records");

    worksheet.addRow([`Employee Name: ${employee}`]);
    worksheet.addRow([dateRange]);
    worksheet.addRow(["Disclaimer: This is not an official document."]);
    worksheet.addRow([]);

    const headers = [
        "Schedule",
        "Date",
        "Day",
        "Branch Location (In-Out)",
        "Time In",
        "Break In",
        "Break Out",
        "Time Out",
        "Overtime (hrs)",
        "Break Late (hrs)",
        "Late (hrs)",
        "Undertime (hrs)",
        "Total Worked Hours",
    ];

    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
        cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF353935" },
        };
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
        };
    });

    let totalHours = 0;
    let totalLate = 0;
    let totalUndertime = 0;
    let totalOvertime = 0;
    let totalBreakLate = 0;
    let totalBillable = 0;

    records.forEach((record) => {
        const worked = parseFloat(record.total_hrs || 0);
        const late = parseFloat(record.total_hrs_late || 0);
        const breakLate = parseFloat(record.total_hrs_break_late || 0);
        const undertime = parseFloat(
            record.total_undertime_hrs || record.total_undertime_hrs || 0,
        );
        const overtime = parseFloat(record.total_overtime || 0);

        totalHours += worked;
        totalLate += late;
        totalBreakLate += breakLate;
        totalUndertime += undertime;
        totalOvertime += overtime;

        worksheet.addRow([
            record.schedule_name ?? "",
            record.cut_off ? moment(record.cut_off).format("MMM DD, YYYY") : "",
            record.cut_off ? moment(record.cut_off).format("dddd") : "",
            record.clock_in_branch && record.clock_out_branch
                ? `In: ${record.clock_in_branch} Out: ${record.clock_out_branch}`
                : record.clock_in_branch
                  ? `In: ${record.clock_in_branch}`
                  : record.clock_out_branch
                    ? `Out: ${record.clock_out_branch}`
                    : "No Data",
            record.clock_in ? formatTime(record.clock_in) : "No Data",
            record.break_in ? formatTime(record.break_in) : "No Data",
            record.break_out ? formatTime(record.break_out) : "No Data",
            record.clock_out ? formatTime(record.clock_out) : "No Data",
            formatNumber(overtime),
            formatNumber(breakLate),
            formatNumber(late),
            formatNumber(undertime),
            formatNumber(worked),
        ]);
    });

    const totalsRow = worksheet.addRow([
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "TOTALS:",
        totalOvertime.toFixed(2),
        totalBreakLate.toFixed(2),
        totalLate.toFixed(2),
        totalUndertime.toFixed(2),
        totalHours.toFixed(2),
    ]);

    totalsRow.eachCell((cell, colNumber) => {
        if (colNumber >= 8) {
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FF353935" },
            };
            cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
            cell.alignment = { horizontal: "center", vertical: "middle" };
            cell.border = {
                top: { style: "thin" },
                bottom: { style: "thin" },
                left: { style: "thin" },
                right: { style: "thin" },
            };
        }
    });

    worksheet.columns = [
        { width: 25 },
        { width: 25 },
        { width: 18 },
        { width: 15 },
        { width: 15 },
        { width: 15 },
        { width: 15 },
        { width: 15 },
        { width: 15 },
        { width: 15 },
        { width: 15 },
        { width: 15 },
        { width: 15 },
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    saveAs(blob, `Time_Records_${employee.replace(/\s/g, "_")}.xlsx`);

    toast.success("Exported successfully to Excel");
};
