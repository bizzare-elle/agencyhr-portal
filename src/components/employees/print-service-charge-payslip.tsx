import React from "react";
import { format, getDay, addMonths } from "date-fns";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { formatToPeso } from "@/helpers/formatToPeso";

interface PrintSCPayslipProps {
    tableId: string;
    employeeName: string;
    isHrEmployee: boolean;
    idNumber: string | null;
    agencyName?: string | null;
    branchName?: string | null;
    queryFrom?: string;
    queryTo?: string;
    records: any[];
}

function parseComp(comp: string | null): { pool: number | null; totalHrs: number | null } {
    if (!comp) return { pool: null, totalHrs: null };
    const match = comp.match(/[₱]([\d,]+\.?\d*)\s*÷\s*([\d,]+\.?\d*)\s*hrs/);
    if (!match) return { pool: null, totalHrs: null };
    return {
        pool: parseFloat(match[1].replace(/,/g, "")),
        totalHrs: parseFloat(match[2].replace(/,/g, "")),
    };
}

function isWeekend(dateStr: string) {
    const day = getDay(new Date(dateStr + "T00:00:00"));
    return day === 0 || day === 6;
}

function peso(n: number) {
    return "P " + n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmt2(n: number) {
    return n.toFixed(2);
}

export const PrintSCPayslip: React.FC<PrintSCPayslipProps> = ({
    employeeName,
    isHrEmployee,
    idNumber,
    agencyName,
    branchName,
    queryFrom,
    queryTo,
    records,
}) => {
    const handlePrint = () => {
        const totalEmpHrs = records.reduce((s, r) => s + parseFloat(r.total_billed_hours || "0"), 0);
        const totalNetSC  = records.reduce((s, r) => s + parseFloat(r.sc_amount_net  || "0"), 0);

        const cutoffLabel = queryFrom && queryTo
            ? `${queryFrom} to ${queryTo}`
            : (queryFrom || queryTo || "—");

        const payoutDateLabel = queryTo
            ? format(addMonths(new Date(queryTo + "T00:00:00"), 2), "MMMM dd, yyyy")
            : "—";

        const rowsHtml = records.map((r) => {
            const { pool, totalHrs } = parseComp(r.computation ?? null);
            const weekend = isWeekend(r.date);
            const dateObj = new Date(r.date + "T00:00:00");
            const dayLabel = format(dateObj, "EEE, MMM dd");
            const empHrs  = parseFloat(r.total_billed_hours || "0");
            const payout  = formatToPeso(r.sc_amount_net || "0");
            const allocation = r.branch_name && r.branch_name !== "N/A"
                ? r.branch_name
                : (agencyName ?? "Corporate");

            return `
                <tr class="${weekend ? "weekend-row" : ""}">
                    <td class="date-cell">
                        ${dayLabel}
                    </td>
                    <td class="center bold">${allocation}</td>
                    <td class="center pool">${pool !== null ? formatToPeso(pool) : "—"}</td>
                    <td class="center">${totalHrs !== null ? fmt2(totalHrs) : "—"}</td>
                    <td class="center">${fmt2(empHrs)}</td>
                    <td class="computation">${r.computation ?? "—"}</td>
                    <td class="right payout">${payout}</td>
                </tr>`;
        }).join("");

        const disclaimerHtml = isHrEmployee
            ? `<div class="disclaimer">Disclaimer: This is not an official document.</div>`
            : "";

        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Service Charge Payslip</title>
                <style>
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body {
                        font-family: Arial, sans-serif;
                        font-size: 11px;
                        color: #222;
                        padding: 14px 18px;
                        background: #fff;
                    }

                    /* ── Header ── */
                    .header-top {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 4px;
                    }
                    .emp-name {
                        font-size: 18px;
                        font-weight: bold;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }
                    .badge {
                        font-size: 10px;
                        font-weight: bold;
                        background: #7c3aed;
                        color: #fff;
                        border-radius: 4px;
                        padding: 2px 8px;
                        letter-spacing: 0.04em;
                    }
                    .total-sc-box {
                        text-align: right;
                    }
                    .total-sc-label {
                        font-size: 9px;
                        font-weight: bold;
                        letter-spacing: 0.12em;
                        color: #555;
                        text-transform: uppercase;
                    }
                    .total-sc-value {
                        font-size: 22px;
                        font-weight: bold;
                        color: #16a34a;
                    }
                    .emp-meta {
                        font-size: 10.5px;
                        color: #444;
                        margin-bottom: 10px;
                    }
                    .header-divider {
                        border: none;
                        border-top: 1px solid #bbb;
                        margin-bottom: 10px;
                    }

                    /* ── Table ── */
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 10.5px;
                    }
                    thead tr {
                        background: #1e293b;
                        color: #fff;
                    }
                    thead th {
                        padding: 7px 8px;
                        text-align: center;
                        font-size: 10px;
                        font-weight: bold;
                        letter-spacing: 0.06em;
                        text-transform: uppercase;
                        border: 1px solid #334155;
                    }
                    tbody tr td {
                        padding: 5px 8px;
                        border: 1px solid #e2e8f0;
                        vertical-align: middle;
                    }
                    tbody tr:nth-child(even) td { background: #f8fafc; }
                    .weekend-row td { background: #fefce8 !important; }
                    .weekend-label {
                        color: #d97706;
                        font-size: 9px;
                        font-weight: bold;
                    }
                    .date-cell { white-space: nowrap; padding-left: 10px; }
                    .center { text-align: center; }
                    .right  { text-align: right; padding-right: 12px; }
                    .bold   { font-weight: bold; }
                    .pool { color: #7c3aed; font-weight: 500; }
                    .computation { color: #7c3aed; font-size: 9.5px; text-align: center; }
                    .payout { font-weight: 600; }

                    /* ── Total row ── */
                    tfoot tr td {
                        padding: 6px 8px;
                        border: 1px solid #e2e8f0;
                        font-weight: bold;
                        background: #f0fdf4;
                    }
                    .total-label { font-size: 11px; color: #166534; }
                    .total-hrs   { color: #16a34a; text-align: center; }
                    .total-pay   { color: #16a34a; text-align: right; padding-right: 12px; font-size: 12px; }

                    .disclaimer {
                        margin-top: 18px;
                        text-align: center;
                        font-size: 9px;
                        color: red;
                    }

                    @page  { size: A4 landscape; margin: 8mm; }
                    @media print {
                        body { font-size: 9px; padding: 0; }
                        .total-sc-value { font-size: 18px; }
                    }
                </style>
            </head>
            <body>
                <div class="header-top">
                    <div>
                        <div class="emp-name">
                            ${employeeName}
                            ${agencyName ? `<span class="badge">${agencyName.toUpperCase()}</span>` : ""}
                        </div>
                        <div class="emp-meta">
                            Emp No: ${idNumber || "—"} &nbsp;&nbsp;
                            Home Branch: ${branchName || "—"} &nbsp;&nbsp;
                            Cut-off Period: ${cutoffLabel} &nbsp;&nbsp;
                            Payout Date: ${payoutDateLabel}
                        </div>
                    </div>
                    <div class="total-sc-box">
                        <div class="total-sc-label">Total Net SC</div>
                        <div class="total-sc-value">P ${totalNetSC.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                </div>
                <hr class="header-divider">

                <table>
                    <thead>
                        <tr>
                            <th style="text-align:left; padding-left:10px;">DATE</th>
                            <th>BRANCH / ALLOCATION</th>
                            <th>DAILY SC POOL</th>
                            <th>TOTAL DAY HRS</th>
                            <th>EMPLOYEE HRS</th>
                            <th>COMPUTATION</th>
                            <th style="text-align:right; padding-right:12px;">SC PAYOUT</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="4" class="total-label">Total (${records.length} day${records.length !== 1 ? "s" : ""})</td>
                            <td class="total-hrs">${fmt2(totalEmpHrs)}</td>
                            <td></td>
                            <td class="total-pay">P ${totalNetSC.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                    </tfoot>
                </table>

                ${disclaimerHtml}

                <script>
                    window.onload = function() { window.print(); };
                </script>
            </body>
            </html>
        `);

        printWindow.document.close();
    };

    return (
        <Button
            onClick={handlePrint}
            className="w-full bg-yellow-500 text-white hover:bg-yellow-600 sm:w-auto"
        >
            <Printer className="mr-2 h-4 w-4" />
            Print
        </Button>
    );
};
