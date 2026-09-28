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
import { Link } from "react-router-dom";
import {
    Users,
    Timer,
    History,
    ScanFace,
    CalendarX,
    Building2,
} from "lucide-react";

export interface DashboardResponse {
    agency_name: string;
    total_employees: number;
    employee_chart: { month: string; regular: number; probationary: number }[];
    logoverride_chart: { month: string; total: number }[];
    overtime_chart: { month: string; total: number }[];
    pending_overtime: number;
    pending_logoverride: number;
    face_enrollment: { enrolled: number; total: number };
    no_schedule_today: number;
    branch_breakdown: { branch_name: string; total: string | number }[];
    recent_pending: {
        id: string;
        employee_name: string;
        branch_name: string | null;
        record_date: string;
        created_at: string;
        type: "overtime" | "logoverride";
    }[];
}

// ── Stat tile ──────────────────────────────────────────────────────────────────
// Same shape as HR Approvals' StatCard, so the coordinator sees one consistent
// KPI-tile language across the portal rather than a bespoke look per page.
function StatTile({
    icon: Icon,
    iconCls,
    bg,
    count,
    label,
    to,
}: {
    icon: React.ElementType;
    iconCls: string;
    bg: string;
    count: number | string;
    label: string;
    to?: string;
}) {
    const body = (
        <CardContent className="flex items-center gap-3 p-4">
            <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${bg}`}
            >
                <Icon className={`h-5 w-5 ${iconCls}`} />
            </div>
            <div className="min-w-0 flex-1">
                <p
                    className="truncate text-xl leading-none font-bold"
                    title={String(count)}
                >
                    {count}
                </p>
                <p className="text-muted-foreground mt-1 truncate text-xs">
                    {label}
                </p>
            </div>
        </CardContent>
    );

    return (
        <Card
            className={
                to ? "transition-colors hover:bg-white/5" : undefined
            }
        >
            {to ? <Link to={to}>{body}</Link> : body}
        </Card>
    );
}

export default function AgencyDashboard() {
    const { token } = useAuthStore();

    const meQuery = useQuery({
        queryKey: ["me"],
        queryFn: async () => {
            const response = await api.get<
                ApiResponse<{ id: string; agency_id: string }>
            >(`/api/v2/auth/me`);
            return response.data.data;
        },
    });

    const agencyId = meQuery.data?.agency_id;
    const approvalsUrl = `/approvals/${meQuery.data?.id ?? ""}`;

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

                {/* KPI tiles */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                    <StatTile
                        icon={Users}
                        iconCls="text-green-400"
                        bg="bg-green-500/10"
                        count={data?.total_employees ?? 0}
                        label="Active Employees"
                    />
                    <StatTile
                        icon={Timer}
                        iconCls="text-orange-400"
                        bg="bg-orange-500/10"
                        count={data?.pending_overtime ?? 0}
                        label="Pending Overtime"
                        to={approvalsUrl}
                    />
                    <StatTile
                        icon={History}
                        iconCls="text-blue-400"
                        bg="bg-blue-500/10"
                        count={data?.pending_logoverride ?? 0}
                        label="Pending Log Overrides"
                        to={approvalsUrl}
                    />
                    <StatTile
                        icon={ScanFace}
                        iconCls="text-yellow-400"
                        bg="bg-yellow-500/10"
                        count={`${data?.face_enrollment.enrolled ?? 0}/${data?.face_enrollment.total ?? 0}`}
                        label="Face Enrolled"
                    />
                    <StatTile
                        icon={CalendarX}
                        iconCls="text-red-400"
                        bg="bg-red-500/10"
                        count={data?.no_schedule_today ?? 0}
                        label="No Schedule Today"
                    />
                </div>

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

                {/* Branch headcount and Needs Attention */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Card className="transition-all duration-200">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                Headcount by Branch
                            </CardTitle>
                            <CardDescription>
                                Where your active employees are posted
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {data?.branch_breakdown?.length ? (
                                <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                                    {data.branch_breakdown.map((b) => {
                                        const total = Number(b.total);
                                        const max = Number(
                                            data.branch_breakdown[0]?.total ??
                                                1,
                                        );
                                        const pct = max
                                            ? Math.max(
                                                  4,
                                                  Math.round(
                                                      (total / max) * 100,
                                                  ),
                                              )
                                            : 0;
                                        return (
                                            <div
                                                key={b.branch_name ?? "unassigned"}
                                            >
                                                <div className="mb-1 flex items-center justify-between text-xs">
                                                    <span className="truncate pr-2">
                                                        {b.branch_name ??
                                                            "Unassigned"}
                                                    </span>
                                                    <span className="text-muted-foreground font-semibold">
                                                        {total}
                                                    </span>
                                                </div>
                                                <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                                                    <div
                                                        className="h-full rounded-full bg-green-500"
                                                        style={{
                                                            width: `${pct}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-sm">
                                    No branch data yet.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="transition-all duration-200">
                        <CardHeader>
                            <CardTitle>Needs Attention</CardTitle>
                            <CardDescription>
                                Most recent overtime and log override
                                requests still awaiting a decision
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {data?.recent_pending?.length ? (
                                <div className="space-y-3">
                                    {data.recent_pending.map((item) => (
                                        <Link
                                            key={`${item.type}-${item.id}`}
                                            to={approvalsUrl}
                                            className="flex items-center justify-between gap-3 rounded-md border border-transparent p-2 text-sm transition-colors hover:border-border hover:bg-white/5"
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate font-medium">
                                                    {item.employee_name}
                                                </p>
                                                <p className="text-muted-foreground truncate text-xs">
                                                    {item.branch_name ??
                                                        "No branch"}{" "}
                                                    &middot;{" "}
                                                    {item.record_date?.slice(
                                                        0,
                                                        10,
                                                    )}
                                                </p>
                                            </div>
                                            <Badge
                                                className={
                                                    item.type === "overtime"
                                                        ? "bg-orange-500/10 text-orange-400"
                                                        : "bg-blue-500/10 text-blue-400"
                                                }
                                            >
                                                {item.type === "overtime"
                                                    ? "Overtime"
                                                    : "Log Override"}
                                            </Badge>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-sm">
                                    Nothing pending — you're all caught up.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </motion.div>
        </ParentComponent>
    );
}
