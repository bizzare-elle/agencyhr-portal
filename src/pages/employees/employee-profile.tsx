import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { ApiResponse } from "@/index";
import { cn } from "@/lib/utils";
import { formateToMonthDayYear } from "@/helpers/formatDates";
import TimeLogsTable from "@/components/employees/time-logs-table";
import FullPageLoader from "@/components/page-loader";
import { useAuthStore } from "@/hooks/use-auth";
import OvertimeRequestsCard from "@/components/employee-overtime";
import LogoverrideRequests from "@/components/employee-logoverride";
import EmployeeScheduleCard from "@/components/employee-schedule";
import { Employee, Schedule, Logoverride, Overtime } from "@/index";

export interface EmployeeResponse {
    info: Employee;
    schedules: Schedule[];
    logoverrides: Logoverride[];
    overtimes: Overtime[];
    setDateRange: React.Dispatch<
        React.SetStateAction<{ from: Date | undefined; to: Date | undefined }>
    >;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="border-muted-foreground/10 flex justify-between border-b py-1 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium">{value}</span>
        </div>
    );
}

export default function EmployeeProfile() {
    const navigate = useNavigate();

    const { data: me } = useQuery({
        queryKey: ["me"],
        queryFn: async () => {
            const response =
                await api.get<ApiResponse<{ hr_id: string; role: string }>>(
                    `/api/v2/auth/me`,
                );
            return response.data.data;
        },
    });

    const { id: paramId } = useParams<{ id: string }>();

    const employeeId =
        me?.role === "agency_coordinator" && paramId ? paramId : me?.hr_id;

    const { data, isLoading, isError } = useQuery<EmployeeResponse>({
        queryKey: ["employeeProfile", employeeId],
        queryFn: async () => {
            const response = await api.get<ApiResponse<EmployeeResponse>>(
                `/api/v2/employees/${employeeId}`,
            );
            return (
                response.data.data ?? {
                    info: [],
                    schedules: [],
                    logoverrides: [],
                    overtimes: [],
                }
            );
        },
        enabled: !!employeeId,
    });

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const midMonth = new Date(today.getFullYear(), today.getMonth(), 15);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const defaultRange =
        today.getDate() <= 15
            ? { from: startOfMonth, to: midMonth }
            : {
                  from: new Date(today.getFullYear(), today.getMonth(), 16),
                  to: endOfMonth,
              };

    const [dateRange, setDateRange] = React.useState<{
        from?: Date;
        to?: Date;
    }>({});

    const days: Date[] = React.useMemo(() => {
        const from = dateRange.from ?? startOfMonth;
        const to = dateRange.to ?? endOfMonth;
        const list: Date[] = [];

        const cursor = new Date(from);
        while (cursor <= to) {
            list.push(new Date(cursor));
            cursor.setDate(cursor.getDate() + 1);
        }
        return list;
    }, [dateRange, startOfMonth, endOfMonth]);

    const filteredSchedules = React.useMemo(() => {
        if (!Array.isArray(data?.schedules)) return [];

        const from = dateRange.from ?? new Date(-8640000000000000);
        const to = dateRange.to ?? new Date(8640000000000000);

        return data.schedules.filter((s) => {
            const scheduleDate = new Date(s.date);
            return scheduleDate >= from && scheduleDate <= to;
        });
    }, [data?.schedules, dateRange]);

    const filteredLogoverrides = React.useMemo(() => {
        if (!Array.isArray(data?.logoverrides)) return [];

        const from = dateRange.from ?? new Date(-8640000000000000);
        const to = dateRange.to ?? new Date(8640000000000000);

        return data.logoverrides.filter((log) => {
            const logDate = new Date(log.date_time);
            return logDate >= from && logDate <= to;
        });
    }, [data?.logoverrides, dateRange]);

    const filteredOvertimes = React.useMemo(() => {
        if (!Array.isArray(data?.overtimes)) return [];

        const from = dateRange.from ?? new Date(-8640000000000000);
        const to = dateRange.to ?? new Date(8640000000000000);

        return data.overtimes.filter((log) => {
            const logDate = new Date(log.date);
            return logDate >= from && logDate <= to;
        });
    }, [data?.overtimes, dateRange]);

    const transferLogs: { id: number; date: string; description: string }[] =
        [];

    if (isLoading) return <FullPageLoader />;
    if (isError) return <div>Error loading employee data.</div>;
    if (!data || !data.info) return <FullPageLoader />;

    return (
        <div className="mx-auto w-full max-w-[1600px] space-y-8 p-4 sm:p-6">
            {/* Header Section */}
            <div className="flex flex-col items-center gap-4 rounded-xl bg-[#36454F] p-6 text-white shadow-md sm:flex-row sm:justify-between">
                <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-2xl font-bold">
                        {data!.info.firstname.charAt(0) +
                            data!.info.lastname.charAt(0)}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-wide sm:text-3xl">
                            {data?.info.name}
                        </h1>
                        <p className="text-xs opacity-90 sm:text-sm">
                            ID: {data?.info.id_number} •{" "}
                            {data?.info.branch_name} • {data?.info.agency_name}
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs Section */}
            <Tabs defaultValue="data" className="w-full">
                <TabsList className="border-muted-foreground/20 scrollbar-none mb-4 flex flex-nowrap justify-start gap-2 overflow-x-auto border-b px-1 sm:px-2">
                    <TabsTrigger
                        value="data"
                        className="text-sm whitespace-nowrap sm:text-base"
                    >
                        Profile
                    </TabsTrigger>
                    <TabsTrigger
                        value="logs"
                        className="text-sm whitespace-nowrap sm:text-base"
                    >
                        Time Logs
                    </TabsTrigger>
                    <TabsTrigger
                        value="schedule"
                        className="text-sm whitespace-nowrap sm:text-base"
                    >
                        Schedule
                    </TabsTrigger>
                    <TabsTrigger
                        value="logOverride"
                        className="text-sm whitespace-nowrap sm:text-base"
                    >
                        Log Override
                    </TabsTrigger>
                    <TabsTrigger
                        value="overtime"
                        className="text-sm whitespace-nowrap sm:text-base"
                    >
                        Overtime
                    </TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="data" className="space-y-10">
                    <section>
                        <h2 className="mb-4 text-lg font-semibold sm:text-xl">
                            Personal & Company
                        </h2>

                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
                            {/* Personal Info */}
                            <Card className="p-4 shadow-sm sm:p-6">
                                <Badge className="mb-3">Personal</Badge>
                                <InfoRow
                                    label="Birth Date"
                                    value={formateToMonthDayYear(
                                        data!.info.birth_date,
                                    )}
                                />
                                <InfoRow
                                    label="Age"
                                    value={data!.info.age || "N/A"}
                                />
                                <InfoRow
                                    label="Gender"
                                    value={data!.info.gender_display}
                                />
                                <InfoRow
                                    label="Civil Status"
                                    value={data!.info.civil_status_display}
                                />
                                <InfoRow
                                    label="Contact Number"
                                    value={data?.info.contact_number}
                                />
                                <InfoRow
                                    label="Personal Email"
                                    value={
                                        data?.info.personal_email_address ||
                                        "N/A"
                                    }
                                />
                                <InfoRow
                                    label="Address"
                                    value={data?.info.address}
                                />
                            </Card>

                            {/* Company Info */}
                            <Card className="p-4 shadow-sm sm:p-6">
                                <Badge className="mb-3">Company</Badge>
                                <InfoRow
                                    label="Agency"
                                    value={data?.info.agency_name}
                                />
                                <InfoRow
                                    label="Branch"
                                    value={data?.info.branch_name}
                                />
                                <InfoRow
                                    label="Department"
                                    value={data?.info.department_name}
                                />
                                <InfoRow
                                    label="Position"
                                    value={data?.info.position_name}
                                />
                                <p className="text-sm font-medium">
                                    Employment Timeline
                                </p>
                                <InfoRow
                                    label="Trial Date"
                                    value={formateToMonthDayYear(
                                        data!.info.trial_date,
                                    )}
                                />
                                <InfoRow
                                    label="Date Hired"
                                    value={formateToMonthDayYear(
                                        data!.info.date_hired,
                                    )}
                                />
                                <InfoRow
                                    label="Regularization"
                                    value={formateToMonthDayYear(
                                        data!.info.date_regularization,
                                    )}
                                />
                                <InfoRow
                                    label="Tenureship"
                                    value={data!.info.tenureship || "N/A"}
                                />
                                <InfoRow
                                    label="Status"
                                    value={
                                        <Badge
                                            className={cn(
                                                "bg-green-600 text-white",
                                                !data?.info.is_active &&
                                                    "bg-red-600 text-white",
                                            )}
                                        >
                                            {data?.info.is_active
                                                ? "Active"
                                                : "Inactive"}
                                        </Badge>
                                    }
                                />
                            </Card>
                        </div>
                    </section>

                    {/* Contacts & IDs */}
                    <section>
                        <h2 className="mb-4 text-lg font-semibold sm:text-xl">
                            Contacts & IDs
                        </h2>
                        <div className="grid gap-6 sm:grid-cols-2">
                            <Card className="p-4 shadow-sm sm:p-6">
                                <Badge className="mb-3">Emergency</Badge>
                                <InfoRow
                                    label="Contact Name"
                                    value={data!.info.emergency_contact_name}
                                />
                                <InfoRow
                                    label="Relationship"
                                    value={data!.info.emergency_relation}
                                />
                                <InfoRow
                                    label="Mobile Number"
                                    value={data!.info.emergency_mobile_no}
                                />
                                <InfoRow
                                    label="Address"
                                    value={data!.info.emergency_address}
                                />
                            </Card>

                            <Card className="p-4 shadow-sm sm:p-6">
                                <Badge className="mb-3">Government IDs</Badge>
                                <InfoRow
                                    label="TIN"
                                    value={
                                        data?.info.government_tin_nos || "N/A"
                                    }
                                />
                                <InfoRow
                                    label="SSS"
                                    value={
                                        data?.info.government_sss_nos || "N/A"
                                    }
                                />
                                <InfoRow
                                    label="PhilHealth"
                                    value={
                                        data?.info.government_philhealth_nos ||
                                        "N/A"
                                    }
                                />
                                <InfoRow
                                    label="PAGIBIG"
                                    value="1212-8799-4133"
                                />
                            </Card>
                        </div>
                    </section>
                </TabsContent>

                <TabsContent value="logs">
                    <Card className="mt-6 p-4 shadow-sm sm:p-6">
                        <CardHeader className="p-0">
                            <CardTitle>Recent Approved Time Logs</CardTitle>
                            <CardDescription>
                                Your approved time logs in the system.
                            </CardDescription>
                        </CardHeader>
                        <TimeLogsTable employeeId={data!.info.id} />
                    </Card>
                </TabsContent>

                <TabsContent value="schedule">
                    <EmployeeScheduleCard
                        days={days}
                        filteredSchedules={filteredSchedules}
                        dateRange={dateRange}
                        employeeId={employeeId as string}
                        setDateRange={setDateRange}
                    />
                </TabsContent>

                <TabsContent value="logOverride">
                    <LogoverrideRequests
                        dateRange={dateRange}
                        setDateRange={setDateRange}
                        days={days}
                        filteredLogoverrides={filteredLogoverrides}
                        filteredSchedules={filteredSchedules}
                        employeeId={employeeId as string}
                    />
                </TabsContent>

                <TabsContent value="overtime">
                    <OvertimeRequestsCard
                        employeeId={employeeId as string}
                        dateRange={dateRange}
                        setDateRange={setDateRange}
                        filteredOvertimes={filteredOvertimes}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
