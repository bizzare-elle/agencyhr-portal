import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { format } from "date-fns";
import { TimeRecord } from "@/index";
import moment from "moment";
import { text } from "stream/consumers";

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
        backgroundColor: "#f0f0f0",
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
        {recordsByEmployee.map((emp, idx) => (
            <Page key={emp.id} size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.title}>Employee Time Records</Text>
                    <Text style={styles.subtitle}>
                        Generated: {format(new Date(), "PPpp")}
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text>Name: {emp.employee_name}</Text>
                    <Text>ID Number: {emp.id_number}</Text>
                    <Text>Branch: {emp.branch}</Text>
                    <Text>Department: {emp.department}</Text>
                    <Text
                        style={{
                            fontSize: 14,
                            fontWeight: "bold",
                            textAlign: "center",
                            marginTop: 4,
                            marginBottom: 4,
                        }}
                    >
                        {emp.agency_name}
                    </Text>
                </View>

                <View style={styles.tableHeader}>
                    <Text style={[styles.cell, { flex: 1.2 }]}>Date</Text>
                    <Text style={[styles.cell, { flex: 1 }]}>Day</Text>
                    <Text style={[styles.cell, { flex: 1.2 }]}>
                        Schedule Type
                    </Text>
                    <Text style={[styles.cell, { flex: 1 }]}>Time In</Text>
                    <Text style={[styles.cell, { flex: 1 }]}>Time Out</Text>
                    <Text style={[styles.cell, { flex: 1 }]}>Break In</Text>
                    <Text style={[styles.cell, { flex: 1 }]}>Break Out</Text>
                    <Text style={[styles.cell, { flex: 1 }]}>Late</Text>
                    <Text style={[styles.cell, { flex: 1 }]}>
                        Total Overtime
                    </Text>
                    <Text style={[styles.cell, { flex: 0.8 }]}>
                        Total Hours
                    </Text>
                </View>

                {emp.time_records.map((rec, i) => (
                    <View style={styles.tableRow} key={i}>
                        <Text style={[styles.cell, { flex: 1.2 }]}>
                            {rec.date
                                ? format(new Date(rec.date), "MMM dd, yyyy")
                                : "-"}
                        </Text>
                        <Text style={[styles.cell, { flex: 1 }]}>
                            {rec.date
                                ? format(new Date(rec.date), "EEEE")
                                : "-"}
                        </Text>
                        <Text style={[styles.cell, { flex: 1.2 }]}>
                            {rec.schedule_name}
                        </Text>
                        <Text
                            style={[
                                styles.cell,
                                { flex: 1 },
                                !rec.time_in ? { color: "red" } : {},
                            ]}
                        >
                            {rec.time_in
                                ? moment(rec.time_in, "HH:mm:ss").format(
                                      "hh:mm A",
                                  )
                                : "No Data"}
                        </Text>

                        <Text
                            style={[
                                styles.cell,
                                { flex: 1 },
                                !rec.time_out ? { color: "red" } : {},
                            ]}
                        >
                            {rec.time_out
                                ? moment(rec.time_out, "HH:mm:ss").format(
                                      "hh:mm A",
                                  )
                                : "No Data"}
                        </Text>

                        <Text
                            style={[
                                styles.cell,
                                { flex: 1 },
                                !rec.break_in ? { color: "red" } : {},
                            ]}
                        >
                            {rec.break_in
                                ? moment(rec.break_in, "HH:mm:ss").format(
                                      "hh:mm A",
                                  )
                                : "No Data"}
                        </Text>

                        <Text
                            style={[
                                styles.cell,
                                { flex: 1 },
                                !rec.break_out ? { color: "red" } : {},
                            ]}
                        >
                            {rec.break_out
                                ? moment(rec.break_out, "HH:mm:ss").format(
                                      "hh:mm A",
                                  )
                                : "No Data"}
                        </Text>

                        <Text
                            style={[
                                styles.cell,
                                { flex: 1 },
                                rec.late !== null && rec.late !== "0"
                                    ? { color: "red" }
                                    : {},
                            ]}
                        >
                            {rec.late}
                        </Text>

                        <Text style={[styles.cell, { flex: 1 }]}>
                            {rec.overtime}
                        </Text>
                        <Text style={[styles.cell, { flex: 0.8 }]}>
                            {rec.hours}
                        </Text>
                    </View>
                ))}

                <View style={{ marginTop: 6 }}>
                    <Text>
                        Total Hours Worked:{" "}
                        {emp.time_records
                            .reduce(
                                (sum, rec) =>
                                    sum + parseFloat(rec.hours || "0"),
                                0,
                            )
                            .toFixed(2)}
                    </Text>
                    <Text>
                        Total Overtime:{" "}
                        {emp.time_records
                            .reduce(
                                (sum, rec) =>
                                    sum + parseFloat(rec.overtime || "0"),
                                0,
                            )
                            .toFixed(2)}
                    </Text>
                    <Text>
                        Total Late:{" "}
                        {emp.time_records
                            .reduce(
                                (sum, rec) => sum + parseFloat(rec.late || "0"),
                                0,
                            )
                            .toFixed(2)}
                    </Text>
                </View>

                <Text style={styles.footer}>
                    Page {idx + 1} of {recordsByEmployee.length}
                </Text>
            </Page>
        ))}
    </Document>
);
