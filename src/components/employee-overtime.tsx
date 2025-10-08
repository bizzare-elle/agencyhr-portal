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
        <Card className="mt-6 p-6 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Overtime Requests</h2>
                <div className="flex items-center gap-2">
                    <label className="text-muted-foreground text-sm">
                        Select Date Range:
                    </label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    "w-[260px] justify-start text-left font-normal",
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
                                numberOfMonths={2}
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {/* Selected range info */}
            {dateRange?.from && (
                <div className="mt-2 flex justify-between">
                    <p className="text-muted-foreground text-sm">
                        Showing overtime requests for{" "}
                        <span className="font-medium">
                            {format(dateRange.from, "MMM d, yyyy")}
                            {dateRange.to &&
                                ` – ${format(dateRange.to, "MMM d, yyyy")}`}
                        </span>
                    </p>
                    <Button asChild>
                        <Link to={`/overtime/form/${employeeId}`}>
                            File Overtime
                        </Link>
                    </Button>
                </div>
            )}

            {/* Table */}
            {filteredData.length > 0 ? (
                <>
                    <Table className="border-border mt-4 overflow-hidden rounded-md border">
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="px-4 py-5 text-left">
                                    Date
                                </TableHead>
                                <TableHead className="px-4 py-5 text-left">
                                    Hours
                                </TableHead>
                                <TableHead className="px-4 py-5 text-left">
                                    Reason
                                </TableHead>
                                <TableHead className="px-4 py-5 text-center">
                                    Status
                                </TableHead>
                                <TableHead className="px-4 py-5 text-center">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedData.map((ot, idx) => (
                                <TableRow
                                    key={idx}
                                    className="hover:bg-primary/10 cursor-pointer transition-colors"
                                >
                                    <TableCell className="px-4 py-5 font-medium">
                                        {format(
                                            new Date(ot.date),
                                            "MMM d, yyyy",
                                        )}
                                    </TableCell>
                                    <TableCell className="px-4 py-5">
                                        {ot.no_of_hours}
                                    </TableCell>
                                    <TableCell className="px-4 py-5 capitalize">
                                        {ot.remarks}
                                    </TableCell>
                                    <TableCell className="px-4 py-5 text-center">
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
                                    <TableCell className="px-4 py-5 text-center">
                                        {/* Dialog content for details */}
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                >
                                                    View
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-md">
                                                <Card className="border-none bg-transparent">
                                                    <CardHeader className="mb-4 text-lg font-semibold">
                                                        <CardTitle>
                                                            Overtime Details
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="space-y-4 text-sm">
                                                            <div className="flex justify-between">
                                                                <Badge>
                                                                    Date:
                                                                </Badge>
                                                                <div className="font-medium">
                                                                    {format(
                                                                        new Date(
                                                                            ot.date,
                                                                        ),
                                                                        "MMM d, yyyy",
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <Badge>
                                                                    Hours:
                                                                </Badge>
                                                                <div className="font-medium">
                                                                    {
                                                                        ot.no_of_hours
                                                                    }
                                                                </div>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <Badge>
                                                                    Remarks:
                                                                </Badge>
                                                                <div className="font-medium capitalize">
                                                                    {ot.remarks ??
                                                                        "—"}
                                                                </div>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <Badge>
                                                                    Status:
                                                                </Badge>
                                                                <div className="font-medium">
                                                                    <span
                                                                        className={cn(
                                                                            ot.status ===
                                                                                "Approved"
                                                                                ? "text-green-600"
                                                                                : ot.status ===
                                                                                    "Disapproved"
                                                                                  ? "text-red-600"
                                                                                  : "text-yellow-600",
                                                                        )}
                                                                    >
                                                                        {
                                                                            ot.status
                                                                        }
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <Badge>
                                                                    Date
                                                                    Created:
                                                                </Badge>
                                                                <div className="font-medium">
                                                                    {format(
                                                                        new Date(
                                                                            ot.created_at,
                                                                        ),
                                                                        "MMM d, yyyy hh:mm a",
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {ot.image ? (
                                                                <img
                                                                    src={
                                                                        ot.image
                                                                    }
                                                                    alt="Overtime Reference"
                                                                    className="my-4 max-h-64 w-full cursor-pointer rounded-lg border object-contain transition hover:opacity-90"
                                                                    onClick={() =>
                                                                        window.open(
                                                                            ot.image,
                                                                            "_blank",
                                                                        )
                                                                    }
                                                                />
                                                            ) : (
                                                                <div className="bg-muted text-muted-foreground my-4 rounded border border-dashed py-5 text-center text-sm">
                                                                    No image
                                                                    attached
                                                                </div>
                                                            )}
                                                        </div>
                                                    </CardContent>
                                                    <CardFooter className="flex justify-end pt-2">
                                                        <DialogClose asChild>
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

                    {/* Pagination */}
                    <div className="mt-4 flex items-center justify-between">
                        <div>
                            <label className="mr-2 text-sm">
                                Rows per page:
                            </label>
                            <select
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="rounded border p-1"
                            >
                                {[5, 10, 20, 50].map((size) => (
                                    <option key={size} value={size}>
                                        {size}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
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
                    {dateRange.to &&
                        ` range (${format(dateRange.from, "MMM d, yyyy")} – ${format(dateRange.to, "MMM d, yyyy")})`}
                    {!dateRange.to &&
                        ` (${format(dateRange.from, "MMM d, yyyy")})`}
                </Card>
            )}
        </Card>
    );
};

export default OvertimeRequestsCard;
