import { ParentComponent } from "@/components/parent-container";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { ApiResponse } from "@/index";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import FullPageLoader from "@/components/page-loader";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
} from "recharts";
import { useAuthStore } from "@/hooks/use-auth";

export interface DashboardResponse {
    agency_name: string;
    total_employees: number;
    pending_logoverrides: number;
    pending_overtime: number;
    pending_schedules: number;
    employee_chart: {
        month: string;
        regular: number;
        probationary: number;
    }[];
    logoverride_chart: {
        month: string;
        total: number;
    }[];
    overtime_chart: {
        month: string;
        total: number;
    }[];
}

export default function AgencyDashboard() {
    const { token } = useAuthStore();

    const meQuery = useQuery({
        queryKey: ["me"],
        queryFn: async () => {
            const response =
                await api.get<ApiResponse<{ agency_id: string }>>(
                    `/api/v2/auth/me`,
                );
            return response.data.data;
        },
    });

    const agencyId = meQuery.data?.agency_id;

    const dashboardQuery = useQuery<DashboardResponse>({
        staleTime: 1000 * 60 * 5,
        // cacheTime: 1000 * 60 * 10,
        queryKey: ["agencyDashboard", agencyId],
        queryFn: async () => {
            const response = await api.get<ApiResponse<DashboardResponse>>(
                `/api/v2/dashboard/${agencyId}`,
            );
            return response.data.data;
        },
        enabled: !!agencyId,
    });

    if (meQuery.isLoading || dashboardQuery.isLoading)
        return <FullPageLoader />;

    if (meQuery.isError || dashboardQuery.isError)
        return (
            <ParentComponent>
                <div className="text-center text-2xl font-bold text-red-500">
                    Error fetching dashboard data.
                </div>
            </ParentComponent>
        );

    const data = dashboardQuery.data;

    const tooltipFormatter = (value: any, name: any) => [
        value,
        String(name).charAt(0).toUpperCase() +
            String(name).slice(1).toLowerCase(),
    ];

    return (
        <ParentComponent>
            <div className="space-y-6">
                <div className="flex flex-col gap-2">
                    <div className="align-center flex gap-x-2 text-2xl font-bold text-white">
                        <h3>Agency Dashboard</h3>
                        <Badge>{data?.agency_name}</Badge>
                    </div>
                    <p className="text-sm text-white/60">
                        Workforce and time management overview.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
                    <Card className="bg-[#1f1f1f] text-white">
                        <CardHeader>
                            <CardTitle>Total Employees</CardTitle>
                            <CardDescription className="text-gray-400">
                                Active employees
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold">
                                {data?.total_employees ?? 0}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-[#1f1f1f] text-white">
                        <CardHeader>
                            <CardTitle>Pending Log Overrides</CardTitle>
                            <CardDescription className="text-gray-400">
                                Awaiting approval
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold text-yellow-400">
                                {data?.pending_logoverrides ?? 0}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-[#1f1f1f] text-white">
                        <CardHeader>
                            <CardTitle>Pending Overtime</CardTitle>
                            <CardDescription className="text-gray-400">
                                Awaiting approval
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold text-blue-400">
                                {data?.pending_overtime ?? 0}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-[#1f1f1f] text-white">
                        <CardHeader>
                            <CardTitle>Pending Schedule Request</CardTitle>
                            <CardDescription className="text-gray-400">
                                Awaiting approval
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold text-yellow-400">
                                {data?.pending_schedules ?? 0}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="bg-[#1f1f1f] text-white">
                    <CardHeader>
                        <CardTitle>
                            Employee Growth (Regular vs Probationary)
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                            Monthly breakdown of employees by status.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={data?.employee_chart || []}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#333"
                                />
                                <XAxis dataKey="month" stroke="#888" />
                                <YAxis stroke="#888" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#2a2a2a",
                                        border: "none",
                                        borderRadius: "8px",
                                        color: "#fff",
                                    }}
                                    formatter={tooltipFormatter}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="regular"
                                    stroke="#4ade80"
                                    fill="#4ade80"
                                    fillOpacity={0.5}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="probationary"
                                    stroke="#60a5fa"
                                    fill="#60a5fa"
                                    fillOpacity={0.5}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Logoverride and Overtime Charts */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <Card className="bg-[#1f1f1f] text-white">
                        <CardHeader>
                            <CardTitle>Monthly Logoverride Files</CardTitle>
                            <CardDescription className="text-gray-400">
                                Total number of logoverride requests filed.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={data?.logoverride_chart || []}>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#333"
                                    />
                                    <XAxis dataKey="month" stroke="#888" />
                                    <YAxis stroke="#888" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "#2a2a2a",
                                            border: "none",
                                            borderRadius: "8px",
                                            color: "#fff",
                                        }}
                                        formatter={tooltipFormatter}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="total"
                                        stroke="#facc15"
                                        fill="#facc15"
                                        fillOpacity={0.5}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="bg-[#1f1f1f] text-white">
                        <CardHeader>
                            <CardTitle>Monthly Overtime Files</CardTitle>
                            <CardDescription className="text-gray-400">
                                Total number of overtime requests filed.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={data?.overtime_chart || []}>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#333"
                                    />
                                    <XAxis dataKey="month" stroke="#888" />
                                    <YAxis stroke="#888" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "#2a2a2a",
                                            border: "none",
                                            borderRadius: "8px",
                                            color: "#fff",
                                        }}
                                        formatter={tooltipFormatter}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="total"
                                        stroke="#3b82f6"
                                        fill="#3b82f6"
                                        fillOpacity={0.5}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </ParentComponent>
    );
}
