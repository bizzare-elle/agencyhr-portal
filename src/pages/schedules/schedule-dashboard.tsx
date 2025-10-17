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
import { ApiResponse } from "@/index";
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
import { formatToDateTime } from "@/helpers/formatDates";
import { format } from "date-fns";
import { Employee, Schedule } from "@/index";

export interface ScheduleResponse {
    info: Employee[];
    schedules: Schedule[];
    recent: Schedule[];
}

export default function ScheduleDashboard() {
    const { setToken } = useAuthStore.getState();

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
                <Card className="p-6 text-center font-bold text-red-500">
                    You don't have permission to access this page.
                </Card>
            </ParentComponent>
        );
    }

    const data = scheduleQuery.data;
    const employee = data?.info?.[0];
    const schedules = data?.schedules ?? [];
    const initialLetter =
        employee?.employee_name?.charAt(0)?.toUpperCase() ?? "?";

    return (
        <ParentComponent>
            {!employee ? (
                <Card>
                    <span className="block py-8 text-center text-2xl font-bold">
                        No schedule data found.
                    </span>
                </Card>
            ) : (
                <>
                    {/* --- Header Section --- */}
                    <div className="mb-4 w-full">
                        <Card className="flex flex-col items-center gap-4 rounded-xl bg-[#36454F] p-6 text-white shadow-md sm:flex-row sm:justify-between">
                            <div className="flex w-full flex-col items-center text-center sm:w-auto sm:flex-row sm:items-center sm:gap-4 sm:text-left">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-2xl font-bold">
                                    {initialLetter}
                                </div>

                                <div className="mt-2 sm:mt-0">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                                        <h1 className="text-lg font-bold tracking-wide sm:text-xl md:text-2xl">
                                            {employee.employee_name}
                                        </h1>
                                        {employee.agency_name && (
                                            <Badge className="mt-1 sm:mt-0 sm:text-sm md:text-base">
                                                {employee.agency_name}
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="mt-1 text-sm opacity-90">
                                        ID: {employee.id_number} •{" "}
                                        {employee.branch_name}
                                    </p>
                                </div>
                            </div>

                            <div className="w-full sm:w-auto">
                                <Link to={`/schedules/form/${employeeId}`}>
                                    <Button className="w-full sm:w-auto">
                                        Request Schedule
                                    </Button>
                                </Link>
                            </div>
                        </Card>
                    </div>

                    {/* --- Summary Section --- */}
                    <div className="mb-4 flex flex-col gap-4 sm:flex-row">
                        {[
                            {
                                title: "Total Schedules",
                                desc: "All schedule entries filed.",
                                count: schedules.length,
                            },
                            {
                                title: "Total Approved",
                                desc: "Approved schedule requests.",
                                count: schedules.filter((i) => i.status === "1")
                                    .length,
                            },
                            {
                                title: "Total Pending",
                                desc: "Pending schedule requests.",
                                count: schedules.filter(
                                    (i) => i.status === "0" || !i.status,
                                ).length,
                            },
                            {
                                title: "Total Disapproved",
                                desc: "Disapproved schedule requests.",
                                count: schedules.filter((i) => i.status === "2")
                                    .length,
                            },
                        ].map((card, i) => (
                            <Card key={i} className="flex-1">
                                <CardHeader>
                                    <CardTitle>{card.title}</CardTitle>
                                    <CardDescription>
                                        {card.desc}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {card.count}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* --- Recent Section --- */}
                    <div className="w-full">
                        {data.recent.length === 0 ? (
                            <Card>
                                <span className="block py-8 text-center text-2xl font-bold">
                                    No recent applications
                                </span>
                            </Card>
                        ) : (
                            <Card className="p-5 px-0">
                                <CardHeader className="pb-5">
                                    <CardTitle>Recent Activities</CardTitle>
                                    <CardDescription>
                                        Your most recent schedule requests.
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="overflow-x-auto">
                                    <Table className="border-border min-w-[600px] overflow-hidden rounded-md border">
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead className="px-4 py-5 text-center">
                                                    Date
                                                </TableHead>
                                                <TableHead className="px-4 py-5 text-center">
                                                    Schedule Type
                                                </TableHead>
                                                <TableHead className="px-4 py-5 text-center">
                                                    Branch
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
                                            {data.recent.map((r) => (
                                                <TableRow
                                                    key={r.id}
                                                    className="hover:bg-muted/10 transition"
                                                >
                                                    <TableCell className="px-4 py-5 text-center">
                                                        {formatToDateTime(
                                                            r.date,
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-4 py-5 text-center">
                                                        {r.schedule_name ??
                                                            "N/A"}
                                                    </TableCell>
                                                    <TableCell className="px-4 py-5 text-center capitalize">
                                                        {r.branch_name ?? "N/A"}
                                                    </TableCell>
                                                    <TableCell className="px-4 py-5 text-center">
                                                        <Badge
                                                            className={`text-white ${
                                                                r.status_label ===
                                                                "Approved"
                                                                    ? "bg-green-500"
                                                                    : "bg-yellow-500"
                                                            }`}
                                                        >
                                                            {r.status_label ===
                                                            "Approved"
                                                                ? "Approved"
                                                                : "Pending for Approval"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-5 text-center">
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

                                                            <DialogContent className="max-w-md">
                                                                <Card className="border-none bg-transparent shadow-none">
                                                                    <CardHeader className="pb-2">
                                                                        <DialogTitle className="text-lg font-semibold">
                                                                            Schedule
                                                                            Details
                                                                        </DialogTitle>
                                                                        <CardDescription>
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
                                                                                label: "Remarks",
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
                                                                                field,
                                                                                i,
                                                                            ) => (
                                                                                <div
                                                                                    key={
                                                                                        i
                                                                                    }
                                                                                    className="flex items-start justify-between"
                                                                                >
                                                                                    <Badge>
                                                                                        {
                                                                                            field.label
                                                                                        }
                                                                                    </Badge>
                                                                                    <span className="max-w-[65%] text-right font-medium break-words capitalize">
                                                                                        {
                                                                                            field.value
                                                                                        }
                                                                                    </span>
                                                                                </div>
                                                                            ),
                                                                        )}
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
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </>
            )}
        </ParentComponent>
    );
}
