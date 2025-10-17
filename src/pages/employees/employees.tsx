import { useQuery } from "@tanstack/react-query";
import DataTable, { TableColumn } from "react-data-table-component";
import api from "@/lib/axios";
import { ApiResponse } from "@/index";
import { Badge } from "@/components/ui/badge";
import { formateToMonthDayYear } from "@/helpers/formatDates";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import FullPageLoader from "@/components/page-loader";
import { toast } from "sonner";
import { format } from "date-fns";
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, FileDown } from "lucide-react";
import CustomSelect from "@/components/custom-select";
import { Employee } from "@/index";
import { ConsolidatedTimeRecordsPDF } from "@/components/employees/batch-report-template";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Spinner } from "@/components/ui/spinner";
import { TimeRecord } from "@/index";
import { Link } from "react-router-dom";

const columns: TableColumn<Employee>[] = [
    { name: "ID", selector: (row) => row.id, sortable: true },
    { name: "Name", selector: (row) => row.name, sortable: true },
    { name: "Branch", selector: (row) => row.branch_id },
    { name: "Department", selector: (row) => row.department },
    {
        name: "Status",
        cell: (row) => {
            if (row.employment_status === "Active")
                return (
                    <Badge className="bg-green-700 text-white">Active</Badge>
                );
            if (row.employment_status === "Resign")
                return <Badge variant="destructive">Resigned</Badge>;
            return <Badge className="bg-gray-600 text-white">Terminated</Badge>;
        },
    },
    {
        name: "Created At",
        selector: (row) => row.created_at,
        format: (row) => formateToMonthDayYear(row.created_at),
    },
    {
        name: "Action",
        cell: (row) => (
            <Button variant="default">
                <Link to={`/employees/${row.id}`}>View Profile</Link>
            </Button>
        ),
    },
];

