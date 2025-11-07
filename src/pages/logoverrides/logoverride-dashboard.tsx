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
                        <Card className="p-3 sm:p-5">
                            <CardHeader className="pb-5">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                                    <div>
                                        <CardTitle className="text-base sm:text-lg">
                                            List of filed logoverrides.
                                        </CardTitle>
                                        <CardDescription className="text-sm sm:text-base">
                                            Your logoverride applications.
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
                                                        id="date"
                                                        variant="outline"
                                                        className={cn(
                                                            "w-full justify-start text-left font-normal sm:w-[260px]",
                                                            !dateRange.from &&
                                                                "text-muted-foreground",
                                                        )}
                                                    >
                                                        <Calendar1Icon className="mr-2 h-4 w-4" />
                                                        {dateRange.from ? (
                                                            dateRange.to ? (
                                                                <>
                                                                    {format(
                                                                        dateRange.from,
                                                                        "LLL dd, y",
                                                                    )}{" "}
                                                                    -{" "}
                                                                    {format(
                                                                        dateRange.to,
                                                                        "LLL dd, y",
                                                                    )}
                                                                </>
                                                            ) : (
                                                                format(
                                                                    dateRange.from,
                                                                    "LLL dd, y",
                                                                )
                                                            )
                                                        ) : (
                                                            <span>
                                                                Select date
                                                                range
                                                            </span>
                                                        )}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent
                                                    className="w-auto p-0"
                                                    align="start"
                                                >
                                                    <Calendar
                                                        initialFocus
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

                                        {/* Sort By */}
                                        <div className="w-full sm:w-auto">
                                            <label className="mb-1 block text-sm font-medium">
                                                Sort By
                                            </label>
                                            <select
                                                value={sortOption}
                                                onChange={(e) => {
                                                    setSortOption(
                                                        e.target.value,
                                                    );
                                                    setCurrentPage(1);
                                                }}
                                                className="bg-background focus:border-primary focus:ring-primary/40 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-2 dark:border-gray-700 dark:bg-[#1E1E1E] dark:text-gray-100"
                                            >
                                                <optgroup label="Created Date">
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
                                                    <option value="disapproved">
                                                        Disapproved Only
                                                    </option>
                                                </optgroup>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>

                            {/* Table */}
                            <CardContent className="overflow-x-auto">
                                <div className="border-border w-full overflow-x-auto rounded-md border">
                                    <Table className="min-w-[600px] text-xs sm:text-sm">
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead className="px-3 py-4 text-center">
                                                    Date
                                                </TableHead>
                                                <TableHead className="px-3 py-4 text-center">
                                                    Clock Type
                                                </TableHead>
                                                <TableHead className="px-3 py-4 text-center">
                                                    Remarks
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
                                            {paginatedData.length > 0 ? (
                                                paginatedData.map((r) => (
                                                    <TableRow
                                                        key={r.id}
                                                        className="hover:bg-muted/10 transition"
                                                    >
                                                        <TableCell className="px-3 py-4 text-center">
                                                            {formatToDateTime(
                                                                r.date_time,
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="px-3 py-4 text-center">
                                                            {r.clock_type}
                                                        </TableCell>
                                                        <TableCell className="px-3 py-4 text-center capitalize">
                                                            {r.remarks || "N/A"}
                                                        </TableCell>
                                                        <TableCell className="px-3 py-4 text-center">
                                                            <Badge
                                                                className={
                                                                    r.status_label ===
                                                                    "Approved"
                                                                        ? "bg-green-500 text-white"
                                                                        : "bg-yellow-500 text-white"
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
                                                                            <CardTitle className="text-base font-semibold sm:text-lg">
                                                                                Logoverride
                                                                                Details
                                                                            </CardTitle>
                                                                            <CardDescription className="text-sm">
                                                                                Review
                                                                                your
                                                                                filed
                                                                                logoverride
                                                                                details.
                                                                            </CardDescription>
                                                                        </CardHeader>
                                                                        <CardContent className="space-y-4 text-sm">
                                                                            {[
                                                                                {
                                                                                    label: "Date",
                                                                                    value: formatToDateTime(
                                                                                        r.date_time,
                                                                                    ),
                                                                                },
                                                                                {
                                                                                    label: "Clock Type",
                                                                                    value: r.clock_type,
                                                                                },
                                                                                {
                                                                                    label: "Remarks",
                                                                                    value: r.remarks,
                                                                                },
                                                                                {
                                                                                    label: "Status",
                                                                                    value: r.status_label,
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
                                                                                            {item.value ||
                                                                                                "N/A"}
                                                                                        </span>
                                                                                    </div>
                                                                                ),
                                                                            )}
                                                                        </CardContent>
                                                                        <CardFooter className="flex flex-wrap justify-end gap-2 pt-2">
                                                                            <DialogClose
                                                                                asChild
                                                                            >
                                                                                <Button
                                                                                    variant="secondary"
                                                                                    size="sm"
                                                                                >
                                                                                    Close
                                                                                </Button>
                                                                            </DialogClose>
                                                                            <AlertDialog>
                                                                                <AlertDialogTrigger
                                                                                    asChild
                                                                                >
                                                                                    <Button
                                                                                        size="sm"
                                                                                        variant="destructive"
                                                                                        disabled={
                                                                                            r.status_label ===
                                                                                            "Approved"
                                                                                        }
                                                                                    >
                                                                                        Withdraw
                                                                                    </Button>
                                                                                </AlertDialogTrigger>
                                                                                <AlertDialogContent>
                                                                                    <AlertDialogHeader>
                                                                                        <AlertDialogTitle>
                                                                                            Withdraw
                                                                                            Logoverride
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
                                                                                            logoverride?
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
                                        <Label
                                            htmlFor="pageSize"
                                            className="text-muted-foreground text-sm"
                                        >
                                            Rows per page:
                                        </Label>
                                        <Select
                                            value={String(pageSize)}
                                            onValueChange={(value) => {
                                                setPageSize(Number(value));
                                                setCurrentPage(1);
                                            }}
                                        >
                                            <SelectTrigger
                                                id="pageSize"
                                                className="bg-background text-foreground border-input w-[80px] border"
                                            >
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {[5, 10, 20, 50].map((size) => (
                                                    <SelectItem
                                                        key={size}
                                                        value={String(size)}
                                                    >
                                                        {size}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
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
