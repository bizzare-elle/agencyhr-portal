import * as React from "react";
import { NavLink } from "react-router-dom";
import {
    IconDashboard,
    IconFileTime,
    IconInnerShadowTop,
    IconUsers,
    IconCalendarCheck,
    IconClipboardList,
    IconClipboardCheck,
    IconFilter2Check,
    IconMoneybag,
    IconBell,
    IconSpeakerphone,
    IconSchool,
    IconHistory,
    IconReceipt,
} from "@tabler/icons-react";
import { Timer, ShieldCheck } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { NavUser } from "@/components/nav-user";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { ApiResponse } from "..";

type NavItem = {
    title: string;
    url: string;
    icon: React.ElementType;
    badge?: number;
};

const navMainItems = (
    userId?: string,
    role?: string,
    agency_id?: string,
    job_level?: string,
    notifCount?: number,
    isApprover?: boolean,
): NavItem[] => {
    const items: NavItem[] = [];

    const hasScheduleAccess =
        job_level === "Level 5: Supervisory" ||
        job_level === "Level 6: Managerial";

    if (role === "hr_employee") {
        items.push(
            {
                title: "Notifications",
                url: `/notifications/${userId ?? ""}`,
                icon: IconBell,
                badge: notifCount && notifCount > 0 ? notifCount : undefined,
            },
            {
                title: "Announcements",
                url: `/announcements/${userId ?? ""}`,
                icon: IconSpeakerphone,
            },
            {
                title: "Profile",
                url: `/employees/${userId ?? ""}`,
                icon: IconUsers,
            },
            {
                title: "Time Records",
                url: `/${userId ?? ""}`,
                icon: IconDashboard,
            },

            {
                title: "Logoverride",
                url: `/logoverrides/${userId ?? ""}`,
                icon: IconFileTime,
            },
            {
                title: "Overtime",
                url: `/overtime/${userId ?? ""}`,
                icon: Timer,
            },
            {
                title: "Training Files",
                url: `/training/${userId ?? ""}`,
                icon: IconSchool,
            },
            {
                title: "Trainings",
                url: `/training-history/${userId ?? ""}`,
                icon: IconHistory,
            },
            // {
            //     title: "Payslip",
            //     url: `/payslip/${userId ?? ""}`,
            //     icon: IconReceipt,
            // },
        );

        if (hasScheduleAccess) {
            items.push(
                {
                    title: "Schedule",
                    url: `/schedules/${userId ?? ""}`,
                    icon: IconCalendarCheck,
                },
                {
                    title: "Forms",
                    url: `/forms/${userId ?? ""}`,
                    icon: IconClipboardList,
                },
            );
            if (isApprover) {
                items.push({
                    title: "HR Approvals",
                    url: `/approvals/${userId ?? ""}`,
                    icon: IconFilter2Check,
                });
            }
        }
    }

    if (role === "agency_coordinator") {
        items.push(
            {
                title: "Dashboard",
                url: `/dashboard/${agency_id ?? ""}`,
                icon: IconDashboard,
            },
            {
                title: "Employee List",
                url: "/employees",
                icon: IconUsers,
            },
            {
                title: "Schedule",
                url: `/schedules/${userId ?? ""}`,
                icon: IconCalendarCheck,
            },
            ...(isApprover
                ? [
                      {
                          title: "HR Approvals",
                          url: `/approvals/${userId ?? ""}`,
                          icon: ShieldCheck,
                      },
                  ]
                : []),
            // {
            //     title: "Forms",
            //     url: `/forms/submissions/${userId ?? ""}`,
            //     icon: IconClipboardList,
            // },
            // {
            //     title: "Validate Forms",
            //     url: `/forms/validation/${userId ?? ""}`,
            //     icon: IconClipboardCheck,
            // },
        );
    }

    return items;
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { data: me, isLoading } = useQuery({
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

    const { unreadCount } = useNotifications(
        me?.role === "hr_employee" ? me?.id : null,
    );

    // Share the same cache key as the HR Approvals page so this never causes
    // a redundant network call when both the sidebar and the page are mounted.
    const { data: approverInfo } = useQuery<{ is_approver: boolean }>({
        queryKey: ["approvals-is-approver"],
        queryFn: async () => {
            const res = await api.get<ApiResponse<{ is_approver: boolean }>>(
                "/api/v2/approvals/is-approver",
            );
            return res.data.data ?? { is_approver: false };
        },
        enabled: !!me,
        staleTime: 5 * 60 * 1000,
    });
    const isApprover = approverInfo?.is_approver ?? false;

    const menuItems = navMainItems(
        me?.id,
        me?.role,
        me?.agency_id,
        me?.job_level,
        unreadCount,
        isApprover,
    );

    // Split items into logical groups for visual separation
    const groupA = menuItems.filter((i) =>
        ["Notifications", "Announcements"].includes(i.title),
    );
    const groupB = menuItems.filter((i) =>
        [
            "Time Records",
            "Profile",
            "Logoverride",
            "Overtime",
            "Training Files",
            "Trainings",
            "Payslip",
        ].includes(i.title),
    );

    const groupC = menuItems.filter((i) =>
        [
            // "Schedule",
            // "Forms",
            // "Dashboard",
            "Employee List",
            // "HR Approvals",
        ].includes(i.title),
    );

    const renderItem = (item: NavItem) => (
        <SidebarMenu key={item.title}>
            <SidebarMenuItem>
                <SidebarMenuButton asChild>
                    <NavLink
                        to={item.url}
                        className={({ isActive }) =>
                            `flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                                isActive
                                    ? "bg-primary text-primary-foreground font-semibold"
                                    : "text-muted-foreground hover:bg-muted/10 hover:text-foreground"
                            }`
                        }
                        end
                    >
                        <item.icon className="!size-[18px] shrink-0" />
                        <span className="truncate">{item.title}</span>
                        {item.badge !== undefined && item.badge > 0 && (
                            <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-teal-500 px-1 text-[10px] font-bold text-white">
                                {item.badge > 99 ? "99+" : item.badge}
                            </span>
                        )}
                    </NavLink>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
    );

    return (
        <Sidebar collapsible="offcanvas" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            className="data-[slot=sidebar-menu-button]:!p-1.5"
                        >
                            <NavLink to="/">
                                <IconInnerShadowTop className="!size-5" />
                                <span className="text-base font-semibold">
                                    Agency HR
                                </span>
                            </NavLink>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="mt-4 gap-0 px-2">
                {!isLoading && (
                    <div className="flex flex-col gap-0.5">
                        {groupA.length > 0 && (
                            <div className="mb-1">{groupA.map(renderItem)}</div>
                        )}
                        {groupB.length > 0 && (
                            <div className="mb-1 border-t border-white/5 pt-1">
                                {groupB.map(renderItem)}
                            </div>
                        )}
                        {groupC.length > 0 && (
                            <div className="mb-1 border-t border-white/5 pt-1">
                                {groupC.map(renderItem)}
                            </div>
                        )}
                    </div>
                )}
            </SidebarContent>

            <SidebarFooter>
                {!isLoading && me ? (
                    <NavUser
                        user={{
                            name: me.name,
                            email: me.email,
                            avatar: me.avatar ?? "/avatars/shadcn.jpg",
                            id: me.id,
                        }}
                    />
                ) : (
                    <div className="text-muted-foreground px-4 py-2 text-sm">
                        Loading user...
                    </div>
                )}
            </SidebarFooter>
        </Sidebar>
    );
}
