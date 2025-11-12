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
    // {
    //     name: "Image",
    //     cell: (row) => {
    //         const hostname = window.location.hostname;
    //         const isLocal = hostname === "localhost";

    //         const baseUrl = isLocal
    //             ? "http://localhost/backoffice/"
    //             : "https://backoffice.wildflour.com.ph/";

    //         const appName = "WFPhonetrics-373955958";
    //         const tableName = "Sheet1";

    //         let imageSrc = "";
    //         let hasImage = false;

    //         if (
    //             row.image &&
    //             typeof row.image === "string" &&
    //             row.image.trim()
    //         ) {
    //             const cleanFileName = row.image.replace(/^.*[\\/]/, "");
    //             const encodedPath = encodeURI(row.image).replace(/%2F/g, "/");

    //             hasImage = true;

    //             if (row.image.startsWith("http")) {
    //                 imageSrc = row.image;
    //             } else if (row.is_logoverride === "1") {
    //                 imageSrc = `${baseUrl}uploads/${cleanFileName}`;
    //             } else if (
    //                 row.image.includes("Sheet1_Images") ||
    //                 row.image.includes("uploads")
    //             ) {
    //                 imageSrc = `${baseUrl}${encodedPath}`;
    //             } else {
    //                 imageSrc = `https://www.appsheet.com/template/getappfileurl?appName=${appName}&tableName=${tableName}&fileName=${encodeURIComponent(
    //                     row.image,
    //                 )}`;
    //             }
    //         }

    //         const cleanFileName = row.image
    //             ? row.image.replace(/^.*[\\/]/, "")
    //             : "";
    //         const backupUrl = `https://www.appsheet.com/template/getappfileurl?appName=${appName}&tableName=${tableName}&fileName=Image_Back_Up/${encodeURIComponent(
    //             cleanFileName,
    //         )}`;
    //         const localImageUrl = `${baseUrl}${encodeURIComponent(
    //             row.image || "",
    //         ).replace(/%2F/g, "/")}`;

    //         const handleImageError = (e: any) => {
    //             const target = e.currentTarget;

    //             if (target.dataset.tried === "true") {
    //                 const parent = target.parentElement;
    //                 const noImageText = document.createElement("span");
    //                 noImageText.textContent = "No image";
    //                 noImageText.className = "text-muted text-sm";
    //                 parent.replaceChild(noImageText, target);
    //                 return;
    //             }

    //             target.dataset.tried = "true";

    //             const tryBackup = new Image();
    //             tryBackup.src = backupUrl;
    //             tryBackup.onload = () => (target.src = backupUrl);
    //             tryBackup.onerror = () => {
    //                 const tryLocal = new Image();
    //                 tryLocal.src = localImageUrl;
    //                 tryLocal.onload = () => (target.src = localImageUrl);
    //                 tryLocal.onerror = () => {
    //                     const parent = target.parentElement;
    //                     const noImageText = document.createElement("span");
    //                     noImageText.textContent = "No image";
    //                     noImageText.className = "text-muted text-sm";
    //                     parent.replaceChild(noImageText, target);
    //                 };
    //             };
    //         };

    //         if (!hasImage) {
    //             return <span className="text-muted text-sm">No image</span>;
    //         }

    //         return (
    //             <Dialog>
    //                 <DialogTrigger className="cursor-pointer">
    //                     <img
    //                         className="max-h-[50px] rounded object-contain"
    //                         src={imageSrc}
    //                         alt={`Time Log ${row.id}`}
    //                         onError={handleImageError}
    //                         loading="lazy"
    //                     />
    //                 </DialogTrigger>
    //                 <DialogContent>
    //                     <DialogHeader>
    //                         <DialogTitle>Time Log Image</DialogTitle>
    //                         <DialogDescription>
    //                             {formatToDateTime(row.date_time)}
    //                         </DialogDescription>
    //                     </DialogHeader>
    //                     <div className="flex items-center justify-center">
    //                         {hasImage ? (
    //                             <img
    //                                 className="max-h-[400px] object-contain"
    //                                 src={imageSrc}
    //                                 alt={`Time Log ${row.id}`}
    //                                 onError={handleImageError}
    //                             />
    //                         ) : (
    //                             <span className="text-sm text-white">
    //                                 No image
    //                             </span>
    //                         )}
    //                     </div>
    //                 </DialogContent>
    //             </Dialog>
    //         );
    //     },
    // },
    {
        name: "Status",
        cell: () => <Badge className="bg-green-600 text-white">Approved</Badge>,
    },
    {
        name: "Actions",
        cell: (row) => {
            const queryClient = useQueryClient();

            const handleWithdraw = async () => {
                try {
                    const res = await api.post(
                        `/api/v2/withdraw_log/${row.id}`,
                    );
                    toast.success("Log withdrawn successfully!");

                    queryClient.invalidateQueries({
                        queryKey: ["employee-time-logs"],
                        exact: false,
                    });
                } catch (error: any) {
                    toast.error("Failed to withdraw log.");
                }
            };
            return (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                            Withdraw
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Withdraw Log</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to withdraw this log? This
                                action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleWithdraw}>
                                Confirm
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
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