export default function Employees() {
    const [page, setPage] = useState<number>(1);
    const [rowsPerPage, setRowsPerPage] = useState<number>(15);
    const [search, setSearch] = useState<string>("");
    const [cutOffDate, setCutOffDate] = useState<Date | undefined>();
    const [isConsolidating, setIsConsolidating] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState<string>("");
    const [consolidatedData, setConsolidatedData] = useState<any[]>([]);

    const meQuery = useQuery({
        queryKey: ["me"],
        queryFn: async () => {
            const response = await api.get<
                ApiResponse<{
                    hr_id: string;
                    name: string;
                    role: string;
                    agency_id: string;
                }>
            >(`/api/v2/auth/me`);
            return response.data.data;
        },
    });

    const { data, isLoading, isError } = useQuery({
        queryKey: ["employees", page, rowsPerPage, search],
        queryFn: async () => {
            const response = await api.get<
                ApiResponse<{ total: number; records: Employee[] }>
            >(
                `/api/v2/employees?search=${search}&page=${page}&limit=${rowsPerPage}`,
            );
            return response.data;
        },
        placeholderData: (previousData) => previousData,
    });

    const handleConsolidate = async () => {
        if (!cutOffDate) {
            toast.error("Please select a cut off date");
            return;
        }

        try {
            setIsConsolidating(true);
            const agency_id = meQuery.data?.agency_id;
            const branch_id = selectedBranch;

            const consolidateResponse = await api.post(
                "/api/v2/time-records/consolidate_agency",
                {
                    agency_id,
                    cut_off_date: format(cutOffDate, "yyyy-MM-dd"),
                    branch_id,
                },
            );

            toast.success("Consolidation successfully completed!");

            const employee_ids = consolidateResponse.data.employee_ids || [];
            if (employee_ids.length === 0) {
                setConsolidatedData([]);
                return;
            }

            const day = cutOffDate.getDate();
            const month = cutOffDate.getMonth() + 1;
            const year = cutOffDate.getFullYear();
            const lastDay = new Date(year, month, 0).getDate();

            const date_from =
                day > 15 ? `${year}-${month}-16` : `${year}-${month}-01`;
            const date_to =
                day > 15
                    ? `${year}-${month}-${lastDay}`
                    : `${year}-${month}-15`;
            const allRecords: TimeRecord[] = [];

            for (const emp_id of employee_ids) {
                const res = await api.get<
                    ApiResponse<{ time_records: TimeRecord[] }>
                >(
                    `/api/v2/time-records/${emp_id}?from=${date_from}&to=${date_to}`,
                );

                if (res.data.data.time_records?.length) {
                    allRecords.push(...res.data.data.time_records);
                }
            }

            const groupedByEmployee = employee_ids
                .map((emp_id: any) => {
                    const empRecords = allRecords.filter(
                        (r) => r.employee_id === emp_id,
                    );
                    if (!empRecords.length) return null;

                    return {
                        id: emp_id,
                        employee_name: empRecords[0].employee_name,
                        id_number: empRecords[0].id_number,
                        branch: empRecords[0].branch_name,
                        department: empRecords[0].department_name,
                        employment_status: empRecords[0].employment_status,
                        agency_name: empRecords[0].agency_name,
                        time_records: empRecords.map((rec) => ({
                            date: rec.cut_off,
                            schedule_name: rec.schedule_name,
                            time_in: rec.clock_in,
                            time_out: rec.clock_out,
                            break_in: rec.break_in,
                            break_out: rec.break_out,
                            hours: rec.total_hrs,
                            late: rec.total_hrs_late,
                            overtime: rec.total_overtime,
                        })),
                    };
                })
                .filter(Boolean);

            console.log("Grouped by employee:", groupedByEmployee);

            setConsolidatedData(groupedByEmployee);
        } catch (error: any) {
            console.error(error);
            toast.error("Consolidation Failed!");
        } finally {
            toast.success("Consolidation successfully completed!");
            setIsConsolidating(false);
        }
    };

    if (isLoading) return <FullPageLoader />;

    if (isError) {
        return (
            <div className="flex h-64 flex-col items-center justify-center text-red-500">
                <p>Failed to load employees.</p>
                <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    className="mt-3"
                >
                    Retry
                </Button>
            </div>
        );
    }

    const employees = data?.data.records ?? [];

    return (
        <div className="mx-auto w-full max-w-[1600px] space-y-8 p-6">
            <div className="flex flex-col gap-1">
                <h3 className="text-lg font-semibold">Employees</h3>
                <span className="text-sm text-white/50">
                    View Employee Profiles. Generate and Consolidate time
                    records.
                </span>
            </div>

            <div className="flex items-end justify-between gap-4">
                <Input
                    type="text"
                    placeholder="Search Employee..."
                    className="max-w-[250px]"
                    onChange={(e) => setSearch(e.target.value)}
                />

                <div className="flex items-center gap-3">
                    {/* 🔹 Date Picker */}
                    <div className="space-y-1">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-[180px] justify-start text-left font-normal"
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {cutOffDate ? (
                                        format(cutOffDate, "MMM d, yyyy")
                                    ) : (
                                        <span>Pick date</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={cutOffDate}
                                    onSelect={setCutOffDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    {/* 🔹 Branch Select */}
                    <CustomSelect
                        apiUrl="api/v2/get_branch"
                        value={selectedBranch}
                        onChange={(value) => setSelectedBranch(value)}
                        placeholder="Select branch..."
                    />
                    <Button
                        onClick={handleConsolidate}
                        disabled={isConsolidating}
                        className={isConsolidating ? "" : "bg-yellow-500"}
                    >
                        {isConsolidating ? (
                            <>
                                <Spinner className="mr-2 h-4 w-4" />
                                Consolidating...
                            </>
                        ) : (
                            "Consolidate"
                        )}
                    </Button>

                    {consolidatedData.length > 0 && (
                        <PDFDownloadLink
                            document={
                                <ConsolidatedTimeRecordsPDF
                                    recordsByEmployee={consolidatedData}
                                />
                            }
                            fileName={`Consolidated_Time_Records_${format(
                                cutOffDate!,
                                "yyyyMMdd",
                            )}.pdf`}
                        >
                            {({ loading }) => (
                                <Button
                                    variant={loading ? "secondary" : "default"}
                                    className="flex items-center gap-2"
                                >
                                    <FileDown className="h-4 w-4" />
                                    {loading
                                        ? "Preparing PDF..."
                                        : "Download PDF"}
                                </Button>
                            )}
                        </PDFDownloadLink>
                    )}

                    {/* {consolidatedData.length === 0 && (
                        <span className="text-sm text-gray-400">
                            No consolidated time records to generate PDF
                        </span>
                    )} */}
                </div>
            </div>

            <Card>
                <CardContent>
                    <DataTable
                        columns={columns}
                        data={employees}
                        pagination
                        paginationServer
                        theme="dark"
                        responsive
                        progressPending={isLoading}
                        paginationPerPage={rowsPerPage}
                        onChangePage={(page) => setPage(page)}
                        onChangeRowsPerPage={(value) => setRowsPerPage(value)}
                        paginationTotalRows={data?.data.total || 0}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
