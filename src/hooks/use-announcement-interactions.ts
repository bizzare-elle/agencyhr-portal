import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { ApiResponse } from "@/index";
import { AnnouncementItem } from "./use-announcements";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ReactionType = "like" | "love" | "haha" | "wow" | "sad";

export interface CommentItem {
    id: number;
    employee_id: number;
    employee_name: string;
    employee_initials: string;
    body: string;
    created_at: string;
    is_own: boolean;
}

// ── Reaction mutation ─────────────────────────────────────────────────────────
// Optimistically updates the announcements cache so the UI feels instant.

export function useAnnouncementReact(employeeId: string | null | undefined) {
    const qc = useQueryClient();
    const queryKey = ["announcements", employeeId];

    return useMutation({
        mutationFn: async ({
            announcementId,
            reactionType,
        }: {
            announcementId: number;
            reactionType: ReactionType;
        }) => {
            const res = await api.post<
                ApiResponse<{
                    user_reaction: ReactionType | null;
                    reaction_counts: Record<ReactionType, number>;
                }>
            >(`/api/v2/announcements/${announcementId}/react`, {
                reaction_type: reactionType,
            });
            return res.data.data;
        },

        onMutate: async ({ announcementId, reactionType }) => {
            await qc.cancelQueries({ queryKey });
            const snapshot = qc.getQueryData(queryKey);

            qc.setQueryData(queryKey, (old: { items: AnnouncementItem[] } | undefined) => {
                if (!old?.items) return old;
                return {
                    ...old,
                    items: old.items.map((item) => {
                        if (item.id !== announcementId) return item;

                        const prev = item.user_reaction as ReactionType | null;
                        const counts = { ...item.reaction_counts } as Record<ReactionType, number>;

                        if (prev === reactionType) {
                            // Toggle off
                            counts[reactionType] = Math.max(0, (counts[reactionType] ?? 0) - 1);
                            return { ...item, reaction_counts: counts, user_reaction: null };
                        }
                        // Switch or new
                        if (prev) {
                            counts[prev] = Math.max(0, (counts[prev] ?? 0) - 1);
                        }
                        counts[reactionType] = (counts[reactionType] ?? 0) + 1;
                        return { ...item, reaction_counts: counts, user_reaction: reactionType };
                    }),
                };
            });

            return { snapshot };
        },

        onError: (_err, _vars, context) => {
            if (context?.snapshot !== undefined) {
                qc.setQueryData(queryKey, context.snapshot);
            }
        },

        onSuccess: (data, { announcementId }) => {
            // Reconcile with server truth
            if (!data) return;
            qc.setQueryData(queryKey, (old: { items: AnnouncementItem[] } | undefined) => {
                if (!old?.items) return old;
                return {
                    ...old,
                    items: old.items.map((item) =>
                        item.id !== announcementId
                            ? item
                            : {
                                  ...item,
                                  user_reaction: data.user_reaction,
                                  reaction_counts: data.reaction_counts,
                              },
                    ),
                };
            });
        },
    });
}

// ── Comments query ────────────────────────────────────────────────────────────

export function useAnnouncementComments(
    announcementId: number,
    enabled: boolean,
) {
    return useQuery({
        queryKey: ["announcement-comments", announcementId],
        queryFn: async () => {
            const res = await api.get<ApiResponse<{ items: CommentItem[] }>>(
                `/api/v2/announcements/${announcementId}/comments`,
            );
            return res.data.data;
        },
        enabled,
        staleTime: 30 * 1000,
    });
}

// ── Add comment mutation ──────────────────────────────────────────────────────

export function useAddComment(
    announcementId: number,
    employeeId: string | null | undefined,
) {
    const qc = useQueryClient();
    const annQueryKey = ["announcements", employeeId];
    const commentsKey = ["announcement-comments", announcementId];

    return useMutation({
        mutationFn: async ({ body }: { body: string }) => {
            const res = await api.post<
                ApiResponse<{ item: CommentItem; comment_count: number }>
            >(`/api/v2/announcements/${announcementId}/comments`, { body });
            return res.data.data;
        },

        onSuccess: (data) => {
            if (!data) return;

            // Append comment to comments cache
            qc.setQueryData(commentsKey, (old: { items: CommentItem[] } | undefined) => ({
                items: [...(old?.items ?? []), data.item],
            }));

            // Update comment_count in announcements list
            qc.setQueryData(annQueryKey, (old: { items: AnnouncementItem[] } | undefined) => {
                if (!old?.items) return old;
                return {
                    ...old,
                    items: old.items.map((item) =>
                        item.id !== announcementId
                            ? item
                            : { ...item, comment_count: data.comment_count },
                    ),
                };
            });
        },
    });
}

// ── Delete comment mutation ───────────────────────────────────────────────────

export function useDeleteComment(
    announcementId: number,
    employeeId: string | null | undefined,
) {
    const qc = useQueryClient();
    const annQueryKey = ["announcements", employeeId];
    const commentsKey = ["announcement-comments", announcementId];

    return useMutation({
        mutationFn: async (commentId: number) => {
            const res = await api.post<ApiResponse<{ comment_count: number }>>(
                `/api/v2/announcements/comments/${commentId}/delete`,
            );
            return res.data.data;
        },

        onSuccess: (data, commentId) => {
            if (!data) return;

            // Remove from comments cache
            qc.setQueryData(commentsKey, (old: { items: CommentItem[] } | undefined) => ({
                items: (old?.items ?? []).filter((c) => c.id !== commentId),
            }));

            // Update comment_count in announcements list
            qc.setQueryData(annQueryKey, (old: { items: AnnouncementItem[] } | undefined) => {
                if (!old?.items) return old;
                return {
                    ...old,
                    items: old.items.map((item) =>
                        item.id !== announcementId
                            ? item
                            : { ...item, comment_count: data.comment_count },
                    ),
                };
            });
        },
    });
}
