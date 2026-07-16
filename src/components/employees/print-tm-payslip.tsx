import React from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface TmDownline {
    id: string;
    name: string;
    agency: string;
    position: string;
    bonus_amount: string;
    is_active: boolean;
    layer: 1 | 2;
    mentor_name?: string;
}

interface PrintTMPayslipProps {
    employeeName: string;
    idNumber?: string | null;
    agencyName?: string | null;
    branchName?: string | null;
    monthLabel: string;
    totalBonus: number;
    isEligible: boolean;
    l1s: TmDownline[];
    l2s: TmDownline[];
}

function ph(n: number) {
    return "PHP " + n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const PrintTMPayslip: React.FC<PrintTMPayslipProps> = ({
    employeeName,
    idNumber,
    agencyName,
    branchName,
    monthLabel,
    totalBonus,
    isEligible,
    l1s,
    l2s,
}) => {
    const handlePrint = () => {
        const activeL1 = l1s.filter((d) => d.is_active);
        const activeL2 = l2s.filter((d) => d.is_active);
        const l1Total  = activeL1.length * 250;
        const l2Total  = activeL2.length * 100;

        const earningsRows = `
            <tr>
                <td>Train &amp; Maintain Bonus — 1st Layer</td>
                <td class="center muted">${activeL1.length} downline${activeL1.length !== 1 ? "s" : ""} × ₱250.00</td>
                <td class="amount">${ph(l1Total)}</td>
            </tr>
            <tr>
                <td>Train &amp; Maintain Bonus — 2nd Layer</td>
                <td class="center muted">${activeL2.length} downline${activeL2.length !== 1 ? "s" : ""} × ₱100.00</td>
                <td class="amount">${ph(l2Total)}</td>
            </tr>`;

        const downlineRows = l1s.map((d) => {
            const children = l2s.filter((l2) => l2.mentor_name === d.name);
            const childHtml = children.map((l2) => `
                <tr>
                    <td class="indent">↳ ${l2.name}${!l2.is_active ? " (excluded)" : ""}</td>
                    <td class="c">L2</td>
                    <td>${l2.position}</td>
                    <td>${l2.agency}</td>
                    <td class="r ${l2.is_active ? "" : "strike"}">${ph(parseFloat(l2.bonus_amount))}</td>
                </tr>`).join("");
            return `
                <tr>
                    <td><strong>${d.name}</strong>${!d.is_active ? " (excluded)" : ""}</td>
                    <td class="c">L1</td>
                    <td>${d.position}</td>
                    <td>${d.agency}</td>
                    <td class="r ${d.is_active ? "" : "strike"}">${ph(parseFloat(d.bonus_amount))}</td>
                </tr>${childHtml}`;
        }).join("");

        const ineligibleBanner = !isEligible ? `
            <div class="ineligible-banner">
                ⚠&nbsp; Disqualified this period — an active Incident Report was filed during this period.
                No bonus is earned.
            </div>` : "";

        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Train &amp; Maintain Payslip</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: Arial, sans-serif; font-size: 11px; color: #222; background: #fff; padding: 24px 28px; }

.company  { font-size: 13px; font-weight: bold; }
.slip-title { font-size: 11px; color: #555; margin-top: 2px; }
.divider  { border: none; border-top: 1px solid #999; margin: 10px 0; }

.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3px 24px; margin-bottom: 10px; font-size: 10.5px; }
.info-grid .lbl { color: #666; }
.info-grid .val { font-weight: bold; }

.section-title { font-size: 9px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; color: #555; margin: 12px 0 4px; }

table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
th { text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 0.07em; color: #666; border-bottom: 1px solid #bbb; padding: 4px 6px; }
th.r { text-align: right; }
td { padding: 4px 6px; border-bottom: 1px solid #eee; vertical-align: middle; }
td.r  { text-align: right; }
td.c  { text-align: center; }
td.strike { text-decoration: line-through; color: #aaa; }
td.indent { padding-left: 20px; color: #555; }
tfoot td { font-weight: bold; border-top: 1px solid #999; border-bottom: none; padding-top: 6px; background: #f9f9f9; }

.total-row { display: flex; justify-content: space-between; align-items: baseline; margin-top: 10px; padding-top: 8px; border-top: 2px solid #222; }
.total-lbl { font-size: 11px; font-weight: bold; }
.total-val { font-size: 16px; font-weight: bold; }

.ineligible { font-size: 10px; color: #c00; border: 1px solid #c00; padding: 5px 8px; margin-bottom: 10px; }

.sig-row { display: flex; gap: 40px; margin-top: 30px; }
.sig { flex: 1; text-align: center; }
.sig-line { border-top: 1px solid #555; margin-top: 26px; margin-bottom: 3px; }
.sig-lbl { font-size: 9px; color: #666; }

.footer { margin-top: 18px; font-size: 8.5px; color: #aaa; text-align: center; font-style: italic; }

@page { size: A4 portrait; margin: 12mm; }
</style>
</head>
<body>

    <div class="company">Wildflour Hospitality Group</div>
    <div class="slip-title">Train &amp; Maintain Bonus Payslip</div>
    <hr class="divider">

    <div class="info-grid">
        <span class="lbl">Employee Name</span><span class="val">${employeeName}</span>
        <span class="lbl">Employee No.</span><span class="val">${idNumber || "—"}</span>
        <span class="lbl">Agency</span><span class="val">${agencyName || "—"}</span>
        <span class="lbl">Home Branch</span><span class="val">${branchName || "—"}</span>
        <span class="lbl">Period</span><span class="val">${monthLabel}</span>
        <span class="lbl">Status</span><span class="val">${isEligible ? "Eligible" : "Disqualified"}</span>
    </div>

    ${!isEligible ? `<div class="ineligible">⚠ Disqualified — an active Incident Report was filed this period. No bonus is earned.</div>` : ""}

    <div class="section-title">Earnings</div>
    <table>
        <thead><tr><th>Description</th><th>Computation</th><th class="r">Amount</th></tr></thead>
        <tbody>
            <tr>
                <td>1st Layer Bonus</td>
                <td>${activeL1.length} downline${activeL1.length !== 1 ? "s" : ""} × PHP 250.00</td>
                <td class="r">${ph(l1Total)}</td>
            </tr>
            <tr>
                <td>2nd Layer Bonus</td>
                <td>${activeL2.length} downline${activeL2.length !== 1 ? "s" : ""} × PHP 100.00</td>
                <td class="r">${ph(l2Total)}</td>
            </tr>
        </tbody>
    </table>

    <div class="total-row">
        <span class="total-lbl">Total Bonus</span>
        <span class="total-val">${ph(totalBonus)}</span>
    </div>

    <div class="section-title">Downline Breakdown</div>
    <table>
        <thead>
            <tr><th>Name</th><th class="c">Layer</th><th>Position</th><th>Agency</th><th class="r">Bonus</th></tr>
        </thead>
        <tbody>
            ${downlineRows || `<tr><td colspan="5" style="text-align:center;color:#aaa;padding:10px 0;">No downline data for this period.</td></tr>`}
        </tbody>
        <tfoot>
            <tr>
                <td colspan="4">${activeL1.length} L1 + ${activeL2.length} L2 active downlines</td>
                <td class="r">${ph(totalBonus)}</td>
            </tr>
        </tfoot>
    </table>

    <div class="sig-row">
        <div class="sig"><div class="sig-line"></div><div class="sig-lbl">Employee</div></div>
        <div class="sig"><div class="sig-line"></div><div class="sig-lbl">Prepared By</div></div>
        <div class="sig"><div class="sig-line"></div><div class="sig-lbl">Noted By</div></div>
    </div>

    <div class="footer">This is a system-generated document. Not official unless signed.</div>

<script>window.onload = function() { window.print(); };</script>
</body>
</html>`);

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
