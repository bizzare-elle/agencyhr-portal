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
} from "../ui/dialog";
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
            const defaultImage = "/no-image.png";
            const appName = "WFPhonetrics-373955958";
            const tableName = "Sheet1";

            const baseUrl =
                window.location.hostname === "localhost"
                    ? "http://localhost/backoffice/"
                    : "https://backoffice.wildflour.com.ph/";

            let imageSrc = defaultImage;

            if (
                row.image &&
                typeof row.image === "string" &&
                row.image.trim()
            ) {
                const cleanFileName = row.image.replace(/^.*[\\/]/, "");

                // 🟢 Handle direct URLs first (already full http path)
                if (row.image.startsWith("http")) {
                    imageSrc = row.image;
                }
                // 🟢 Handle Log Override → always from local uploads
                else if (row.is_logoverride === "1") {
                    imageSrc = `${baseUrl}uploads/${cleanFileName}`;
                }
                // 🟢 Handle local Sheet1_Images or uploads paths
                else if (
                    row.image.includes("Sheet1_Images") ||
                    row.image.includes("uploads")
                ) {
                    const encodedImage = encodeURIComponent(row.image).replace(
                        /%2F/g,
                        "/",
                    );
                    imageSrc = `${baseUrl}${encodedImage}`;
                }
                // 🟢 Default → AppSheet main URL
                else {
                    imageSrc = `https://www.appsheet.com/template/getappfileurl?appName=${appName}&tableName=${tableName}&fileName=${row.image}`;
                }

                // 🟠 Backup and fallback URLs
                const backupUrl = `https://www.appsheet.com/template/getappfileurl?appName=${appName}&tableName=${tableName}&fileName=Image_Back_Up/${cleanFileName}`;
                const localImageUrl = `${baseUrl}uploads/${cleanFileName}`;

                // 🟣 Error handler — try backup → local → default
                const handleImageError = (
                    e: React.SyntheticEvent<HTMLImageElement>,
                ) => {
                    const target = e.currentTarget;
                    target.onerror = null;

                    const tryBackup = new Image();
                    tryBackup.src = backupUrl;
                    tryBackup.onload = () => (target.src = backupUrl);
                    tryBackup.onerror = () => {
                        const tryLocal = new Image();
                        tryLocal.src = localImageUrl;
                        tryLocal.onload = () => (target.src = localImageUrl);
                        tryLocal.onerror = () => {
                            target.src = defaultImage;
                        };
                    };
                };

                // 🖼️ Render dialog with zoomable image
                return (
                    <Dialog>
                        <DialogTrigger className="cursor-pointer">
                            <img
                                className="max-h-[50px] rounded object-contain"
                                src={imageSrc}
                                alt={`Time Log ${row.id}`}
                                onError={handleImageError}
                            />
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Time Log Image</DialogTitle>
                                <DialogDescription>
                                    {formatToDateTime(row.date_time)}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex items-center justify-center">
                                <img
                                    className="max-h-[400px] object-contain"
                                    src={imageSrc}
                                    alt={`Time Log ${row.id}`}
                                    onError={handleImageError}
                                />
                            </div>
                        </DialogContent>
                    </Dialog>
                );
            }

            // 🩶 No image fallback
            return (
                <img
                    src={defaultImage}
                    alt="No image"
                    className="max-h-[50px] rounded object-contain opacity-70"
                />
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
