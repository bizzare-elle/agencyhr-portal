import { ApiResponse } from "@/index";
import api from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";
import DataTable, { TableColumn } from "react-data-table-component";
import { useState } from "react";
import {
    formatToMonthDayYear,
    formatToDateTime,
    formatToTime,
} from "@/helpers/formatDates";
import { Badge } from "../ui/badge";
import FullPageLoader from "../page-loader";
import { useQueryClient } from "@tanstack/react-query";
import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface TimeLog {
    id: string;
    app_key: string;
    employee_id: string;
    useremail: string;
    date_time: string;
    clock_type: "Clock-In" | "Clock-Out" | string;
    location: string;
    branch_id: string | null;
    branch_name: string;
    image: string;
    remarks: string | null;
    approved_by: string | null;
    approved_at: string | null;
    is_range: "0" | "1";
    is_logoverride: "0" | "1";
    status: string;
    created_by: string;
    created_at: string;
    updated_by: string | null;
    updated_at: string | null;
    deleted_by: string | null;
    deleted_at: string | null;
}

const columns: TableColumn<TimeLog>[] = [
    {
        name: "Date",
        selector: (row) => row.date_time,
        format: (row) => formatToMonthDayYear(row.date_time),
        maxWidth: "200px",
    },
    {
        name: "Time",
        selector: (row) => row.date_time,
        format: (row) => formatToTime(row.date_time),
        maxWidth: "200px",
    },
    {
        name: "Clock Type",
        selector: (row) => row.clock_type,
    },
    {
        name: "Branch",
        selector: (row) => row.branch_name as string,
    },

    {
        name: "Status",
        cell: () => <Badge className="bg-green-600 text-white">Approved</Badge>,
    },
    {
        name: "Actions",
        cell: (row) => {
            const queryClient = useQueryClient();
            const [selectedType, setSelectedType] = useState<string | null>(
                null,
            );

            const handleWithdraw = async () => {
                try {
                    await api.post(`/api/v2/withdraw_log/${row.id}`);
                    toast.success("Log withdrawn successfully!");
                    queryClient.invalidateQueries({
                        queryKey: ["employee-time-logs"],
                    });
                } catch (error) {
                    toast.error("Failed to withdraw log.");
                }
            };

            const handleChangeClockType = async (type: string) => {
                try {
                    await api.post(`/api/v2/change_clock_type/${row.id}`, {
                        type,
                    });
                    toast.success(`Clock type changed to ${type}!`);
                    queryClient.invalidateQueries({
                        queryKey: ["employee-time-logs"],
                    });
                } catch (error: any) {
                    const message =
                        error?.response?.data?.message ||
                        "Failed to update clock type.";
                    toast.error(message);
                }
            };

            const CLOCK_TYPES = [
                "Clock-In",
                "Clock-Out",
                "Break-In",
                "Break-Out",
            ];

            return (
                <>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="sm">
                                Actions
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel className="text-muted-foreground text-xs">
                                Change Clock Type
                            </DropdownMenuLabel>

                            {CLOCK_TYPES.map((type) => (
                                <DropdownMenuItem
                                    key={type}
                                    onClick={() => setSelectedType(type)}
                                    className={
                                        type === row.clock_type
                                            ? "bg-gray-200 font-bold text-black"
                                            : ""
                                    }
                                >
                                    {type}
                                    {type === row.clock_type && (
                                        <span className="ml-2 text-green-600">
                                            ✔
                                        </span>
                                    )}
                                </DropdownMenuItem>
                            ))}

                            <DropdownMenuSeparator />

                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem className="font-medium text-red-600">
                                        Withdraw Log
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>

                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>
                                            Withdraw Log
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Are you sure you want to withdraw
                                            this log? This action cannot be
                                            undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>
                                            Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleWithdraw}
                                        >
                                            Confirm
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <AlertDialog
                        open={!!selectedType}
                        onOpenChange={(open) => !open && setSelectedType(null)}
                    >
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    Change Clock Type
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to change this log to{" "}
                                    <strong>{selectedType}</strong>?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel
                                    onClick={() => setSelectedType(null)}
                                >
                                    Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => {
                                        if (selectedType) {
                                            handleChangeClockType(selectedType);
                                            setSelectedType(null);
                                        }
                                    }}
                                >
                                    Confirm
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </>
            );
        },
        ignoreRowClick: true,
        allowOverflow: true,
        button: true,
    },
];

export default function TimeLogsTable({ employeeId }: { employeeId: number }) {
    const [page, setPage] = useState<number>(1);
    const [rowsPerPage, setRowsPerPage] = useState<number>(15);

    const { data, isLoading, isError } = useQuery({
        queryKey: ["employee-time-logs", employeeId, page, rowsPerPage],
        queryFn: async () => {
            const response = await api.get<
                ApiResponse<{ records: TimeLog[]; total: number }>
            >(
                `/api/v2/employees/${employeeId}/time-logs?page=${page}&limit=${rowsPerPage}`,
            );
            return response.data;
        },
        placeholderData: (previousData) => previousData,
        staleTime: 10 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });

    if (isLoading) return <FullPageLoader />;

    return (
        <DataTable
            columns={columns}
            progressPending={isLoading}
            data={data?.data.records as TimeLog[]}
            theme="dark"
            paginationPerPage={rowsPerPage}
            sortServer
            pagination
            paginationTotalRows={data?.data.total}
            paginationServer
            onChangePage={(p) => setPage(p)}
            onChangeRowsPerPage={(v) => setRowsPerPage(v)}
            customStyles={{
                header: {
                    style: {
                        fontSize: "16px",
                        fontWeight: 600,
                        color: "#fff",
                        backgroundColor: "#1f2937",
                    },
                },
                headRow: { style: { borderBottom: "1px solid #374151" } },
                headCells: { style: { padding: "10px" } },
                rows: {
                    style: {
                        minHeight: "55px",
                        borderBottom: "1px solid #374151",
                        borderRadius: "8px",
                    },
                },
                cells: { style: { padding: "10px 8px", color: "#d1d5db" } },
                pagination: {
                    style: { backgroundColor: "#111827", color: "#fff" },
                },
            }}
        />
    );
}
