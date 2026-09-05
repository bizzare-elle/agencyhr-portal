import React from "react";
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

// ── Category mapping (mirrors batch-report-template & PHP reference) ──────────
const KEY_CATEGORY_MAP: Record<string, string> = {
    "Regular Day": "Regular Day",
    "Regular Day ND": "Regular Day",
    "Regular Day OT": "Regular Day",
    "Regular Day OT + ND": "Regular Day",
    Restday: "Rest Day",
    "Restday ND": "Rest Day",
    "Restday OT": "Rest Day",
    "Restday OT + ND": "Rest Day",
    "Special Day": "Special Holiday",
    "Special Day ND": "Special Holiday",
    "Special Day OT": "Special Holiday",
    "Special Day OT + ND": "Special Holiday",
    "Special Day Restday": "Special Holiday on Rest Day",
    "Special Day Restday ND": "Special Holiday on Rest Day",
    "Special Day Restday OT": "Special Holiday on Rest Day",
    "Special Day Restday OT + ND": "Special Holiday on Rest Day",
    "Double Special Day": "Special Holiday",
    "Double Special Day ND": "Special Holiday",
    "Double Special Day OT": "Special Holiday",
    "Double Special Day OT + ND": "Special Holiday",
    "Double Special Day Restday": "Special Holiday on Rest Day",
    "Double Special Day Restday ND": "Special Holiday on Rest Day",
    "Double Special Day Restday OT": "Special Holiday on Rest Day",
    "Double Special Day Restday OT + ND": "Special Holiday on Rest Day",
    "Legal Day": "Legal Holiday",
    "Legal Day ND": "Legal Holiday",
    "Legal Day OT": "Legal Holiday",
    "Legal Day OT + ND": "Legal Holiday",
    "Legal Day Restday": "Legal Holiday on Rest Day",
    "Legal Day Restday ND": "Legal Holiday on Rest Day",
    "Legal Day Restday OT": "Legal Holiday on Rest Day",
    "Legal Day Restday OT + ND": "Legal Holiday on Rest Day",
    "Double Legal Day": "Legal Holiday",
    "Double Legal Day ND": "Legal Holiday",
    "Double Legal Day OT": "Legal Holiday",
    "Double Legal Day OT + ND": "Legal Holiday",
    "Double Legal Day Restday": "Legal Holiday on Rest Day",
    "Double Legal Day Restday ND": "Legal Holiday on Rest Day",
    "Double Legal Day Restday OT": "Legal Holiday on Rest Day",
    "Double Legal Day Restday OT + ND": "Legal Holiday on Rest Day",
    "Regular Holiday (Single Pay)": "Legal Holiday (Day Off) 100%",
};

const SUMMARY_ORDER = [
    "Regular Day",
    "Rest Day",
    "Legal Holiday",
    "Legal Holiday on Rest Day",
    "Legal Holiday (Day Off) 100%",
    "Special Holiday",
    "Special Holiday on Rest Day",
];

const CATEGORY_PRIORITY: Record<string, number> = {
    "Legal Holiday": 3,
    "Legal Holiday on Rest Day": 3,
    "Legal Holiday (Day Off) 100%": 3,
    "Rest Day": 2,
    "Special Holiday on Rest Day": 2,
    "Special Holiday": 1,
    "Regular Day": 0,
};

const HOLIDAY_CATEGORIES = new Set([
    "Legal Holiday",
    "Legal Holiday on Rest Day",
    "Legal Holiday (Day Off) 100%",
    "Special Holiday",
    "Special Holiday on Rest Day",
]);

type SummaryEntry = {
    days: number;
    base: number;
    ot: number;
    nd: number;
    ot_nd: number;
};
type BranchSummary = Record<string, SummaryEntry>;
type BranchLU = {
    late_days: number;
    late_hrs: number;
    under_days: number;
    under_hrs: number;
    billable: number;
};

const floorHalf = (h: number) => Math.floor(h * 2) / 2;

const fmt2 = (n: number) => n.toFixed(2);

export const PrintTimeRecords: React.FC<
    PrintTimeRecordsProps & { records: any[] }
