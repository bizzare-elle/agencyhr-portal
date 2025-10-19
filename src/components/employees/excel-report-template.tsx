import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export function exportConsolidatedToExcel(
    recordsByEmployee: any[],
    cutOffDate: Date,
) {
    const wb = XLSX.utils.book_new();
    const wsData: any[] = [];

    recordsByEmployee.forEach((emp, index) => {
        wsData.push(["Employee Name:", emp.employee_name]);
        wsData.push(["Employee ID:", emp.id_number]);
        wsData.push(["Branch:", emp.branch]);
        wsData.push(["Department:", emp.department]);
        wsData.push(["Employment Status:", emp.employment_status]);
        wsData.push(["Agency:", emp.agency_name]);
        wsData.push([]);

        wsData.push([
            "Date",
            "Schedule",
            "Time In",
            "Time Out",
            "Break In",
            "Break Out",
            "Hours",
            "Late (mins)",
            "Overtime (hrs)",
            "Undertime (hrs)",
            "Billable Hours",
        ]);

        if (emp.time_records?.length > 0) {
            emp.time_records.forEach((rec: any) => {
                wsData.push([
                    rec.date,
                    rec.schedule_name || "",
                    rec.time_in || "",
                    rec.time_out || "",
                    rec.break_in || "",
                    rec.break_out || "",
                    Number(rec.hours || 0),
                    Number(rec.late || 0),
                    Number(rec.overtime || 0),
                    Number(rec.undertime || 0),
                    Number(rec.billable_hours || 0),
                ]);
            });

            // Compute totals
            const totals = emp.time_records.reduce(
                (acc: any, rec: any) => {
                    acc.hours += Number(rec.hours) || 0;
                    acc.late += Number(rec.late) || 0;
                    acc.overtime += Number(rec.overtime) || 0;
                    acc.undertime += Number(rec.undertime) || 0;
                    acc.billable_hours += Number(rec.billable_hours) || 0;
                    return acc;
                },
                {
                    hours: 0,
                    late: 0,
                    overtime: 0,
                    undertime: 0,
                    billable_hours: 0,
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
                totals.hours.toFixed(2),
                totals.late.toFixed(0),
                totals.overtime.toFixed(2),
                totals.undertime.toFixed(2),
                totals.billable_hours.toFixed(2),
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

    const fileName = `Consolidated_Time_Records_${cutOffDate
        .toISOString()
        .slice(0, 10)}.xlsx`;

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([wbout], { type: "application/octet-stream" }), fileName);
}
