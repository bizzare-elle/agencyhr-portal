import * as React from "react";
import { NavLink } from "react-router-dom";
import {
    IconDashboard,
    IconFileTime,
    IconInnerShadowTop,
    IconUsers,
    IconCalendarCheck,
    IconClipboardList,
    IconFilter2Check,
    IconBell,
    IconSpeakerphone,
    IconSchool,
    IconHistory,
} from "@tabler/icons-react";
import { Timer, ShieldCheck, Settings2, Wifi } from "lucide-react";
import { isTabEnabled } from "@/lib/tabs";
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

type NavSection = {
    label: string;
    items: NavItem[];
};

function buildSections(
    userId?: string,
    role?: string,
    agency_id?: string,
    job_level?: string,
    notifCount?: number,
    isApprover?: boolean,
    isAdmin?: boolean,
    canWorkRemotely?: boolean,
    tabPerms?: Record<string, number>,
): NavSection[] {
    const ok = (key: string) => isTabEnabled(key, tabPerms);
    if (isAdmin) {
        return [
            {
                label: "Admin",
                items: [
                    {
                        title: "Admin Panel",
                        url: `/admin/${userId ?? ""}`,
                        icon: Settings2,
                    },
                ],
            },
        ];
    }

    const hasScheduleAccess =
        job_level === "Level 5: Supervisory" ||
        job_level === "Level 6: Managerial";

    if (role === "hr_employee") {
        const sections: NavSection[] = [];

        if (ok("profile")) {
            sections.push({
                label: "My Profile",
                items: [
                    {
                        title: "Profile",
                        url: `/employees/${userId ?? ""}`,
                        icon: IconUsers,
                    },
                ],
            });
        }

        const attendanceItems: NavItem[] = [];
        if (ok("time_records"))
            attendanceItems.push({
                title: "Time Records",
                url: `/${userId ?? ""}`,
                icon: IconDashboard,
            });
        if (ok("work_remotely") && canWorkRemotely)
            attendanceItems.push({
                title: "Work Remotely",
                url: `/remote/${userId ?? ""}`,
                icon: Wifi,
            });
        if (ok("logoverride"))
            attendanceItems.push({
                title: "Logoverride",
                url: `/logoverrides/${userId ?? ""}`,
                icon: IconFileTime,
            });
        if (ok("overtime"))
            attendanceItems.push({
                title: "Overtime",
                url: `/overtime/${userId ?? ""}`,
                icon: Timer,
            });
        if (attendanceItems.length)
            sections.push({ label: "Attendance", items: attendanceItems });

        const learningItems: NavItem[] = [];
        if (ok("training_files"))
            learningItems.push({
                title: "Training Files",
                url: `/training/${userId ?? ""}`,
                icon: IconSchool,
            });
        if (ok("trainings"))
            learningItems.push({
                title: "Trainings",
                url: `/training-history/${userId ?? ""}`,
                icon: IconHistory,
            });
        if (learningItems.length)
            sections.push({ label: "Learning", items: learningItems });

        const updateItems: NavItem[] = [];
        if (ok("notifications"))
            updateItems.push({
                title: "Notifications",
                url: `/notifications/${userId ?? ""}`,
                icon: IconBell,
                badge: notifCount && notifCount > 0 ? notifCount : undefined,
            });
        if (ok("announcements"))
            updateItems.push({
                title: "Announcements",
                url: `/announcements/${userId ?? ""}`,
                icon: IconSpeakerphone,
            });
        if (updateItems.length)
            sections.push({ label: "Updates", items: updateItems });

        if (hasScheduleAccess) {
            const mgmtItems: NavItem[] = [];
            if (ok("schedule"))
                mgmtItems.push({
                    title: "Schedule",
                    url: `/schedules/${userId ?? ""}`,
                    icon: IconCalendarCheck,
                });
            if (ok("forms"))
                mgmtItems.push({
                    title: "Forms",
                    url: `/forms/${userId ?? ""}`,
                    icon: IconClipboardList,
                });
            if (ok("hr_approvals") && isApprover)
                mgmtItems.push({
                    title: "HR Approvals",
                    url: `/approvals/${userId ?? ""}`,
                    icon: IconFilter2Check,
                });
            if (mgmtItems.length)
                sections.push({ label: "Management", items: mgmtItems });
        } else if (isApprover && ok("hr_approvals")) {
            sections.push({
                label: "Management",
                items: [
                    {
                        title: "HR Approvals",
                        url: `/approvals/${userId ?? ""}`,
                        icon: IconFilter2Check,
                    },
                ],
            });
        }

        return sections;
    }

    if (role === "agency_coordinator") {
        const sections: NavSection[] = [
            {
                label: "Overview",
                items: [
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
                ],
            },
            {
                label: "Management",
                items: [
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
                ],
            },
        ];
        return sections;
    }

    return [];
}

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
                    profile_photo_url?: string;
                    agency_id: string;
                    job_level: string;
                    is_admin?: number;
                    can_work_remotely?: number;
                    tab_permissions?: Record<string, number>;
                }>
            >(`/api/v2/auth/me`);
            return response.data.data;
        },
    });

    const { unreadCount } = useNotifications(
        me?.role === "hr_employee" ? me?.id : null,
    );

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
    const isAdmin = (me?.is_admin ?? 0) === 1;
    const canWorkRemotely = (me?.can_work_remotely ?? 0) === 1;

    const sections = buildSections(
        me?.id,
        me?.role,
        me?.agency_id,
        me?.job_level,
        unreadCount,
        isApprover,
        isAdmin,
        canWorkRemotely,
        me?.tab_permissions,
    );

    const renderItem = (item: NavItem) => (
        <NavLink
            key={item.title}
            to={item.url}
            end
            className={({ isActive }) =>
                `flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
                    isActive
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "text-muted-foreground hover:bg-muted/10 hover:text-foreground"
                }`
            }
        >
            <item.icon className="size-4 shrink-0" />
            <span className="truncate">{item.title}</span>
            {item.badge !== undefined && item.badge > 0 && (
                <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-teal-500 px-1 text-[10px] font-bold text-white">
                    {item.badge > 99 ? "99+" : item.badge}
                </span>
            )}
        </NavLink>
    );

    return (
        <Sidebar collapsible="offcanvas" {...props}>
            <SidebarHeader className="pb-8">
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

            <SidebarContent className="mt-1 gap-0 px-2">
                {!isLoading && (
                    <div className="flex flex-col gap-3 py-1">
                        {sections.map((section) => (
                            <div key={section.label}>
                                <p className="text-muted-foreground/40 mb-0.5 px-2.5 text-[10px] font-semibold tracking-widest uppercase">
                                    {section.label}
                                </p>
                                <div className="flex flex-col gap-px">
                                    {section.items.map(renderItem)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </SidebarContent>

            <SidebarFooter>
                {!isLoading && me && (
                    <div className="px-1 pt-1 pb-2">
                        <NavUser
                            user={{
                                name: me.name,
                                email: me.email,
                                avatar: me.profile_photo_url ?? me.avatar ?? "",
                                id: me.id,
                            }}
                        />
                    </div>
                )}
            </SidebarFooter>
        </Sidebar>
    );
}
