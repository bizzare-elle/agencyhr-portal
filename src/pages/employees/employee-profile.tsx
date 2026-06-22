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
import { ApiResponse, Employee } from "@/index";
import { cn } from "@/lib/utils";
import { formatToMonthDayYear } from "@/helpers/formatDates";
import TimeLogsTable from "@/components/employees/time-logs-table";
import FullPageLoader from "@/components/page-loader";
import OvertimeRequestsCard from "@/components/employee-overtime";
import LogoverrideRequests from "@/components/employee-logoverride";
import EmployeeScheduleCard from "@/components/employee-schedule";
import EmployeeTraining from "@/components/employee-training";

const InfoRow = React.memo(
    ({ label, value }: { label: string; value: React.ReactNode }) => (
        <div className="border-muted-foreground/10 flex justify-between border-b py-1 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium">{value}</span>
        </div>
    ),
);

interface EmployeeResponse {
    info: Employee;
    schedules: any[];
    logoverrides: any[];
    overtimes: any[];
}

export default function EmployeeProfile() {
    const navigate = useNavigate();
    const { id: paramId } = useParams<{ id: string }>();

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
                    info: {} as Employee,
                    schedules: [],
                    logoverrides: [],
                    overtimes: [],
                }
            );
        },
        enabled: !!employeeId,
        staleTime: 1000 * 60 * 10,
        gcTime: 1000 * 60 * 30,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false,
    });

    const [activeTab, setActiveTab] = React.useState("data");
    const [dateRange, setDateRange] = React.useState<{
        from?: Date;
        to?: Date;
    }>({});

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const days = React.useMemo(() => {
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

    if (!employeeId || isLoading || !data) return <FullPageLoader />;
    if (isError)
        return (
            <div className="text-center text-red-600">
                Failed to load employee data.
            </div>
        );

    const employee = data.info ?? {};

    return (
        <div className="mx-auto w-full max-w-[1600px] space-y-8 p-4 sm:p-6">
            <div className="flex flex-col items-center gap-4 rounded-xl border p-6 shadow-sm sm:flex-row sm:justify-between">
                <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/20 text-2xl font-bold text-yellow-400">
                        {employee.firstname.charAt(0) +
                            employee.lastname.charAt(0)}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-wide sm:text-3xl">
                            {employee.name}
                        </h1>
                        <p className="text-xs text-muted-foreground sm:text-sm">
                            ID: {employee.id_number} • {employee.branch_name} •{" "}
                            {employee.agency_name}
                        </p>
                    </div>
                </div>
            </div>

            <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
            >
                <TabsList className="border-muted-foreground/20 scrollbar-none mb-4 flex w-full flex-nowrap justify-start gap-2 overflow-x-auto border-b px-1 sm:justify-center sm:gap-4 sm:px-2">
                    <TabsTrigger value="data">Profile</TabsTrigger>
                    <TabsTrigger value="logs">Time Logs</TabsTrigger>
                    <TabsTrigger value="schedule">Schedule</TabsTrigger>
                    <TabsTrigger value="logOverride">Log Override</TabsTrigger>
                    <TabsTrigger value="overtime">Overtime</TabsTrigger>
                    <TabsTrigger value="training">Training</TabsTrigger>
                </TabsList>

                {activeTab === "data" && (
                    <TabsContent value="data" className="space-y-10">
                        <section>
                            <h2 className="mb-4 text-lg font-semibold sm:text-xl">
                                Personal & Company
                            </h2>
                            <div className="grid gap-6 sm:grid-cols-2">
                                <Card className="p-4 shadow-sm sm:p-6">
                                    <Badge className="mb-3">Personal</Badge>
                                    <InfoRow
                                        label="Birth Date"
                                        value={formatToMonthDayYear(
                                            employee.birth_date,
                                        )}
                                    />
                                    <InfoRow
                                        label="Age"
                                        value={employee.age || "N/A"}
                                    />
                                    <InfoRow
                                        label="Gender"
                                        value={employee.gender_display}
                                    />
                                    <InfoRow
                                        label="Civil Status"
                                        value={employee.civil_status_display}
                                    />
                                    <InfoRow
                                        label="Contact Number"
                                        value={employee.contact_number}
                                    />
                                    <InfoRow
                                        label="Address"
                                        value={employee.address}
                                    />
                                    <InfoRow
                                        label="Personal Email Address"
                                        value={employee.personal_email_address}
                                    />
                                </Card>

                                <Card className="p-4 shadow-sm sm:p-6">
                                    <Badge className="mb-3">Company</Badge>
                                    <InfoRow
                                        label="Agency"
                                        value={employee.agency_name}
                                    />
                                    <InfoRow
                                        label="Branch"
                                        value={employee.branch_name}
                                    />
                                    <InfoRow
                                        label="Department"
                                        value={employee.department_name}
                                    />
                                    <InfoRow
                                        label="Position"
                                        value={employee.position_name}
                                    />
                                    <InfoRow
                                        label="Date Hired"
                                        value={formatToMonthDayYear(
                                            employee.date_hired,
                                        )}
                                    />
                                    <InfoRow
                                        label="Status"
                                        value={
                                            <Badge
                                                className={cn(
                                                    "text-white",
                                                    employee.is_active
                                                        ? "bg-green-600"
                                                        : "bg-red-600",
                                                )}
                                            >
                                                {employee.is_active
                                                    ? "Active"
                                                    : "Inactive"}
                                            </Badge>
                                        }
                                    />
                                    <InfoRow
                                        label="Company Email  Address"
                                        value={employee.company_email_address}
                                    />
                                </Card>
                            </div>
                        </section>

                        <section>
                            <h2 className="mb-4 text-lg font-semibold sm:text-xl">
                                Contacts & IDs
                            </h2>
                            <div className="grid gap-6 sm:grid-cols-2">
                                <Card className="p-4 shadow-sm sm:p-6">
                                    <Badge className="mb-3">Emergency</Badge>
                                    <InfoRow
                                        label="Contact Name"
                                        value={
                                            employee.emergency_contact_name ||
                                            "N/A"
                                        }
                                    />
                                    <InfoRow
                                        label="Relationship"
                                        value={
                                            employee.emergency_relation || "N/A"
                                        }
                                    />
                                    <InfoRow
                                        label="Mobile Number"
                                        value={
                                            employee.emergency_mobile_no ||
                                            "N/A"
                                        }
                                    />
                                    <InfoRow
                                        label="Address"
                                        value={
                                            employee.emergency_address || "N/A"
                                        }
                                    />
                                </Card>

                                <Card className="p-4 shadow-sm sm:p-6">
                                    <Badge className="mb-3">
                                        Government IDs
                                    </Badge>
                                    <InfoRow
                                        label="TIN"
                                        value={
                                            employee.government_tin_nos || "N/A"
                                        }
                                    />
                                    <InfoRow
                                        label="SSS"
                                        value={
                                            employee.government_sss_nos || "N/A"
                                        }
                                    />
                                    <InfoRow
                                        label="PhilHealth"
                                        value={
                                            employee.government_philhealth_nos ||
                                            "N/A"
                                        }
                                    />
                                    <InfoRow
                                        label="PAGIBIG"
                                        value={
                                            employee.government_pagibig_nos ||
                                            "N/A"
                                        }
                                    />
                                </Card>
                            </div>
                        </section>
                    </TabsContent>
                )}

                {activeTab === "logs" && (
                    <TabsContent value="logs">
                        <Card className="mt-6 p-4 shadow-sm sm:p-6">
                            <CardHeader className="p-0">
                                <CardTitle>Recent Approved Time Logs</CardTitle>
                                <CardDescription>
                                    Your approved time logs in the system.
                                </CardDescription>
                            </CardHeader>
                            <TimeLogsTable employeeId={employee.id} />
                        </Card>
                    </TabsContent>
                )}

                {activeTab === "schedule" && (
                    <TabsContent value="schedule">
                        <EmployeeScheduleCard
                            days={days}
                            filteredSchedules={data?.schedules ?? []}
                            dateRange={dateRange}
                            employeeId={employeeId as string}
                            setDateRange={setDateRange}
                        />
                    </TabsContent>
                )}

                {activeTab === "logOverride" && (
                    <TabsContent value="logOverride">
                        <LogoverrideRequests
                            dateRange={dateRange}
                            setDateRange={setDateRange}
                            days={days}
                            filteredLogoverrides={data?.logoverrides ?? []}
                            employeeId={employeeId as string}
                        />
                    </TabsContent>
                )}

                {activeTab === "overtime" && (
                    <TabsContent value="overtime">
                        <OvertimeRequestsCard
                            employeeId={employeeId as string}
                            dateRange={dateRange}
                            setDateRange={setDateRange}
                            filteredOvertimes={data?.overtimes ?? []}
                        />
                    </TabsContent>
                )}

                {activeTab === "training" && (
                    <TabsContent value="training">
                        <EmployeeTraining employeeId={employeeId as string} />
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}
