import { useQuery } from "@tanstack/react-query";
import { useState, useCallback, useEffect } from "react";
import api from "@/lib/axios";
import { ApiResponse } from "@/index";

export type NotifType = "training" | "video" | "logoverride" | "overtime";

export interface NotificationItem {
    id: string;              // e.g. "training_5"
    rawId: number;
    type: NotifType;
    title: string;
    subtitle: string | null;
    status_label: string | null;
    created_at: string;      // "2026-06-30 14:22:00"
    created_at_date: string; // "Jun 30, 2026"
}

interface ApiItem {
    id: number;
    type: NotifType;
    title: string;
    subtitle: string | null;
    status_label: string | null;
    created_at: string;
    created_at_date: string;
}

function storageKey(employeeId: string) {
    return `notif_read_v2_${employeeId}`;
}

function getReadSet(employeeId: string): Set<string> {
    try {
        const raw = localStorage.getItem(storageKey(employeeId));
        return new Set(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
        return new Set<string>();
    }
}

function saveReadSet(employeeId: string, keys: Set<string>) {
    localStorage.setItem(storageKey(employeeId), JSON.stringify([...keys]));
}

export function useNotifications(employeeId: string | null | undefined) {
    const [readIds, setReadIds] = useState<Set<string>>(
        () => (employeeId ? getReadSet(employeeId) : new Set<string>()),
    );

    useEffect(() => {
        if (employeeId) setReadIds(getReadSet(employeeId));
    }, [employeeId]);

    const { data, isLoading } = useQuery({
        queryKey: ["notifications", employeeId],
        queryFn: async () => {
            const res = await api.get<ApiResponse<{ items: ApiItem[] }>>(
                `/api/v2/employees/${employeeId}/notifications`,
            );
            return res.data.data;
        },
        enabled: !!employeeId,
        staleTime: 2 * 60 * 1000,
    });

    const items: NotificationItem[] = (data?.items ?? []).map((it) => ({
        ...it,
        id: `${it.type}_${it.id}`,
        rawId: it.id,
    }));

    const unreadCount = items.filter((n) => !readIds.has(n.id)).length;

    const markAllRead = useCallback(() => {
        if (!employeeId) return;
        const allKeys = new Set(items.map((n) => n.id));
        saveReadSet(employeeId, allKeys);
        setReadIds(allKeys);
    }, [items, employeeId]);

    const markOneRead = useCallback(
        (id: string) => {
            if (!employeeId) return;
            const next = new Set([...readIds, id]);
            saveReadSet(employeeId, next);
            setReadIds(next);
        },
        [readIds, employeeId],
    );

    return { items, unreadCount, isLoading, markAllRead, markOneRead, readIds };
}
