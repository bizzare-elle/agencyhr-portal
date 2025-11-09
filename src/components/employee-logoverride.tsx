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
import { DateRange } from "react-day-picker";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { safeFormat } from "@/helpers/formatDates";

interface LogoverrideRequestsProps {
    dateRange: { from?: Date; to?: Date };
    setDateRange: React.Dispatch<
        React.SetStateAction<{ from?: Date; to?: Date }>
    >;
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
                safeFormat(new Date(l.date_time), "yyyy-MM-dd") ===
                safeFormat(day, "yyyy-MM-dd"),
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
                <CardHeader className="w-full p-0">
                    <CardTitle>Employee Logoverrides</CardTitle>
                    <CardDescription>
                        {" "}
                        List of logoverrides you applied and registered to the
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
                                        "w-full justify-start text-left font-normal sm:w-[240px]",
                                        "rounded-md border px-3 py-2",
                                        "hover:bg-muted/50",
                                        !dateRange && "text-muted-foreground",
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange?.from ? (
                                        dateRange.to ? (
                                            <>
                                                {safeFormat(
                                                    dateRange.from,
                                                    "MMM d, yyyy",
                                                )}{" "}
                                                –{" "}
                                                {safeFormat(
                                                    dateRange.to,
                                                    "MMM d, yyyy",
                                                )}
                                            </>
                                        ) : (
                                            safeFormat(
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
                                    onSelect={(range) => {
                                        if (range?.from) {
                                            setDateRange({
                                                from: range.from,
                                                to: range.to ?? range.from,
                                            });
                                        } else {
                                            setDateRange({
                                                from: undefined,
                                                to: undefined,
                                            });
                                        }
                                    }}
                                    numberOfMonths={1}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-muted-foreground text-center text-sm sm:text-left">
                    <span>Showing log overrides for </span>
                    <span className="text-foreground font-medium">
                        {dateRange.from
                            ? safeFormat(dateRange.from, "MMMM d, yyyy - ")
                            : "This cut-off"}
                        {dateRange.to
                            ? safeFormat(dateRange.to, "MMMM d, yyyy")
                            : "."}
                    </span>
                </div>

                <Link
                    to={`/logoverrides/form/${employeeId}`}
                    className="w-full sm:w-auto"
                >
                    <Button size="sm" className="w-full sm:w-auto">
                        File Log Override
                    </Button>
                </Link>
            </div>

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
                                            {safeFormat(
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
                                                <DialogContent className="max-w-md">
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
                                                                        safeFormat(
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
                                                                        safeFormat(
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
                                                                {(() => {
                                                                    if (
                                                                        !log.image
                                                                    ) {
                                                                        return (
                                                                            <div className="bg-muted text-muted-foreground my-4 rounded border border-dashed py-5 text-center text-sm">
                                                                                No
                                                                                image
                                                                                attached
                                                                            </div>
                                                                        );
                                                                    }

                                                                    // --- Determine which AppSheet app/table to use based on date (optional)
                                                                    const cutoffDate =
                                                                        new Date(
                                                                            "2025-06-01T00:00:00",
                                                                        );
                                                                    const recordDate =
                                                                        log.date_time
                                                                            ? new Date(
                                                                                  log.date_time,
                                                                              )
                                                                            : cutoffDate;
                                                                    const appName =
                                                                        recordDate >=
                                                                        cutoffDate
                                                                            ? "WFPhonetrics-373955958"
                                                                            : "AtlasAgencyTimeTrackerv2-373955958";
                                                                    const tableName =
                                                                        recordDate >=
                                                                        cutoffDate
                                                                            ? "Sheet1"
                                                                            : "hr_time_tracker";

                                                                    // --- Build the base image URL
                                                                    let imageSrc =
                                                                        "";
                                                                    if (
                                                                        log.image &&
                                                                        log.image.startsWith(
                                                                            "http",
                                                                        )
                                                                    ) {
                                                                        // Direct URL (could be AppSheet or your backend)
                                                                        imageSrc =
                                                                            log.image;
                                                                    } else if (
                                                                        log.image &&
                                                                        log.image.includes(
                                                                            "Sheet1_Images",
                                                                        )
                                                                    ) {
                                                                        // Local CodeIgniter-hosted file
                                                                        const encodedImage =
                                                                            encodeURIComponent(
                                                                                log.image,
                                                                            ).replace(
                                                                                /%2F/g,
                                                                                "/",
                                                                            );
                                                                        imageSrc = `http://localhost/backoffice/${encodedImage}`;
                                                                    } else if (
                                                                        log.image
                                                                    ) {
                                                                        // AppSheet-hosted file
                                                                        const cleanFileName =
                                                                            log.image.replace(
                                                                                /^.*[\\/]/,
                                                                                "",
                                                                            );
                                                                        imageSrc = `https://www.appsheet.com/template/getappfileurl?appName=${appName}&tableName=${tableName}&fileName=${cleanFileName}`;
                                                                    }

                                                                    // --- Fallback URLs (if local/AppSheet image fails)
                                                                    const cleanFileName =
                                                                        log.image.replace(
                                                                            /^.*[\\/]/,
                                                                            "",
                                                                        );
                                                                    const backupUrl = `https://www.appsheet.com/template/getappfileurl?appName=${appName}&tableName=${tableName}&fileName=Image_Back_Up/${cleanFileName}`;

                                                                    return (
                                                                        <div className="my-4">
                                                                            <img
                                                                                src={
                                                                                    imageSrc
                                                                                }
                                                                                alt="Logoverride Reference"
                                                                                className="max-h-64 w-full cursor-pointer rounded-lg border object-contain transition hover:opacity-90"
                                                                                onClick={() =>
                                                                                    window.open(
                                                                                        imageSrc,
                                                                                        "_blank",
                                                                                    )
                                                                                }
                                                                                onError={(
                                                                                    e,
                                                                                ) => {
                                                                                    const target =
                                                                                        e.currentTarget as HTMLImageElement;
                                                                                    console.warn(
                                                                                        "Primary image failed, using backup:",
                                                                                        backupUrl,
                                                                                    );
                                                                                    target.src =
                                                                                        backupUrl;
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    );
                                                                })()}
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
                    {dateRange.from &&
                        dateRange.to &&
                        ` range (${safeFormat(dateRange.from, "MMM d, yyyy")} – ${safeFormat(
                            dateRange.to,
                            "MMM d, yyyy",
                        )})`}
                    {dateRange.from &&
                        dateRange.to &&
                        ` (${safeFormat(dateRange.from, "MMM d, yyyy")})`}
                </Card>
            )}
        </Card>
    );
};

export default LogoverrideRequests;
