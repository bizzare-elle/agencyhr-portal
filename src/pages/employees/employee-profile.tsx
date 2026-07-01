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
import { Wifi, Camera } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { toast } from "sonner";
import { ApiResponse, Employee } from "@/index";
import { cn } from "@/lib/utils";
import { formatToMonthDayYear } from "@/helpers/formatDates";
import TimeLogsTable from "@/components/employees/time-logs-table";
import FullPageLoader from "@/components/page-loader";
import OvertimeRequestsCard from "@/components/employee-overtime";
import LogoverrideRequests from "@/components/employee-logoverride";
import EmployeeScheduleCard from "@/components/employee-schedule";
import { ParentComponent } from "@/components/parent-container";

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

    const queryClient = useQueryClient();
    const avatarInputRef = React.useRef<HTMLInputElement>(null);
    const [avatarUploading, setAvatarUploading] = React.useState(false);

    const { data: me } = useQuery({
        queryKey: ["me"],
        queryFn: async () => {
            const response = await api.get<ApiResponse<{
                hr_id: string;
                role: string;
                can_work_remotely?: number;
                profile_photo_url?: string;
            }>>(`/api/v2/auth/me`);
            return response.data.data;
        },
    });

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
        if (!allowed.includes(file.type)) {
            toast.error("Only JPEG, PNG, GIF, or WebP images allowed.");
            return;
        }
        const form = new FormData();
        form.append("avatar", file);
        setAvatarUploading(true);
        try {
            await api.post(`/api/v2/employees/${employeeId}/avatar`, form);
            await queryClient.invalidateQueries({ queryKey: ["me"] });
            toast.success("Profile photo updated.");
        } catch (err: any) {
            const msg = err?.response?.data?.message ?? err?.message ?? "Upload failed.";
            toast.error(msg);
        } finally {
            setAvatarUploading(false);
            if (avatarInputRef.current) avatarInputRef.current.value = "";
        }
    };

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
        <ParentComponent>
            <div className="mx-auto w-full max-w-[1600px] space-y-8 p-4 sm:p-6">
                {/* Profile header */}
                <div className="rounded-xl border bg-muted/5 p-5 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">

                        {/* Avatar */}
                        <div className="relative self-center sm:self-start flex-shrink-0">
                            <input
                                ref={avatarInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                className="hidden"
                                onChange={handleAvatarUpload}
                            />
                            <div className="h-20 w-20 rounded-2xl overflow-hidden bg-primary/15 flex items-center justify-center text-2xl font-bold text-primary">
                                {me?.profile_photo_url ? (
                                    <img
                                        src={me.profile_photo_url}
                                        alt={employee.name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    employee.firstname.charAt(0).toUpperCase() +
                                    employee.lastname.charAt(0).toUpperCase()
                                )}
                            </div>
                            {/* Upload overlay — only for own profile */}
                            {me?.hr_id === String(employeeId) && (
                                <button
                                    onClick={() => avatarInputRef.current?.click()}
                                    disabled={avatarUploading}
                                    className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 opacity-0 hover:opacity-100 transition-opacity disabled:opacity-50"
                                    title="Change profile photo"
                                >
                                    <Camera className="h-6 w-6 text-white" />
                                </button>
                            )}
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1 text-center sm:text-left">
                            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                                <h1 className="text-xl font-bold leading-tight sm:text-2xl">
                                    {employee.name}
                                </h1>
                                <Badge
                                    className={cn(
                                        "text-xs",
                                        employee.is_active
                                            ? "border-green-500/30 bg-green-500/10 text-green-400"
                                            : "border-red-500/30 bg-red-500/10 text-red-400",
                                    )}
                                >
                                    {employee.is_active ? "Active" : "Inactive"}
                                </Badge>
                                {me?.can_work_remotely === 1 && (
                                    <Badge className="gap-1 border-teal-500/30 bg-teal-500/10 text-teal-400">
                                        <Wifi className="h-3 w-3" />
                                        Remote Eligible
                                    </Badge>
                                )}
                            </div>

                            <p className="text-muted-foreground mt-1 text-sm">
                                {employee.position_name || "—"}
                            </p>

                            <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 sm:justify-start">
                                {[
                                    { label: "ID", value: employee.id_number },
                                    { label: "Branch", value: employee.branch_name },
                                    { label: "Dept", value: employee.department_name },
                                    { label: "Agency", value: employee.agency_name },
                                ].map(({ label, value }) => value ? (
                                    <span key={label} className="text-xs text-muted-foreground">
                                        <span className="font-medium text-foreground/60">{label}:</span>{" "}
                                        {value}
                                    </span>
                                ) : null)}
                            </div>
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
                        <TabsTrigger value="logOverride">
                            Log Override
                        </TabsTrigger>
                        <TabsTrigger value="overtime">Overtime</TabsTrigger>
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
                                            value={
                                                employee.civil_status_display
                                            }
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
                                            value={
                                                employee.personal_email_address
                                            }
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
                                            label="Company Email Address"
                                            value={
                                                employee.company_email_address
                                            }
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
                                        <Badge className="mb-3">
                                            Emergency
                                        </Badge>
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
                                                employee.emergency_relation ||
                                                "N/A"
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
                                                employee.emergency_address ||
                                                "N/A"
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
                                                employee.government_tin_nos ||
                                                "N/A"
                                            }
                                        />
                                        <InfoRow
                                            label="SSS"
                                            value={
                                                employee.government_sss_nos ||
                                                "N/A"
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
                                    <CardTitle>
                                        Recent Approved Time Logs
                                    </CardTitle>
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

                </Tabs>
            </div>
        </ParentComponent>
    );
}
