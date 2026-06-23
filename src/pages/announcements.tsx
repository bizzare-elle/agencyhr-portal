import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAnnouncements, AnnouncementItem, AnnouncementTarget } from "@/hooks/use-announcements";
import {
    useAnnouncementReact,
    useAnnouncementComments,
    useAddComment,
    useDeleteComment,
    ReactionType,
    CommentItem,
} from "@/hooks/use-announcement-interactions";
import { cn } from "@/lib/utils";
import { ParentComponent } from "@/components/parent-container";
import api from "@/lib/axios";
import { ApiResponse } from "@/index";

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const diff    = Date.now() - d.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours   = Math.floor(minutes / 60);
        const days    = Math.floor(hours / 24);
        if (minutes < 1)  return "just now";
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24)   return `${hours}h ago`;
        if (days < 7)     return `${days}d ago`;
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
        return dateStr;
    }
}

function toInitials(name: string): string {
    return name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("");
}

const AVATAR_COLORS = [
    "#3b82f6", "#8b5cf6", "#14b8a6",
    "#f97316", "#f43f5e", "#10b981",
    "#6366f1", "#ec4899",
];

function avatarBg(name: string): string {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i)) % AVATAR_COLORS.length;
    return AVATAR_COLORS[h];
}

// ── Reactions config ──────────────────────────────────────────────────────────

const REACTIONS: { type: ReactionType; emoji: string; label: string; activeColor: string }[] = [
    { type: "like", emoji: "👍", label: "Like",  activeColor: "bg-blue-500/15 text-blue-400 ring-blue-500/20" },
    { type: "love", emoji: "❤️", label: "Love",  activeColor: "bg-rose-500/15 text-rose-400 ring-rose-500/20" },
    { type: "haha", emoji: "😂", label: "Haha",  activeColor: "bg-amber-500/15 text-amber-400 ring-amber-500/20" },
    { type: "wow",  emoji: "😮", label: "Wow",   activeColor: "bg-orange-500/15 text-orange-400 ring-orange-500/20" },
    { type: "sad",  emoji: "😢", label: "Sad",   activeColor: "bg-slate-500/15 text-slate-400 ring-slate-500/20" },
];

// ── SVG icons ─────────────────────────────────────────────────────────────────

function UsersIcon() {
    return (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="h-3 w-3">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    );
}
function MapPinIcon() {
    return (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="h-3 w-3">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    );
}
function BuildingIcon() {
    return (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="h-3 w-3">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
    );
}
function BriefcaseIcon() {
    return (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="h-3 w-3">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
    );
}
function PersonIcon() {
    return (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="h-3 w-3">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
    );
}
function MegaphoneIcon() {
    return (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
    );
}
function CommentIcon() {
    return (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="h-3.5 w-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
    );
}
function SendIcon() {
    return (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="h-3.5 w-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
    );
}
function TrashIcon() {
    return (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="h-3 w-3">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
    );
}

// ── Target chips ──────────────────────────────────────────────────────────────

const TARGET_STYLE: Record<string, { cls: string; icon: React.ReactNode }> = {
    all:        { cls: "bg-teal-500/10 text-teal-400 ring-teal-500/20",       icon: <UsersIcon /> },
    branch:     { cls: "bg-blue-500/10 text-blue-400 ring-blue-500/20",       icon: <MapPinIcon /> },
    department: { cls: "bg-violet-500/10 text-violet-400 ring-violet-500/20", icon: <BuildingIcon /> },
    position:   { cls: "bg-orange-500/10 text-orange-400 ring-orange-500/20", icon: <BriefcaseIcon /> },
    employee:   { cls: "bg-slate-500/10 text-slate-400 ring-slate-500/20",    icon: <PersonIcon /> },
};

function TargetChip({ target }: { target: AnnouncementTarget }) {
    const s = TARGET_STYLE[target.type] ?? TARGET_STYLE["all"];
    return (
        <span className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset",
            s.cls,
        )}>
            <span className="h-3 w-3 shrink-0">{s.icon}</span>
            {target.label}
        </span>
    );
}

// ── Author avatar ─────────────────────────────────────────────────────────────

