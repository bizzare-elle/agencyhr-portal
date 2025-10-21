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
    worksheet.addRow([]);

    const headers = [
        "Branch",
        "Schedule",
        "Date",
        "Day",
        "Time In",
        "Break In",
        "Break Out",
        "Time Out",
        "Overtime (hrs)",
        "Late (hrs)",
        "Undertime (hrs)",
        "Total Worked Hours",
        "Billable Hours",
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
    let totalBillable = 0;

    records.forEach((r) => {
        const worked = parseFloat(r.total_hours_worked || 0);
        const late = parseFloat(r.late_minutes_in_hours || r.late_minutes || 0);
        const undertime = parseFloat(
            r.undertime_minutes_in_hours || r.undertime_minutes || 0,
        );
        const overtime = parseFloat(r.ot_no_of_hours || 0);
        const billable = parseFloat(r.totWorkedBill || 0);

        totalHours += worked;
        totalLate += late;
        totalUndertime += undertime;
        totalOvertime += overtime;
        totalBillable += billable;

        worksheet.addRow([
            r.branch_name ?? "",
            r.schedule_type ?? "",
            r.work_date ? moment(r.work_date).format("MMM DD, YYYY") : "",
            r.work_date ? moment(r.work_date).format("dddd") : "",
            r.Clock_In ? formatTime(r.Clock_In) : "No Data",
            r.Break_In ? formatTime(r.Break_In) : "No Data",
            r.Break_Out ? formatTime(r.Break_Out) : "No Data",
            r.Clock_Out ? formatTime(r.Clock_Out) : "No Data",
            formatNumber(overtime),
            formatNumber(late),
            formatNumber(undertime),
            formatNumber(worked),
            formatNumber(billable),
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
        totalLate.toFixed(2),
        totalUndertime.toFixed(2),
        totalHours.toFixed(2),
        totalBillable.toFixed(2),
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
        { width: 18 },
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    saveAs(blob, `Time_Records_${employee.replace(/\s/g, "_")}.xlsx`);

    toast.success("Exported successfully to Excel");
};
