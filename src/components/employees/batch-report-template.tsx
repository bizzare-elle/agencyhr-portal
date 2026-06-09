import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { format } from "date-fns";
import { TimeRecord } from "@/index";
import { formatTime, formatNumber } from "@/helpers/formatDates";
import { GroupedEmployee } from "@/index";

interface ConsolidatedPDFProps {
    recordsByEmployee: GroupedEmployee[];
}

// ── Category mapping (mirrors batch_employee_schedule_print.php) ──────────────
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

type SummaryEntry = { days: number; ot: number; nd: number; ot_nd: number };
type BranchSummary = Record<string, SummaryEntry>;
type BranchLateUnder = {
    late_days: number;
    late_hrs: number;
    under_days: number;
    under_hrs: number;
    billable: number;
};

// Floor to nearest 0.5 (mirrors PHP floor_half)
const floorHalf = (h: number) => Math.floor(h * 2) / 2;

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    page: { padding: 10, fontSize: 8, fontFamily: "Helvetica" },

    header: {
        marginBottom: 6,
        borderBottomWidth: 1,
        borderBottomColor: "#6c757d",
        paddingBottom: 4,
    },

    title: { fontSize: 14, fontFamily: "Helvetica-Bold" },
    subtitle: { fontSize: 8, color: "gray" },

    // 4-column info grid
    infoGrid: {
        flexDirection: "row",
        marginBottom: 6,
        gap: 8,
    },
    infoCell: { flex: 1, fontSize: 8 },
    infoBold: { fontFamily: "Helvetica-Bold" },

    section: { marginBottom: 6 },

    // Main timesheet table
    tableHeader: {
        flexDirection: "row",
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: "#6c757d",
        backgroundColor: "#f2f2f2",
    },
    tableRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderColor: "#6c757d",
    },
    tableFooter: {
        flexDirection: "row",
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: "#6c757d",
        backgroundColor: "#f2f2f2",
    },

    cell: {
        borderRightWidth: 1,
        borderColor: "#6c757d",
        textAlign: "center",
        paddingVertical: 2,
        paddingHorizontal: 2,
    },
    firstCell: {
        borderLeftWidth: 1,
        borderLeftColor: "#6c757d",
        borderRightWidth: 1,
        borderColor: "#6c757d",
        textAlign: "center",
        paddingVertical: 2,
        paddingHorizontal: 2,
    },

    flexDate: { flex: 1 },
    flexSchedule: { flex: 1.4 },
    flexBranch: { flex: 1 },
    flexTime: { flex: 0.8 },
    flexOT: { flex: 0.75 },
    flexTotalWorked: { flex: 0.9 },
    flexTotal: { flex: 0.9 },

    // Per-branch attendance breakdown
    summaryWrapper: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
        marginTop: 8,
    },
    summaryTable: { width: "48%" },

    breakdownHeader: {
        flexDirection: "row",
        backgroundColor: "#d9d9d9",
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: "#6c757d",
    },
    breakdownSubHeader: {
        flexDirection: "row",
        backgroundColor: "#e8e8e8",
        borderBottomWidth: 1,
        borderColor: "#6c757d",
    },
    breakdownRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderColor: "#6c757d",
    },
    breakdownFooter: {
        flexDirection: "row",
        backgroundColor: "#f2f2f2",
        borderBottomWidth: 1,
        borderColor: "#6c757d",
        fontFamily: "Helvetica-Bold",
    },
    bdCell: {
        borderRightWidth: 1,
        borderColor: "#6c757d",
        textAlign: "center",
        paddingVertical: 2,
        paddingHorizontal: 2,
        fontSize: 7,
    },
    bdFirstCell: {
        borderLeftWidth: 1,
        borderLeftColor: "#6c757d",
        borderRightWidth: 1,
        borderColor: "#6c757d",
        textAlign: "left",
        paddingVertical: 2,
        paddingHorizontal: 3,
        fontSize: 7,
    },
    bdLabelFlex: { flex: 2.5 },
    bdNumFlex: { flex: 1 },

    overnightNote: { fontSize: 7, color: "gray", marginTop: 3 },

    signatureSection: { marginTop: 20, alignItems: "center" },
    signatureLine: {
        borderTopWidth: 1,
        borderTopColor: "#000",
        width: "40%",
        marginTop: 20,
    },
    signatureLabel: { fontSize: 8, marginTop: 4, fontFamily: "Helvetica-Bold" },

    footer: {
        position: "absolute",
        bottom: 10,
        left: 10,
        right: 10,
        fontSize: 6,
        textAlign: "right",
        color: "gray",
    },
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const displayHours = (hrs: number | string | null | undefined) => {
    const n = Number(hrs);
    if (!hrs || isNaN(n) || n === 0) return "—";
    return n.toFixed(2);
};

