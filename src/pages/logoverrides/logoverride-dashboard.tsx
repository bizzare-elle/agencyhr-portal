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
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ApiResponse } from "@/index";

export interface Logoverride {
    id: string;
    app_key: string;
    employee_id: string;
    useremail: string;
    date_time: string;
    clock_type: string;
    location: string;
    branch_id: string | null;
    image: string;
    is_range: string;
    is_logoverride: string;
    status: string;
    created_by: string;
    created_at: string;
    updated_by: string | null;
    updated_at: string | null;
    deleted_by: string | null;
    deleted_at: string | null;
}

export default function LogoverrideDashboard() {
    const navigate = useNavigate();
    const employeedId = useParams().id;
    const { isLoading, isError, data, isSuccess } = useQuery({
        queryKey: ["logoverrideDashboard", employeedId],
        queryFn: async () => {
            const response = await api.get<ApiResponse<Logoverride[]>>(
                `/api/v2/logoverrides/${employeedId}`,
            );
            return response.data.data || [];
        },
        enabled: !!employeedId,
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
            {data?.length === 0 ? (
                <div className="w-full">
                    <Card>
                        <span className="text-2xl font-bold">
                            No log overrides found.
                        </span>
                    </Card>
                </div>
            ) : (
                <>
                    <div className="py-5">
                        <Card>
                            <div className="flex items-center justify-start gap-x-3 p-5">
                                <User size={40} strokeWidth={1} />
                                <div className="text-3xl font-bold">
                                    {data?.[0]?.employee_id}
                                </div>
                                <Badge className="flex items-center gap-x-1">
                                    Active <BadgeCheckIcon size={16} />
                                </Badge>
                            </div>
                        </Card>
                    </div>

                    <div className="flex justify-between gap-x-5">
                        <Card className="w-full">
                            <CardHeader className="justify-start text-start">
                                <CardTitle>Total Logoverrides</CardTitle>
                                <CardDescription>
                                    Total number of logoverrides you filed.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-start text-2xl font-bold">
                                    {data?.length}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="w-full">
                            <CardHeader className="justify-start text-start">
                                <CardTitle>
                                    Total Approved Logoverrides
                                </CardTitle>
                                <CardDescription>
                                    Total number of approved logoverrides you
                                    filed.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-start text-2xl font-bold">
                                    {
                                        data?.filter(
                                            (item) => item.status === "2",
                                        ).length
                                    }
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="w-full">
                            <CardHeader className="justify-start text-start">
                                <CardTitle>
                                    Total Pending Logoverrides
                                </CardTitle>
                                <CardDescription>
                                    Total number of pending logoverrides you
                                    filed.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-start text-2xl font-bold">
                                    {
                                        data?.filter(
                                            (item) => item.status !== "2",
                                        ).length
                                    }
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </ParentComponent>
    );
}
