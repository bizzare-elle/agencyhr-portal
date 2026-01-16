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

export const PrintTimeRecords: React.FC<PrintTimeRecordsProps> = ({
    tableId,
    employeeName,
    agencyName,
    idNumber,
    branchName,
    isHrEmployee,
    queryFrom,
    queryTo,
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

        const printContent = table.outerHTML;
        const printWindow = window.open("", "_blank");

        const disclaimerHtml = isHrEmployee
            ? `
                <div class="footer">
                    <strong>Disclaimer:</strong> This is not an official document.
                </div>
            `
            : "";

        if (printWindow) {
            printWindow.document.write(`
            <html>
                <head>
                    <title>Employee Time Records</title>
                    <style>
                        body {
                            font-family: Helvetica, Arial, sans-serif;
                            padding: 10px;
                            font-size: 10px;
                            color: #000;
                        }
                        .header {
                            padding-bottom: 6px;
                            margin-bottom: 5px;
                        }
                        .header-divider {
                            border-bottom: 1px solid #000;
                            margin: 6px 0 10px 0;
                        }
                        .header h2 {
                            font-size: 14px;
                            font-weight: bold;
                            margin: 0;
                        }
                        .header h3 {
                            font-size: 11px;
                            margin: 2px 0;
                            font-weight: normal;
                        }
                        .header h4 {
                            font-size: 9px;
                            color: gray;
                            margin: 2px 0 0 0;
                        }

                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-top: 10px;
                           
                        }

                        th {
                            background-color: #d9e1f2;
                            border-top: 1px solid #000;
                            border-bottom: 1px solid #000;
                            border-left: 1px solid #000;
                            padding: 4px 6px;
                            font-size: 9px;
                            font-weight: bold;
                            text-align: center;
                        }

                        th:last-child {
                            border-right: 1px solid #000;
                        }

                        td {
                            padding: 3px 6px;
                            font-size: 9px;
                            text-align: center;
                            border-bottom: 0.5px solid #ccc;
                            border-left: 1px solid #000;
                        }

                        td:last-child {
                            border-right: 1px solid #000;
                        }

                        .totals {
                            margin-top: 12px;
                            padding-top: 6px;
                            border-top: 1px solid #000;
                            font-size: 10px;
                        }

                        .signature {
                            margin-top: 40px;
                            text-align: center;
                        }
                        .signature-line {
                            margin: 0 auto;
                            width: 220px;
                            border-top: 1px solid #000;
                            padding-top: 4px;
                            font-size: 9px;
                        }

                        .footer {
                            margin-top: 20px;
                            text-align: center;
                            font-size: 9px;
                            color: red;
                        }
                    </style>
                </head>

                <body>
                    <div class="header">
                        <h2>Employee Time Records</h2>
                        <h4>Generated: ${format(new Date(), "PPpp")} </h4>

                        <div class="header-divider"></div>
                    
                        <h3>Name: ${employeeName}</h3>
                        <h3>ID Number: ${idNumber || "N/A"}</h3>
                        <h3>Branch: ${branchName}</h3>
                        <h3>Agency: ${agencyName || "No Agency"}</h3>

                    </div>

                    ${printContent}

                    <div class="totals">
                        <div>Total Overtime (Hours): ${totalOvertime.toFixed(2)}</div>
                        <div>Total Break Late (Hours): ${totalBreakLate.toFixed(2)}</div>
                        <div>Total Late (Hours): ${totalLate.toFixed(2)}</div>
                        <div>Total Undertime (Hours): ${totalUndertime.toFixed(2)}</div>
                        <div>Total Hours Worked: ${totalHoursWorked.toFixed(2)}</div>
                        <div>Total Billable Hours: ${totalBillable.toFixed(2)}</div>
                    </div>

                    <div class="signature">
                        <div class="signature-line">${employeeName}</div>
                    </div>

                   ${disclaimerHtml}

                  <script>
                    document.querySelectorAll("tbody tr").forEach(row => {
                        const cells = row.querySelectorAll("td");

                        const overtimeIdx = 7;      // OT
                        const breakLateIdx = 8;     // Break Late
                        const lateIdx = 9;          // Late
                        const undertimeIdx = 10;    // Undertime

                        cells.forEach((cell, idx) => {
                            const text = cell.textContent?.trim().toLowerCase();

                            // ---- 1. Missing data styling ----
                            // Apply ONLY to non-overtime columns
                            if (
                                idx !== overtimeIdx &&
                                (
                                    !text ||
                                    text === "no data" ||
                                    text === "no filed" ||
                                    text === "n/a"
                                )
                            ) {
                                cell.style.color = "red";
                                cell.style.fontWeight = "bold";
                                return;
                            }

                            // ---- 2. Penalty columns only ----
                            if (
                                idx === breakLateIdx ||
                                idx === lateIdx ||
                                idx === undertimeIdx
                            ) {
                                const value = parseFloat(text);
                                if (!isNaN(value) && value > 0) {
                                    cell.style.color = "red";
                                    cell.style.fontWeight = "bold";
                                }
                            }

                            // ---- 3. Overtime is ALWAYS neutral ----
                            // No styling applied even if > 0
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
