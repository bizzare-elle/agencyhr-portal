import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
import { useParams } from "react-router-dom";
import { ApiResponse } from "@/index";
import { format } from "date-fns";
import isValidateDateString from "@/helpers/isValidDateString";

export interface Employee {
    info: {
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
        schedules: Schedule[];
    };
}

export interface Schedule {
    id: string;
    emp_sched_date_id: string;
    branch_id: string;
    date: string;
    employee_id: string;
    schedule_type: string;
    created_by: string;
    created_at: string;
    updated_by: string | null;
    updated_at: string | null;
    deleted_by: string | null;
    deleted_at: string | null;
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
    const employeedId = useParams().id;
    const { isLoading, isError, data, isSuccess } = useQuery({
        queryKey: ["employeeProfile"],
        queryFn: async () => {
            const response = await api.get<ApiResponse<Employee>>(
                `/api/v2/employees/${employeedId}`,
            );
            return response.data.data;
        },
    });

    const employee = {
        name: "LEONILA ALULOD GALASAO",
        id: "A1264",
        birthDate: "2003-03-03",
        age: "22",
        gender: "Female",
        civilStatus: "Single",
        phone: "09193709989",
        email: "leeyon032511@gmail.com",
        address: "Blk 2 Lot 27 Phase 3 Marinig Cabuyao, Laguna",
    };

    const trainings = [
        {
            title: "Safety Orientation",
            date: "2025-01-15",
            status: "Completed",
        },
        { title: "Data Security", date: "2025-03-02", status: "Scheduled" },
    ];

    const timeLogs = [
        { date: "2025-09-18", in: "09:05", out: "18:00" },
        { date: "2025-09-19", in: "09:00", out: "18:10" },
    ];

    const schedule = [
        { day: "Mon–Fri", shift: "9:00 AM – 6:00 PM" },
        { day: "Sat", shift: "Off" },
    ];

    const logOverrides = [
        {
            date: "2025-09-10",
            reason: "Forgot to time-out",
            status: "Approved",
        },
    ];

    const overtime = [
        {
            date: "2025-09-12",
            hours: 3,
            reason: "System deployment",
            status: "Pending",
        },
    ];

    const transferLogs: { id: number; date: string; description: string }[] =
        [];

    if (isLoading) return <div>Loading...</div>;

    if (isError) return <div>Error loading employee data.</div>;

