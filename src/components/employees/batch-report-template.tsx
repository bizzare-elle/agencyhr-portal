import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { format } from "date-fns";
import moment from "moment";
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
    page: { padding: 15, fontSize: 8, fontFamily: "Helvetica" },
    header: {
        marginBottom: 6,
        borderBottomWidth: 1,
        borderBottomColor: "#000",
        paddingBottom: 4,
    },
    title: { fontSize: 12, fontWeight: "bold" },
    subtitle: { fontSize: 8, color: "gray" },
    section: { marginBottom: 6 },
    tableHeader: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#000",
        backgroundColor: "#d9e1f2",
        paddingVertical: 2,
        alignItems: "center",
    },
    tableRow: {
        flexDirection: "row",
        borderBottomWidth: 0.5,
        borderBottomColor: "#ccc",
        paddingVertical: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    cell: {
        flex: 1,
        textAlign: "center",
        borderLeftWidth: 1,
        borderLeftColor: "#000",
        paddingHorizontal: 2,
    },
    lastCell: { borderRightWidth: 1, borderRightColor: "#000" },
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
        left: 15,
        right: 15,
        fontSize: 6,
        textAlign: "right",
        color: "gray",
    },
});

export const ConsolidatedTimeRecordsPDF = ({
    recordsByEmployee,
}: ConsolidatedPDFProps) => {
    const displayHoursFixed = (hrs: number | string | null | undefined) =>
        Number(hrs ?? 0).toFixed(2);

    const renderCellStyle = (value: number | string | null | undefined) => {
        if (value === "No Data" || value === null || value === undefined) {
            return { color: "red", fontWeight: "bold" };
        }
        const num = Number(value ?? 0);
        return {
            color: num > 0 ? "red" : "black",
            fontWeight: num > 0 ? "bold" : "normal",
        };
    };

    return (
        <Document>
            {recordsByEmployee.map((emp, idx) => {
                const totals = emp.time_records.reduce(
                    (acc, rec) => {
                        acc.late_break += Number(rec.late_break ?? 0);
                        acc.late += Number(rec.late ?? 0);
                        acc.overtime += Number(rec.overtime ?? 0);
                        acc.undertime += Number(rec.undertime ?? 0);
                        acc.hours += Number(rec.hours ?? 0);
                        return acc;
                    },
                    {
                        late_break: 0,
                        late: 0,
                        overtime: 0,
                        undertime: 0,
                        hours: 0,
                    },
                );

                return (
                    <Page key={emp.id} size="A4" style={styles.page}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.title}>
                                Employee Time Records
                            </Text>
                            <Text style={styles.subtitle}>
                                Generated: {format(new Date(), "PPpp")}
                            </Text>
                        </View>

                        {/* Employee Info */}
                        <View style={styles.section}>
                            <Text>Name: {emp.employee_name}</Text>
                            <Text>ID Number: {emp.id_number}</Text>
                            <Text>Branch: {emp.branch}</Text>
                            <Text>Agency: {emp.agency_name}</Text>
                        </View>

                        {/* Table Header */}
                        <View style={styles.tableHeader}>
                            <Text style={[styles.cell, { flex: 1 }]}>Date</Text>
                            <Text style={[styles.cell, { flex: 1 }]}>
                                Schedule
                            </Text>
                            <Text style={[styles.cell, { flex: 1 }]}>
                                Branch In/Out
                            </Text>
                            <Text style={[styles.cell, { flex: 0.8 }]}>
                                Time In
                            </Text>
                            <Text style={[styles.cell, { flex: 0.8 }]}>
                                Break Out
                            </Text>
                            <Text style={[styles.cell, { flex: 0.8 }]}>
                                Break In
                            </Text>
                            <Text style={[styles.cell, { flex: 0.8 }]}>
                                Time Out
                            </Text>
                            <Text style={[styles.cell, { flex: 0.6 }]}>OT</Text>
                            <Text style={[styles.cell, { flex: 0.6 }]}>
                                Break Late
                            </Text>
                            <Text style={[styles.cell, { flex: 0.6 }]}>
                                Late
                            </Text>
                            <Text style={[styles.cell, { flex: 0.6 }]}>
                                Undertime
                            </Text>
                            <Text
                                style={[
                                    styles.cell,
                                    { flex: 0.8 },
                                    styles.lastCell,
                                ]}
                            >
                                Total Hrs
                            </Text>
                        </View>

                        {/* Table Rows */}
                        {emp.time_records.map((rec, i) => {
                            const timeIn = rec.time_in ?? "No Data";
                            const timeOut = rec.time_out ?? "No Data";
                            const breakIn = rec.break_in ?? "No Data";
                            const breakOut = rec.break_out ?? "No Data";

                            return (
                                <View style={styles.tableRow} key={i}>
                                    <Text style={[styles.cell, { flex: 1 }]}>
                                        {moment(rec.date).format("LL")}
                                    </Text>
                                    <Text style={[styles.cell, { flex: 1 }]}>
                                        {rec.schedule ?? "No Data"}
                                    </Text>
                                    <Text style={[styles.cell, { flex: 1 }]}>
                                        {rec.branch_timeIn === "No data" &&
                                        rec.branch_timeOut === "No data"
                                            ? "No Data"
                                            : `In: ${rec.branch_timeIn ?? "N/A"} / Out: ${rec.branch_timeOut ?? "N/A"}`}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.cell,
                                            { flex: 0.8 },
                                            renderCellStyle(timeIn),
                                        ]}
                                    >
                                        {timeIn}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.cell,
                                            { flex: 0.8 },
                                            renderCellStyle(breakOut),
                                        ]}
                                    >
                                        {breakOut}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.cell,
                                            { flex: 0.8 },
                                            renderCellStyle(breakIn),
                                        ]}
                                    >
                                        {breakIn}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.cell,
                                            { flex: 0.8 },
                                            renderCellStyle(timeOut),
                                        ]}
                                    >
                                        {timeOut}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.cell,
                                            { flex: 0.6 },
                                            renderCellStyle(rec.overtime),
                                        ]}
                                    >
                                        {Number(rec.overtime ?? 0)
                                            ? formatNumber(rec.overtime)
                                            : "No Filed"}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.cell,
                                            { flex: 0.6 },
                                            renderCellStyle(rec.late_break),
                                        ]}
                                    >
                                        {Number(rec.late_break ?? 0).toFixed(2)}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.cell,
                                            { flex: 0.6 },
                                            renderCellStyle(rec.late),
                                        ]}
                                    >
                                        {Number(rec.late ?? 0).toFixed(2)}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.cell,
                                            { flex: 0.6 },
                                            renderCellStyle(rec.undertime),
                                        ]}
                                    >
                                        {Number(rec.undertime ?? 0).toFixed(2)}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.cell,
                                            { flex: 0.8 },
                                            styles.lastCell,
                                        ]}
                                    >
                                        {formatNumber(rec.hours ?? 0)}
                                    </Text>
                                </View>
                            );
                        })}

                        {/* Totals */}
                        <View style={styles.totals}>
                            <Text>
                                Total Overtime: {formatNumber(totals.overtime)}
                            </Text>
                            <Text>
                                Total Break Late: {totals.late_break.toFixed(2)}
                            </Text>
                            <Text>Total Late: {totals.late.toFixed(2)}</Text>
                            <Text>
                                Total Undertime: {totals.undertime.toFixed(2)}
                            </Text>
                            <Text>
                                Total Hours Worked: {formatNumber(totals.hours)}
                            </Text>
                        </View>

                        {/* Signature */}
                        <View style={styles.signatureSection}>
                            <View style={styles.signatureLine} />
                            <Text style={styles.signatureLabel}>
                                {emp.employee_name}
                            </Text>
                        </View>

                        {/* Footer */}
                        <Text style={styles.footer}>
                            Page {idx + 1} of {recordsByEmployee.length}
                        </Text>
                    </Page>
                );
            })}
        </Document>
    );
};
