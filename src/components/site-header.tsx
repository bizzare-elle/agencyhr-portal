import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useNotifications } from "@/hooks/use-notifications";
import api from "@/lib/axios";
import { ApiResponse } from "@/index";
import { cn } from "@/lib/utils";

interface SiteHeaderProps {
    title?: string;
}

export function SiteHeader({ title = "Documents" }: SiteHeaderProps) {
    const navigate = useNavigate();

    const { data: me } = useQuery({
        queryKey: ["me"],
        queryFn: async () => {
            const res = await api.get<
                ApiResponse<{ id: string; role: string }>
            >(`/api/v2/auth/me`);
            return res.data.data;
        },
        staleTime: Infinity,
    });

    const { unreadCount } = useNotifications(
        me?.role === "hr_employee" ? me?.id : null,
    );

    return (
        <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
            <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
                <SidebarTrigger className="-ml-1" />
                <Separator
                    orientation="vertical"
                    className="mx-2 data-[orientation=vertical]:h-4"
                />
                <h1 className="text-base font-medium">{title}</h1>

                {me?.role === "hr_employee" && (
                    <div className="ml-auto">
                        <button
                            onClick={() => navigate(`/notifications/${me.id}`)}
                            className="relative flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/20 hover:text-foreground"
                            aria-label="Notifications"
                        >
                            <svg
                                className="h-5 w-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.8}
                                    d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                                />
                            </svg>
                            {unreadCount > 0 && (
                                <span
                                    className={cn(
                                        "absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-teal-500 px-0.5 text-[10px] font-bold text-white",
                                    )}
                                >
                                    {unreadCount > 99 ? "99+" : unreadCount}
                                </span>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}
