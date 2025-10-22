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

        const totalLate = sumColumnByIndex(9);
        const totalUndertime = sumColumnByIndex(10);
        const totalOvertime = sumColumnByIndex(8);
        const totalBillable = sumColumnByIndex(12);

        const printContent = table.outerHTML;
        const printWindow = window.open("", "_blank");

        if (printWindow) {
            printWindow.document.write(`
        <html>
            <head>
                <title>Time Records - ${employeeName}</title>
                <style>
                    body {
                        font-family: Helvetica, Arial, sans-serif;
                        padding: 30px;
                        font-size: 10px;
                        color: #000;
                    }
                    h2, h3, h4 {
                        text-align: left;
                        margin: 0;
                    }
                    h2 {
                        font-size: 14px;
                        font-weight: bold;
                        margin-bottom: 4px;
                    }
                    h3 {
                        font-size: 12px;
                        font-weight: normal;
                        color: #333;
                        margin: 2px 0 6px 0;
                    }
                    h4 {
                        font-size: 10px;
                        color: gray;
                        margin-bottom: 10px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 10px;
                    }
                    th, td {
                        border: 1px solid #ccc;
                        padding: 4px 6px;
                        text-align: center;
                        font-size: 10px;
                    }
                    th {
                        background-color: #f0f0f0;
                        font-weight: bold;
                    }
                    td.late {
                        color: red;
                    }
                    .totals {
                        margin-top: 15px;
                        text-align: left;
                        font-size: 11px;
                        font-weight: bold;
                    }
                    .totals div {
                        margin-bottom: 2px;
                    }
                    .signature {
                        margin-top: 40px;
                        display: flex;
                        justify-content: center;
                        text-align: center;
                        font-size: 11px;
                    }
                    .signature-line {
                        margin-top: 40px;
                        width: 220px;
                        border-top: 1px solid #000;
                        text-align: center;
                        padding-top: 5px;
                        font-size: 10px;
                    }
                    @media print {
                        button { display: none; }
                    }
                </style>
            </head>
            <body>
                <div style="text-align: left; margin-bottom: 10px;">
                    <h2>${employeeName}</h2>
                    <h3>${agencyName || "No Agency"}</h3>
                    <h4>Cut-off Period: ${
                        queryFrom && queryTo
                            ? `${moment(queryFrom).format("MMM D, YYYY")} - ${moment(
                                  queryTo,
                              ).format("MMM D, YYYY")}`
                            : "No Cut-off Dates"
                    }</h4>
                </div>

                ${printContent}

                <div class="totals">
                    <div>Total Late (Hours): ${totalLate.toFixed(2)}</div>
                    <div>Total Undertime (Hours): ${totalUndertime.toFixed(2)}</div>
                    <div>Total Overtime (Hours): ${totalOvertime.toFixed(2)}</div>
                    <div>Total Hours Worked: ${totalBillable.toFixed(2)}</div>
                </div>

                <div class="signature">
                    <div class="signature-line">${employeeName}</div>
                </div>
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