const displayHoursTotal = (hrs: number | string | null | undefined) => {
    const n = Number(hrs);
    if (!hrs || isNaN(n)) return "0.00";
    return n.toFixed(2);
};

const renderCellStyle = (value: string | number | null | undefined) => {
    if (
        value === null ||
        value === undefined ||
        value === "" ||
        value === "No Data"
    ) {
        return { color: "red" };
    }
    const num = Number(value);
    if (!isNaN(num) && num > 0) return { color: "red" };
    return {};
};

const getTimeCell = (time: string | null | undefined) =>
    time ? String(formatTime(time)) : "No Data";

// ── Component ─────────────────────────────────────────────────────────────────
export const ConsolidatedTimeRecordsPDF = ({
    recordsByEmployee = [],
}: ConsolidatedPDFProps) => {
    const employees = Array.isArray(recordsByEmployee) ? recordsByEmployee : [];

    return (
        <Document>
            {employees.map((emp, idx) => {
                const safeTimeRecords = Array.isArray(emp.time_records)
                    ? emp.time_records
                    : [];

                // ── Totals for tfoot ──────────────────────────────────────
                let totalOT = 0;
                let totalLateBreak = 0;
                let totalLate = 0;
                let totalUndertime = 0;
                let totalWorked = 0;
                let totalBillable = 0;
                let hasOvernight = false;

                // ── Per-branch attendance summary (mirrors PHP) ───────────
                const blankSummary = (): BranchSummary => {
                    const s: BranchSummary = {};
                    SUMMARY_ORDER.forEach((t) => {
                        s[t] = { days: 0, ot: 0, nd: 0, ot_nd: 0 };
                    });
                    return s;
                };

                const branchSummaries: Record<string, BranchSummary> = {};
                const branchLateUnder: Record<string, BranchLateUnder> = {};

                safeTimeRecords.forEach((rec: any) => {
                    // Accumulate tfoot totals
                    totalOT += Number(rec.overtime ?? 0);
                    totalLateBreak += Number(rec.late_break ?? 0);
                    totalLate += Number(rec.late ?? 0);
                    totalUndertime += Number(rec.undertime ?? 0);
                    totalWorked += Number(rec.hoursWorked ?? 0);
                    totalBillable += Number(rec.hours ?? 0);

                    // Overnight detection
                    if (
                        rec.time_out &&
                        rec.time_in &&
                        rec.time_out < rec.time_in
                    ) {
                        hasOvernight = true;
                    }

                    // Branch key — use clock-in branch name as proxy
                    const branchKey: string = rec.branch_timeIn || "Unassigned";

                    if (!branchSummaries[branchKey]) {
                        branchSummaries[branchKey] = blankSummary();
                        branchLateUnder[branchKey] = {
                            late_days: 0,
                            late_hrs: 0,
                            under_days: 0,
                            under_hrs: 0,
                            billable: 0,
                        };
                    }

                    // Late / undertime accumulators
                    const late =
                        Number(rec.late ?? 0) + Number(rec.late_break ?? 0);
                    const under = Number(rec.undertime ?? 0);
                    if (late > 0) {
                        branchLateUnder[branchKey].late_days++;
                        branchLateUnder[branchKey].late_hrs += late;
                    }
                    if (under > 0) {
                        branchLateUnder[branchKey].under_days++;
                        branchLateUnder[branchKey].under_hrs += under;
                    }
                    branchLateUnder[branchKey].billable += Number(
                        rec.hours ?? 0,
                    );

                    // Manhour breakdown → category mapping
                    const arr = Array.isArray(rec.manhourArray)
                        ? rec.manhourArray
                        : [];

                    // Determine the highest-priority day category for this row
                    let dayCategory: string | null = null;
                    arr.forEach((mh: any) => {
                        if (Number(mh.hours || 0) <= 0) return;
                        const cat = KEY_CATEGORY_MAP[mh.category] ?? null;
                        if (!cat) return;
                        if (
                            dayCategory === null ||
                            (CATEGORY_PRIORITY[cat] ?? 0) >
                                (CATEGORY_PRIORITY[dayCategory] ?? 0)
                        ) {
                            dayCategory = cat;
                        }
                    });

                    if (!dayCategory) return;

                    branchSummaries[branchKey][dayCategory].days++;

                    arr.forEach((mh: any) => {
                        const hours = Number(mh.hours || 0);
                        if (hours <= 0) return;
                        const cat = KEY_CATEGORY_MAP[mh.category] ?? null;
                        if (cat !== dayCategory) return;

                        const isOT = mh.category.includes("OT");
                        const isND = mh.category.includes("ND");
                        if (isOT && isND) {
                            branchSummaries[branchKey][dayCategory!].ot_nd +=
                                hours;
                        } else if (isOT) {
                            branchSummaries[branchKey][dayCategory!].ot +=
                                hours;
                        } else if (isND) {
                            branchSummaries[branchKey][dayCategory!].nd +=
                                hours;
                        }
                    });
                });

                return (
                    <Page key={emp.id ?? idx} size="A4" style={styles.page}>
                        {/* ── Header ─────────────────────────────────────── */}
                        <View style={styles.header}>
                            <Text style={styles.title}>Employee Timesheet</Text>
                            <Text style={styles.subtitle}>
                                Generated:{" "}
                                {format(new Date(), "yyyy-MM-dd HH:mm:ss")}
                            </Text>
                        </View>

                        {/* ── Info grid (4-column) ────────────────────────── */}
                        <View style={styles.infoGrid}>
                            <Text style={styles.infoCell}>
                                <Text style={styles.infoBold}>Name: </Text>
                                {String(emp.employee_name)}
                            </Text>
                            <Text style={styles.infoCell}>
                                <Text style={styles.infoBold}>ID Number: </Text>
                                {String(emp.id_number)}
                            </Text>
                            <Text style={styles.infoCell}>
                                <Text style={styles.infoBold}>Branch: </Text>
                                {String(emp.branch)}
                            </Text>
                            <Text style={styles.infoCell}>
                                <Text style={styles.infoBold}>Agency: </Text>
                                {String(emp.agency_name)}
                            </Text>
                        </View>

                        {/* ── Main timesheet table ────────────────────────── */}
                        {/* Header row */}
                        <View style={styles.tableHeader}>
                            <Text
                                style={[
                                    styles.cell,
                                    styles.firstCell,
                                    styles.flexDate,
                                ]}
                            >
                                Date
                            </Text>
                            <Text style={[styles.cell, styles.flexSchedule]}>
                                Schedule
                            </Text>
                            <Text style={[styles.cell, styles.flexBranch]}>
                                Branch (In-Out)
                            </Text>
                            <Text style={[styles.cell, styles.flexTime]}>
                                Time In
                            </Text>
                            <Text style={[styles.cell, styles.flexTime]}>
                                Break Out
                            </Text>
                            <Text style={[styles.cell, styles.flexTime]}>
                                Break In
                            </Text>
                            <Text style={[styles.cell, styles.flexTime]}>
                                Time Out
                            </Text>
                            <Text style={[styles.cell, styles.flexOT]}>
                                OT (hrs)
                            </Text>
                            <Text style={[styles.cell, styles.flexOT]}>
                                Break Late (hrs)
                            </Text>
                            <Text style={[styles.cell, styles.flexOT]}>
                                Late (hrs)
                            </Text>
                            <Text style={[styles.cell, styles.flexOT]}>
                                Undertime (hrs)
                            </Text>
                            <Text style={[styles.cell, styles.flexTotalWorked]}>
                                Total Worked
                            </Text>
                            <Text style={[styles.cell, styles.flexTotal]}>
                                Billable
                            </Text>
                        </View>

                        {/* Data rows */}
                        {safeTimeRecords.map((rec: any, i: number) => {
                            const branchCell =
                                rec.branch_timeIn && rec.branch_timeOut
                                    ? `${rec.branch_timeIn} - ${rec.branch_timeOut}`
                                    : rec.branch_timeIn ||
                                      rec.branch_timeOut ||
                                      "—";

                            let clockOutDisplay = getTimeCell(rec.time_out);
                            if (
                                rec.time_out &&
                                rec.time_in &&
                                rec.time_out < rec.time_in
                            ) {
                                clockOutDisplay += " *";
                            }

                            return (
                                <View style={styles.tableRow} key={i}>
                                    <Text
                                        style={[
                                            styles.cell,
                                            styles.firstCell,
                                            styles.flexDate,
                                        ]}
                                    >
                                        {String(rec.date)}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.cell,
                                            styles.flexSchedule,
                                        ]}
                                    >
                                        {String(rec.schedule ?? "—")}
                                    </Text>
                                    <Text
                                        style={[styles.cell, styles.flexBranch]}
                                    >
                                        {branchCell}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.cell,
                                            styles.flexTime,
                                            renderCellStyle(
                                                getTimeCell(rec.time_in),
                                            ),
                                        ]}
                                    >
                                        {getTimeCell(rec.time_in)}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.cell,
                                            styles.flexTime,
                                            renderCellStyle(
                                                getTimeCell(rec.break_out),
                                            ),
                                        ]}
                                    >
                                        {getTimeCell(rec.break_out)}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.cell,
                                            styles.flexTime,
                                            renderCellStyle(
                                                getTimeCell(rec.break_in),
                                            ),
                                        ]}
                                    >
                                        {getTimeCell(rec.break_in)}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.cell,
                                            styles.flexTime,
                                            renderCellStyle(
                                                getTimeCell(rec.time_out),
                                            ),
                                        ]}
                                    >
                                        {clockOutDisplay}
                                    </Text>
                                    <Text style={[styles.cell, styles.flexOT]}>
                                        {Number(rec.overtime ?? 0)
                                            ? displayHours(rec.overtime)
                                            : "—"}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.cell,
                                            styles.flexOT,
                                            renderCellStyle(rec.late_break),
                                        ]}
                                    >
                                        {displayHours(rec.late_break)}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.cell,
                                            styles.flexOT,
                                            renderCellStyle(rec.late),
                                        ]}
                                    >
                                        {displayHours(rec.late)}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.cell,
                                            styles.flexOT,
                                            renderCellStyle(rec.undertime),
                                        ]}
                                    >
                                        {displayHours(rec.undertime)}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.cell,
                                            styles.flexTotalWorked,
                                        ]}
                                    >
                                        {displayHoursTotal(rec.hoursWorked)}
                                    </Text>
                                    <Text
                                        style={[styles.cell, styles.flexTotal]}
                                    >
                                        {displayHoursTotal(rec.hours)}
                                    </Text>
                                </View>
                            );
                        })}

                        {/* Totals footer row */}
                        <View style={styles.tableFooter}>
                            <Text
                                style={[
                                    styles.cell,
                                    styles.firstCell,
                                    styles.flexDate,
                                    styles.flexSchedule,
                                    styles.flexBranch,
                                    styles.flexTime,
                                    styles.flexTime,
                                    styles.flexTime,
                                    styles.flexTime,
                                    { textAlign: "right", flex: 7 },
                                ]}
                            >
                                Totals
                            </Text>
                            <Text style={[styles.cell, styles.flexOT]}>
                                {displayHoursTotal(totalOT)}
                            </Text>
                            <Text style={[styles.cell, styles.flexOT]}>
                                {displayHoursTotal(totalLateBreak)}
                            </Text>
                            <Text style={[styles.cell, styles.flexOT]}>
                                {displayHoursTotal(totalLate)}
                            </Text>
                            <Text style={[styles.cell, styles.flexOT]}>
                                {displayHoursTotal(totalUndertime)}
                            </Text>
                            <Text style={[styles.cell, styles.flexTotalWorked]}>
                                {displayHoursTotal(totalWorked)}
                            </Text>
                            <Text style={[styles.cell, styles.flexTotal]}>
                                {displayHoursTotal(totalBillable)}
                            </Text>
                        </View>

                        {/* Overnight note */}
                        {hasOvernight && (
                            <Text style={styles.overnightNote}>
                                * Time Out marked with * indicates next-day
                                clock-out (overnight shift)
                            </Text>
                        )}

                        {/* ── Per-branch attendance breakdown ─────────────── */}
                        {Object.keys(branchSummaries).length > 0 && (
                            <View style={styles.summaryWrapper}>
                                {Object.entries(branchSummaries).map(
                                    ([bName, bSummary]) => {
                                        const bu = branchLateUnder[bName];
                                        const hasData =
                                            bu.late_hrs > 0 ||
                                            bu.under_hrs > 0 ||
                                            Object.values(bSummary).some(
                                                (d) =>
                                                    d.days > 0 ||
                                                    d.ot > 0 ||
                                                    d.nd > 0 ||
                                                    d.ot_nd > 0,
                                            );
                                        if (!hasData) return null;

                                        return (
                                            <View
                                                key={bName}
                                                style={styles.summaryTable}
                                            >
                                                {/* Branch header */}
                                                <View
                                                    style={
                                                        styles.breakdownHeader
                                                    }
                                                >
                                                    <Text
                                                        style={[
                                                            styles.bdFirstCell,
                                                            styles.bdLabelFlex,
                                                            {
                                                                flex: 6,
                                                                textAlign:
                                                                    "center",
                                                                fontFamily:
                                                                    "Helvetica-Bold",
                                                                fontSize: 8,
                                                            },
                                                        ]}
                                                    >
                                                        TIMEKEEPING ATTENDANCE —{" "}
                                                        {bName.toUpperCase()}
                                                    </Text>
                                                </View>
                                                {/* Column sub-header */}
                                                <View
                                                    style={
                                                        styles.breakdownSubHeader
                                                    }
                                                >
                                                    <Text
                                                        style={[
                                                            styles.bdFirstCell,
                                                            styles.bdLabelFlex,
                                                        ]}
                                                    >
                                                        Work Type
                                                    </Text>
                                                    <Text
                                                        style={[
                                                            styles.bdCell,
                                                            styles.bdNumFlex,
                                                        ]}
                                                    >
                                                        Days
                                                    </Text>
                                                    <Text
                                                        style={[
                                                            styles.bdCell,
                                                            styles.bdNumFlex,
                                                        ]}
                                                    >
                                                        OT
                                                    </Text>
                                                    <Text
                                                        style={[
                                                            styles.bdCell,
                                                            styles.bdNumFlex,
                                                        ]}
                                                    >
                                                        ND
                                                    </Text>
                                                    <Text
                                                        style={[
                                                            styles.bdCell,
                                                            styles.bdNumFlex,
                                                        ]}
                                                    >
                                                        OT + ND
                                                    </Text>
                                                </View>
                                                {/* Category rows */}
                                                {SUMMARY_ORDER.map((type) => {
                                                    const d = bSummary[type];
                                                    if (
                                                        !d ||
                                                        (d.days === 0 &&
                                                            d.ot === 0 &&
                                                            d.nd === 0 &&
                                                            d.ot_nd === 0)
                                                    )
                                                        return null;
                                                    const otD = floorHalf(d.ot);
                                                    const ndD = floorHalf(d.nd);
                                                    const otNdD = floorHalf(
                                                        d.ot_nd,
                                                    );
                                                    return (
                                                        <View
                                                            key={type}
                                                            style={
                                                                styles.breakdownRow
                                                            }
                                                        >
                                                            <Text
                                                                style={[
                                                                    styles.bdFirstCell,
                                                                    styles.bdLabelFlex,
                                                                ]}
                                                            >
                                                                {type}
                                                            </Text>
                                                            <Text
                                                                style={[
                                                                    styles.bdCell,
                                                                    styles.bdNumFlex,
                                                                ]}
                                                            >
                                                                {d.days > 0
                                                                    ? d.days
                                                                    : ""}
                                                            </Text>
                                                            <Text
                                                                style={[
                                                                    styles.bdCell,
                                                                    styles.bdNumFlex,
                                                                ]}
                                                            >
                                                                {otD > 0
                                                                    ? otD.toFixed(
                                                                          2,
                                                                      )
                                                                    : ""}
                                                            </Text>
                                                            <Text
                                                                style={[
                                                                    styles.bdCell,
                                                                    styles.bdNumFlex,
                                                                ]}
                                                            >
                                                                {ndD > 0
                                                                    ? ndD.toFixed(
                                                                          2,
                                                                      )
                                                                    : ""}
                                                            </Text>
                                                            <Text
                                                                style={[
                                                                    styles.bdCell,
                                                                    styles.bdNumFlex,
                                                                ]}
                                                            >
                                                                {otNdD > 0
                                                                    ? otNdD.toFixed(
                                                                          2,
                                                                      )
                                                                    : ""}
                                                            </Text>
                                                        </View>
                                                    );
                                                })}
                                                {/* Late row */}
                                                {bu.late_hrs > 0 && (
                                                    <View
                                                        style={
                                                            styles.breakdownRow
                                                        }
                                                    >
                                                        <Text
                                                            style={[
                                                                styles.bdFirstCell,
                                                                styles.bdLabelFlex,
                                                            ]}
                                                        >
                                                            Late(s) / Hour(s)
                                                        </Text>
                                                        <Text
                                                            style={[
                                                                styles.bdCell,
                                                                styles.bdNumFlex,
                                                            ]}
                                                        >
                                                            {bu.late_days}
                                                        </Text>
                                                        <Text
                                                            style={[
                                                                styles.bdCell,
                                                                styles.bdNumFlex,
                                                            ]}
                                                        >
                                                            {bu.late_hrs.toFixed(
                                                                2,
                                                            )}
                                                        </Text>
                                                        <Text
                                                            style={[
                                                                styles.bdCell,
                                                                styles.bdNumFlex,
                                                            ]}
                                                        ></Text>
                                                        <Text
                                                            style={[
                                                                styles.bdCell,
                                                                styles.bdNumFlex,
                                                            ]}
                                                        ></Text>
                                                    </View>
                                                )}
                                                {/* Undertime row */}
                                                {bu.under_hrs > 0 && (
                                                    <View
                                                        style={
                                                            styles.breakdownRow
                                                        }
                                                    >
                                                        <Text
                                                            style={[
                                                                styles.bdFirstCell,
                                                                styles.bdLabelFlex,
                                                            ]}
                                                        >
                                                            Undertime / Hour(s)
                                                        </Text>
                                                        <Text
                                                            style={[
                                                                styles.bdCell,
                                                                styles.bdNumFlex,
                                                            ]}
                                                        >
                                                            {bu.under_days}
                                                        </Text>
                                                        <Text
                                                            style={[
                                                                styles.bdCell,
                                                                styles.bdNumFlex,
                                                            ]}
                                                        >
                                                            {bu.under_hrs.toFixed(
                                                                2,
                                                            )}
                                                        </Text>
                                                        <Text
                                                            style={[
                                                                styles.bdCell,
                                                                styles.bdNumFlex,
                                                            ]}
                                                        ></Text>
                                                        <Text
                                                            style={[
                                                                styles.bdCell,
                                                                styles.bdNumFlex,
                                                            ]}
                                                        ></Text>
                                                    </View>
                                                )}
                                                {/* Billable footer */}
                                                <View
                                                    style={
                                                        styles.breakdownFooter
                                                    }
                                                >
                                                    <Text
                                                        style={[
                                                            styles.bdFirstCell,
                                                            styles.bdLabelFlex,
                                                            {
                                                                textAlign:
                                                                    "right",
                                                            },
                                                        ]}
                                                    >
                                                        Billable Hrs
                                                    </Text>
                                                    <Text
                                                        style={[
                                                            styles.bdCell,
                                                            { flex: 4 },
                                                        ]}
                                                    >
                                                        {bu.billable.toFixed(2)}
                                                    </Text>
                                                </View>
                                            </View>
                                        );
                                    },
                                )}
                            </View>
                        )}

                        {/* ── Signature ───────────────────────────────────── */}
                        <View style={styles.signatureSection}>
                            <View style={styles.signatureLine} />
                            <Text style={styles.signatureLabel}>
                                {String(emp.employee_name)} — Employee Signature
                            </Text>
                        </View>

                        {/* ── Page number footer ──────────────────────────── */}
                        <Text
                            style={styles.footer}
                            render={({ pageNumber, totalPages }) =>
                                `Page ${pageNumber} of ${totalPages}`
                            }
                        />
                    </Page>
                );
            })}
        </Document>
    );
};
