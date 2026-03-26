import React from "react";
import moment from "moment";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface PrintTimeRecordsProps {
    tableId: string;
    employeeName: string;
    isHrEmployee: boolean;
    idNumber: string | null;
    agencyName?: string | null;
    branchName?: string | null;
    queryFrom?: string;
    queryTo?: string;
}

export const PrintTimeRecords: React.FC<
    PrintTimeRecordsProps & { records: any[] }
> = ({
    tableId,
    employeeName,
    agencyName,
    idNumber,
    branchName,
    isHrEmployee,
    queryFrom,
    queryTo,
    records,
}) => {
    const handlePrint = () => {
        const table = document.getElementById(tableId);
        if (!table) return;

        const sumColumnByIndex = (index: number) => {
            const rows = Array.from(table.querySelectorAll("tbody tr"));
            return rows.reduce((sum, row) => {
                const cells = row.querySelectorAll("td");
                const val = parseFloat(
                    cells[index]?.textContent?.trim() || "0",
                );
                return sum + (isNaN(val) ? 0 : val);
            }, 0);
        };

        const totalBreakLate = sumColumnByIndex(8);
        const totalLate = sumColumnByIndex(9);
        const totalUndertime = sumColumnByIndex(10);
        const totalOvertime = sumColumnByIndex(7);
        const totalHoursWorked = sumColumnByIndex(11);
        const totalBillable = sumColumnByIndex(12);

        // --- Compute manhour totals grouped by category ---
        const manhourTotals: { [key: string]: number } = {};
        records.forEach((record) => {
            let manhours: Record<string, number> = {};
            try {
                manhours =
                    typeof record.manhour_conversion === "string"
                        ? JSON.parse(record.manhour_conversion)
                        : record.manhour_conversion || {};
            } catch {}
            Object.entries(manhours).forEach(([category, value]) => {
                const hours = Number(value);
                if (hours > 0) {
                    if (!manhourTotals[category]) manhourTotals[category] = 0;
                    manhourTotals[category] += hours;
                }
            });
        });

        const printContent = table.outerHTML;
        const printWindow = window.open("", "_blank");

        const disclaimerHtml = isHrEmployee
            ? `<div class="footer"><strong>Disclaimer:</strong> This is not an official document.</div>`
            : "";

        if (printWindow) {
            printWindow.document.write(`
                <html>
                <head>
                    <title>Employee Time Records</title>
                    <style>
                        body { font-family: Helvetica, Arial, sans-serif; padding:10px; font-size:10px; color:#000; }
                        .header { padding-bottom:6px; margin-bottom:5px; }
                        .header-divider { border-bottom:1px solid #000; margin:6px 0 10px 0; }
                        .header h2 { font-size:14px; font-weight:bold; margin:0; }
                        .header h3 { font-size:11px; margin:2px 0; font-weight:normal; }
                        .header h4 { font-size:9px; color:gray; margin:2px 0 0 0; }
                        table { width:100%; border-collapse:collapse; margin-top:10px; }
                        th { background-color:#d9e1f2; border:1px solid #000; padding:4px 6px; font-size:9px; font-weight:bold; text-align:center; }
                        td { padding:3px 6px; font-size:9px; text-align:center; border-bottom:0.5px solid #ccc; border-left:1px solid #000; }
                        td:last-child { border-right:1px solid #000; }
                        .totals { margin-top:12px; padding-top:6px; border-top:1px solid #000; font-size:10px; }
                        .signature { margin-top:40px; text-align:center; }
                        .signature-line { margin:0 auto; width:220px; border-top:1px solid #000; padding-top:4px; font-size:9px; }
                        .footer { margin-top:20px; text-align:center; font-size:9px; color:red; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h2>Employee Time Records</h2>
                        <h4>Generated: ${format(new Date(), "PPpp")}</h4>
                        <div class="header-divider"></div>
                        <h3>Name: ${employeeName}</h3>
                        <h3>ID Number: ${idNumber || "N/A"}</h3>
                        <h3>Branch: ${branchName || "N/A"}</h3>
                        <h3>Agency: ${agencyName || "No Agency"}</h3>
                    </div>

                    ${printContent}

                  <div class="totals" style="margin-top:12px; border-top:1px solid #000; padding-top:6px;">
    <table style="width:30%; border-collapse: collapse; font-size:10px; margin-top:4px;">
        <thead>
            <tr>
                <th style="border:1px solid #000; padding:4px;">Timekeeping Attendance Summary</th>
                <th style="border:1px solid #000; padding:4px;">Total Hours</th>
            </tr>
        </thead>
        <tbody>
          ${Object.entries(manhourTotals)
              .map(
                  ([cat, hrs]) =>
                      `<tr>
                            <td style="border:1px solid #000; padding:4px;">${cat}</td>
                            <td style="border:1px solid #000; padding:4px;">${hrs.toFixed(2)}</td>
                        </tr>`,
              )
              .join("")}
        </tbody>
            <tr>
                <td style="border:1px solid #000; padding:4px;">Total Overtime</td>
                <td style="border:1px solid #000; padding:4px;">${totalOvertime.toFixed(2)}</td>
            </tr>
            <tr>
                <td style="border:1px solid #000; padding:4px;">Total Break Late</td>
                <td style="border:1px solid #000; padding:4px;">${totalBreakLate.toFixed(2)}</td>
            </tr>
            <tr>
                <td style="border:1px solid #000; padding:4px;">Total Late</td>
                <td style="border:1px solid #000; padding:4px;">${totalLate.toFixed(2)}</td>
            </tr>
            <tr>
                <td style="border:1px solid #000; padding:4px;">Total Undertime</td>
                <td style="border:1px solid #000; padding:4px;">${totalUndertime.toFixed(2)}</td>
            </tr>
            <tr>
                <td style="border:1px solid #000; padding:4px;">Total Hours Worked</td>
                <td style="border:1px solid #000; padding:4px;">${totalHoursWorked.toFixed(2)}</td>
            </tr>
            <tr>
                <td style="border:1px solid #000; padding:4px;">Total Billable Hours</td>
                <td style="border:1px solid #000; padding:4px;">${totalBillable.toFixed(2)}</td>
            </tr>
           
          
    </table>
</div>

                    <div class="signature">
                        <div class="signature-line">${employeeName}</div>
                    </div>

                    ${disclaimerHtml}

                    <script>
                        document.querySelectorAll("tbody tr").forEach(row => {
                            const cells = row.querySelectorAll("td");
                            const overtimeIdx = 7;
                            const breakLateIdx = 8;
                            const lateIdx = 9;
                            const undertimeIdx = 10;
                            cells.forEach((cell, idx) => {
                                const text = cell.textContent?.trim().toLowerCase();
                                if (idx !== overtimeIdx && (!text || text === "no data" || text === "no filed" || text === "n/a")) {
                                    cell.style.color = "red";
                                    cell.style.fontWeight = "bold";
                                    return;
                                }
                                if (idx === breakLateIdx || idx === lateIdx || idx === undertimeIdx) {
                                    const value = parseFloat(text);
                                    if (!isNaN(value) && value > 0) {
                                        cell.style.color = "red";
                                        cell.style.fontWeight = "bold";
                                    }
                                }
                            });
                        });
                    </script>
                </body>
                </html>
            `);

            printWindow.document.close();
            printWindow.onload = () => printWindow.print();
        }
    };

    return (
        <Button
            onClick={handlePrint}
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
        >
            <Printer className="mr-2 h-4 w-4" />
            Print
        </Button>
    );
};
