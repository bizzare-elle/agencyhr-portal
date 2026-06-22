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
    IconMoneybag,
    IconBell,
} from "@tabler/icons-react";
import { Timer } from "lucide-react";
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
                title: "Time Records",
                url: `/${userId ?? ""}`,
                icon: IconDashboard,
            },
            {
                title: "Profile",
                url: `/employees/${userId ?? ""}`,
                icon: IconUsers,
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
            // {
            //     title: "Service Charge Payslip",
            //     url: `/payslip/${userId ?? ""}`,
            //     icon: IconMoneybag,
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

    const menuItems = navMainItems(
        me?.id,
        me?.role,
        me?.agency_id,
        me?.job_level,
        unreadCount,
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

            <SidebarContent className="mt-10">
                {!isLoading &&
                    menuItems.map((item) => (
                        <SidebarMenu key={item.title}>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <NavLink
                                        to={item.url}
                                        className={({ isActive }) =>
                                            `flex items-center gap-2 rounded-md px-4 py-4 transition-colors ${
                                                isActive
                                                    ? "bg-primary text-primary-foreground font-semibold"
                                                    : "text-muted-foreground hover:bg-muted/10"
                                            }`
                                        }
                                        end
                                    >
                                        <item.icon className="!size-5" />
                                        {item.title}
                                        {item.badge !== undefined && item.badge > 0 && (
                                            <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-teal-500 px-1 text-[11px] font-semibold text-white">
                                                {item.badge > 99 ? "99+" : item.badge}
                                            </span>
                                        )}
                                    </NavLink>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    ))}
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