> = ({
    tableId,
    employeeName,
    agencyName,
    idNumber,
    branchName,
    isHrEmployee,
    records,
}) => {
    const handlePrint = () => {
        const table = document.getElementById(tableId);
        if (!table) return;

        // ── Column totals from DOM table ────────────────────────────────────
        const sumCol = (idx: number) =>
            Array.from(table.querySelectorAll("tbody tr")).reduce(
                (sum, row) => {
                    const val = parseFloat(
                        row.querySelectorAll("td")[idx]?.textContent?.trim() ||
                            "0",
                    );
                    return sum + (isNaN(val) ? 0 : val);
                },
                0,
            );

        const totalOT = sumCol(7);
        const totalBreakLate = sumCol(8);
        const totalLate = sumCol(9);
        const totalUndertime = sumCol(10);
        const totalHoursWorked = sumCol(11);
        const totalBillable = sumCol(12);

        // ── Build per-branch attendance summary ─────────────────────────────
        const blankSummary = (): BranchSummary => {
            const s: BranchSummary = {};
            SUMMARY_ORDER.forEach((t) => {
                s[t] = { days: 0, base: 0, ot: 0, nd: 0, ot_nd: 0 };
            });
            return s;
        };

        const branchSummaries: Record<string, BranchSummary> = {};
        const branchLU: Record<string, BranchLU> = {};

        records.forEach((rec: any) => {
            // Mirrors backoffice's row_branch_id = branch_id ?? branch_clock_in ?? branch_clock_out
            const branchKey: string =
                rec.branch_name || rec.clock_in_branch || rec.clock_out_branch || "Unassigned";

            if (!branchSummaries[branchKey]) {
                branchSummaries[branchKey] = blankSummary();
                branchLU[branchKey] = {
                    late_days: 0,
                    late_hrs: 0,
                    under_days: 0,
                    under_hrs: 0,
                    billable: 0,
                };
            }

            // Parse manhour_conversion → {category: hours}
            let manhours: Record<string, number> = {};
            try {
                manhours =
                    typeof rec.manhour_conversion === "string"
                        ? JSON.parse(rec.manhour_conversion)
                        : rec.manhour_conversion || {};
            } catch {
                /* ignore malformed JSON */
            }

            // Determine highest-priority day category
            let dayCategory: string | null = null;
            Object.entries(manhours).forEach(([key, hours]) => {
                if (Number(hours) <= 0) return;
                const cat = KEY_CATEGORY_MAP[key];
                if (!cat) return;
                if (
                    dayCategory === null ||
                    (CATEGORY_PRIORITY[cat] ?? 0) >
                        (CATEGORY_PRIORITY[dayCategory] ?? 0)
                ) {
                    dayCategory = cat;
                }
            });

            // Late/undertime hours are zeroed out on holiday-type days -- those hours
            // are already broken out in their own Legal/Special Holiday attendance
            // row, so counting them again here would double-charge the employee for
            // the same day. Mirrors $is_holiday_day in the PHP print view.
            const isHolidayDay = dayCategory
                ? HOLIDAY_CATEGORIES.has(dayCategory)
                : false;

            const late = isHolidayDay
                ? 0
                : Number(rec.total_hrs_late ?? rec.late ?? 0) +
                  Number(rec.total_hrs_break_late ?? rec.late_break ?? 0);
            const under = isHolidayDay
                ? 0
                : Number(rec.total_undertime_hrs ?? rec.undertime ?? 0);
            if (late > 0) {
                branchLU[branchKey].late_days++;
                branchLU[branchKey].late_hrs += late;
            }
            if (under > 0) {
                branchLU[branchKey].under_days++;
                branchLU[branchKey].under_hrs += under;
            }
            branchLU[branchKey].billable += Number(
                rec.total_hrs ?? rec.hours ?? 0,
            );

            if (!dayCategory) return;

            branchSummaries[branchKey][dayCategory].days++;

            Object.entries(manhours).forEach(([key, hours]) => {
                if (Number(hours) <= 0) return;
                const cat = KEY_CATEGORY_MAP[key];
                if (cat !== dayCategory) return;
                const isOT = key.includes("OT");
                const isND = key.includes("ND");
                if (isOT && isND)
                    branchSummaries[branchKey][dayCategory!].ot_nd +=
                        Number(hours);
                else if (isOT)
                    branchSummaries[branchKey][dayCategory!].ot +=
                        Number(hours);
                else if (isND)
                    branchSummaries[branchKey][dayCategory!].nd +=
                        Number(hours);
                else
                    branchSummaries[branchKey][dayCategory!].base +=
                        Number(hours);
            });
        });

        // ── Render per-branch tables ────────────────────────────────────────
        const branchTablesHtml = Object.entries(branchSummaries)
            .map(([bName, bSummary]) => {
                const bu = branchLU[bName];
                const hasData =
                    bu.late_hrs > 0 ||
                    bu.under_hrs > 0 ||
                    Object.values(bSummary).some(
                        (d) =>
                            d.days > 0 || d.ot > 0 || d.nd > 0 || d.ot_nd > 0,
                    );
                if (!hasData) return "";

                const catRows = SUMMARY_ORDER.map((type) => {
                    const d = bSummary[type];
                    if (
                        !d ||
                        (d.days === 0 &&
                            d.base === 0 &&
                            d.ot === 0 &&
                            d.nd === 0 &&
                            d.ot_nd === 0)
                    )
                        return "";
                    const otD = floorHalf(d.ot);
                    const ndD = floorHalf(d.nd);
                    const otNdD = floorHalf(d.ot_nd);
                    // Matrix is Excel-style overlapping: base incl. ND, ot incl. ot_nd.
                    // "Regular Day" shows a day count; every other (holiday/rest-day)
                    // category shows accumulated base hours instead, mirroring the PHP
                    // print view's $days_cell logic.
                    const daysCell =
                        type === "Regular Day"
                            ? d.days > 0
                                ? `${d.days} Day/s`
                                : ""
                            : d.base > 0
                              ? fmt2(d.base)
                              : "";
                    return `<tr>
                        <td style="text-align:left;">${type}</td>
                        <td>${daysCell}</td>
                        <td>${otD > 0 ? fmt2(otD) : ""}</td>
                        <td>${ndD > 0 ? fmt2(ndD) : ""}</td>
                        <td>${otNdD > 0 ? fmt2(otNdD) : ""}</td>
                    </tr>`;
                }).join("");

                const lateRow =
                    bu.late_hrs > 0
                        ? `<tr>
                        <td style="text-align:left;">Late(s) / Hour(s)</td>
                        <td>${fmt2(bu.late_hrs)}</td>
                        <td></td><td></td><td></td>
                    </tr>`
                        : "";

                const underRow =
                    bu.under_hrs > 0
                        ? `<tr>
                        <td style="text-align:left;">Undertime / Hour(s)</td>
                        <td>${fmt2(bu.under_hrs)}</td>
                        <td></td><td></td><td></td>
                    </tr>`
                        : "";

                return `
                    <table class="breakdown-table" style="width:49%; display:inline-table; vertical-align:top; margin-right:1%;">
                        <thead>
                            <tr>
                                <th colspan="5" style="text-align:center; background-color:#d9d9d9; font-size:10px;">
                                    TIMEKEEPING ATTENDANCE &mdash; ${bName.toUpperCase()}
                                </th>
                            </tr>
                            <tr>
                                <th style="text-align:left; width:44%;">Work Type</th>
                                <th>Days / Hours</th>
                                <th>OT</th>
                                <th>ND</th>
                                <th>OT + ND</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${catRows}
                            ${lateRow}
                            ${underRow}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td style="text-align:right;"><strong>Billable Hrs</strong></td>
                                <td colspan="4"><strong>${fmt2(bu.billable)}</strong></td>
                            </tr>
                        </tfoot>
                    </table>`;
            })
            .join("");

        // ── Inject tfoot totals row into the cloned table HTML ──────────────
        const tfootHtml = `
            <tfoot>
                <tr>
                    <td colspan="7" style="text-align:right; font-weight:bold;">Totals</td>
                    <td>${totalOT > 0 ? fmt2(totalOT) : "&mdash;"}</td>
                    <td>${totalBreakLate > 0 ? fmt2(totalBreakLate) : "&mdash;"}</td>
                    <td>${totalLate > 0 ? fmt2(totalLate) : "&mdash;"}</td>
                    <td>${totalUndertime > 0 ? fmt2(totalUndertime) : "&mdash;"}</td>
                    <td>${fmt2(totalHoursWorked)}</td>
                    <td>${fmt2(totalBillable)}</td>
                </tr>
            </tfoot>`;

        // ── Mark overnight clock-outs (Time Out < Time In on the same cutoff) ──
        // Mirrors the PHP print view's `$row['clock_out'] < $row['clock_in']` check.
        // Operates on a detached clone so the on-screen table is left untouched.
        const clonedTable = table.cloneNode(true) as HTMLTableElement;
        let hasOvernight = false;
        const clonedRows = clonedTable.querySelectorAll("tbody tr");
        clonedRows.forEach((row, idx) => {
            const rec = records[idx];
            if (!rec) return;
            const clockIn = rec.clock_in || rec.timeIn;
            const clockOut = rec.clock_out || rec.timeOut;
            if (!clockIn || !clockOut || clockOut >= clockIn) return;
            const timeOutCell = row.querySelectorAll("td")[6];
            if (!timeOutCell) return;
            timeOutCell.textContent = `${(timeOutCell.textContent || "").trim()} *`;
            hasOvernight = true;
        });

        const printContent = clonedTable.outerHTML.replace(
            "</table>",
            tfootHtml + "</table>",
        );

        const overnightNoteHtml = hasOvernight
            ? `<div style="font-size:9px; margin-top:3px;">* Time Out marked with * indicates next-day clock-out (overnight shift)</div>`
            : "";

        const disclaimerHtml = isHrEmployee
            ? `<div class="footer"><strong>Disclaimer:</strong> This is not an official document.</div>`
            : "";

        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Employee Timesheet</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        font-size: 10px;
                        color: #6c757d;
                        padding: 10px;
                    }

                    /* ── Header ── */
                    .employee-header { font-size: 20px; font-weight: bold; line-height: 1.2; color: #000; }
                    .generated-info  { font-size: 12px; font-weight: bold; line-height: 1.2; }
                    .header-divider  { border: 0; border-top: 1px solid #6c757d; margin: 8px 0; }

                    /* ── 4-column info grid ── */
                    .info-grid {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 4px 16px;
                        margin-bottom: 8px;
                        font-size: 11px;
                    }

                    /* ── Main table ── */
                    table { width: 100%; border-collapse: collapse; font-size: 10px; }
                    th, td { border: 1px solid #6c757d; padding: 4px 6px; text-align: center; vertical-align: middle; }
                    th { background-color: #f2f2f2; font-weight: bold; }
                    tr:nth-child(even) td { background-color: #f9f9f9; }
                    tfoot td { font-weight: bold; background-color: #f2f2f2; }

                    /* ── Breakdown tables ── */
                    .breakdown-wrapper { margin-top: 10px; }
                    .breakdown-table { font-size: 9px; margin-top: 6px; }
                    .breakdown-table th { background-color: #e8e8e8; }
                    .breakdown-table td, .breakdown-table th { padding: 3px 5px; }
                    .breakdown-table tfoot td { font-weight: bold; background-color: #f2f2f2; }

                    /* ── Signature ── */
                    .signature-container { margin-top: 40px; text-align: center; }
                    .signature-line      { width: 250px; border-top: 1px solid #000; margin: 20px auto 0; padding-top: 6px; }
                    .signature-text      { font-size: 10px; font-weight: bold; }

                    .footer { margin-top: 20px; text-align: center; font-size: 9px; color: red; }

                    @page  { size: A4 portrait; margin: 8mm; }
                    @media print {
                        body { font-size: 7.5px; }
                    }
                </style>
            </head>
            <body>
                <!-- Header -->
                <div class="employee-header">Employee Timesheet</div>
                <div class="generated-info">Generated: ${format(new Date(), "yyyy-MM-dd HH:mm:ss")}</div>
                <hr class="header-divider">

                <!-- 4-column info grid -->
                <div class="info-grid">
                    <div><strong>Name:</strong> ${employeeName}</div>
                    <div><strong>ID Number:</strong> ${idNumber || "N/A"}</div>
                    <div><strong>Branch:</strong> ${branchName || "N/A"}</div>
                    <div><strong>Agency:</strong> ${agencyName || "—"}</div>
                </div>

                <!-- Main timesheet table (with injected tfoot) -->
                ${printContent}
                ${overnightNoteHtml}

                <!-- Per-branch attendance breakdown -->
                <div class="breakdown-wrapper" style="display:flex; flex-wrap:wrap; gap:10px; align-items:flex-start; margin-top:10px;">
                    ${branchTablesHtml}
                </div>

                <!-- Signature -->
                <div class="signature-container">
                    <div class="signature-line">
                        <span class="signature-text">${employeeName} &mdash; Employee Signature</span>
                    </div>
                </div>

                ${disclaimerHtml}

                <script>
                    // Highlight missing / flagged cells
                    document.querySelectorAll("tbody tr").forEach(function(row) {
                        var cells = row.querySelectorAll("td");
                        var overtimeIdx   = 7;
                        var breakLateIdx  = 8;
                        var lateIdx       = 9;
                        var undertimeIdx  = 10;
                        cells.forEach(function(cell, idx) {
                            var text = (cell.textContent || "").trim().toLowerCase();
                            if (idx !== overtimeIdx && (!text || text === "no data" || text === "no filed" || text === "n/a" || text === "—")) {
                                cell.style.color = "red";
                                cell.style.fontWeight = "bold";
                                return;
                            }
                            if (idx === breakLateIdx || idx === lateIdx || idx === undertimeIdx) {
                                var value = parseFloat(text);
                                if (!isNaN(value) && value > 0) {
                                    cell.style.color = "red";
                                    cell.style.fontWeight = "bold";
                                }
                            }
                        });
                    });
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
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
        >
            <Printer className="mr-2 h-4 w-4" />
            Print
        </Button>
    );
};
