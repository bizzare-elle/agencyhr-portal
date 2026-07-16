import React from "react";
import { format, getDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { formatToPeso } from "@/helpers/formatToPeso";

interface ScOverpayment {
    id: string;
    reason: string;
    source_cut_off_date: string | null;
    status: string;
    amount_owed: string;
    amount_recovered: string;
    remaining: number;
}

interface PrintSCPayslipProps {
    tableId: string;
    employeeName: string;
    isHrEmployee: boolean;
    idNumber: string | null;
    agencyName?: string | null;
    branchName?: string | null;
    allocationName?: string | null;
    scPercentage?: string | null;
    queryFrom?: string;
    queryTo?: string;
    records: any[];
    overpayments?: ScOverpayment[];
    overpaymentRecovery?: number;
    finalPayout?: number | null;
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
    allocationName,
    scPercentage,
    queryFrom,
    queryTo,
    records,
    overpayments = [],
    overpaymentRecovery = 0,
    finalPayout = null,
}) => {
    const handlePrint = () => {
        const totalEmpHrs = records.reduce((s, r) => s + parseFloat(r.total_billed_hours || "0"), 0);
        const totalNetSC  = records.reduce((s, r) => s + parseFloat(r.sc_amount_net  || "0"), 0);

        const cutoffLabel = queryFrom && queryTo
            ? `${queryFrom} to ${queryTo}`
            : (queryFrom || queryTo || "—");

        // Payout date = 15th of the month 2 months after the period's month
        const payoutDateLabel = queryFrom
            ? (() => {
                const d = new Date(queryFrom + "T00:00:00");
                return format(new Date(d.getFullYear(), d.getMonth() + 2, 15), "MMMM dd, yyyy");
            })()
            : "—";

        const sortedRecords = [...records].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        const rowsHtml = sortedRecords.map((r) => {
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
                    <td class="date-cell">${dayLabel}</td>
                    <td class="center bold">${allocation}</td>
                    <td class="center pool">${pool !== null ? formatToPeso(pool) : "—"}</td>
                    <td class="center">${totalHrs !== null ? fmt2(totalHrs) : "—"}</td>
                    <td class="center">${fmt2(empHrs)}</td>
                    <td class="computation">${r.computation ?? "—"}</td>
                    <td class="right payout">${payout}</td>
                </tr>`;
        }).join("");

        const hasOverpayment = overpayments.length > 0 && overpaymentRecovery > 0;
        const effectiveFinal = finalPayout ?? totalNetSC;


        const overpaymentRowsHtml = overpayments.map((adj) => {
            const sourceCutoff = adj.source_cut_off_date
                ? format(new Date(adj.source_cut_off_date + "T00:00:00"), "MMM yyyy")
                : "—";
            const statusColor = adj.status === "settled"
                ? "color:#16a34a;"
                : adj.status === "partial"
                ? "color:#d97706;"
                : "color:#dc2626;";
            return `
                <tr>
                    <td style="padding:5px 8px;border:1px solid #e2e8f0;font-size:9.5px;">${adj.reason}</td>
                    <td style="padding:5px 8px;border:1px solid #e2e8f0;text-align:center;">${sourceCutoff}</td>
                    <td style="padding:5px 8px;border:1px solid #e2e8f0;text-align:center;font-weight:bold;${statusColor}">${adj.status.toUpperCase()}</td>
                    <td style="padding:5px 8px;border:1px solid #e2e8f0;text-align:right;">${peso(parseFloat(adj.amount_owed))}</td>
                    <td style="padding:5px 8px;border:1px solid #e2e8f0;text-align:right;">${peso(parseFloat(adj.amount_recovered))}</td>
                    <td style="padding:5px 8px;border:1px solid #e2e8f0;text-align:right;color:#dc2626;font-weight:600;">${peso(adj.remaining)}</td>
                </tr>`;
        }).join("");

        const overpaymentTotalOwed      = overpayments.reduce((s, a) => s + parseFloat(a.amount_owed), 0);
        const overpaymentTotalRecovered = overpayments.reduce((s, a) => s + parseFloat(a.amount_recovered), 0);
        const overpaymentTotalRemaining = overpayments.reduce((s, a) => s + a.remaining, 0);

        const overpaymentSectionHtml = hasOverpayment ? `
            <div style="margin-top:18px;">
                <div style="background:#dc2626;color:#000;padding:7px 12px;font-size:10px;font-weight:bold;letter-spacing:0.08em;text-transform:uppercase;border-radius:4px 4px 0 0;">
                    Overpayment
                </div>
                <table style="width:100%;border-collapse:collapse;font-size:10.5px;margin-bottom:0;">
                    <thead>
                        <tr style="background:#000;color:#fff;">
                            <th style="padding:6px 8px;border:1px solid #333;text-align:left;font-size:9.5px;font-weight:bold;text-transform:uppercase;letter-spacing:0.05em;">Reason</th>
                            <th style="padding:6px 8px;border:1px solid #333;text-align:center;font-size:9.5px;font-weight:bold;text-transform:uppercase;letter-spacing:0.05em;">Source Cut-off</th>
                            <th style="padding:6px 8px;border:1px solid #333;text-align:center;font-size:9.5px;font-weight:bold;text-transform:uppercase;letter-spacing:0.05em;">Status</th>
                            <th style="padding:6px 8px;border:1px solid #333;text-align:right;font-size:9.5px;font-weight:bold;text-transform:uppercase;letter-spacing:0.05em;">Amount Owed</th>
                            <th style="padding:6px 8px;border:1px solid #333;text-align:right;font-size:9.5px;font-weight:bold;text-transform:uppercase;letter-spacing:0.05em;">Recovered to Date</th>
                            <th style="padding:6px 8px;border:1px solid #333;text-align:right;font-size:9.5px;font-weight:bold;text-transform:uppercase;letter-spacing:0.05em;">Remaining</th>
                        </tr>
                    </thead>
                    <tbody>${overpaymentRowsHtml}</tbody>
                    <tfoot>
                        <tr style="background:#fef2f2;font-weight:bold;">
                            <td colspan="3" style="padding:6px 8px;border:1px solid #fca5a5;font-size:10px;text-transform:uppercase;">Total</td>
                            <td style="padding:6px 8px;border:1px solid #fca5a5;text-align:right;">${peso(overpaymentTotalOwed)}</td>
                            <td style="padding:6px 8px;border:1px solid #fca5a5;text-align:right;">${peso(overpaymentTotalRecovered)}</td>
                            <td style="padding:6px 8px;border:1px solid #fca5a5;text-align:right;color:#dc2626;">${peso(overpaymentTotalRemaining)}</td>
                        </tr>
                    </tfoot>
                </table>
                <div style="margin-top:8px;text-align:right;font-size:11px;">
                    <div style="display:flex;justify-content:flex-end;gap:40px;margin-bottom:3px;">
                        <span style="color:#555;">Net SC (this cut-off)</span>
                        <span style="font-weight:600;min-width:100px;text-align:right;">${peso(totalNetSC)}</span>
                    </div>
                    <div style="display:flex;justify-content:flex-end;gap:40px;margin-bottom:3px;">
                        <span style="color:#dc2626;">Less: SC Recovery this cut-off</span>
                        <span style="font-weight:600;color:#dc2626;min-width:100px;text-align:right;">− ${peso(overpaymentRecovery)}</span>
                    </div>
                    <div style="display:flex;justify-content:flex-end;gap:40px;border-top:1px solid #bbb;padding-top:5px;margin-top:5px;">
                        <span style="font-weight:bold;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;">Final Payout</span>
                        <span style="font-weight:bold;font-size:14px;color:#16a34a;min-width:100px;text-align:right;">${peso(effectiveFinal)}</span>
                    </div>
                </div>
            </div>` : "";


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
                    .total-sc-box { text-align: right; }
                    .total-sc-label {
                        font-size: 9px;
                        font-weight: bold;
                        letter-spacing: 0.12em;
                        color: #555;
                        text-transform: uppercase;
                    }
                    .total-sc-value { font-size: 22px; font-weight: bold; color: #16a34a; }
                    .emp-meta { font-size: 10.5px; color: #444; margin-bottom: 10px; }
                    .header-divider { border: none; border-top: 1px solid #bbb; margin-bottom: 10px; }

                    table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
                    thead tr { background: #1e293b; color: #fff; }
                    thead th {
                        padding: 7px 8px;
                        text-align: center;
                        font-size: 10px;
                        font-weight: bold;
                        letter-spacing: 0.06em;
                        text-transform: uppercase;
                        border: 1px solid #334155;
                    }
                    tbody tr td { padding: 5px 8px; border: 1px solid #e2e8f0; vertical-align: middle; }
                    tbody tr:nth-child(even) td { background: #f8fafc; }
                    .weekend-row td { background: #fefce8 !important; }
                    .date-cell { white-space: nowrap; padding-left: 10px; }
                    .center { text-align: center; }
                    .right  { text-align: right; padding-right: 12px; }
                    .bold   { font-weight: bold; }
                    .pool { color: #7c3aed; font-weight: 500; }
                    .computation { color: #7c3aed; font-size: 9.5px; text-align: center; }
                    .payout { font-weight: 600; }

                    tfoot tr td {
                        padding: 6px 8px;
                        border: 1px solid #e2e8f0;
                        font-weight: bold;
                        background: #f0fdf4;
                    }
                    .total-label { font-size: 11px; color: #166534; }
                    .total-hrs   { color: #16a34a; text-align: center; }
                    .total-pay   { color: #16a34a; text-align: right; padding-right: 12px; font-size: 12px; }

                    .disclaimer { margin-top: 18px; text-align: center; font-size: 9px; color: red; }

                    @page  { size: A4 portrait; margin: 8mm; }
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
                            ${allocationName ? `Allocation: ${allocationName} &nbsp;&nbsp;` : ""}
                            ${scPercentage ? `SC Rate: ${scPercentage}% &nbsp;&nbsp;` : ""}
                            Cut-off Period: ${cutoffLabel} &nbsp;&nbsp;
                            Payout Date: ${payoutDateLabel}
                        </div>
                    </div>
                    <div class="total-sc-box">
                        <div class="total-sc-label">Final Payout</div>
                        <div class="total-sc-value">P ${effectiveFinal.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
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
                    <tbody>${rowsHtml}</tbody>
                    <tfoot>
                        <tr>
                            <td colspan="4" class="total-label">Total (${records.length} day${records.length !== 1 ? "s" : ""})</td>
                            <td class="total-hrs">${fmt2(totalEmpHrs)}</td>
                            <td></td>
                            <td class="total-pay">P ${totalNetSC.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                    </tfoot>
                </table>

                ${overpaymentSectionHtml}
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
