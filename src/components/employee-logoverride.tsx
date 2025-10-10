import { useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogClose,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface LogoverrideRequestsProps {
    dateRange: { from?: Date; to?: Date };
    setDateRange: (range: { from?: Date; to?: Date }) => void;
    days: Date[];
    filteredLogoverrides: any[];
    filteredSchedules?: any[];
    employeeId: string | number;
}

const LogoverrideRequests: React.FC<LogoverrideRequestsProps> = ({
    dateRange,
    setDateRange,
    days,
    filteredLogoverrides,
    filteredSchedules,
    employeeId,
}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);

    const filteredDays = days.filter(
        (day) =>
            (!dateRange?.from || day >= dateRange.from) &&
            (!dateRange?.to || day <= dateRange.to),
    );

    const allLogOverrides = filteredDays.flatMap((day) =>
        filteredLogoverrides?.filter(
            (l) =>
                format(new Date(l.date_time), "yyyy-MM-dd") ===
                format(day, "yyyy-MM-dd"),
        ),
    );

    const totalPages = Math.ceil(allLogOverrides.length / pageSize);
    const paginatedOverrides = allLogOverrides.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize,
    );

    const renderPageNumbers = () => {
        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            pages.push(
                <Button
                    key={i}
                    size="sm"
                    variant={i === currentPage ? "default" : "outline"}
                    onClick={() => setCurrentPage(i)}
                >
                    {i}
                </Button>,
            );
        }
        return pages;
    };

    return (
        <Card className="mt-6 p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <h2 className="text-lg font-semibold sm:text-xl">
                    Logoverride Requests
                </h2>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <label className="text-muted-foreground text-sm">
                        Select Date-range:
                    </label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    "w-full justify-start text-left font-normal sm:w-[260px]",
                                    !dateRange?.from && "text-muted-foreground",
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange?.from ? (
                                    dateRange.to ? (
                                        <>
                                            {format(
                                                dateRange.from,
                                                "MMM d, yyyy",
                                            )}{" "}
                                            –{" "}
                                            {format(
                                                dateRange.to,
                                                "MMM d, yyyy",
                                            )}
                                        </>
                                    ) : (
                                        format(dateRange.from, "MMM d, yyyy")
                                    )
                                ) : (
                                    <span>Pick a date range</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                initialFocus
                                mode="range"
                                selected={dateRange}
                                onSelect={(range) =>
                                    setDateRange(
                                        range?.from
                                            ? {
                                                  from: range.from,
                                                  to: range.to ?? range.from,
                                              }
                                            : {
                                                  from: undefined,
                                                  to: undefined,
                                              },
                                    )
                                }
                                numberOfMonths={1}
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {/* Date Info & Button */}
            {dateRange?.from && (
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-muted-foreground text-center text-sm sm:text-left">
                        Showing log overrides for{" "}
                        <span className="font-medium">
                            {format(dateRange.from, "MMM d, yyyy")}
                            {dateRange.to &&
                                ` – ${format(dateRange.to, "MMM d, yyyy")}`}
                        </span>
                    </p>
                    <Button size="sm" className="w-full sm:w-auto">
                        <Link to={`/logoverrides/form/${employeeId}`}>
                            File Logoverride
                        </Link>
                    </Button>
                </div>
            )}

            {/* Table */}
            {allLogOverrides.length > 0 ? (
                <>
                    <div className="mt-4 overflow-x-auto rounded-md border">
                        <Table className="min-w-[600px]">
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="px-4 py-3 text-left">
                                        Date
                                    </TableHead>
                                    <TableHead className="px-4 py-3 text-center">
                                        Clock Type
                                    </TableHead>
                                    <TableHead className="px-4 py-3 text-center">
                                        Status
                                    </TableHead>
                                    <TableHead className="px-4 py-3 text-center">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedOverrides.map((log, idx) => (
                                    <TableRow
                                        key={`${idx}-${log.date_time}`}
                                        className="hover:bg-primary/5 cursor-pointer transition-colors"
                                    >
                                        <TableCell className="px-4 py-3 font-medium">
                                            {format(
                                                new Date(log.date_time),
                                                "MMM d, yyyy",
                                            )}
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-center">
                                            {log.clock_type}
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-center">
                                            <Badge
                                                className={cn(
                                                    log.status === "Approved"
                                                        ? "bg-green-600 text-white"
                                                        : log.status ===
                                                            "For Approval"
                                                          ? "bg-yellow-600 text-white"
                                                          : "bg-red-600 text-white",
                                                )}
                                            >
                                                {log.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-center">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                    >
                                                        View
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="w-[90vw] max-w-md sm:w-auto">
                                                    <Card className="border-none bg-transparent">
                                                        <CardHeader className="mb-4 text-lg font-semibold">
                                                            <CardTitle>
                                                                Logoverride
                                                                Details
                                                            </CardTitle>
                                                            <CardDescription>
                                                                Details of the
                                                                logoverride
                                                                you’ve filed.
                                                            </CardDescription>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <div className="space-y-3 text-sm">
                                                                {[
                                                                    [
                                                                        "Date",
                                                                        format(
                                                                            new Date(
                                                                                log.date_time,
                                                                            ),
                                                                            "MMM d, yyyy",
                                                                        ),
                                                                    ],
                                                                    [
                                                                        "Clock Type",
                                                                        log.clock_type,
                                                                    ],
                                                                    [
                                                                        "Status",
                                                                        log.status,
                                                                    ],
                                                                    [
                                                                        "Remarks",
                                                                        log.remarks ??
                                                                            "—",
                                                                    ],
                                                                    [
                                                                        "Date Created",
                                                                        format(
                                                                            new Date(
                                                                                log.created_at,
                                                                            ),
                                                                            "MMM d, yyyy hh:mm a",
                                                                        ),
                                                                    ],
                                                                ].map(
                                                                    ([
                                                                        label,
                                                                        value,
                                                                    ]) => (
                                                                        <div
                                                                            key={
                                                                                label
                                                                            }
                                                                            className="flex justify-between gap-2"
                                                                        >
                                                                            <Badge>
                                                                                {
                                                                                    label
                                                                                }

                                                                                :
                                                                            </Badge>
                                                                            <div className="text-right font-medium break-all">
                                                                                {
                                                                                    value
                                                                                }
                                                                            </div>
                                                                        </div>
                                                                    ),
                                                                )}
                                                                {log.image ? (
                                                                    <div className="my-4">
                                                                        <img
                                                                            src={
                                                                                log.image
                                                                            }
                                                                            alt="Reference"
                                                                            className="max-h-64 w-full cursor-pointer rounded-lg border object-contain"
                                                                            onClick={() =>
                                                                                window.open(
                                                                                    log.image,
                                                                                    "_blank",
                                                                                )
                                                                            }
                                                                        />
                                                                    </div>
                                                                ) : (
                                                                    <div className="bg-muted text-muted-foreground my-4 rounded border border-dashed py-5 text-center text-sm">
                                                                        No image
                                                                        attached
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </CardContent>
                                                        <CardFooter className="flex justify-end pt-2">
                                                            <DialogClose
                                                                asChild
                                                            >
                                                                <Button variant="secondary">
                                                                    Close
                                                                </Button>
                                                            </DialogClose>
                                                        </CardFooter>
                                                    </Card>
                                                </DialogContent>
                                            </Dialog>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center justify-center gap-2 sm:justify-start">
                            <label className="text-sm">Rows per page:</label>
                            <select
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value));
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
                                    setCurrentPage((prev) => prev - 1)
                                }
                            >
                                Previous
                            </Button>
                            {renderPageNumbers()}
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={currentPage === totalPages}
                                onClick={() =>
                                    setCurrentPage((prev) => prev + 1)
                                }
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </>
            ) : (
                <Card className="text-muted-foreground mt-4 p-6 text-center">
                    No log overrides found for the selected date
                    {dateRange.to &&
                        ` range (${format(dateRange.from, "MMM d, yyyy")} – ${format(
                            dateRange.to,
                            "MMM d, yyyy",
                        )})`}
                    {!dateRange.to &&
                        ` (${format(dateRange.from, "MMM d, yyyy")})`}
                </Card>
            )}
        </Card>
    );
};

export default LogoverrideRequests;
