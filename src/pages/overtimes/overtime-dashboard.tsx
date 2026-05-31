import { ParentComponent } from "@/components/parent-container";
import { useNavigate, Link, data } from "react-router-dom";
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
import { ApiResponse, Overtime, Employee } from "@/index";
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
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { safeFormat } from "@/helpers/formatDates";

export interface OvertimeResponse {
    info: Overtime[];
    employee: Employee;

    cutoffs: {
        current: CutoffGroup;
        previous: CutoffGroup;
    };
}

export interface CutoffGroup {
    cutoff: string;
    approved_hours: number;
    pending_hours: number;
    disapproved_hours: number;
    items: Overtime[];
}

export default function OvertimeDashboard() {
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
        if (dateRange.from)
            setDateFrom(safeFormat(dateRange.from, "yyyy-MM-dd"));
        else setDateFrom("");

        if (dateRange.to) setDateTo(safeFormat(dateRange.to, "yyyy-MM-dd"));
        else setDateTo("");
    }, [dateRange]);

    const employeeId = meQuery.data?.hr_id;

    const overtimeQuery = useQuery({
        queryKey: ["overtimeDashboard", employeeId],
        queryFn: async () => {
            const response = await api.get<ApiResponse<OvertimeResponse>>(
                `/api/v2/overtime/${employeeId}`,
            );
            const data = response.data.data;

            console.log(data);
            return data ?? { employee: {} as Employee, info: [] };
        },
        enabled: !!employeeId,
    });

    const { refetch } = overtimeQuery;
    const overtimes = overtimeQuery.data?.info ?? [];
    const employee = overtimeQuery.data?.employee;
    const current = overtimeQuery.data?.cutoffs.current;
    const previous = overtimeQuery.data?.cutoffs.previous;

    const filteredData = useMemo(() => {
        let data = [...overtimes];

        if (dateFrom || dateTo) {
            data = data.filter((item) => {
                const date = new Date(item.date);
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
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime(),
            );
        } else if (sortOption === "oldest") {
            data.sort(
                (a, b) =>
                    new Date(a.created_at).getTime() -
                    new Date(b.created_at).getTime(),
            );
        } else if (sortOption === "approved") {
            data = data.filter((i) => i.status === "1");
        } else if (sortOption === "pending") {
            data = data.filter((i) => i.status === "0");
        } else if (sortOption === "disapproved") {
            data = data.filter((i) => i.status === "2");
        }

        return data;
    }, [overtimes, sortOption, dateFrom, dateTo]);

    const handleWithdraw = async (id: any) => {
        try {
            const response = await api.post(`/api/v2/withdraw_overtime/${id}`);

            const data = response.data;

            if (data.status === 1 || data.status === "1") {
                toast.success(
                    data.message || "Overtime withdrawn successfully.",
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

    if (meQuery.isLoading || overtimeQuery.isLoading) return <FullPageLoader />;

    if (meQuery.isError || overtimeQuery.isError)
        return (
            <ParentComponent>
                <div className="text-center text-2xl font-bold">
                    Error fetching data.
                </div>
            </ParentComponent>
        );

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
            {overtimes.length === 0 ? (
                <div className="w-full px-3 sm:px-0">
                    <Card className="py-10">
                        <div className="flex flex-col items-center space-y-4 text-center">
                            <span className="text-lg font-bold sm:text-2xl">
                                No filed overtime found.
                            </span>
                            <Link to={`/overtime/form/${employeeId}`}>
                                <Button className="w-full bg-yellow-500 text-sm text-white hover:bg-yellow-600 sm:w-auto sm:text-base">
                                    File Overtime
                                </Button>
                            </Link>
                        </div>
                    </Card>
                </div>
            ) : (
                <>
                    <div className="mb-5 w-full px-3 sm:px-0">
                        <Card className="flex flex-col items-center gap-4 rounded-xl border p-4 shadow-sm sm:flex-row sm:justify-between sm:p-6">
                            {/* Employee Info */}
                            <div className="flex w-full flex-col items-center text-center sm:w-auto sm:flex-row sm:items-center sm:gap-4 sm:text-left">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-yellow-500/20 text-lg font-bold text-yellow-400 sm:h-16 sm:w-16 sm:text-2xl">
                                    {employee?.name?.charAt(0) ?? "?"}
                                </div>
                                <div className="mt-2 flex flex-col items-center sm:mt-0 sm:items-start">
                                    <div className="flex flex-col items-center gap-1 sm:flex-row sm:gap-2">
                                        <h1 className="text-base font-bold tracking-wide sm:text-lg md:text-xl">
                                            {employee?.name ?? "N/A"}
                                        </h1>
                                        {employee?.agency_name && (
                                            <Badge className="text-xs sm:text-sm md:text-base">
                                                {employee.agency_name}
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                                        ID: {employee?.id_number ?? "N/A"} •{" "}
                                        {employee?.branch_name ?? "N/A"}
                                    </p>
                                </div>
                            </div>

                            {/* File Button */}
                            <div className="w-full sm:w-auto">
                                <Link to={`/overtime/form/${employeeId}`}>
                                    <Button className="w-full bg-yellow-500 text-sm text-white hover:bg-yellow-600 sm:w-auto sm:text-base">
                                        File Overtime
                                    </Button>
                                </Link>
                            </div>
                        </Card>
                    </div>

                    <div className="grid w-full grid-cols-1 gap-4 px-3 sm:px-0 md:grid-cols-3">
                        {/* Approved Hours */}
                        <Card className="rounded-2xl p-4 shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-base font-semibold md:text-lg">
                                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                                    Total Approved Overtime Hours
                                </CardTitle>
                            </CardHeader>

                            <CardContent className="space-y-3 text-sm md:text-base">
                                <div className="flex w-full items-center justify-between">
                                    <Badge className="w-fit bg-green-500/10 px-3 py-1 text-green-400">
                                        Previous Cut-off
                                    </Badge>
                                    <span className="font-medium">
                                        {previous?.approved_hours} hours
                                    </span>
                                </div>

                                <div className="flex w-full items-center justify-between">
                                    <Badge className="w-fit bg-green-500/10 px-3 py-1 text-green-400">
                                        Current Cut-off
                                    </Badge>
                                    <span className="font-medium">
                                        {current?.approved_hours} hours
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Pending Hours */}
                        <Card className="rounded-2xl p-4 shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-base font-semibold md:text-lg">
                                    <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
                                    Total Pending Overtime Hours
                                </CardTitle>
                            </CardHeader>

                            <CardContent className="space-y-3 text-sm md:text-base">
                                <div className="flex w-full items-center justify-between">
                                    <Badge className="w-fit bg-yellow-500/10 px-3 py-1 text-yellow-400">
                                        Previous Cut-off
                                    </Badge>
                                    <span className="font-medium">
                                        {previous?.pending_hours} hours
                                    </span>
                                </div>

                                <div className="flex w-full items-center justify-between">
                                    <Badge className="w-fit bg-yellow-500/10 px-3 py-1 text-yellow-400">
                                        Current Cut-off
                                    </Badge>
                                    <span className="font-medium">
                                        {current?.pending_hours} hours
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl p-4 shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-base font-semibold md:text-lg">
                                    <span className="h-2 w-2 rounded-full bg-red-500"></span>
                                    Total Disapproved Overtime Hours
                                </CardTitle>
                            </CardHeader>

                            <CardContent className="space-y-3 text-sm md:text-base">
                                <div className="flex w-full items-center justify-between">
                                    <Badge className="w-fit bg-red-500/10 px-3 py-1 text-red-400">
                                        Previous Cut-off
                                    </Badge>
                                    <span className="font-medium">
                                        {previous?.disapproved_hours} hours
                                    </span>
                                </div>

                                <div className="flex w-full items-center justify-between">
                                    <Badge className="w-fit bg-red-500/10 px-3 py-1 text-red-400">
                                        Current Cut-off
                                    </Badge>
                                    <span className="font-medium">
                                        {current?.disapproved_hours} hours
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Table Section */}
                    <div className="w-full px-3 sm:px-0">
                        <Card className="p-3 sm:p-5">
                            <CardHeader className="pb-5">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                                    <div>
                                        <CardTitle className="text-base sm:text-lg">
                                            List of filed overtime
                                        </CardTitle>
                                        <CardDescription className="text-sm sm:text-base">
                                            Your overtime applications.
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
                                                                    {safeFormat(
                                                                        dateRange.from,
                                                                        "LLL dd, y",
                                                                    )}{" "}
                                                                    -{" "}
                                                                    {safeFormat(
                                                                        dateRange.to,
                                                                        "LLL dd, y",
                                                                    )}
                                                                </>
                                                            ) : (
                                                                safeFormat(
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
                                            <Select
                                                value={sortOption}
                                                onValueChange={(value) => {
                                                    setSortOption(value);
                                                    setCurrentPage(1);
                                                }}
                                            >
                                                <SelectTrigger className="w-full sm:w-[180px]">
                                                    <SelectValue placeholder="Sort by..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectGroup>
                                                        <SelectLabel>Created Date</SelectLabel>
                                                        <SelectItem value="newest">Newest First</SelectItem>
                                                        <SelectItem value="oldest">Oldest First</SelectItem>
                                                    </SelectGroup>
                                                    <SelectGroup>
                                                        <SelectLabel>Status</SelectLabel>
                                                        <SelectItem value="approved">Approved Only</SelectItem>
                                                        <SelectItem value="pending">Pending Only</SelectItem>
                                                        <SelectItem value="disapproved">Disapproved Only</SelectItem>
                                                    </SelectGroup>
                                                </SelectContent>
                                            </Select>
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
                                                    Branch
                                                </TableHead>
                                                <TableHead className="px-3 py-4 text-center">
                                                    Start Time
                                                </TableHead>
                                                <TableHead className="px-3 py-4 text-center">
                                                    End Time
                                                </TableHead>
                                                <TableHead className="px-3 py-4 text-center">
                                                    Number of Hour/s
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
                                                            {r.date
                                                                ? safeFormat(
                                                                      new Date(
                                                                          r.date,
                                                                      ),
                                                                      "MMM d, yyyy",
                                                                  )
                                                                : "N/A"}
                                                        </TableCell>
                                                        <TableCell className="px-3 py-4 text-center">
                                                            {r.branch_name ||
                                                                "N/A"}
                                                        </TableCell>
                                                        <TableCell className="px-3 py-4 text-center">
                                                            {r.start_time ||
                                                                "N/A"}
                                                        </TableCell>
                                                        <TableCell className="px-3 py-4 text-center">
                                                            {r.end_time ||
                                                                "N/A"}
                                                        </TableCell>
                                                        <TableCell className="px-3 py-4 text-center">
                                                            {r.no_of_hours ||
                                                                "N/A"}
                                                        </TableCell>
                                                        <TableCell className="px-3 py-4 text-center capitalize">
                                                            {r.remarks || "N/A"}
                                                        </TableCell>
                                                        <TableCell className="px-3 py-4 text-center">
                                                            <Badge
                                                                className={cn(
                                                                    r.status ===
                                                                        "1"
                                                                        ? "bg-green-500/10 px-3 py-1 text-green-400"
                                                                        : r.status ===
                                                                            "0"
                                                                          ? "bg-yellow-500/10 px-3 py-1 text-yellow-400"
                                                                          : "bg-red-500/10 px-3 py-1 text-red-400",
                                                                )}
                                                            >
                                                                {r.status ===
                                                                "1"
                                                                    ? "Approved"
                                                                    : r.status ===
                                                                        "2"
                                                                      ? "Disapproved"
                                                                      : "Pending"}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="px-3 py-4 text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                            {(r.status === "0" || r.status === "2") && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() =>
                                                                        navigate(
                                                                            `/overtime/edit/${r.edit_id ?? r.id}`,
                                                                            { state: { overtime: r } },
                                                                        )
                                                                    }
                                                                >
                                                                    Edit
                                                                </Button>
                                                            )}
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
                                                                                Overtime
                                                                                Details
                                                                            </CardTitle>
                                                                            <CardDescription className="text-sm">
                                                                                Review
                                                                                your
                                                                                filed
                                                                                overtime
                                                                                details.
                                                                            </CardDescription>
                                                                        </CardHeader>
                                                                        <CardContent className="space-y-4 text-sm">
                                                                            {[
                                                                                {
                                                                                    label: "Date",
                                                                                    value: safeFormat(
                                                                                        r.date,
                                                                                    ),
                                                                                },
                                                                                {
                                                                                    label: "Start Time",
                                                                                    value: r.start_time,
                                                                                },
                                                                                {
                                                                                    label: "End Time",
                                                                                    value: r.end_time,
                                                                                },
                                                                                {
                                                                                    label: "Remarks",
                                                                                    value: r.remarks,
                                                                                },
                                                                                {
                                                                                    label: "Number of Hour/s",
                                                                                    value: r.no_of_hours,
                                                                                },
                                                                                {
                                                                                    label: "Branch",
                                                                                    value: r.branch_name,
                                                                                },
                                                                                {
                                                                                    label: "Status",
                                                                                    value:
                                                                                        r.status ===
                                                                                        "1"
                                                                                            ? "Approved"
                                                                                            : r.status ===
                                                                                                "2"
                                                                                              ? "Disapproved"
                                                                                              : "Pending",
                                                                                },
                                                                                {
                                                                                    label: "Date Created",
                                                                                    value: safeFormat(
                                                                                        new Date(
                                                                                            r.created_at,
                                                                                        ),
                                                                                        "MMM d, yyyy hh:mm a",
                                                                                    ),
                                                                                },
                                                                                ...(r.status ===
                                                                                "2"
                                                                                    ? [
                                                                                          {
                                                                                              label: "Disapproval Remarks",
                                                                                              value: r.reason_disapproval,
                                                                                          },
                                                                                      ]
                                                                                    : []),

                                                                                ...(r.status ===
                                                                                "2"
                                                                                    ? [
                                                                                          {
                                                                                              label: "Date Updated",
                                                                                              value: safeFormat(
                                                                                                  new Date(
                                                                                                      r.updated_at,
                                                                                                  ),
                                                                                                  "MMM d, yyyy hh:mm a",
                                                                                              ),
                                                                                          },
                                                                                      ]
                                                                                    : []),
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
                                                                        <CardFooter className="flex justify-end space-x-3 pt-2">
                                                                            <DialogClose
                                                                                asChild
                                                                            >
                                                                                <Button variant="secondary">
                                                                                    Close
                                                                                </Button>
                                                                            </DialogClose>

                                                                            {(r.status === "0" || r.status === "2") && (
                                                                                <Button
                                                                                    variant="outline"
                                                                                    onClick={() =>
                                                                                        navigate(
                                                                                            `/overtime/edit/${r.edit_id ?? r.id}`,
                                                                                            { state: { overtime: r } },
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    Edit
                                                                                </Button>
                                                                            )}

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
                                                                                            overtime?
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
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={8}
                                                        className="py-5 text-center text-muted-foreground"
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
