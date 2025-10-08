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
    CardFooter,
} from "@/components/ui/card";
import { ApiResponse } from "@/index";
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
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";

export interface Logoverride {
    id: string;
    employee_id: string;
    employee_name: string;
    clock_type: string;
    date_time: string;
    remarks: string;
    status: string;
    image: string;
    created_at: string;
}

export interface Employee {
    id: string;
    firstname: string;
    lastname: string;
    agency_id: string | null;
    branch_id: string | null;
}

export interface LogoverrideResponse {
    info: Logoverride[];
    recent_file: Logoverride[];
    employees: Employee[];
}

export default function LogoverrideDashboard() {
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

    const logoverrideQuery = useQuery<LogoverrideResponse>({
        queryKey: ["logoverrideDashboard", employeeId],
        queryFn: async () => {
            const response = await api.get<ApiResponse<LogoverrideResponse>>(
                `/api/v2/logoverrides/${employeeId}`,
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

    if (meQuery.isLoading || logoverrideQuery.isLoading)
        return <FullPageLoader />;

    if (meQuery.isError || logoverrideQuery.isError)
        return (
            <ParentComponent>
                <div className="text-center text-2xl font-bold">
                    Error fetching data.
                </div>
            </ParentComponent>
        );

    const data = logoverrideQuery.data;

    return (
        <ParentComponent>
            {data?.info.length === 0 ? (
                <Card>
                    <span className="block py-8 text-center text-2xl font-bold">
                        No log overrides found.
                    </span>
                </Card>
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
                                <Link to={`/logoverrides/form/${employeeId}`}>
                                    <Button>File Logoverride</Button>
                                </Link>
                            </div>
                        </Card>
                    </div>

                    {/* Summary Cards */}
                    <div className="mb-4 flex flex-col gap-4 sm:flex-row">
                        <Card className="flex-1">
                            <CardHeader>
                                <CardTitle>Total Logoverrides</CardTitle>
                                <CardDescription>
                                    Total number of logoverrides filed.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {data?.info.length}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="flex-1">
                            <CardHeader>
                                <CardTitle>Total Approved</CardTitle>
                                <CardDescription>
                                    Approved logoverrides count.
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

                        <Card className="flex-1">
                            <CardHeader>
                                <CardTitle>Total Pending</CardTitle>
                                <CardDescription>
                                    Pending logoverrides count.
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

                    {/* Recent Activities */}
                    <div className="w-full">
                        {data?.recent_file.length === 0 ? (
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
                                        Your most recent logoverride
                                        applications.
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
                                                    Clock Type
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
                                                    className="hover:bg-muted/10 transition"
                                                >
                                                    <TableCell className="px-4 py-5 text-center">
                                                        {formatToDateTime(
                                                            r.date_time,
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-4 py-5 text-center">
                                                        {r.clock_type}
                                                    </TableCell>
                                                    <TableCell className="px-4 py-5 text-center capitalize">
                                                        {r?.remarks || "N/A"}
                                                    </TableCell>
                                                    <TableCell className="px-4 py-5 text-center">
                                                        {r.status ===
                                                        "Approved" ? (
                                                            <Badge className="bg-green-500 text-white">
                                                                {r.status}
                                                            </Badge>
                                                        ) : (
                                                            <Badge className="bg-yellow-500 text-black">
                                                                Pending or
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
                                                                <Card className="border-none bg-transparent shadow-none">
                                                                    <CardHeader className="pb-2">
                                                                        <DialogTitle className="text-lg font-semibold">
                                                                            Logoverride
                                                                            Details
                                                                        </DialogTitle>
                                                                        <CardDescription>
                                                                            Review
                                                                            your
                                                                            filed
                                                                            logoverride
                                                                            details.
                                                                        </CardDescription>
                                                                    </CardHeader>

                                                                    <CardContent className="space-y-4 text-sm">
                                                                        <div className="flex items-center justify-between">
                                                                            <Badge>
                                                                                Date:
                                                                            </Badge>
                                                                            <span className="font-medium">
                                                                                {formatToDateTime(
                                                                                    r.date_time,
                                                                                )}
                                                                            </span>
                                                                        </div>

                                                                        <div className="flex items-center justify-between">
                                                                            <Badge>
                                                                                Clock
                                                                                Type:
                                                                            </Badge>
                                                                            <span className="font-medium capitalize">
                                                                                {r.clock_type ||
                                                                                    "N/A"}
                                                                            </span>
                                                                        </div>

                                                                        <div className="flex items-start justify-between">
                                                                            <Badge>
                                                                                Remarks:
                                                                            </Badge>
                                                                            <span className="max-w-[65%] text-right font-medium break-words capitalize">
                                                                                {r.remarks ||
                                                                                    "N/A"}
                                                                            </span>
                                                                        </div>

                                                                        <div className="flex items-center justify-between">
                                                                            <Badge>
                                                                                Status:
                                                                            </Badge>
                                                                            <span
                                                                                className={`font-medium ${r.status === "Approved" ? "text-green-600" : "text-yellow-600"}`}
                                                                            >
                                                                                {
                                                                                    r.status
                                                                                }
                                                                            </span>
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
                                                                                    alt="Logoverride Reference"
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
