import { ParentComponent } from "@/components/parent-container";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { User } from "lucide-react";
import { BadgeCheckIcon } from "lucide-react";
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
import { Link } from "react-router-dom";
import { useAuthStore } from "@/hooks/use-auth";

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
    middlename: string | null;
    lastname: string;
    name: string | null;
    birth_date: string | null;
    age: string | null;
    citizenship: string | null;
    gender: string | null;
    civil_status: string | null;
    trial_date: string | null;
    date_hired: string | null;
    date_regularization: string | null;
    tenureship: string | null;
    employment_status: string | null;
    agency_id: string | null;
    id_number: string | null;
    branch_id: string | null;
    transfer_date_id: string | null;
    address: string | null;
    contact_number: string | null;
    personal_email_address: string | null;
    company_email_address: string | null;
    schedule_type: string | null;
    department_id: string | null;
    permission_id: string | null;
    position_id: string | null;
    salary_rate: string | null;
    daily_rate: string | null;
    hourly_rate: string | null;
    billing_rate: string | null;
    allowance: string | null;
    status: string;
    leave_type: string | null;
    leave_remarks: string | null;
    date_resigned: string | null;
    remarks: string | null;
    government_tin_nos: string | null;
    government_sss_nos: string | null;
    government_philhealth_nos: string | null;
    government_pagibig_nos: string | null;
    emergency_contact_name: string | null;
    emergency_address: string | null;
    emergency_mobile_no: string | null;
    emergency_relation: string | null;
    pay_divisor: string | null;
    access: string;
    is_chef: string | null;
    chef_downline_id: string | null;
    is_direct: string | null;
    user_access: string | null;
    created_at: string | null;
    created_by: string | null;
    updated_at: string | null;
    updated_by: string | null;
    deleted_at: string | null;
    deleted_by: string | null;
    gross_pay: string | null;
}

export interface OvertimeResponse {
    info: Overtime[];
    recent_file: Overtime[];
    employees: Employee[];
}

export default function OvertimeDashboard() {
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
    const { isLoading, isError, data } = useQuery<OvertimeResponse>({
        queryKey: ["overtimeDashboard"],
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

    if (isLoading)
        return (
            <ParentComponent>
                <div className="text-2xl font-bold">Loading...</div>
            </ParentComponent>
        );

    if (isError)
        return (
            <ParentComponent>
                <div className="text-2xl font-bold">
                    Error fetching the data.
                </div>
            </ParentComponent>
        );

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
                    <div>
                        <Card className="flex flex-row items-center justify-between px-5 py-8">
                            <div className="flex items-center gap-4">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-2xl font-bold">
                                    {data?.info[0].employee_name.charAt(0)}
                                </div>
                                <div>
                                    <div className="flex flex-row space-x-3">
                                        <h1 className="text-2xl font-bold tracking-wide">
                                            {data?.info[0].employee_name}{" "}
                                        </h1>
                                        <Badge>
                                            {" "}
                                            {data?.employees[0].agency_id}
                                        </Badge>
                                    </div>
                                    <p className="text-sm opacity-90">
                                        ID: {data?.info[0].employee_id} •{" "}
                                        {data?.employees[0].branch_id}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <Link to={`/overtime/form/${employeeId}`}>
                                    {" "}
                                    <Button>File Overtime</Button>
                                </Link>
                            </div>
                        </Card>
                    </div>

                    <div className="flex justify-between gap-x-5">
                        <Card className="w-full">
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

                        <Card className="w-full">
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

                        <Card className="w-full">
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

                    <div className="w-full">
                        {data?.recent_file.length === 0 ? (
                            <Card>
                                <span className="text-center text-2xl font-bold">
                                    No recent application
                                </span>
                            </Card>
                        ) : (
                            <Card className="p-5 px-0">
                                <div className="flex flex-col space-y-3">
                                    <CardHeader className="pb-5">
                                        <CardTitle>Recent Activities</CardTitle>
                                        <CardDescription>
                                            Here are your most recent overtime
                                            applications.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {data?.recent_file.map((r) => (
                                                <Card
                                                    key={r.id}
                                                    className="pl-none flex flex-col transition delay-200 duration-300 ease-in-out hover:-translate-y-1 hover:scale-102"
                                                >
                                                    <div className="flex justify-between">
                                                        <div className="w-full text-center">
                                                            {formatToDateTime(
                                                                r.date,
                                                            )}
                                                        </div>

                                                        <div className="w-full text-center capitalize">
                                                            {r?.remarks ||
                                                                "N/A"}
                                                        </div>
                                                        <div className="w-full text-center">
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
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    </CardContent>
                                </div>
                            </Card>
                        )}
                    </div>
                </>
            )}
        </ParentComponent>
    );
}
