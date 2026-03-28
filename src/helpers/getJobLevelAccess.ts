import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { ApiResponse } from "..";

export function getJobLevelAccess() {
    const { data: me } = useQuery({
        queryKey: ["me"],
        queryFn: async () => {
            const response = await api.get<
                ApiResponse<{
                    id: string;
                    name: string;
                    email: string;
                    role: string;
                    avatar?: string;
                    agency_id: string;
                    job_level: string;
                }>
            >(`/api/v2/auth/me`);
            return response.data.data;
        },
    });

    const job_level = me?.job_level;

    if (
        job_level === "Level 5: Supervisory" ||
        job_level === "Level 6: Managerial"
    ) {
        return {
            job_level: job_level,
            acccess: true,
        };
    }
}
