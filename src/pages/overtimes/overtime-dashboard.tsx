import { ParentComponent } from "@/components/parent-container";
import { useNavigate, Link } from "react-router-dom";
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
import { ApiResponse } from "@/index";
import { formatToDateTime } from "@/helpers/formatDates";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/hooks/use-auth";
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
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog";
import FullPageLoader from "@/components/page-loader";
import { format } from "date-fns";

export interface Overtime {
    id: string;
    employee_id: string;
    employee_name: string;
    date: string;
    no_of_hours: string;
    image: string;
    remarks: string;
    status: string;
    created_by: string;
    created_at: string;
    updated_by: string | null;
    updated_at: string | null;
    deleted_by: string | null;
    deleted_at: string | null;
}

export interface Employee {
    id: string;
    user_id: string | null;
    firstname: string;
    lastname: string;
    name: string | null;
    agency_id: string | null;
    branch_id: string | null;
    status: string;
    access: string;
    created_at: string | null;
    updated_at: string | null;
    deleted_at: string | null;
}

export interface OvertimeResponse {
    info: Overtime[];
    recent_file: Overtime[];
    employees: Employee[];
}

export default function OvertimeDashboard() {
    const navigate = useNavigate();
    const { setToken } = useAuthStore.getState();

    const meQuery = useQuery({
        queryKey: ["me"],
        queryFn: async () => {
            const response =
                await api.get<ApiResponse<{ id: string }>>(`/api/v2/auth/me`);
            return response.data.data;
        },
    });

    const employeeId = meQuery.data?.id;

    const overtimeQuery = useQuery<OvertimeResponse>({
        queryKey: ["overtimeDashboard", employeeId],
        queryFn: async () => {
            const response = await api.get<ApiResponse<OvertimeResponse>>(
                `/api/v2/overtime/${employeeId}`,
            );
            return (
                response.data.data ?? {
                    info: [],
                    employees: [],
                    recent_file: [],
                }
            );
        },
        enabled: !!employeeId,
    });

    if (meQuery.isLoading || overtimeQuery.isLoading) return <FullPageLoader />;

    if (meQuery.isError || overtimeQuery.isError)
        return (
            <ParentComponent>
                <div className="text-2xl font-bold">
                    Error fetching the data.
                </div>
            </ParentComponent>
        );

    const data = overtimeQuery.data;

    return (
        <ParentComponent>
            {data?.info.length === 0 ? (
                <div className="w-full">
                    <Card>
                        <span className="text-center text-2xl font-bold">
                            No filed overtime found.
                        </span>
                    </Card>
                </div>
            ) : (
                <>
                    {/* Employee Info Card */}
                    <div className="mb-4 w-full">
                        <Card className="flex flex-col items-center justify-between gap-4 px-5 py-6 md:flex-row md:gap-0">
                            <div className="flex items-center gap-4">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-2xl font-bold">
                                    {data?.info[0].employee_name.charAt(0)}
                                </div>
                                <div>
                                    <div className="flex flex-col md:flex-row md:items-center md:gap-3">
                                        <h1 className="text-xl font-bold tracking-wide md:text-2xl">
                                            {data?.info[0].employee_name}
                                        </h1>
                                        <Badge className="mt-1 md:mt-0">
                                            {data?.employees[0]?.agency_id}
                                        </Badge>
                                    </div>
                                    <p className="text-sm opacity-90">
                                        ID: {data?.info[0].employee_id} •{" "}
                                        {data?.employees[0]?.branch_id}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <Link to={`/overtime/form/${employeeId}`}>
                                    <Button>File Overtime</Button>
                                </Link>
                            </div>
                        </Card>
                    </div>

                    {/* Summary Cards */}
                    <div className="mb-4 flex flex-col gap-4 md:flex-row">
                        <Card className="w-full md:w-1/3">
                            <CardHeader>
                                <CardTitle>Total Overtime</CardTitle>
                                <CardDescription>
                                    Total number of overtime you filed.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {data?.info.length}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="w-full md:w-1/3">
                            <CardHeader>
                                <CardTitle>Total Approved Overtime</CardTitle>
                                <CardDescription>
                                    Total number of approved overtime you filed.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {
                                        data?.info.filter(
                                            (item) => item.status === "2",
                                        ).length
                                    }
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="w-full md:w-1/3">
                            <CardHeader>
                                <CardTitle>Total Pending Overtime</CardTitle>
                                <CardDescription>
                                    Total number of pending overtime you filed.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {
                                        data?.info.filter(
                                            (item) => item.status !== "2",
                                        ).length
                                    }
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Activities Table */}
                    <div className="w-full overflow-x-auto">
                        {data?.recent_file.length === 0 ? (
                            <Card>
                                <span className="text-center text-2xl font-bold">
                                    No recent application
                                </span>
                            </Card>
                        ) : (
                            <Card className="p-5 px-0">
                                <CardHeader className="pb-5">
                                    <CardTitle>Recent Activities</CardTitle>
                                    <CardDescription>
                                        Here are your most recent overtime
                                        applications.
                                    </CardDescription>
                                </CardHeader>

                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <Table className="border-border min-w-[600px] overflow-hidden rounded-md border">
                                            <TableHeader className="bg-muted/50">
                                                <TableRow>
                                                    <TableHead className="px-4 py-5 text-center">
                                                        Date
                                                    </TableHead>
                                                    <TableHead className="px-4 py-5 text-center">
                                                        Number of Hour/s
                                                    </TableHead>
                                                    <TableHead className="px-4 py-5 text-center">
                                                        Remarks
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
                                                {data?.recent_file.map((r) => (
                                                    <TableRow
                                                        key={r.id}
                                                        className="hover:bg-muted/10 cursor-pointer transition-colors"
                                                    >
                                                        <TableCell className="px-4 py-5 text-center">
                                                            {formatToDateTime(
                                                                r.date,
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="px-4 py-5 text-center capitalize">
                                                            {r?.no_of_hours ||
                                                                "N/A"}
                                                        </TableCell>
                                                        <TableCell className="px-4 py-5 text-center capitalize">
                                                            {r?.remarks ||
                                                                "N/A"}
                                                        </TableCell>
                                                        <TableCell className="px-4 py-5 text-center">
                                                            {r.status ===
                                                            "Approved" ? (
                                                                <Badge className="bg-green-500">
                                                                    {r.status}
                                                                </Badge>
                                                            ) : (
                                                                <Badge className="bg-yellow-500">
                                                                    Pending for
                                                                    Approval
                                                                </Badge>
                                                            )}
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
                                                                    <Card className="border-none bg-transparent">
                                                                        <CardHeader className="mb-4 text-lg font-semibold">
                                                                            <CardTitle>
                                                                                Overtime
                                                                                Details
                                                                            </CardTitle>
                                                                        </CardHeader>
                                                                        <CardContent>
                                                                            <div className="space-y-4 text-sm">
                                                                                <div className="flex justify-between">
                                                                                    <Badge>
                                                                                        Date:
                                                                                    </Badge>
                                                                                    <div className="font-medium">
                                                                                        {formatToDateTime(
                                                                                            r.date,
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex justify-between">
                                                                                    <Badge>
                                                                                        Remarks:
                                                                                    </Badge>
                                                                                    <div className="font-medium capitalize">
                                                                                        {r?.remarks ||
                                                                                            "N/A"}
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex justify-between">
                                                                                    <Badge>
                                                                                        Total
                                                                                        Number
                                                                                        of
                                                                                        Hour/s:
                                                                                    </Badge>
                                                                                    <div className="font-medium capitalize">
                                                                                        {r?.no_of_hours ||
                                                                                            "N/A"}
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex justify-between">
                                                                                    <Badge>
                                                                                        Status:
                                                                                    </Badge>
                                                                                    <div className="font-medium">
                                                                                        <span
                                                                                            className={`font-medium ${
                                                                                                r.status ===
                                                                                                "Approved"
                                                                                                    ? "text-green-600"
                                                                                                    : "text-yellow-600"
                                                                                            }`}
                                                                                        >
                                                                                            {
                                                                                                r.status
                                                                                            }
                                                                                        </span>
                                                                                    </div>
                                                                                </div>

                                                                                <div className="flex items-start justify-between">
                                                                                    <Badge>
                                                                                        Date
                                                                                        Created:
                                                                                    </Badge>
                                                                                    <span className="max-w-[65%] text-right font-medium break-words capitalize">
                                                                                        {format(
                                                                                            new Date(
                                                                                                r.created_at,
                                                                                            ),
                                                                                            "MMM d, yyyy hh:mm a",
                                                                                        )}
                                                                                    </span>
                                                                                </div>

                                                                                {r.image ? (
                                                                                    <div className="my-4">
                                                                                        <img
                                                                                            src={
                                                                                                r.image
                                                                                            }
                                                                                            alt="Overtime Reference"
                                                                                            className="max-h-64 w-full cursor-pointer rounded-lg border object-contain transition hover:opacity-90"
                                                                                            onClick={() =>
                                                                                                window.open(
                                                                                                    r.image,
                                                                                                    "_blank",
                                                                                                )
                                                                                            }
                                                                                        />
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="bg-muted text-muted-foreground my-4 rounded border border-dashed py-5 text-center text-sm">
                                                                                        No
                                                                                        image
                                                                                        attached
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </CardContent>
                                                                        <DialogFooter className="flex justify-end pt-2">
                                                                            <DialogClose
                                                                                asChild
                                                                            >
                                                                                <Button variant="secondary">
                                                                                    Close
                                                                                </Button>
                                                                            </DialogClose>
                                                                        </DialogFooter>
                                                                    </Card>
                                                                </DialogContent>
                                                            </Dialog>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </>
            )}
        </ParentComponent>
    );
}
