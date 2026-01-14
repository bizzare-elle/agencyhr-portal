import React from "react";
import moment from "moment";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface PrintTimeRecordsProps {
    tableId: string;
    employeeName: string;
    agencyName?: string | null;
    queryFrom?: string;
    queryTo?: string;
}

export const PrintTimeRecords: React.FC<PrintTimeRecordsProps> = ({
    tableId,
    employeeName,
    agencyName,
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
        const totalBillable = sumColumnByIndex(11);

        const printContent = table.outerHTML;
        const printWindow = window.open("", "_blank");

        if (printWindow) {
            printWindow.document.write(`
            <html>
                <head>
                    <title>Employee Time Records</title>
                    <style>
                        body {
                            font-family: Helvetica, Arial, sans-serif;
                            padding: 32px;
                            font-size: 10px;
                            color: #000;
                        }

                        .header {
                            border-bottom: 1px solid #000;
                            padding-bottom: 6px;
                            margin-bottom: 12px;
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
                            border-left: 1px solid #000;
                            border-right: 1px solid #000;
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
                        <h3>${employeeName}</h3>
                        <h3>${agencyName || "No Agency"}</h3>
                        <h4>
                            Cut-off Period:
                            ${
                                queryFrom && queryTo
                                    ? `${moment(queryFrom).format("MMM D, YYYY")} - ${moment(
                                          queryTo,
                                      ).format("MMM D, YYYY")}`
                                    : "No Cut-off Dates"
                            }
                        </h4>
                    </div>

                    ${printContent}

                    <div class="totals">
                        <div>Total Overtime (Hours): ${totalOvertime.toFixed(2)}</div>
                        <div>Total Break Late (Hours): ${totalBreakLate.toFixed(2)}</div>
                        <div>Total Late (Hours): ${totalLate.toFixed(2)}</div>
                        <div>Total Undertime (Hours): ${totalUndertime.toFixed(2)}</div>
                        <div>Total Hours Worked: ${totalBillable.toFixed(2)}</div>
                    </div>

                    <div class="signature">
                        <div class="signature-line">${employeeName}</div>
                    </div>

                    <div class="footer">
                        <strong>Disclaimer:</strong> This is not an official document.
                    </div>

                    <!-- No Data / No Filed styling -->
                   <script>
                        document.querySelectorAll("tbody tr").forEach(row => {
                            const cells = row.querySelectorAll("td");

                            // Column indexes (1-based visually, 0-based in JS)
                            const overtimeIdx = 7;      // OT
                            const breakLateIdx = 8;     // Break Late
                            const lateIdx = 9;         // Late
                            const undertimeIdx = 10;    // Undertime

                            cells.forEach((cell, idx) => {
                                const text = cell.textContent?.trim().toLowerCase();

                                // Always red for No Data / No Filed / N/A / empty
                                if (
                                    !text ||
                                    text === "no data" ||
                                    text === "no filed" ||
                                    text === "n/a"
                                ) {
                                    cell.style.color = "red";
                                    cell.style.fontWeight = "bold";
                                    return;
                                }

                                // Red only if numeric value > 0 for specific columns
                                if (
                                    idx === overtimeIdx ||
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
