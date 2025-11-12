import ExcelJS from "exceljs";
import moment from "moment";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import { formatTime, formatNumber } from "@/helpers/formatDates";
import { computeWorkedBill } from "@/helpers/computeHours";

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

    records.forEach((record) => {
        const worked = parseFloat(record.total_hours_worked || 0);
        const late = parseFloat(
            record.late_minutes_in_hours || record.late_minutes || 0,
        );
        const undertime = parseFloat(
            record.undertime_minutes_in_hours || record.undertime_minutes || 0,
        );
        const overtime = parseFloat(record.ot_no_of_hours || 0);

        const totalHoursWorkedBilled =
            Number(record.total_schedule_hours) === 4 ? 4 : 8;

        const totWorkedBill = computeWorkedBill(record, totalHoursWorkedBilled);
        const billable = parseFloat((totWorkedBill as any) || 0);

        totalHours += worked;
        totalLate += late;
        totalUndertime += undertime;
        totalOvertime += overtime;
        totalBillable += billable;

        worksheet.addRow([
            record.branch_name ?? "",
            record.schedule_type ?? "",
            record.work_date
                ? moment(record.work_date).format("MMM DD, YYYY")
                : "",
            record.work_date ? moment(record.work_date).format("dddd") : "",
            record.Clock_In ? formatTime(record.Clock_In) : "No Data",
            record.Break_In ? formatTime(record.Break_In) : "No Data",
            record.Break_Out ? formatTime(record.Break_Out) : "No Data",
            record.Clock_Out ? formatTime(record.Clock_Out) : "No Data",
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
