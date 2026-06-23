import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { ApiResponse } from "@/index";

export interface AnnouncementTarget {
    type: string;   // 'all' | 'branch' | 'department' | 'position' | 'employee'
    label: string;
}

export interface AnnouncementItem {
    id: number;
    title: string;
    body: string;
    image_url: string | null;
    author_name: string;
    author_initials: string;
    created_at: string;    // "2026-06-23 10:00:00"
    targets: AnnouncementTarget[];
    reaction_counts: Record<string, number>;
    user_reaction: string | null;
    comment_count: number;
}

export function useAnnouncements(employeeId: string | null | undefined) {
    const { data, isLoading, error } = useQuery({
        queryKey: ["announcements", employeeId],
        queryFn: async () => {
            const res = await api.get<ApiResponse<{ items: AnnouncementItem[] }>>(
                `/api/v2/employees/${employeeId}/announcements`,
            );
            return res.data.data;
        },
        enabled: !!employeeId,
        staleTime: 5 * 60 * 1000,
    });

    return {
        items: data?.items ?? [],
        isLoading,
        error,
    };
}
