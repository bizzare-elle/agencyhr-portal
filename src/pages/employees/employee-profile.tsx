import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardDescription,
    CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from "@/components/ui/table";
import { ClipboardList } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { ApiResponse } from "@/index";
import { cn } from "@/lib/utils";
import { formatToPeso } from "@/helpers/formatToPeso";
import { formateToMonthDayYear, formatToDateTime } from "@/helpers/formatDates";
import TimeLogsTable from "@/components/employees/time-logs-table";
import FullPageLoader from "@/components/page-loader";
import { useAuthStore } from "@/hooks/use-auth";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import OvertimeRequestsCard from "@/components/employee-overtime";
import LogoverrideRequests from "@/components/employee-logoverride";

export interface Employee {
    id: number;
    firstname: string;
    middlename: string;
    lastname: string;
    name: string;
    birth_date: string;
    age: number | null;
    citizenship: string;
    gender: string;
    civil_status: string;
    trial_date: string;
    date_hired: string;
    date_regularization: string;
    department_name: string;
    tenureship: string | null;
    gender_display: string;
    civil_status_display: string;
    employment_status: string;
    agency_id: string;
    id_number: string;
    branch_id: string;
    branch_name: string;
    agency_name: string;
    address: string;
    is_active: boolean;
    contact_number: string;
    personal_email_address: string;
    company_email_address: string;
    schedule_type: string | null;
    department_id: number;
    position_id: number;
    position_name: string;
    salary_rate: string;
    daily_rate: string;
    hourly_rate: string;
    billing_rate: string;
    allowance: string;
    status: string;
    date_resigned: string | null;
    remarks: string;
    government_tin_nos: string;
    government_sss_nos: string;
    government_philhealth_nos: string;
    government_pagibig_nos: string;
    emergency_contact_name: string;
    emergency_address: string;
    emergency_mobile_no: string;
    emergency_relation: string;
    pay_divisor: string;
    access: string;
    is_chef: string;
    chef_downline_id: string;
    is_direct: string;
    created_at: string;
    created_by: string;
    updated_at: string;
    updated_by: string;
    deleted_at: string | null;
    deleted_by: string | null;
    gross_pay: string | null;
}

export interface Schedule {
    id: string;
    emp_sched_date_id: string;
    branch_id: string;
    branch_name: string;
    date: string;
    employee_id: string;
    schedule_name: string;
    schedule_type: string;
    created_by: string;
    created_at: string;
    updated_by: string | null;
    updated_at: string | null;
    deleted_by: string | null;
    deleted_at: string | null;
}

export interface Logoverride {
    id: string;
    app_key: string;
    employee_id: string;
    employee_name: string;
    agency_name: string;
    useremail: string;
    date_time: string;
    clock_type: string;
    location: string;
    branch_id: string | null;
    image: string;
    is_range: string;
    remarks: string;
    is_logoverride: string;
    status: string;
    created_by: string;
    created_at: string;
    updated_by: string | null;
    updated_at: string | null;
    deleted_by: string | null;
    deleted_at: string | null;
}

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

export interface EmployeeResponse {
    info: Employee;
    schedules: Schedule[];
    logoverrides: Logoverride[];
    overtimes: Overtime[];
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
    const { setToken } = useAuthStore.getState();

    const { data: me } = useQuery({
        queryKey: ["me"],
        queryFn: async () => {
            const response =
                await api.get<ApiResponse<{ id: string }>>(`/api/v2/auth/me`);
            return response.data.data;
        },
    });

