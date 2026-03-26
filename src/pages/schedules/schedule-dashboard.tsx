import { ParentComponent } from "@/components/parent-container";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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
import { ApiResponse, Employee, Schedule } from "@/index";
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
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { formatToDateTime } from "@/helpers/formatDates";
import { format } from "date-fns";
import { useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { toast } from "sonner";

export interface ScheduleResponse {
    info: Employee[];
    schedules: Schedule[];
    recent: Schedule[];
}

export default function ScheduleDashboard() {
    const { setToken } = useAuthStore.getState();

    const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [sortOption, setSortOption] = useState<
        "newest" | "oldest" | "approved" | "pending"
    >("newest");

    const meQuery = useQuery({
        queryKey: ["me"],
        queryFn: async () => {
            const response =
                await api.get<ApiResponse<{ hr_id: string }>>(
                    "/api/v2/auth/me",
                );
            return response.data.data;
        },
    });

    const employeeId = meQuery.data?.hr_id;

    const scheduleQuery = useQuery<ScheduleResponse>({
        queryKey: ["scheduleDashboard", employeeId],
        queryFn: async () => {
            const response = await api.get<ApiResponse<ScheduleResponse>>(
                `/api/v2/schedules/${employeeId}`,
            );
            return (
                response.data.data ?? { info: [], schedules: [], recent: [] }
            );
        },
        enabled: !!employeeId,
    });

    const data = scheduleQuery.data;
    const employee = data?.info?.[0];
    const recentSchedules = data?.recent ?? [];
    const schedules = data?.schedules ?? [];
    const initialLetter =
        employee?.employee_name?.charAt(0)?.toUpperCase() ?? "?";

    const filteredSchedules = useMemo(() => {
        let filtered = [...schedules];

        if (dateRange.from)
            filtered = filtered.filter(
                (s) => new Date(s.date) >= dateRange.from!,
            );
        if (dateRange.to)
            filtered = filtered.filter(
                (s) => new Date(s.date) <= dateRange.to!,
            );

        switch (sortOption) {
            case "newest":
                filtered.sort(
                    (a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime(),
                );
                break;
            case "oldest":
                filtered.sort(
                    (a, b) =>
                        new Date(a.date).getTime() - new Date(b.date).getTime(),
                );
                break;
            case "approved":
                filtered = filtered.filter(
                    (s) => s.status_label === "Approved",
                );
                break;
            case "pending":
                filtered = filtered.filter((s) => s.status_label === "Pending");
                break;
        }

        return filtered;
    }, [schedules, dateRange, sortOption]);

    const { refetch } = scheduleQuery;
    const totalPages = Math.ceil(filteredSchedules.length / pageSize);
    const paginatedSchedules = filteredSchedules.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize,
    );

    const handleWithdraw = async (id: any) => {
        try {
            const response = await api.post(`/api/v2/withdraw_schedules/${id}`);

            const data = response.data;

            if (data.status === 1 || data.status === "1") {
                toast.success(
                    data.message || "Schedule withdrawn successfully.",
                );
                refetch?.();
            } else {
                toast.error(data.message || "Failed to withdraw schedule.");
            }
        } catch (error: any) {
            console.error("Withdraw Error:", error);
            toast.error(
                "An unexpected error occurred while withdrawing the schedule.",
            );
        }
    };

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

    if (meQuery.isLoading || scheduleQuery.isLoading) return <FullPageLoader />;

    if (meQuery.isError || scheduleQuery.isError) {
        return (
            <ParentComponent>
                <div className="text-center text-2xl font-bold text-red-500">
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
            {!employee ? (
                <div className="w-full">
                    <Card className="py-10">
                        <div className="flex flex-col space-y-4 text-center">
                            <span className="text-2xl font-bold">
                                No filed schedule found.
                            </span>
                            <Link to={`/schedules/form/${employeeId}`}>
                                <Button className="w-full sm:w-auto">
                                    File Schedule
                                </Button>
                            </Link>
                        </div>
                    </Card>
                </div>
            ) : (
                <>
                    {/* Header */}
                    <div className="mb-4 w-full">
                        <Card className="flex flex-col items-center gap-4 rounded-xl bg-[#36454F] p-4 text-white shadow-md sm:flex-row sm:justify-between sm:p-6">
                            <div className="flex w-full flex-col items-center text-center sm:w-auto sm:flex-row sm:items-center sm:gap-4 sm:text-left">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/20 text-xl font-bold sm:h-16 sm:w-16 sm:text-2xl">
                                    {initialLetter}
                                </div>

                                <div className="mt-2 flex flex-col items-center sm:mt-0 sm:items-start">
                                    <div className="flex flex-col items-center gap-1 sm:flex-row sm:items-center sm:gap-2">
                                        <h1 className="text-base font-bold tracking-wide sm:text-lg md:text-2xl">
                                            {employee.employee_name}
                                        </h1>
                                        {employee.agency_name && (
                                            <Badge className="text-xs sm:text-sm md:text-base">
                                                {employee.agency_name}
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="mt-1 text-xs opacity-90 sm:text-sm">
                                        ID: {employee.id_number} •{" "}
                                        {employee.branch_name}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                {" "}
                                <div className="w-full sm:w-auto">
                                    <Link to={`/schedules/form/${employeeId}`}>
                                        <Button className="w-full text-sm sm:w-auto sm:text-base">
                                            File Employee Schedule
                                        </Button>
                                    </Link>
                                </div>
                                <div className="w-full sm:w-auto">
                                    <Link
                                        to={`/schedules/upload/${employeeId}`}
                                    >
                                        <Button className="w-full text-sm sm:w-auto sm:text-base">
                                            Upload Schedule By Batch
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Table */}
                    <div className="w-full px-3 sm:px-0">
                        <Card className="p-3 sm:p-5">
                            <CardHeader className="pb-5">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                                    <div>
                                        <CardTitle className="text-base sm:text-lg">
                                            List of filed schedules
                                        </CardTitle>
                                        <CardDescription className="text-sm sm:text-base">
                                            Your recent schedule requests
                                        </CardDescription>
                                    </div>

                                    {/* Filters */}
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:space-x-4">
                                        {/* Date Range */}
                                        <div className="w-full sm:w-auto">
                                            <label className="mb-1 block text-sm font-medium">
                                                Date Range
                                            </label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        className="w-full justify-start text-left font-normal sm:w-[260px]"
                                                    >
                                                        {dateRange.from
                                                            ? dateRange.to
                                                                ? `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}`
                                                                : format(
                                                                      dateRange.from,
                                                                      "LLL dd, y",
                                                                  )
                                                            : "Select date range"}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent
                                                    className="w-auto p-0"
                                                    align="start"
                                                >
                                                    <Calendar
                                                        mode="range"
                                                        selected={
                                                            dateRange as DateRange
                                                        }
                                                        onSelect={(range) => {
                                                            setDateRange(
                                                                range || {},
                                                            );
                                                            setCurrentPage(1);
                                                        }}
                                                        numberOfMonths={1}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>

                                        {/* Sort */}
                                        <div className="w-full sm:w-auto">
                                            <label className="mb-1 block text-sm font-medium">
                                                Sort By
                                            </label>
                                            <select
                                                value={sortOption}
                                                onChange={(e) => {
                                                    setSortOption(
                                                        e.target
                                                            .value as typeof sortOption,
                                                    );
                                                    setCurrentPage(1);
                                                }}
                                                className="bg-background focus:border-primary focus:ring-primary/40 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-2 dark:border-gray-700 dark:bg-[#1E1E1E] dark:text-gray-100"
                                            >
                                                <optgroup label="Date">
                                                    <option value="newest">
                                                        Newest First
                                                    </option>
                                                    <option value="oldest">
                                                        Oldest First
                                                    </option>
                                                </optgroup>
                                                <optgroup label="Status">
                                                    <option value="approved">
                                                        Approved Only
                                                    </option>
                                                    <option value="pending">
                                                        Pending Only
                                                    </option>
                                                </optgroup>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="overflow-x-auto">
                                <div className="border-border w-full overflow-x-auto rounded-md border">
                                    <Table className="min-w-[600px] text-xs sm:text-sm">
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead className="px-3 py-4 text-center">
                                                    Employee Name
                                                </TableHead>
                                                <TableHead className="px-3 py-4 text-center">
                                                    Date
                                                </TableHead>
                                                <TableHead className="px-3 py-4 text-center">
                                                    Schedule Type
                                                </TableHead>
                                                <TableHead className="px-3 py-4 text-center">
                                                    Branch
                                                </TableHead>
                                                <TableHead className="px-3 py-4 text-center">
                                                    Status
                                                </TableHead>
                                                <TableHead className="px-3 py-4 text-center">
                                                    Actions
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedSchedules.length > 0 ? (
                                                paginatedSchedules.map((r) => (
                                                    <TableRow
                                                        key={r.id}
                                                        className="hover:bg-muted/10 transition"
                                                    >
                                                        <TableCell className="px-3 py-4 text-center">
                                                            {r.employee_name ??
                                                                "N/A"}
                                                        </TableCell>
                                                        <TableCell className="px-3 py-4 text-center">
                                                            {formatToDateTime(
                                                                r.date,
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="px-3 py-4 text-center">
                                                            {r.schedule_name ??
                                                                "N/A"}
                                                        </TableCell>
                                                        <TableCell className="px-3 py-4 text-center capitalize">
                                                            {r.branch_name ??
                                                                "N/A"}
                                                        </TableCell>
                                                        <TableCell className="px-3 py-4 text-center">
                                                            <Badge
                                                                className={
                                                                    r.status_label ===
                                                                    "Approved"
                                                                        ? "bg-green-100 px-3 py-1 text-green-800"
                                                                        : r.status_label ===
                                                                            "Pending"
                                                                          ? "bg-yellow-100 px-3 py-1 text-yellow-800"
                                                                          : "bg-red-100 px-3 py-1 text-red-800"
                                                                }
                                                            >
                                                                {r.status_label}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="px-3 py-4 text-center">
                                                            <Dialog>
                                                                <DialogTrigger
                                                                    asChild
                                                                >
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                    >
                                                                        View
                                                                    </Button>
                                                                </DialogTrigger>
                                                                <DialogContent className="max-w-sm sm:max-w-md">
                                                                    <Card className="border-none bg-transparent shadow-none">
                                                                        <CardHeader className="pb-2">
                                                                            <DialogTitle className="text-base font-semibold sm:text-lg">
                                                                                Schedule
                                                                                Details
                                                                            </DialogTitle>
                                                                            <CardDescription className="text-sm">
                                                                                Review
                                                                                your
                                                                                filed
                                                                                schedule
                                                                                details.
                                                                            </CardDescription>
                                                                        </CardHeader>
                                                                        <CardContent className="space-y-4 text-sm">
                                                                            {[
                                                                                {
                                                                                    label: "Date",
                                                                                    value: formatToDateTime(
                                                                                        r.date,
                                                                                    ),
                                                                                },
                                                                                {
                                                                                    label: "Schedule Type",
                                                                                    value:
                                                                                        r.schedule_name ??
                                                                                        "N/A",
                                                                                },
                                                                                {
                                                                                    label: "Branch",
                                                                                    value:
                                                                                        r.branch_name ??
                                                                                        "N/A",
                                                                                },
                                                                                {
                                                                                    label: "Status",
                                                                                    value:
                                                                                        r.status_label ??
                                                                                        "N/A",
                                                                                },
                                                                                {
                                                                                    label: "Date Created",
                                                                                    value: format(
                                                                                        new Date(
                                                                                            r.created_at,
                                                                                        ),
                                                                                        "MMM d, yyyy hh:mm a",
                                                                                    ),
                                                                                },
                                                                            ].map(
                                                                                (
                                                                                    item,
                                                                                ) => (
                                                                                    <div
                                                                                        key={
                                                                                            item.label
                                                                                        }
                                                                                        className="flex items-start justify-between"
                                                                                    >
                                                                                        <Badge>
                                                                                            {
                                                                                                item.label
                                                                                            }

                                                                                            :
                                                                                        </Badge>
                                                                                        <span className="max-w-[65%] text-right font-medium break-words capitalize">
                                                                                            {
                                                                                                item.value
                                                                                            }
                                                                                        </span>
                                                                                    </div>
                                                                                ),
                                                                            )}
                                                                        </CardContent>
                                                                        <CardFooter className="flex justify-end space-x-3 pt-2">
                                                                            <DialogClose
                                                                                asChild
                                                                            >
                                                                                <Button variant="secondary">
                                                                                    Close
                                                                                </Button>
                                                                            </DialogClose>

                                                                            <AlertDialog>
                                                                                <AlertDialogTrigger
                                                                                    asChild
                                                                                >
                                                                                    <Button variant="destructive">
                                                                                        Withdraw
                                                                                    </Button>
                                                                                </AlertDialogTrigger>
                                                                                <AlertDialogContent>
                                                                                    <AlertDialogHeader>
                                                                                        <AlertDialogTitle>
                                                                                            Confirm
                                                                                            Withdrawal
                                                                                        </AlertDialogTitle>
                                                                                        <AlertDialogDescription>
                                                                                            Are
                                                                                            you
                                                                                            sure
                                                                                            you
                                                                                            want
                                                                                            to
                                                                                            withdraw
                                                                                            this
                                                                                            schedule?
                                                                                            This
                                                                                            action
                                                                                            cannot
                                                                                            be
                                                                                            undone.
                                                                                        </AlertDialogDescription>
                                                                                    </AlertDialogHeader>
                                                                                    <AlertDialogFooter>
                                                                                        <AlertDialogCancel
                                                                                            asChild
                                                                                        >
                                                                                            <Button variant="outline">
                                                                                                Cancel
                                                                                            </Button>
                                                                                        </AlertDialogCancel>
                                                                                        <Button
                                                                                            variant="destructive"
                                                                                            onClick={() =>
                                                                                                handleWithdraw(
                                                                                                    r.id,
                                                                                                )
                                                                                            }
                                                                                        >
                                                                                            Yes,
                                                                                            Withdraw
                                                                                        </Button>
                                                                                    </AlertDialogFooter>
                                                                                </AlertDialogContent>
                                                                            </AlertDialog>
                                                                        </CardFooter>
                                                                    </Card>
                                                                </DialogContent>
                                                            </Dialog>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={5}
                                                        className="py-5 text-center text-gray-500"
                                                    >
                                                        No records found.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Pagination */}
                                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center justify-center gap-2 sm:justify-start">
                                        <label className="text-sm">
                                            Rows per page:
                                        </label>
                                        <select
                                            value={pageSize}
                                            onChange={(e) => {
                                                setPageSize(
                                                    Number(e.target.value),
                                                );
                                                setCurrentPage(1);
                                            }}
                                            className="rounded border p-1 text-sm"
                                        >
                                            {[5, 10, 20, 50].map((size) => (
                                                <option key={size} value={size}>
                                                    {size}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex items-center justify-center gap-2 sm:justify-end">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={currentPage === 1}
                                            onClick={() =>
                                                setCurrentPage(
                                                    (prev) => prev - 1,
                                                )
                                            }
                                        >
                                            Previous
                                        </Button>
                                        {renderPageNumbers()}
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={
                                                currentPage === totalPages
                                            }
                                            onClick={() =>
                                                setCurrentPage(
                                                    (prev) => prev + 1,
                                                )
                                            }
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </ParentComponent>
    );
}