function AuthorAvatar({
    name,
    initials,
    size = "md",
}: {
    name: string;
    initials: string;
    size?: "sm" | "md";
}) {
    const sz = size === "sm" ? "h-8 w-8 text-[11px]" : "h-10 w-10 text-[13px]";
    return (
        <div
            className={cn(
                "flex shrink-0 items-center justify-center rounded-full font-bold text-white shadow-sm",
                sz,
            )}
            style={{ background: avatarBg(name) }}
            title={name}
        >
            {initials}
        </div>
    );
}

// ── Single comment row ────────────────────────────────────────────────────────

function CommentRow({
    comment,
    onDelete,
}: {
    comment: CommentItem;
    onDelete?: () => void;
}) {
    return (
        <div className="flex gap-2.5">
            <AuthorAvatar
                name={comment.employee_name}
                initials={comment.employee_initials}
                size="sm"
            />
            <div className="flex-1 min-w-0">
                <div className="rounded-xl bg-white/[0.04] px-3 py-2">
                    <p className="text-xs font-semibold text-foreground leading-tight">
                        {comment.employee_name}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground/80 whitespace-pre-wrap leading-relaxed">
                        {comment.body}
                    </p>
                </div>
                <div className="flex items-center gap-3 mt-1 px-1">
                    <span className="text-[11px] text-muted-foreground/30">
                        {relativeTime(comment.created_at)}
                    </span>
                    {onDelete && (
                        <button
                            onClick={onDelete}
                            className="flex items-center gap-0.5 text-[11px] text-muted-foreground/30 hover:text-red-400 transition-colors"
                        >
                            <TrashIcon />
                            Delete
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Post card ─────────────────────────────────────────────────────────────────

const MAX_BODY = 300;

// ── Image lightbox ────────────────────────────────────────────────────────────

function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={onClose}
        >
            <button
                onClick={onClose}
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                aria-label="Close"
            >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            <img
                src={src}
                alt={alt}
                onClick={(e) => e.stopPropagation()}
                className="max-h-[90vh] max-w-full rounded-xl object-contain shadow-2xl"
            />
        </div>
    );
}

// ── Post card ─────────────────────────────────────────────────────────────────

function PostCard({
    post,
    employeeId,
    meInitials,
    meName,
    onImageClick,
}: {
    post: AnnouncementItem;
    employeeId: string;
    meInitials: string;
    meName: string;
    onImageClick: (url: string, title: string) => void;
}) {
    const [expanded, setExpanded]         = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText]   = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const needsTruncate = post.body.length > MAX_BODY;
    const bodyDisplay   = needsTruncate && !expanded
        ? post.body.slice(0, MAX_BODY) + "…"
        : post.body;

    const { mutate: react, isPending: reacting } = useAnnouncementReact(employeeId);
    const { data: commentsData, isLoading: loadingComments } = useAnnouncementComments(
        post.id,
        showComments,
    );
    const { mutate: addComment, isPending: submitting } = useAddComment(post.id, employeeId);
    const { mutate: deleteComment } = useDeleteComment(post.id, employeeId);

    const comments = commentsData?.items ?? [];

    const totalReactions = REACTIONS.reduce(
        (acc, r) => acc + (post.reaction_counts[r.type] ?? 0),
        0,
    );

    function handleReact(type: ReactionType) {
        if (reacting) return;
        react({ announcementId: post.id, reactionType: type });
    }

    function handleAddComment() {
        const text = commentText.trim();
        if (!text || submitting) return;
        addComment({ body: text }, {
            onSuccess: () => setCommentText(""),
        });
    }

    function handleToggleComments() {
        setShowComments((v) => {
            if (!v) setTimeout(() => inputRef.current?.focus(), 100);
            return !v;
        });
    }

    return (
        <article className="overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03]">
            {/* Header */}
            <div className="flex items-start gap-3 p-5 pb-4">
                <AuthorAvatar name={post.author_name} initials={post.author_initials} />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground leading-tight">
                        {post.author_name}
                    </p>
                    <p className="text-xs text-muted-foreground/50 mt-0.5">
                        {relativeTime(post.created_at)}
                    </p>
                </div>
                {/* Target chips — desktop */}
                <div className="hidden sm:flex flex-wrap gap-1.5 justify-end max-w-[200px]">
                    {post.targets.slice(0, 3).map((t) => (
                        <TargetChip key={`${t.type}-${t.label}`} target={t} />
                    ))}
                    {post.targets.length > 3 && (
                        <span className="text-[11px] text-muted-foreground/40 self-center">
                            +{post.targets.length - 3}
                        </span>
                    )}
                </div>
            </div>

            {/* Body */}
            <div className="px-5 pb-4">
                <h2 className="text-base font-bold text-foreground mb-2 leading-snug">
                    {post.title}
                </h2>
                <p className="text-sm text-muted-foreground/80 whitespace-pre-wrap leading-relaxed">
                    {bodyDisplay}
                </p>
                {needsTruncate && (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="mt-1.5 text-xs font-medium text-primary/70 hover:text-primary transition-colors"
                    >
                        {expanded ? "See less" : "See more"}
                    </button>
                )}
            </div>

            {/* Image */}
            {post.image_url && (
                <div className="overflow-hidden">
                    <img
                        src={post.image_url}
                        alt={post.title}
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        onClick={() => onImageClick(post.image_url!, post.title)}
                        className="w-full object-cover max-h-80 cursor-zoom-in"
                    />
                </div>
            )}

            {/* Interaction summary row */}
            {(totalReactions > 0 || post.comment_count > 0) && (
                <div className="flex items-center justify-between px-5 py-2 text-[11px] text-muted-foreground/40 border-t border-white/5">
                    {totalReactions > 0 ? (
                        <span>
                            {REACTIONS.filter((r) => (post.reaction_counts[r.type] ?? 0) > 0)
                                .slice(0, 3)
                                .map((r) => r.emoji)
                                .join("")}{" "}
                            {totalReactions}
                        </span>
                    ) : (
                        <span />
                    )}
                    {post.comment_count > 0 && (
                        <button
                            onClick={handleToggleComments}
                            className="hover:text-muted-foreground/60 transition-colors"
                        >
                            {post.comment_count} comment{post.comment_count !== 1 ? "s" : ""}
                        </button>
                    )}
                </div>
            )}

            {/* Reaction bar */}
            <div className="flex items-center border-t border-white/5 px-3 py-1.5">
                <div className="flex flex-1 flex-wrap gap-0.5">
                    {REACTIONS.map((r) => {
                        const isActive = post.user_reaction === r.type;
                        const count = post.reaction_counts[r.type] ?? 0;
                        return (
                            <button
                                key={r.type}
                                onClick={() => handleReact(r.type)}
                                disabled={reacting}
                                title={r.label}
                                className={cn(
                                    "flex items-center gap-1 rounded-lg px-2 py-1 text-sm transition-all select-none",
                                    isActive
                                        ? cn("ring-1 ring-inset font-semibold", r.activeColor)
                                        : "text-muted-foreground/40 hover:bg-white/5 hover:text-foreground",
                                )}
                            >
                                <span>{r.emoji}</span>
                                {count > 0 && (
                                    <span className="text-[10px] tabular-nums">{count}</span>
                                )}
                            </button>
                        );
                    })}
                </div>
                <button
                    onClick={handleToggleComments}
                    className={cn(
                        "ml-2 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-all",
                        showComments
                            ? "text-primary"
                            : "text-muted-foreground/40 hover:bg-white/5 hover:text-foreground",
                    )}
                >
                    <CommentIcon />
                    {post.comment_count > 0 ? post.comment_count : "Comment"}
                </button>
            </div>

            {/* Target chips — mobile */}
            <div className="flex flex-wrap gap-1.5 border-t border-white/5 px-5 py-2.5 sm:hidden">
                {post.targets.map((t) => (
                    <TargetChip key={`${t.type}-${t.label}`} target={t} />
                ))}
            </div>

            {/* Date — desktop */}
            <div className="hidden sm:flex justify-end border-t border-white/5 px-5 py-2">
                <time
                    dateTime={post.created_at}
                    className="text-[11px] text-muted-foreground/30"
                >
                    {new Date(post.created_at).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                    })}
                </time>
            </div>

            {/* Comments section */}
            {showComments && (
                <div className="border-t border-white/5 px-5 py-4 space-y-3">
                    {/* Comment input */}
                    <div className="flex items-center gap-2.5">
                        <AuthorAvatar name={meName || "Me"} initials={meInitials || "?"} size="sm" />
                        <div className="flex flex-1 items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-4 py-1.5 focus-within:border-white/20 transition-colors">
                            <input
                                ref={inputRef}
                                type="text"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleAddComment();
                                    }
                                }}
                                placeholder="Write a comment…"
                                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/30"
                            />
                            <button
                                onClick={handleAddComment}
                                disabled={submitting || !commentText.trim()}
                                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary hover:bg-primary/30 disabled:opacity-30 transition-colors"
                            >
                                <SendIcon />
                            </button>
                        </div>
                    </div>

                    {/* Loading */}
                    {loadingComments && (
                        <p className="text-xs text-muted-foreground/30 pl-10">Loading comments…</p>
                    )}

                    {/* Comment list */}
                    {comments.map((c) => (
                        <CommentRow
                            key={c.id}
                            comment={c}
                            onDelete={
                                c.is_own
                                    ? () => deleteComment(c.id)
                                    : undefined
                            }
                        />
                    ))}

                    {!loadingComments && comments.length === 0 && (
                        <p className="text-xs text-muted-foreground/30 pl-10">
                            No comments yet. Be the first to comment!
                        </p>
                    )}
                </div>
            )}
        </article>
    );
}