    return (
        <div className="mx-auto w-full max-w-[1500px] space-y-8 p-6">
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

                <button
                    onClick={() => navigate(`/employee/edit/${employee.id}`)}
                    className="rounded bg-white px-4 py-2 text-sm font-semibold text-indigo-700 shadow hover:bg-indigo-50"
                >
                    Edit Profile
                </button>
            </div>

            <Tabs defaultValue="data" className="w-full">
                <TabsList className="border-muted-foreground/20 mb-4 justify-start space-x-2 border-b">
                    <TabsTrigger value="data">Profile</TabsTrigger>
                    <TabsTrigger value="trainings">Trainings</TabsTrigger>
                    <TabsTrigger value="logs">Time Logs</TabsTrigger>
                    <TabsTrigger value="schedule">Schedule</TabsTrigger>
                    <TabsTrigger value="logOverride">Log Override</TabsTrigger>
                    <TabsTrigger value="overtime">Overtime</TabsTrigger>
                </TabsList>

                {/* ── Employee Data ── */}
                <TabsContent value="data" className="space-y-10">
                    <section>
                        <h2 className="mb-4 text-xl font-semibold">
                            Personal & Company
                        </h2>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {/* Personal */}
                            <Card className="p-6 shadow-sm">
                                <Badge className="mb-3 bg-indigo-100 text-indigo-700">
                                    Personal
                                </Badge>
                                <InfoRow
                                    label="Birth Date"
                                    value={format(
                                        new Date(data!.info.birth_date),
                                        "MMMM d, yyyy",
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

                            {/* Company */}
                            <Card className="p-6 shadow-sm">
                                <Badge className="mb-3 bg-indigo-100 text-indigo-700">
                                    Company
                                </Badge>
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
                                <hr className="my-3" />
                                <p className="text-sm font-medium">
                                    Employment Timeline
                                </p>{" "}
                                x
                                <InfoRow
                                    label="Trial Date"
                                    value={
                                        isValidateDateString(
                                            data!.info.trial_date,
                                        )
                                            ? format(
                                                  new Date(
                                                      data!.info.trial_date,
                                                  ),
                                                  "MMMM d, yyyy",
                                              )
                                            : "N/A"
                                    }
                                />
                                <InfoRow
                                    label="Date Hired"
                                    value={format(
                                        new Date(data!.info.date_hired),
                                        "MMMM d, yyyy",
                                    )}
                                />
                                <InfoRow
                                    label="Regularization"
                                    value={data!.info.date_regularization}
                                />
                                <InfoRow
                                    label="Tenureship"
                                    value={data!.info.tenureship || "N/A"}
                                />
                                <hr className="my-3" />
                                <InfoRow
                                    label="Status"
                                    value={
                                        <span className="rounded-full bg-green-100 px-3 py-0.5 text-xs font-semibold text-green-700">
                                            Active
                                        </span>
                                    }
                                />
                            </Card>

                            {/* Salary */}
                            <Card className="p-6 shadow-sm">
                                <Badge className="mb-3 bg-indigo-100 text-indigo-700">
                                    Salary
                                </Badge>
                                <InfoRow label="Pay Divisor" value="313" />
                                <InfoRow
                                    label="Basic Salary"
                                    value="₱18,127.92"
                                />
                                <InfoRow label="Daily Rate" value="₱695.00" />
                                <InfoRow label="Hourly Rate" value="₱86.88" />
                                <InfoRow
                                    label="Billing Rate"
                                    value="₱1,043.23"
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
                                <Badge className="mb-3 bg-indigo-100 text-indigo-700">
                                    Emergency
                                </Badge>
                                <InfoRow
                                    label="Contact Name"
                                    value="Ronald Radhir A. Noscal"
                                />
                                <InfoRow label="Relationship" value="Husband" />
                                <InfoRow
                                    label="Mobile Number"
                                    value="09395196698"
                                />
                                <InfoRow
                                    label="Address"
                                    value="Blk 2 Lot 27 Phase 3 Marinig Cabuyao, Laguna"
                                />
                            </Card>

                            <Card className="p-6 shadow-sm">
                                <Badge className="mb-3 bg-indigo-100 text-indigo-700">
                                    Government IDs
                                </Badge>
                                <InfoRow label="TIN" value="515-079-756" />
                                <InfoRow label="SSS" value="35-0194357-9" />
                                <InfoRow
                                    label="PhilHealth"
                                    value="0825-3737-5368"
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

                {/* Trainings */}
                <TabsContent value="trainings">
                    <Card className="mt-6 p-6 shadow-sm">
                        <h2 className="mb-4 text-xl font-semibold">
                            Trainings
                        </h2>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {trainings.map((t, i) => (
                                    <TableRow key={i}>
                                        <TableCell>{t.title}</TableCell>
                                        <TableCell>{t.date}</TableCell>
                                        <TableCell>{t.status}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>

                {/* Time Logs */}
                <TabsContent value="logs">
                    <Card className="mt-6 p-6 shadow-sm">
                        <h2 className="mb-4 text-xl font-semibold">
                            Recent Time Logs
                        </h2>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Time In</TableHead>
                                    <TableHead>Time Out</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {timeLogs.map((log, i) => (
                                    <TableRow key={i}>
                                        <TableCell>{log.date}</TableCell>
                                        <TableCell>{log.in}</TableCell>
                                        <TableCell>{log.out}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>

                {/* Schedule */}
                <TabsContent value="schedule">
                    <Card className="mt-6 space-y-2 p-6 shadow-sm">
                        <h2 className="mb-4 text-xl font-semibold">
                            Weekly Schedule
                        </h2>
                        {schedule.map((s, i) => (
                            <p key={i}>
                                <strong>{s.day}:</strong> {s.shift}
                            </p>
                        ))}
                    </Card>
                </TabsContent>

                {/* Log Overrides */}
                <TabsContent value="logOverride">
                    <Card className="mt-6 p-6 shadow-sm">
                        <h2 className="mb-4 text-xl font-semibold">
                            Log Override Requests
                        </h2>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logOverrides.map((req, i) => (
                                    <TableRow key={i}>
                                        <TableCell>{req.date}</TableCell>
                                        <TableCell>{req.reason}</TableCell>
                                        <TableCell>{req.status}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>

                {/* Overtime */}
                <TabsContent value="overtime">
                    <Card className="mt-6 p-6 shadow-sm">
                        <h2 className="mb-4 text-xl font-semibold">
                            Overtime Requests
                        </h2>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Hours</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {overtime.map((ot, i) => (
                                    <TableRow key={i}>
                                        <TableCell>{ot.date}</TableCell>
                                        <TableCell>{ot.hours}</TableCell>
                                        <TableCell>{ot.reason}</TableCell>
                                        <TableCell>{ot.status}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
