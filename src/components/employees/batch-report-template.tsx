import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { format } from "date-fns";
import moment from "moment";
import { minutesToHours } from "@/helpers/computeHours";
import { TimeRecord } from "@/index";
import { formatTime, formatNumber } from "@/helpers/formatDates";
import { exit } from "process";

interface EmployeeData {
    id: string;
    employee_name: string;
    id_number: string;
    branch: string;
    agency_name: string;
    department: string;
    employment_status: string;
    time_records: TimeRecord[];
}

interface ConsolidatedPDFProps {
    recordsByEmployee: EmployeeData[];
}

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontSize: 10,
        fontFamily: "Helvetica",
    },
    header: {
        marginBottom: 10,
        borderBottom: "1 solid #000",
        paddingBottom: 4,
    },
    title: {
        fontSize: 14,
        fontWeight: "bold",
    },
    subtitle: {
        fontSize: 10,
        color: "gray",
    },
    section: {
        marginTop: 10,
        marginBottom: 10,
    },
    tableHeader: {
        flexDirection: "row",
        borderBottom: "1 solid #000",
        paddingVertical: 4,
        backgroundColor: "#d9e1f2",
        fontWeight: "bold",
    },
    tableRow: {
        flexDirection: "row",
        borderBottom: "0.5 solid #ccc",
        paddingVertical: 2,
    },
    cell: {
        flex: 1,
        textAlign: "center",
    },
    totals: {
        marginTop: 8,
        borderTop: "1 solid #000",
        paddingTop: 4,
    },
    signatureSection: {
        marginTop: 60,
        alignItems: "center",
        textAlign: "center",
    },
    signatureLine: {
        borderTop: "1 solid #000",
        marginTop: 30,
        width: "50%",
    },
    signatureLabel: {
        fontSize: 9,
        marginTop: 4,
    },
    footer: {
        position: "absolute",
        bottom: 20,
        left: 30,
        right: 30,
        fontSize: 8,
        textAlign: "right",
        color: "gray",
    },
});

export const ConsolidatedTimeRecordsPDF = ({
    recordsByEmployee,
}: ConsolidatedPDFProps) => (
    <Document>
        {recordsByEmployee.map((emp, idx) => {
            const totals = emp.time_records.reduce(
                (acc, rec) => {
                    acc.late += minutesToHours(rec.late);
                    acc.overtime += Number(rec.overtime) || 0;
                    acc.undertime += minutesToHours(rec.undertime);
                    acc.hours += Number(rec.hours) || 0;
                    return acc;
                },
                { late: 0, overtime: 0, undertime: 0, hours: 0, billable: 0 },
            );

            return (
                <Page key={emp.id} size="A4" style={styles.page}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Employee Time Records</Text>
                        <Text style={styles.subtitle}>
                            Generated: {format(new Date(), "PPpp")}
                        </Text>
                    </View>

                    {/* Employee Info */}
                    <View style={styles.section}>
                        <Text>Name: {emp.employee_name}</Text>
                        <Text>ID Number: {emp.id_number}</Text>
                        <Text>Branch: {emp.branch}</Text>
                        <Text>Department: {emp.department}</Text>
                        <Text>Agency: {emp.agency_name}</Text>
                    </View>

                    {/* Table Header */}
                    <View style={styles.tableHeader}>
                        <Text style={[styles.cell, { flex: 1.2 }]}>Date</Text>
                        <Text style={[styles.cell, { flex: 1 }]}>Schedule</Text>
                        <Text style={[styles.cell, { flex: 1 }]}>Time In</Text>
                        <Text style={[styles.cell, { flex: 1 }]}>Break In</Text>
                        <Text style={[styles.cell, { flex: 1 }]}>
                            Break Out
                        </Text>
                        <Text style={[styles.cell, { flex: 1 }]}>Time Out</Text>
                        <Text style={[styles.cell, { flex: 0.8 }]}>
                            Late (hrs)
                        </Text>
                        <Text style={[styles.cell, { flex: 0.8 }]}>
                            Overtime (hrs)
                        </Text>
                        <Text style={[styles.cell, { flex: 0.8 }]}>
                            Undertime (hrs)
                        </Text>
                        <Text style={[styles.cell, { flex: 1 }]}>
                            Total Hours Worked
                        </Text>
                    </View>

                    {emp.time_records.map((rec, i) => {
                        const late = minutesToHours(rec.late);
                        const undertime = minutesToHours(rec.undertime);
                        const overtime = Number(rec.overtime) || 0;
                        const hours = Number(rec.hours) || 0;

                        return (
                            <View style={styles.tableRow} key={i}>
                                <Text style={[styles.cell, { flex: 1.2 }]}>
                                    {moment(rec.date).format("MMM DD, YYYY")}
                                </Text>
                                <Text style={[styles.cell, { flex: 1 }]}>
                                    {rec.schedule || ""}
                                </Text>
                                <Text style={[styles.cell, { flex: 1 }]}>
                                    {formatTime(rec.time_in)}
                                </Text>
                                <Text style={[styles.cell, { flex: 1 }]}>
                                    {formatTime(rec.break_in)}
                                </Text>
                                <Text style={[styles.cell, { flex: 1 }]}>
                                    {formatTime(rec.break_out)}
                                </Text>
                                <Text style={[styles.cell, { flex: 1 }]}>
                                    {formatTime(rec.time_out)}
                                </Text>
                                <Text style={[styles.cell, { flex: 0.8 }]}>
                                    {formatNumber(late)}
                                </Text>
                                <Text style={[styles.cell, { flex: 0.8 }]}>
                                    {formatNumber(overtime)}
                                </Text>
                                <Text style={[styles.cell, { flex: 0.8 }]}>
                                    {formatNumber(undertime)}
                                </Text>
                                <Text style={[styles.cell, { flex: 1 }]}>
                                    {formatNumber(hours)}
                                </Text>
                            </View>
                        );
                    })}

                    {/* Totals Section */}
                    <View style={styles.totals}>
                        <Text>Total Late (hrs): {totals.late.toFixed(2)}</Text>
                        <Text>
                            Total Overtime (hrs): {totals.overtime.toFixed(2)}
                        </Text>
                        <Text>
                            Total Undertime (hrs): {totals.undertime.toFixed(2)}
                        </Text>
                        <Text>
                            Total Hours Worked: {totals.hours.toFixed(2)}
                        </Text>
                    </View>

                    <View style={styles.signatureSection}>
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureLabel}>
                            {emp.employee_name}
                        </Text>
                    </View>

                    <Text style={styles.footer}>
                        Page {idx + 1} of {recordsByEmployee.length}
                    </Text>
                </Page>
            );
        })}
    </Document>
);
