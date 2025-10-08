import { ApiResponse } from "@/index";
import api from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";
import DataTable, { TableColumn } from "react-data-table-component";
import { useState } from "react";
import {
    formateToMonthDayYear,
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
import { Image } from "lucide-react";

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
        format: (row) => formateToMonthDayYear(row.date_time),
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

            if (row.image && row.image.startsWith("http")) {
                imageSrc = row.image;
            } else if (row.image) {
                const cutoffDate = new Date("2025-06-01T00:00:00");
                const recordDate = new Date(row.date_time);

                if (recordDate >= cutoffDate) {
                    imageSrc =
                        "https://www.appsheet.com/template/getappfileurl?appName=WFPhonetrics-373955958&tableName=Sheet1&fileName=" +
                        row.image;
                } else {
                    imageSrc =
                        "https://www.appsheet.com/template/getappfileurl?appName=AtlasAgencyTimeTrackerv2-373955958&tableName=hr_time_tracker&fileName=" +
                        row.image;
                }
            }

            return (
                <Dialog>
                    <DialogTrigger className="cursor-pointer">
                        <img
<<<<<<< HEAD
                            className="max-h-[50px]"
                            src={imageSrc}
                            alt="N/A"
=======
                            className="h-[50px]"
                            src={imageSrc}
                            loading="lazy"
>>>>>>> 0e77a60b29fbbf70085311f977e2e4969fc20df7
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
<<<<<<< HEAD
                                className="max-h-[400px]"
                                src={imageSrc}
                                alt="Time Log"
=======
                                className="h-[400px]"
                                src={imageSrc}
                                loading="lazy"
>>>>>>> 0e77a60b29fbbf70085311f977e2e4969fc20df7
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
    const [rowsPerPage, setRowsPerPage] = useState<number>(25);

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
                cells: {
                    style: {
                        paddingBlock: "10px",
                    },
                },
            }}
        />
    );
}
