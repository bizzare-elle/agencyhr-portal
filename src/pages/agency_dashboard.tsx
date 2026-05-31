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
import { motion } from "framer-motion";

export interface DashboardResponse {
    agency_name: string;
    total_employees: number;
    employee_chart: { month: string; regular: number; probationary: number }[];
    logoverride_chart: { month: string; total: number }[];
    overtime_chart: { month: string; total: number }[];
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
                <div className="flex h-[60vh] items-center justify-center text-2xl font-bold text-red-500">
                    Failed to load dashboard data.
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
            <motion.div
                className="space-y-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
            >
                {/* Header */}
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3 text-2xl font-bold">
                        <h3>Agency Dashboard</h3>
                        <Badge className="bg-primary text-primary-foreground">
                            {data?.agency_name}
                        </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Workforce and time management overview.
                    </p>
                </div>

                {/* Summary Card */}
                <Card className="transition-all duration-200">
                    <CardHeader>
                        <CardTitle>Total Employees</CardTitle>
                        <CardDescription>
                            Currently active in your agency
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-5xl font-extrabold tracking-tight text-green-400">
                            {data?.total_employees ?? 0}
                        </div>
                    </CardContent>
                </Card>

                {/* Employee Growth Chart */}
                <Card className="transition-all duration-200">
                    <CardHeader>
                        <CardTitle>
                            Employee Growth (Regular vs Probationary)
                        </CardTitle>
                        <CardDescription>
                            Monthly breakdown of employees by status
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={320}>
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
                                    stroke="#22c55e"
                                    fill="#22c55e"
                                    fillOpacity={0.4}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="probationary"
                                    stroke="#3b82f6"
                                    fill="#3b82f6"
                                    fillOpacity={0.4}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Logoverride and Overtime Charts */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <Card className="transition-all duration-200">
                        <CardHeader>
                            <CardTitle>Monthly Logoverride Files</CardTitle>
                            <CardDescription>
                                Total number of logoverride requests filed
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={280}>
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
                                        stroke="#fbbf24"
                                        fill="#fbbf24"
                                        fillOpacity={0.5}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="transition-all duration-200">
                        <CardHeader>
                            <CardTitle>Monthly Overtime Files</CardTitle>
                            <CardDescription>
                                Total number of overtime requests filed
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={280}>
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
            </motion.div>
        </ParentComponent>
    );
}
