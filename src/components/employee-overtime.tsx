import React, { useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardFooter,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from "@/components/ui/table";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogClose,
} from "@/components/ui/dialog";
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

interface OvertimeRequestsCardProps {
    employeeId: number | string;
    dateRange: { from?: Date; to?: Date };
    setDateRange: (range: { from?: Date; to?: Date }) => void;
    filteredOvertimes: any[];
}

const OvertimeRequestsCard: React.FC<OvertimeRequestsCardProps> = ({
    employeeId,
    dateRange,
    setDateRange,
    filteredOvertimes,
}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);

    // Filter overtimes by selected date range
    const filteredData = filteredOvertimes.filter((ot) => {
        const otDate = new Date(ot.date);
        return (
            (!dateRange?.from || otDate >= dateRange.from) &&
            (!dateRange?.to || otDate <= dateRange.to)
        );
    });

    const totalPages = Math.ceil(filteredData.length / pageSize);
    const paginatedData = filteredData.slice(
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
                <CardHeader className="w-full p-0">
                    <CardTitle>Employee Overtime</CardTitle>
                    <CardDescription>
                        {" "}
                        List of overtime you applied and registered to the
                        system.
                    </CardDescription>
                </CardHeader>

                <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                    <div className="flex w-full flex-col sm:w-auto sm:flex-row sm:items-center sm:gap-2">
                        <span className="text-muted-foreground mb-1 text-sm sm:mb-0">
                            Select Date Range:
                        </span>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-start text-left font-normal sm:w-[260px]",
                                        !dateRange?.from &&
                                            "text-muted-foreground",
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
                                            format(
                                                dateRange.from,
                                                "MMM d, yyyy",
                                            )
                                        )
                                    ) : (
                                        <span>Pick a date range</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                className="w-auto p-0"
                                align="start"
                            >
                                <Calendar
                                    mode="range"
                                    selected={dateRange as DateRange}
                                    onSelect={(range) =>
                                        setDateRange(
                                            range?.from
                                                ? {
                                                      from: range.from,
                                                      to:
                                                          range.to ??
                                                          range.from,
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
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-muted-foreground text-center text-sm sm:text-left">
                    Showing overtime requests for{" "}
                    <span className="font-bold text-white">
                        {dateRange.from
                            ? format(dateRange.from, "MMMM d, yyyy - ")
                            : "This cut-off"}
                        {dateRange.to
                            ? format(dateRange.to, "MMMM d, yyyy")
                            : "."}
                    </span>
                </p>
                <Button asChild className="w-full sm:w-auto">
                    <Link to={`/overtime/form/${employeeId}`}>
                        File Overtime
                    </Link>
                </Button>
            </div>

            {filteredData.length > 0 ? (
                <>
                    <div className="mt-4 overflow-x-auto rounded-md border">
                        <Table className="min-w-[600px]">
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="px-4 py-3 text-left">
                                        Date
                                    </TableHead>
                                    <TableHead className="px-4 py-3 text-left">
                                        Hours
                                    </TableHead>
                                    <TableHead className="px-4 py-3 text-left">
                                        Reason
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
                                {paginatedData.map((ot, idx) => (
                                    <TableRow
                                        key={idx}
                                        className="hover:bg-primary/5 cursor-pointer transition-colors"
                                    >
                                        <TableCell className="px-4 py-3 font-medium">
                                            {format(
                                                new Date(ot.date),
                                                "MMM d, yyyy",
                                            )}
                                        </TableCell>
                                        <TableCell className="px-4 py-3">
                                            {ot.no_of_hours}
                                        </TableCell>
                                        <TableCell className="px-4 py-3 capitalize">
                                            {ot.remarks}
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-center">
                                            <Badge
                                                className={cn(
                                                    ot.status === "Approved"
                                                        ? "bg-green-600 text-white"
                                                        : ot.status ===
                                                            "Pending for Approval"
                                                          ? "bg-yellow-600 text-white"
                                                          : "bg-red-600 text-white",
                                                )}
                                            >
                                                {ot.status}
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
                                                                Overtime Details
                                                            </CardTitle>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <div className="space-y-3 text-sm">
                                                                {[
                                                                    [
                                                                        "Date",
                                                                        format(
                                                                            new Date(
                                                                                ot.date,
                                                                            ),
                                                                            "MMM d, yyyy",
                                                                        ),
                                                                    ],
                                                                    [
                                                                        "Hours",
                                                                        ot.no_of_hours,
                                                                    ],
                                                                    [
                                                                        "Remarks",
                                                                        ot.remarks ??
                                                                            "—",
                                                                    ],
                                                                    [
                                                                        "Status",
                                                                        ot.status,
                                                                    ],
                                                                    [
                                                                        "Date Created",
                                                                        format(
                                                                            new Date(
                                                                                ot.created_at,
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
                                                                {ot.image ? (
                                                                    <div className="my-4">
                                                                        <img
                                                                            src={
                                                                                ot.image
                                                                            }
                                                                            alt="Overtime Reference"
                                                                            className="max-h-64 w-full cursor-pointer rounded-lg border object-contain"
                                                                            onClick={() =>
                                                                                window.open(
                                                                                    ot.image,
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
                            {Array.from({ length: totalPages }, (_, i) => (
                                <Button
                                    key={i + 1}
                                    size="sm"
                                    variant={
                                        currentPage === i + 1
                                            ? "default"
                                            : "outline"
                                    }
                                    onClick={() => setCurrentPage(i + 1)}
                                >
                                    {i + 1}
                                </Button>
                            ))}
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
                    No overtime requests found for the selected date
                    {dateRange.from &&
                        dateRange.to &&
                        ` range (${format(dateRange.from, "MMM d, yyyy")} – ${format(dateRange.to, "MMM d, yyyy")})`}
                    {dateRange.from &&
                        dateRange.to &&
                        ` (${format(dateRange.from, "MMM d, yyyy")})`}
                </Card>
            )}
        </Card>
    );
};

export default OvertimeRequestsCard;
