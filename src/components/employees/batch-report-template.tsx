import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { format } from "date-fns";
import { TimeRecord } from "@/index";
import { formatTime, formatNumber } from "@/helpers/formatDates";

interface EmployeeData {
    id: string;
    employee_name: string;
    id_number: string;
    branch: string;
    agency_name: string;
    employment_status: string;
    time_records: TimeRecord[];
}

interface ConsolidatedPDFProps {
    recordsByEmployee: EmployeeData[];
}

const styles = StyleSheet.create({
    page: { padding: 10, fontSize: 8, fontFamily: "Helvetica" },

    header: {
        marginBottom: 6,
        borderBottomWidth: 1,
        borderBottomColor: "#000",
        paddingBottom: 4,
    },

    title: { fontSize: 12 },
    subtitle: { fontSize: 8, color: "gray" },

    section: { marginBottom: 6 },

    tableHeader: {
        flexDirection: "row",
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: "#000",
        backgroundColor: "#d9e1f2",
    },

    tableRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderColor: "#000",
    },

    cell: {
        borderRightWidth: 1,
        borderColor: "#000",
        textAlign: "center",
        paddingVertical: 2,
        paddingHorizontal: 2,
    },

    firstCell: {
        borderLeftWidth: 1,
        borderLeftColor: "#000",
        borderRightWidth: 1,
        borderColor: "#000",
        textAlign: "center",
        paddingVertical: 2,
        paddingHorizontal: 2,
    },

    flexDate: { flex: 1 },
    flexSchedule: { flex: 1 },
    flexBranch: { flex: 1 },
    flexTime: { flex: 0.8 },
    flexOT: { flex: 0.6 },
    flexTotalWorked: { flex: 0.8 },
    flexTotal: { flex: 0.8 },

    totals: {
        marginTop: 8,
        borderTopWidth: 1,
        borderTopColor: "#000",
        paddingTop: 4,
        fontSize: 8,
    },

    signatureSection: { marginTop: 20, alignItems: "center" },

    signatureLine: {
        borderTopWidth: 1,
        borderTopColor: "#000",
        width: "40%",
        marginTop: 20,
    },

    signatureLabel: { fontSize: 7, marginTop: 2 },

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

const displayHoursFixed = (hrs: number | string | null | undefined) => {
    if (hrs === null || hrs === undefined || Number(hrs) === 0) {
        return "0";
    }
    return Number(hrs).toFixed(2);
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
    if (!isNaN(num) && num > 0) {
        return { color: "red" };
    }

    return {};
};

const getTimeCell = (time: string | null | undefined) =>
    time ? String(formatTime(time)) : "No Data";

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

                const totals = safeTimeRecords.reduce(
                    (acc, rec) => {
                        acc.late_break += Number(rec.late_break ?? 0);
                        acc.late += Number(rec.late ?? 0);
                        acc.undertime += Number(rec.undertime ?? 0);
                        acc.hours += Number(rec.hours ?? 0);
                        acc.hoursWorked += Number(rec.hoursWorked ?? 0);
                        return acc;
                    },
                    {
                        hoursWorked: 0,
                        late_break: 0,
                        late: 0,
                        undertime: 0,
                        hours: 0,
                    },
                );

                const manhourTotals = safeTimeRecords.reduce(
                    (acc: Record<string, number>, rec: any) => {
                        const arr = Array.isArray(rec.manhourArray)
                            ? rec.manhourArray
                            : [];

                        arr.forEach((mh: any) => {
                            acc[mh.category] =
                                (acc[mh.category] || 0) + Number(mh.hours || 0);
                        });

                        return acc;
                    },
                    {},
                );

                return (
                    <Page key={emp.id ?? idx} size="A4" style={styles.page}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.title}>
                                Employee Time Records
                            </Text>
                            <Text style={styles.subtitle}>
                                Generated:{" "}
                                {format(new Date(), "yyyy-MM-dd HH:mm")}
                            </Text>
                        </View>

                        {/* Employee Info */}
                        <View style={styles.section}>
                            <Text>Name: {String(emp.employee_name)}</Text>
                            <Text>ID Number: {String(emp.id_number)}</Text>
                            <Text>Branch: {String(emp.branch)}</Text>
                            <Text>Agency: {String(emp.agency_name)}</Text>
                        </View>

                        {/* Table Header */}
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
                                Branch In/Out
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
                            <Text style={[styles.cell, styles.flexOT]}>OT</Text>
                            <Text style={[styles.cell, styles.flexOT]}>
                                Break Late
                            </Text>
                            <Text style={[styles.cell, styles.flexOT]}>
                                Late
                            </Text>
                            <Text style={[styles.cell, styles.flexOT]}>
                                Undertime
                            </Text>
                            <Text style={[styles.cell, styles.flexTotalWorked]}>
                                Total Hours Worked
                            </Text>
                            <Text style={[styles.cell, styles.flexTotal]}>
                                Total Billable Hours
                            </Text>
                        </View>

                        {/* Rows */}
                        {safeTimeRecords.map((rec, i) => (
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
                                    style={[styles.cell, styles.flexSchedule]}
                                >
                                    {String(rec.schedule ?? "No Data")}
                                </Text>

                                <Text style={[styles.cell, styles.flexBranch]}>
                                    {rec.branch_timeIn && rec.branch_timeOut
                                        ? `${rec.branch_timeIn} - ${rec.branch_timeOut}`
                                        : "No Data"}
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
                                    {getTimeCell(rec.time_out)}
                                </Text>

                                <Text style={[styles.cell, styles.flexOT]}>
                                    {Number(rec.overtime ?? 0)
                                        ? String(formatNumber(rec.overtime))
                                        : "No Filed"}
                                </Text>

                                <Text
                                    style={[
                                        styles.cell,
                                        styles.flexOT,
                                        renderCellStyle(rec.late_break),
                                    ]}
                                >
                                    {displayHoursFixed(rec.late_break)}
                                </Text>

                                <Text
                                    style={[
                                        styles.cell,
                                        styles.flexOT,
                                        renderCellStyle(rec.late),
                                    ]}
                                >
                                    {displayHoursFixed(rec.late)}
                                </Text>

                                <Text
                                    style={[
                                        styles.cell,
                                        styles.flexOT,
                                        renderCellStyle(rec.undertime),
                                    ]}
                                >
                                    {displayHoursFixed(rec.undertime)}
                                </Text>

                                <Text
                                    style={[
                                        styles.cell,
                                        styles.flexTotalWorked,
                                    ]}
                                >
                                    {String(formatNumber(rec.hoursWorked ?? 0))}
                                </Text>

                                <Text style={[styles.cell, styles.flexTotal]}>
                                    {String(formatNumber(rec.hours ?? 0))}
                                </Text>
                            </View>
                        ))}

                        {/* Totals */}
                        <View
                            style={[
                                styles.totals,
                                { flexDirection: "row", flexWrap: "wrap" },
                            ]}
                        >
                            <View style={{ width: "30%", marginRight: 10 }}>
                                <View style={styles.tableHeader}>
                                    <Text
                                        style={[
                                            styles.firstCell,
                                            { flex: 1, fontSize: 7 },
                                        ]}
                                    >
                                        Timekeeping Attendance Summary
                                    </Text>
                                    <Text
                                        style={[
                                            styles.cell,
                                            { flex: 1, fontSize: 7 },
                                        ]}
                                    >
                                        Total Hours
                                    </Text>
                                </View>
                                {Object.entries(manhourTotals).map(
                                    ([cat, hrs]) => {
                                        if (!hrs || Number(hrs) <= 0)
                                            return null; // skip 0 hours
                                        return (
                                            <View
                                                style={styles.tableRow}
                                                key={cat}
                                            >
                                                <Text
                                                    style={[
                                                        styles.firstCell,
                                                        {
                                                            flex: 1,
                                                            fontSize: 7,
                                                        },
                                                    ]}
                                                >
                                                    {cat}
                                                </Text>
                                                <Text
                                                    style={[
                                                        styles.cell,
                                                        {
                                                            flex: 1,
                                                            fontSize: 7,
                                                        },
                                                    ]}
                                                >
                                                    {displayHoursFixed(hrs)}
                                                </Text>
                                            </View>
                                        );
                                    },
                                )}
                                <View style={styles.tableRow}>
                                    <Text
                                        style={[
                                            styles.firstCell,
                                            { flex: 1, fontSize: 7 },
                                        ]}
                                    >
                                        Break Late
                                    </Text>
                                    <Text
                                        style={[
                                            styles.cell,
                                            { flex: 1, fontSize: 7 },
                                        ]}
                                    >
                                        {displayHoursFixed(totals.late_break)}
                                    </Text>
                                </View>
                                <View style={styles.tableRow}>
                                    <Text
                                        style={[
                                            styles.firstCell,
                                            { flex: 1, fontSize: 7 },
                                        ]}
                                    >
                                        Late
                                    </Text>
                                    <Text
                                        style={[
                                            styles.cell,
                                            { flex: 1, fontSize: 7 },
                                        ]}
                                    >
                                        {displayHoursFixed(totals.late)}
                                    </Text>
                                </View>
                                <View style={styles.tableRow}>
                                    <Text
                                        style={[
                                            styles.firstCell,
                                            { flex: 1, fontSize: 7 },
                                        ]}
                                    >
                                        Undertime
                                    </Text>
                                    <Text
                                        style={[
                                            styles.cell,
                                            { flex: 1, fontSize: 7 },
                                        ]}
                                    >
                                        {displayHoursFixed(totals.undertime)}
                                    </Text>
                                </View>
                                <View style={styles.tableRow}>
                                    <Text
                                        style={[
                                            styles.firstCell,
                                            { flex: 1, fontSize: 7 },
                                        ]}
                                    >
                                        Hours Worked
                                    </Text>
                                    <Text
                                        style={[
                                            styles.cell,
                                            { flex: 1, fontSize: 7 },
                                        ]}
                                    >
                                        {String(
                                            formatNumber(totals.hoursWorked),
                                        )}
                                    </Text>
                                </View>
                                <View style={styles.tableRow}>
                                    <Text
                                        style={[
                                            styles.firstCell,
                                            { flex: 1, fontSize: 7 },
                                        ]}
                                    >
                                        Billable Hours
                                    </Text>
                                    <Text
                                        style={[
                                            styles.cell,
                                            { flex: 1, fontSize: 7 },
                                        ]}
                                    >
                                        {String(formatNumber(totals.hours))}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Signature */}
                        <View style={styles.signatureSection}>
                            <View style={styles.signatureLine} />
                            <Text style={styles.signatureLabel}>
                                {String(emp.employee_name)}
                            </Text>
                        </View>

                        {/* Footer */}
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
