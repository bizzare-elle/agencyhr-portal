import { ParentComponent } from "@/components/parent-container";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/axios";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
} from "@/components/ui/card";
import { ApiResponse, Logoverride, Employee } from "@/index";
import { formatToDateTime } from "@/helpers/formatDates";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/hooks/use-auth";
import FullPageLoader from "@/components/page-loader";
import {
    Table,
    TableCell,
    TableBody,
    TableHeader,
    TableRow,
    TableHead,
} from "@/components/ui/table";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogTrigger,
} from "@/components/ui/dialog";
import { format, isAfter, isBefore } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar1Icon } from "lucide-react";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { toast } from "sonner";

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
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export interface LogoverrideResponse {
    info: Logoverride[];
    recent_file: Logoverride[];
    employees: Employee[];
}

export default function LogoverrideDashboard() {
    const navigate = useNavigate();
    const { setToken } = useAuthStore.getState();
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [sortOption, setSortOption] = useState("newest");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
        from: dateFrom ? new Date(dateFrom) : undefined,
        to: dateTo ? new Date(dateTo) : undefined,
    });

    const meQuery = useQuery({
        queryKey: ["me"],
        queryFn: async () => {
            const response =
                await api.get<ApiResponse<{ hr_id: string }>>(
                    `/api/v2/auth/me`,
                );
            return response.data.data;
        },
    });

    useMemo(() => {
        if (dateRange.from) setDateFrom(format(dateRange.from, "yyyy-MM-dd"));
        else setDateFrom("");

        if (dateRange.to) setDateTo(format(dateRange.to, "yyyy-MM-dd"));
        else setDateTo("");
    }, [dateRange]);

    const employeeId = meQuery.data?.hr_id;

    const logoverrideQuery = useQuery({
        queryKey: ["logoverrideDashboard", employeeId],
        queryFn: async () => {
            const response = await api.get<
                ApiResponse<{ employee: Employee; logoverrides: Logoverride[] }>
            >(`/api/v2/logoverrides/${employeeId}`);

            const data = response.data.data;
            return data ?? { employee: {} as Employee, logoverrides: [] };
        },
        enabled: !!employeeId,
    });

    const { refetch } = logoverrideQuery;
    const logoverrides = logoverrideQuery.data?.logoverrides ?? [];
    const employee = logoverrideQuery.data?.employee;

    const filteredData = useMemo(() => {
        let data = [...logoverrides];

        if (dateFrom || dateTo) {
            data = data.filter((item) => {
                const date = new Date(item.date_time);
                const from = dateFrom ? new Date(dateFrom) : null;
                const to = dateTo ? new Date(dateTo) : null;

                if (from && isBefore(date, from)) return false;
                if (to && isAfter(date, to)) return false;
                return true;
            });
        }

        if (sortOption === "newest") {
            data.sort(
                (a, b) =>
                    new Date(b.date_time).getTime() -
                    new Date(a.date_time).getTime(),
            );
        } else if (sortOption === "oldest") {
            data.sort(
                (a, b) =>
                    new Date(a.date_time).getTime() -
                    new Date(b.date_time).getTime(),
            );
        } else if (sortOption === "approved") {
            data = data.filter((i) => i.status_label === "Approved");
        } else if (sortOption === "pending") {
            data = data.filter((i) => i.status_label === "Pending");
        } else if (sortOption === "disapproved") {
            data = data.filter((i) => i.status_label === "Disapproved");
        }

        return data;
    }, [logoverrides, sortOption, dateFrom, dateTo]);

    const handleWithdraw = async (id: any) => {
        try {
            const response = await api.post(
                `/api/v2/withdraw_logoverride/${id}`,
            );

            const data = response.data;

            if (data.status === 1 || data.status === "1") {
                toast.success(
                    data.message || "Logoverride withdrawn successfully.",
                );
                refetch?.();
            } else {
                toast.error(data.message || "Failed to withdraw overtime.");
            }
        } catch (error: any) {
            console.error("Withdraw Error:", error);
            toast.error(
                "An unexpected error occurred while withdrawing the overtime.",
            );
        }
    };

    const totalPages = Math.ceil(filteredData.length / pageSize);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize,
    );

    const renderPageNumbers = () => {
        if (totalPages <= 1) return null;

        const pages: (number | string)[] = [];
        const maxVisible = 3;
        let start = Math.max(currentPage - 2, 1);
        let end = Math.min(start + maxVisible - 1, totalPages);

        if (end - start + 1 < maxVisible) {
            start = Math.max(end - maxVisible + 1, 1);
        }

        if (start > 1) {
            pages.push(1);
            if (start > 2) pages.push("...");
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        if (end < totalPages) {
            if (end < totalPages - 1) pages.push("...");
            pages.push(totalPages);
        }

        return pages.map((page, index) =>
            typeof page === "number" ? (
                <Button
                    key={page}
                    size="sm"
                    variant={currentPage === page ? "default" : "outline"}
                    onClick={() => setCurrentPage(page)}
                >
                    {page}
                </Button>
            ) : (
                <span key={`ellipsis-${index}`} className="px-2">
                    {page}
                </span>
            ),
        );
    };

    if (meQuery.isLoading || logoverrideQuery.isLoading) {
        return <FullPageLoader />;
    }

    if (meQuery.isError || logoverrideQuery.isError) {
        return (
            <ParentComponent>
                <div className="text-center text-2xl font-bold">
                    Error fetching data.
                </div>
            </ParentComponent>
        );
    }

    if (!employeeId) {
        return (
            <ParentComponent>
                <Card className="text-center font-bold text-red-500">
                    You don't have permission to access this page.
                </Card>
            </ParentComponent>
        );
    }

    return (
        <ParentComponent>
            {/* Back Button */}
            <div className="mb-4 flex justify-start px-3 sm:px-0">
                <Button
                    variant="outline"
                    className="sm:w-auto"
                    onClick={() => {
                        if (window.history.length > 1) navigate(-1);
                        else navigate("/logoverrides"); 
                    }}
                >
                    Back
                </Button>
            </div>

            {logoverrides.length === 0 ? (
                <div className="w-full px-3 sm:px-0">
                    <Card className="py-10">
                        <div className="flex flex-col items-center space-y-4 text-center">
                            <span className="text-lg font-bold sm:text-2xl">
                                No filed logoverride found.
                            </span>
                            <Link to={`/logoverrides/form/${employeeId}`}>
                                <Button className="w-full text-sm sm:w-auto sm:text-base">
                                    File Logoverride
                                </Button>
                            </Link>
                        </div>
                    </Card>
                </div>
            ) : (
                <>
                    {/* Employee Info Card */}
                    <div className="mb-4 w-full px-3 sm:px-0">
                        <Card className="flex flex-col items-center gap-4 rounded-xl bg-[#36454F] p-4 text-white shadow-md sm:flex-row sm:justify-between sm:p-6">
                            {/* Employee Info */}
                            <div className="flex w-full flex-col items-center text-center sm:w-auto sm:flex-row sm:items-center sm:gap-4 sm:text-left">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20 text-lg font-bold sm:h-16 sm:w-16 sm:text-2xl">
                                    {employee?.name?.charAt(0) ?? "?"}
                                </div>
                                <div className="mt-2 flex flex-col items-center sm:mt-0 sm:items-start">
                                    <div className="flex flex-col items-center gap-1 sm:flex-row sm:gap-2">
                                        <h1 className="text-base font-bold tracking-wide sm:text-lg md:text-xl">
                                            {employee?.name ?? "N/A"}
                                        </h1>
                                        {employee?.agency_id && (
                                            <Badge className="text-xs sm:text-sm md:text-base">
                                                {employee.agency_name}
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="mt-1 text-xs opacity-90 sm:text-sm">
                                        ID: {employee?.id_number ?? "N/A"} •{" "}
                                        {employee?.branch_name ?? "N/A"}
                                    </p>
                                </div>
                            </div>

                            {/* File Button */}
                            <div className="w-full sm:w-auto">
                                <Link to={`/logoverrides/form/${employeeId}`}>
                                    <Button className="w-full text-sm sm:w-auto sm:text-base">
                                        File Logoverride
                                    </Button>
                                </Link>
                            </div>
                        </Card>
                    </div>

                    {/* Table Section */}
                    <div className="w-full px-3 sm:px-0">
                        {/* ...rest of your table and pagination code remains unchanged... */}
                    </div>
                </>
            )}
        </ParentComponent>
    );
}
