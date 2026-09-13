import { ParentComponent } from "@/components/parent-container";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/axios";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { ApiResponse, LeaveForm } from "@/index";
import FullPageLoader from "@/components/page-loader";
import {
    Table,
    TableCell,
    TableBody,
    TableHeader,
    TableRow,
    TableHead,
} from "@/components/ui/table";
import { formatToMonthDayYear } from "@/helpers/formatDates";
import { CalendarOff } from "lucide-react";

export default function MyLeaveForms() {
    const leaveQuery = useQuery<LeaveForm[]>({
        queryKey: ["myLeaveForms"],
        queryFn: async () => {
            const res = await api.get<ApiResponse<LeaveForm[]>>(
                "/api/v2/leave-forms/my",
            );
            return res.data.data ?? [];
        },
    });

    const forms = leaveQuery.data ?? [];

    if (leaveQuery.isLoading) return <FullPageLoader />;

    if (leaveQuery.isError) {
        return (
            <ParentComponent>
                <div className="text-center text-2xl font-bold text-red-500">
                    Error fetching leave forms.
                </div>
            </ParentComponent>
        );
    }

    return (
        <ParentComponent>
            <div className="mb-4 w-full">
                <Card className="flex flex-col items-center gap-3 rounded-xl border p-4 shadow-sm sm:flex-row sm:p-6">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-yellow-500/20 text-yellow-400">
                        <CalendarOff className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold sm:text-xl">
                            Leave Forms
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Approved leave forms filed for you. These are
                            already reflected on your schedule.
                        </p>
                    </div>
                </Card>
            </div>

            <div className="w-full px-3 sm:px-0">
                <Card className="p-3 sm:p-5">
                    <CardHeader className="pb-5">
                        <CardTitle className="text-base sm:text-lg">
                            My Approved Leave
                        </CardTitle>
                        <CardDescription>
                            Filed by your agency coordinator.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="overflow-x-auto">
                        <div className="border-border w-full overflow-x-auto rounded-md border">
                            <Table className="min-w-[800px] text-xs sm:text-sm">
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="px-3 py-4 text-center">
                                            Leave Type
                                        </TableHead>
                                        <TableHead className="px-3 py-4 text-center">
                                            Paid?
                                        </TableHead>
                                        <TableHead className="px-3 py-4 text-center">
                                            Date Range
                                        </TableHead>
                                        <TableHead className="px-3 py-4 text-center">
                                            Days
                                        </TableHead>
                                        <TableHead className="px-3 py-4 text-center">
                                            Attachment
                                        </TableHead>
                                        <TableHead className="px-3 py-4 text-center">
                                            Filed By
                                        </TableHead>
                                        <TableHead className="px-3 py-4 text-center">
                                            Filed On
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {forms.length > 0 ? (
                                        forms.map((f) => (
                                            <TableRow
                                                key={f.id}
                                                className="hover:bg-muted/10 transition"
                                            >
                                                <TableCell className="px-3 py-4 text-center">
                                                    <Badge variant="outline">
                                                        {f.leave_type_label ??
                                                            f.leave_type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="px-3 py-4 text-center">
                                                    {Number(f.is_paid) === 1 ? (
                                                        <Badge className="bg-green-500/10 text-green-400">
                                                            Paid
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-muted text-muted-foreground">
                                                            Unpaid
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="px-3 py-4 text-center">
                                                    {formatToMonthDayYear(
                                                        f.date_start,
                                                    )}{" "}
                                                    &ndash;{" "}
                                                    {formatToMonthDayYear(
                                                        f.date_end,
                                                    )}
                                                </TableCell>
                                                <TableCell className="px-3 py-4 text-center">
                                                    {f.days_count}
                                                </TableCell>
                                                <TableCell className="px-3 py-4 text-center">
                                                    {f.attachment_url ? (
                                                        <a
                                                            href={
                                                                f.attachment_url
                                                            }
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-yellow-500 underline hover:text-yellow-600"
                                                        >
                                                            View
                                                        </a>
                                                    ) : (
                                                        "N/A"
                                                    )}
                                                </TableCell>
                                                <TableCell className="px-3 py-4 text-center">
                                                    {f.filed_by_name ?? "N/A"}
                                                </TableCell>
                                                <TableCell className="px-3 py-4 text-center">
                                                    {formatToMonthDayYear(
                                                        f.created_at,
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={7}
                                                className="py-5 text-center text-gray-500"
                                            >
                                                No approved leave forms filed
                                                for you yet.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </ParentComponent>
    );
}
