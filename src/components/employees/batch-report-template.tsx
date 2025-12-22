import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { format } from "date-fns";
import moment from "moment";
import { minutesToHours } from "@/helpers/computeHours";
import { TimeRecord } from "@/index";
import { formatTime, formatNumber } from "@/helpers/formatDates";
import { displayHours } from "@/helpers/computeHours";
import { cn } from "@/lib/utils";

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
    page: {
        padding: 15,
        fontSize: 8,
        fontFamily: "Helvetica",
    },
    header: {
        marginBottom: 6,
        borderBottom: "1 solid #000",
        paddingBottom: 2,
    },
    title: { fontSize: 12, fontWeight: "bold" },
    subtitle: { fontSize: 8, color: "gray" },
    section: { marginBottom: 6 },
    tableHeader: {
        flexDirection: "row",
        borderBottom: "1 solid #000",
        paddingVertical: 2,
        backgroundColor: "#d9e1f2",
    },
    tableRow: {
        flexDirection: "row",
        borderBottom: "0.5 solid #ccc",
        paddingVertical: 1,
    },
    cell: { flex: 1, textAlign: "center" },
    totals: {
        marginTop: 4,
        borderTop: "1 solid #000",
        paddingTop: 2,
        fontSize: 8,
    },
    signatureSection: { marginTop: 20, alignItems: "center" },
    signatureLine: { borderTop: "1 solid #000", width: "40%", marginTop: 20 },
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
    const displayHours = (hrs: number | null | undefined) => {
        const h = Number(hrs ?? 0);
        return h.toFixed(2);
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
                        <View
                            style={[
                                styles.tableHeader,
                                { alignItems: "center" },
                            ]}
                        >
                            <Text style={[styles.cell, { flex: 1 }]}>Date</Text>
                            <Text style={[styles.cell, { flex: 1 }]}>
                                Schedule
                            </Text>
                            <Text style={[styles.cell, { flex: 1 }]}>
                                Branch Location In/Out
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
                            <Text style={[styles.cell, { flex: 0.8 }]}>
                                Total Hrs
                            </Text>
                        </View>

                        {/* Table Rows */}
                        {emp.time_records.map((rec, i) => (
                            <View
                                style={[
                                    styles.tableRow,
                                    {
                                        alignItems: "center",
                                        justifyContent: "center",
                                    },
                                ]}
                                key={i}
                            >
                                <Text style={[styles.cell, { flex: 1 }]}>
                                    {moment(rec.date).format("LL")}
                                </Text>
                                <Text style={[styles.cell, { flex: 1 }]}>
                                    {rec.schedule ?? "No data"}
                                </Text>
                                <Text style={[styles.cell, { flex: 1 }]}>
                                    {rec.branch_timeIn === "No data" &&
                                    rec.branch_timeOut === "No data"
                                        ? "No data"
                                        : `In: ${rec.branch_timeIn ?? "N/A"} / Out: ${rec.branch_timeOut ?? "N/A"}`}
                                </Text>
                                <Text style={[styles.cell, { flex: 0.8 }]}>
                                    {rec.time_in
                                        ? formatTime(rec.time_in)
                                        : "No Data"}
                                </Text>
                                <Text style={[styles.cell, { flex: 0.8 }]}>
                                    {rec.break_out
                                        ? formatTime(rec.break_out)
                                        : "No Data"}
                                </Text>
                                <Text style={[styles.cell, { flex: 0.8 }]}>
                                    {rec.break_in
                                        ? formatTime(rec.break_in)
                                        : "No Data"}
                                </Text>
                                <Text style={[styles.cell, { flex: 0.8 }]}>
                                    {rec.time_out
                                        ? formatTime(rec.time_out)
                                        : "No Data"}
                                </Text>
                                <Text style={[styles.cell, { flex: 0.6 }]}>
                                    {Number(rec.overtime ?? 0)
                                        ? formatNumber(rec.overtime)
                                        : "No Filed"}
                                </Text>
                                <Text
                                    style={[
                                        styles.cell,
                                        {
                                            flex: 0.6,
                                            color: Number(rec.late_break ?? 0)
                                                ? "red"
                                                : "black",
                                            fontWeight: Number(
                                                rec.late_break ?? 0,
                                            )
                                                ? "bold"
                                                : "normal",
                                        },
                                    ]}
                                >
                                    {displayHours(rec.late_break)}
                                </Text>
                                <Text
                                    style={[
                                        styles.cell,
                                        {
                                            flex: 0.6,
                                            color: Number(rec.late ?? 0)
                                                ? "red"
                                                : "black",
                                            fontWeight: Number(rec.late ?? 0)
                                                ? "bold"
                                                : "normal",
                                        },
                                    ]}
                                >
                                    {displayHours(Number(rec.late ?? 0))}
                                </Text>
                                <Text style={[styles.cell, { flex: 0.6 }]}>
                                    {displayHours(Number(rec.undertime ?? 0))}
                                </Text>
                                <Text style={[styles.cell, { flex: 0.8 }]}>
                                    {formatNumber(rec.hours ?? 0)}
                                </Text>
                            </View>
                        ))}

                        {/* Totals */}
                        <View style={styles.totals}>
                            <Text>
                                Total Overtime: {formatNumber(totals.overtime)}
                            </Text>
                            <Text>
                                Total Break Late:{" "}
                                {displayHours(totals.late_break)}
                            </Text>
                            <Text>Total Late: {displayHours(totals.late)}</Text>
                            <Text>
                                Total Undertime:{" "}
                                {displayHours(totals.undertime)}
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
