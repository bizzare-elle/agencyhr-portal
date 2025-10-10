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
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/hooks/use-auth";
import FullPageLoader from "@/components/page-loader";

export interface Employee {
    id: string;
    id_number: string;
    employee_name: string;
    firstname: string;
    lastname: string;
    agency_id: string | null;
    agency_name: string | null;
    branch_id: string | null;
    branch_name: string | null;
}

export interface Schedule {
    id: string;
    employee_id: string;
    employee_name: string;
    branch_name: string;
    schedule_name: string;
    status: string;
    status_label?: string;
}

export interface ScheduleResponse {
    info: Employee;
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
                    `/api/v2/auth/me`,
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
                response.data.data ?? {
                    info: {},
                    schedules: [],
                    recent: [],
                }
            );
        },
        enabled: !!employeeId,
    });

    if (meQuery.isLoading || scheduleQuery.isLoading) return <FullPageLoader />;

    if (meQuery.isError || scheduleQuery.isError)
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

    const data = scheduleQuery.data;
    const employee = data?.info;
    const firstSchedule = data?.schedules?.[0];
    const initialLetter =
        firstSchedule?.employee_name?.charAt(0) ??
        employee?.employee_name?.charAt(0) ??
        "?";

    const totalSchedules = data?.schedules?.length ?? 0;
    const totalApproved = data?.schedules?.filter(
        (item) => item.status === "1",
    ).length;
    const totalDisapproved = data?.schedules?.filter(
        (item) => item.status === "2",
    ).length;
    const totalPending = data?.schedules?.filter(
        (item) => item.status === "0" || !item.status,
    ).length;

    return (
        <ParentComponent>
            {totalSchedules === 0 ? (
                <Card>
                    <span className="block py-8 text-center text-2xl font-bold">
                        No log schedules found.
                    </span>
                </Card>
            ) : (
                <>
                    <div className="mb-4 w-full">
                        <Card className="flex flex-col items-center gap-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white shadow-md sm:flex-row sm:justify-between">
                            {/* Left side: profile info */}
                            <div className="flex w-full flex-col items-center text-center sm:w-auto sm:flex-row sm:items-center sm:gap-4 sm:text-left">
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/20 text-2xl font-bold">
                                    {initialLetter}
                                </div>

                                <div className="mt-2 sm:mt-0">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                                        <h1 className="text-lg font-bold tracking-wide sm:text-xl md:text-2xl">
                                            {data?.info.employee_name}
                                        </h1>
                                        {employee?.agency_name && (
                                            <Badge className="mt-1 sm:mt-0 sm:text-sm md:text-base">
                                                {employee.agency_name}
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="mt-1 text-sm opacity-90">
                                        ID: {employee?.id_number ?? "N/A"} •{" "}
                                        {employee?.branch_name ?? "N/A"}
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

                    {/* Summary cards */}
                    <div className="mb-4 flex flex-col gap-4 sm:flex-row">
                        <Card className="flex-1">
                            <CardHeader>
                                <CardTitle>Total Schedule Requests</CardTitle>
                                <CardDescription>
                                    Total number of schedule requests filed.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {totalSchedules}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="flex-1">
                            <CardHeader>
                                <CardTitle>Total Approved</CardTitle>
                                <CardDescription>
                                    Approved schedule requests.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {totalApproved}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="flex-1">
                            <CardHeader>
                                <CardTitle>Total Pending</CardTitle>
                                <CardDescription>
                                    Pending schedule requests.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {totalPending}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="flex-1">
                            <CardHeader>
                                <CardTitle>Total Disapproved</CardTitle>
                                <CardDescription>
                                    Disapproved schedule requests.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {totalDisapproved}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </ParentComponent>
    );
}
