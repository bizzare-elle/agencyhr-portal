import * as React from "react";
import { NavLink } from "react-router-dom";
import {
    IconDashboard,
    IconFileTime,
    IconInnerShadowTop,
    IconUsers,
} from "@tabler/icons-react";
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
import { useAuthStore } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { ApiResponse } from "..";
import { Timer } from "lucide-react";

const navMainItems = (userId?: string) => [
    {
        title: "Time Records",
        url: "/",
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
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { setToken } = useAuthStore.getState();

    const { data: me, isLoading } = useQuery({
        queryKey: ["me"],
        queryFn: async () => {
            const response = await api.get<
                ApiResponse<{
                    id: string;
                    name: string;
                    email: string;
                    avatar?: string;
                }>
            >(`/api/v2/auth/me`);
            return response.data.data;
        },
    });

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
                {navMainItems(me?.id).map((item) => (
                    <SidebarMenu key={item.title}>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                                <NavLink
                                    to={item.url}
                                    className={({ isActive }) =>
                                        `flex items-center gap-2 rounded-md px-4 py-4 transition-colors ${
                                            isActive
                                                ? "bg-red-500 font-semibold text-white"
                                                : "text-muted-foreground hover:bg-muted/10"
                                        }`
                                    }
                                    end
                                >
                                    <item.icon className="!size-5" />
                                    {item.title}
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
