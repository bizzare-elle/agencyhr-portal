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
import {
    Dialog,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "../ui/dialog";
import { Button } from "../ui/button";
import FullPageLoader from "../page-loader";

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
        name: "ID",
        selector: (row) => row.id,
        maxWidth: "100px",
        sortable: true,
    },
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
        name: "Location",
        selector: (row) => row.location as string,
    },
    {
        name: "Image",
        cell: (row) => {
            let imageSrc = "";
            const cutoffDate = new Date("2025-06-01T00:00:00");
            const recordDate = new Date(row.date_time);

            const appName =
                recordDate >= cutoffDate
                    ? "WFPhonetrics-373955958"
                    : "AtlasAgencyTimeTrackerv2-373955958";
            const tableName =
                recordDate >= cutoffDate ? "Sheet1" : "hr_time_tracker";
            if (row.image && row.image.startsWith("http")) {
                imageSrc = row.image;
            } else if (row.image && row.image.includes("Sheet1_Images")) {
                const encodedImage = encodeURIComponent(row.image).replace(
                    /%2F/g,
                    "/",
                );
                imageSrc = `http://localhost/backoffice/${encodedImage}`;
            } else if (row.image) {
                const cleanFileName = row.image.replace(/^.*[\\/]/, "");

                const primaryAppSheet = `https://www.appsheet.com/template/getappfileurl?appName=${appName}&tableName=${tableName}&fileName=${row.image}`;

                const secondaryAppSheet = `https://www.appsheet.com/template/getappfileurl?appName=${appName}&tableName=${tableName}&fileName=Image_Back_Up/${row.image}`;

                if (
                    row.image.includes("AppBackup") ||
                    row.image.includes("ImagesBackup")
                ) {
                    imageSrc = secondaryAppSheet;
                } else {
                    imageSrc = primaryAppSheet;
                }
            }

            // Warn if no image could be resolved
            if (!imageSrc) {
                console.warn("Missing image for record:", row);
            }

            return (
                <Dialog>
                    <DialogTrigger className="cursor-pointer">
                        <img
                            className="max-h-[50px]"
                            src={imageSrc}
                            alt="N/A"
                            onError={(e) => {
                                const target =
                                    e.currentTarget as HTMLImageElement;
                                const cleanFileName = row.image?.replace(
                                    /^.*[\\/]/,
                                    "",
                                );
                                target.src = `https://www.appsheet.com/template/getappfileurl?appName=${appName}&tableName=${tableName}&fileName=Image_Back_Up/${cleanFileName}`;
                            }}
                        />
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Time Log Image</DialogTitle>
                            <DialogDescription>
                                {formatToDateTime(row.date_time)}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex items-center justify-center object-contain">
                            <img
                                className="max-h-[400px]"
                                src={imageSrc}
                                alt="Time Log"
                                onError={(e) => {
                                    const target =
                                        e.currentTarget as HTMLImageElement;
                                    const cleanFileName = row.image?.replace(
                                        /^.*[\\/]/,
                                        "",
                                    );
                                    target.src = `https://www.appsheet.com/template/getappfileurl?appName=${appName}&tableName=${tableName}&fileName=Image_Back_Up/${cleanFileName}`;
                                }}
                            />
                        </div>
                        <DialogFooter className="mt-4">
                            <DialogClose asChild>
                                <Button variant="secondary">Close</Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            );
        },
    },
    {
        name: "Status",
        cell: () => <Badge className="bg-green-600 text-white">Approved</Badge>,
    },
];

export default function TimeLogsTable({ employeeId }: { employeeId: number }) {
    const [page, setPage] = useState<number>(1);
    const [rowsPerPage, setRowsPerPage] = useState<number>(15);

    const { data, isLoading, isError } = useQuery({
        queryKey: ["employee-time-logs", employeeId, page, rowsPerPage],
        queryFn: async function () {
            const response = await api.get<
                ApiResponse<{ records: TimeLog[]; total: number }>
            >(
                `/api/v2/employees/${employeeId}/time-logs?page=${page}&limit=${rowsPerPage}`,
            );

            return response.data;
        },
        placeholderData: (previousData) => previousData,
    });

    if (isLoading) {
        return <FullPageLoader />;
    }

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
            onChangePage={(page) => setPage(page)}
            onChangeRowsPerPage={(value) => setRowsPerPage(value)}
            customStyles={{
                header: {
                    style: {
                        fontSize: "16px",
                        fontWeight: 600,
                        color: "#fff",
                        backgroundColor: "#1f2937",
                    },
                },
                headRow: {
                    style: {
                        borderBottom: "1px solid #374151",
                    },
                },
                headCells: {
                    style: {
                        padding: "10px",
                    },
                },
                rows: {
                    style: {
                        minHeight: "55px",
                        borderBottom: "1px solid #374151",
                        borderRadius: "8px",
                    },
                },
                cells: {
                    style: {
                        padding: "10px 8px",
                        color: "#d1d5db",
                    },
                },
                pagination: {
                    style: {
                        backgroundColor: "#111827",
                        color: "#fff",
                    },
                },
            }}
        />
    );
}