    const employeeId = me?.id;

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
        from: Date | undefined;
        to: Date | undefined;
    }>(defaultRange);

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
        <div className="mx-auto w-full max-w-[1600px] space-y-8 p-6">
            <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white shadow-md">
                <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-2xl font-bold">
                        {data!.info.firstname.charAt(0) +
                            data!.info.lastname.charAt(0)}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-wide">
                            {data?.info.name}
                        </h1>
                        <p className="text-sm opacity-90">
                            ID: {data?.info.id_number} •{" "}
                            {data?.info.branch_name} • {data?.info.agency_name}
                        </p>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="data" className="w-full">
                <TabsList className="border-muted-foreground/20 mb-4 justify-start space-x-2 border-b">
                    <TabsTrigger value="data">Profile</TabsTrigger>
                    <TabsTrigger value="logs">Time Logs</TabsTrigger>
                    <TabsTrigger value="schedule">Schedule</TabsTrigger>
                    <TabsTrigger value="logOverride">Log Override</TabsTrigger>
                    <TabsTrigger value="overtime">Overtime</TabsTrigger>
                </TabsList>
                <TabsContent value="data" className="space-y-10">
                    <section>
                        <h2 className="mb-4 text-xl font-semibold">
                            Personal & Company
                        </h2>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {/* Personal */}
                            <Card className="p-6 shadow-sm">
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

                            <Card className="p-6 shadow-sm">
                                <Badge className="mb-3">Company</Badge>
                                <InfoRow
                                    label="Agency Name"
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

                            <Card className="p-6 shadow-sm">
                                <Badge className="mb-3">Salary</Badge>
                                <InfoRow
                                    label="Pay Divisor"
                                    value={data?.info.pay_divisor}
                                />
                                <InfoRow
                                    label="Basic Salary"
                                    value={formatToPeso(data!.info.salary_rate)}
                                />
                                <InfoRow
                                    label="Daily Rate"
                                    value={formatToPeso(data!.info.daily_rate)}
                                />
                                <InfoRow
                                    label="Hourly Rate"
                                    value={formatToPeso(data!.info.hourly_rate)}
                                />
                                <InfoRow
                                    label="Billing Rate"
                                    value={
                                        data!.info.billing_rate
                                            ? formatToPeso(
                                                  data!.info.billing_rate,
                                              )
                                            : "N/A"
                                    }
                                />
                            </Card>
                        </div>
                    </section>

                    {/* Contacts & IDs */}
                    <section>
                        <h2 className="mb-4 text-xl font-semibold">
                            Contacts & IDs
                        </h2>
                        <div className="grid gap-6 md:grid-cols-2">
                            <Card className="p-6 shadow-sm">
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

                            <Card className="p-6 shadow-sm">
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

                    {/* Transfer Logs */}
                    <section>
                        <h2 className="mb-4 text-xl font-semibold">
                            Transfer Logs
                        </h2>
                        <Card className="relative p-6 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between p-0 pb-4">
                                <CardTitle className="text-lg font-medium">
                                    History
                                </CardTitle>
                                <button className="rounded bg-purple-600 px-3 py-1 text-sm text-white hover:bg-purple-700">
                                    Transfer Timeline
                                </button>
                            </CardHeader>
                            <CardContent>
                                {transferLogs.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center rounded border border-purple-300 bg-purple-50 py-6 text-purple-700">
                                        <ClipboardList className="mb-2 h-6 w-6 text-purple-500" />
                                        <p className="text-sm">
                                            No transfer logs available.
                                        </p>
                                    </div>
                                ) : (
                                    <ul className="divide-y divide-gray-200">
                                        {transferLogs.map((log) => (
                                            <li key={log.id} className="py-3">
                                                <p className="font-medium">
                                                    {log.description}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {log.date}
                                                </p>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>
                    </section>
                </TabsContent>

                {/* Time Logs */}
                <TabsContent value="logs">
                    <Card className="mt-6 p-6 shadow-sm">
                        <h2 className="mb-4 text-xl font-semibold">
                            Recent Time Logs
                        </h2>
                        <TimeLogsTable employeeId={data!.info.id} />
                    </Card>
                </TabsContent>

                <TabsContent value="schedule">
                    <Card className="mt-6 space-y-4 p-6 shadow-sm">
                        {/* Header + Date Picker */}
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <h2 className="text-xl font-semibold">
                                Employee Schedule
                            </h2>

                            {/* Date Range Picker */}
                            <div className="flex items-center gap-2">
                                <label className="text-muted-foreground text-sm">
                                    Select Cut-off
                                </label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-[260px] justify-start text-left font-normal",
                                                "rounded-md border px-3 py-2",
                                                "hover:bg-muted/50",
                                                !dateRange &&
                                                    "text-muted-foreground",
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {dateRange?.from ? (
                                                dateRange.to ? (
                                                    <>
                                                        {format(
                                                            dateRange.from,
                                                            "MMM d, yyyy",
                                                        )}{" "}
                                                        –{" "}
                                                        {format(
                                                            dateRange.to,
                                                            "MMM d, yyyy",
                                                        )}
                                                    </>
                                                ) : (
                                                    format(
                                                        dateRange.from,
                                                        "MMM d, yyyy",
                                                    )
                                                )
                                            ) : (
                                                <span>Pick a date range</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="w-auto p-0"
                                        align="start"
                                    >
                                        <Calendar
                                            initialFocus
                                            mode="range"
                                            selected={dateRange}
                                            onSelect={(range) => {
                                                if (range?.from) {
                                                    setDateRange({
                                                        from: range.from,
                                                        to:
                                                            range.to ??
                                                            range.from,
                                                    });
                                                } else {
                                                    setDateRange({
                                                        from: undefined,
                                                        to: undefined,
                                                    });
                                                }
                                            }}
                                            numberOfMonths={2}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        {dateRange?.from && (
                            <p className="text-muted-foreground text-sm">
                                Showing schedule for{" "}
                                <span className="font-medium">
                                    {format(dateRange.from, "MMM d, yyyy")}
                                    {dateRange.to &&
                                        ` – ${format(dateRange.to, "MMM d, yyyy")}`}
                                </span>
                            </p>
                        )}

                        <div className="grid grid-cols-7 gap-2 text-left text-xs">
                            {days.map((day, i) => {
                                const daySchedules = filteredSchedules?.filter(
                                    (s) =>
                                        format(
                                            new Date(s.date),
                                            "yyyy-MM-dd",
                                        ) === format(day, "yyyy-MM-dd"),
                                );

                                const isToday =
                                    format(day, "yyyy-MM-dd") ===
                                    format(new Date(), "yyyy-MM-dd");

                                return (
                                    <div
                                        key={i}
                                        className={`min-h-[100px] rounded-md border p-2 transition ${
                                            isToday
                                                ? "bg-primary/10 border-primary"
                                                : "bg-background hover:bg-muted/50"
                                        }`}
                                    >
                                        <div className="mb-1 text-[11px] font-semibold">
                                            {format(day, "d")} -{" "}
                                            {format(day, "EEE")}
                                        </div>

                                        {daySchedules &&
                                        daySchedules.length > 0 ? (
                                            <ul className="space-y-1">
                                                {daySchedules.map((s, idx) => (
                                                    <li
                                                        key={idx}
                                                        className="truncate rounded px-1 py-1 text-[11px] leading-tight"
                                                    >
                                                        {s.schedule_name ===
                                                        "NO SCHEDULE" ? (
                                                            <Badge
                                                                variant="secondary"
                                                                className="bg-blue-500 text-white"
                                                            >
                                                                {
                                                                    s.schedule_name
                                                                }
                                                            </Badge>
                                                        ) : (
                                                            <Badge>
                                                                {
                                                                    s.schedule_name
                                                                }
                                                            </Badge>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <div className="text-muted-foreground text-[10px]">
                                                —
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="logOverride">
                    <LogoverrideRequests
                        dateRange={dateRange}
                        setDateRange={setDateRange}
                        days={days}
                        filteredLogoverrides={filteredLogoverrides}
                        filteredSchedules={filteredSchedules}
                        employeeId={employeeId}
                    />
                </TabsContent>

                <TabsContent value="overtime">
                    <OvertimeRequestsCard
                        employeeId={employeeId}
                        dateRange={dateRange}
                        setDateRange={setDateRange}
                        filteredOvertimes={filteredOvertimes}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