// ── Skeleton card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
    return (
        <div className="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-white/5" />
                <div className="flex-1 space-y-2">
                    <div className="h-3 w-32 animate-pulse rounded bg-white/5" />
                    <div className="h-2.5 w-20 animate-pulse rounded bg-white/[0.03]" />
                </div>
            </div>
            <div className="h-4 w-3/4 animate-pulse rounded bg-white/5 mb-3" />
            <div className="space-y-2">
                <div className="h-3 w-full animate-pulse rounded bg-white/[0.03]" />
                <div className="h-3 w-5/6 animate-pulse rounded bg-white/[0.03]" />
                <div className="h-3 w-4/6 animate-pulse rounded bg-white/[0.03]" />
            </div>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Announcements() {
    const { id } = useParams<{ id: string }>();
    const { items, isLoading } = useAnnouncements(id);

    const [lightbox, setLightbox] = useState<{ url: string; title: string } | null>(null);
    const openLightbox = useCallback((url: string, title: string) => setLightbox({ url, title }), []);
    const closeLightbox = useCallback(() => setLightbox(null), []);

    const { data: me } = useQuery({
        queryKey: ["me"],
        queryFn: async () => {
            const res = await api.get<ApiResponse<{ id: string; name: string; email: string; role: string; avatar?: string; agency_id: string; job_level: string }>>(`/api/v2/auth/me`);
            return res.data.data;
        },
        staleTime: 5 * 60 * 1000,
    });

    const meName     = me?.name ?? "";
    const meInitials = meName ? toInitials(meName) : "?";

    return (
        <ParentComponent>
            {lightbox && (
                <ImageLightbox src={lightbox.url} alt={lightbox.title} onClose={closeLightbox} />
            )}
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <MegaphoneIcon />
                </div>
                <div>
                    <h1 className="text-lg font-bold tracking-tight">Announcements</h1>
                    <p className="text-[11px] uppercase tracking-widest text-muted-foreground/40">
                        Company Updates &amp; Notices
                    </p>
                </div>
                {!isLoading && items.length > 0 && (
                    <span className="ml-auto rounded-full bg-white/5 px-3 py-1 text-xs text-muted-foreground/50">
                        {items.length} post{items.length !== 1 ? "s" : ""}
                    </span>
                )}
            </div>

            {/* Feed */}
            <div className="mx-auto max-w-2xl space-y-4">
                {isLoading && [1, 2, 3].map((i) => <SkeletonCard key={i} />)}

                {!isLoading && items.length === 0 && (
                    <div className="flex flex-col items-center gap-4 py-24 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/5 bg-white/[0.02] text-white/10">
                            <MegaphoneIcon />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground/50">No announcements yet</p>
                            <p className="mt-0.5 text-xs text-muted-foreground/30">
                                Check back later for company updates.
                            </p>
                        </div>
                    </div>
                )}

                {!isLoading && items.map((post) => (
                    <PostCard
                        key={post.id}
                        post={post}
                        employeeId={id ?? ""}
                        meInitials={meInitials}
                        meName={meName}
                        onImageClick={openLightbox}
                    />
                ))}
            </div>
        </ParentComponent>
    );
}
