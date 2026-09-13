import { ParentComponent } from "@/components/parent-container";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Button } from "@/components/ui/button";
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
import { formatToMonthDayYear } from "@/helpers/formatDates";
import { toast } from "sonner";
import { CalendarOff } from "lucide-react";

export default function LeaveDashboard() {
    const queryClient = useQueryClient();

    const leaveQuery = useQuery<LeaveForm[]>({
        queryKey: ["leaveForms"],
        queryFn: async () => {
            const res = await api.get<ApiResponse<LeaveForm[]>>(
                "/api/v2/leave-forms",
            );
            return res.data.data ?? [];
        },
    });

    const withdrawMutation = useMutation({
        mutationFn: (id: string) =>
            api.post(`/api/v2/leave-forms/${id}/withdraw`),
        onSuccess: (res: any) => {
            toast.success(
                res.data?.message || "Leave form withdrawn successfully.",
            );
            queryClient.invalidateQueries({ queryKey: ["leaveForms"] });
        },
        onError: (error: any) => {
            toast.error(
                error?.response?.data?.message ||
                    "Failed to withdraw the leave form.",
            );
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
                <Card className="flex flex-col items-center justify-between gap-4 rounded-xl border p-4 shadow-sm sm:flex-row sm:p-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-yellow-500/20 text-yellow-400">
                            <CalendarOff className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold sm:text-xl">
                                Leave Forms
                            </h1>
                            <p className="text-muted-foreground text-sm">
                                Leave forms you've filed for your employees.
                            </p>
                        </div>
                    </div>

                    <Link to="/leave-forms/form">
                        <Button className="w-full bg-yellow-500 text-white hover:bg-yellow-600 sm:w-auto">
                            File Leave Form
                        </Button>
                    </Link>
                </Card>
            </div>

            <div className="w-full px-3 sm:px-0">
                <Card className="p-3 sm:p-5">
                    <CardHeader className="pb-5">
                        <CardTitle className="text-base sm:text-lg">
                            Filed Leave Forms
                        </CardTitle>
                        <CardDescription>
                            Withdrawing a leave form removes it from the
                            employee's schedule.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="overflow-x-auto">
                        <div className="border-border w-full overflow-x-auto rounded-md border">
                            <Table className="min-w-[800px] text-xs sm:text-sm">
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="px-3 py-4 text-center">
                                            Employee
                                        </TableHead>
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
                                            Filed On
                                        </TableHead>
                                        <TableHead className="px-3 py-4 text-center">
                                            Actions
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
                                                    {f.employee_name ?? "N/A"}
                                                </TableCell>
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
                                                    {formatToMonthDayYear(
                                                        f.created_at,
                                                    )}
                                                </TableCell>
                                                <TableCell className="px-3 py-4 text-center">
                                                    <AlertDialog>
                                                        <AlertDialogTrigger
                                                            asChild
                                                        >
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                disabled={
                                                                    withdrawMutation.isPending
                                                                }
                                                            >
                                                                Withdraw
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>
                                                                    Withdraw
                                                                    this leave
                                                                    form?
                                                                </AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This
                                                                    removes the
                                                                    leave from{" "}
                                                                    {
                                                                        f.employee_name
                                                                    }
                                                                    's
                                                                    schedule
                                                                    for{" "}
                                                                    {formatToMonthDayYear(
                                                                        f.date_start,
                                                                    )}{" "}
                                                                    &ndash;{" "}
                                                                    {formatToMonthDayYear(
                                                                        f.date_end,
                                                                    )}
                                                                    . This
                                                                    action
                                                                    cannot be
                                                                    undone.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>
                                                                    Cancel
                                                                </AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() =>
                                                                        withdrawMutation.mutate(
                                                                            f.id,
                                                                        )
                                                                    }
                                                                >
                                                                    Yes,
                                                                    Withdraw
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={8}
                                                className="py-5 text-center text-gray-500"
                                            >
                                                No leave forms filed yet.
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
