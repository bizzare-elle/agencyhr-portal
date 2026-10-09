import React from "react";
import {
    IconDotsVertical,
    IconLogout,
    IconLockCode,
    IconFileAnalytics,
    IconHeadset,
    IconDevices,
} from "@tabler/icons-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar";
import { useAuthStore } from "@/hooks/use-auth";
import { useNavigate, NavLink } from "react-router-dom";
import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { toast } from "sonner";
import ResetPasswordModal from "./reset-pass-modal";

function getInitials(name: string): string {
    // Handles "LASTNAME, FIRSTNAME" and "FIRST LAST" formats
    const parts = name.includes(",")
        ? name.split(",").map((p) => p.trim())
        : name.trim().split(/\s+/);
    return parts
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p.charAt(0).toUpperCase())
        .join("");
}

export function NavUser({
    user,
}: {
    user: {
        name: string;
        email: string;
        avatar: string;
        id: string;
    };
}) {
    const initials = getInitials(user.name);
    const { isMobile } = useSidebar();
    const logout = useAuthStore((state) => state.logout);
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const [open, setOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string | number>("");

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const handleResetClick = () => {
        setSelectedId(user.id);
        setOpen(true);
    };

    const handleAvatarClick = () => {
        if (fileInputRef.current) fileInputRef.current.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
        if (!allowed.includes(file.type)) {
            toast.error("Only JPEG, PNG, GIF, or WebP images are allowed.");
            return;
        }
        const form = new FormData();
        form.append("avatar", file);
        setUploading(true);
        try {
            await api.post(`/api/v2/employees/${user.id}/avatar`, form);
            await queryClient.invalidateQueries({ queryKey: ["me"] });
            toast.success("Profile photo updated.");
        } catch (err: any) {
            const msg =
                err?.response?.data?.message ??
                err?.message ??
                "Upload failed.";
            toast.error(msg);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleFileChange}
            />
            <SidebarMenu>
                <SidebarMenuItem>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <SidebarMenuButton
                                size="lg"
                                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                            >
                                <div
                                    className="relative cursor-pointer"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleAvatarClick();
                                    }}
                                    title="Change profile photo"
                                >
                                    <Avatar className="h-8 w-8 rounded-lg">
                                        <AvatarImage
                                            src={user.avatar}
                                            alt={user.name}
                                        />
                                        <AvatarFallback className="bg-primary/20 text-primary rounded-2xl font-semibold">
                                            {uploading ? "…" : initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-3.5 w-3.5 text-white"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                            <circle cx="12" cy="13" r="4" />
                                        </svg>
                                    </span>
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">
                                        {user.name}
                                    </span>
                                    <span className="text-muted-foreground truncate text-xs">
                                        {user.email || "agencyuser@gmail.com"}
                                    </span>
                                </div>
                                <IconDotsVertical className="ml-auto size-4" />
                            </SidebarMenuButton>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-xl"
                            side={isMobile ? "bottom" : "right"}
                            align="end"
                            sideOffset={4}
                        >
                            {/* Header */}
                            <DropdownMenuLabel className="p-0 font-normal">
                                <div className="flex items-center gap-3 px-3 py-3">
                                    <Avatar className="h-10 w-10 flex-shrink-0 rounded-xl">
                                        <AvatarImage
                                            src={user.avatar}
                                            alt={user.name}
                                        />
                                        <AvatarFallback className="bg-primary/20 text-primary rounded-xl text-sm font-semibold">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm leading-tight font-semibold">
                                            {user.name}
                                        </p>
                                        <p className="text-muted-foreground mt-0.5 truncate text-xs">
                                            {user.email}
                                        </p>
                                    </div>
                                </div>
                            </DropdownMenuLabel>

                            <DropdownMenuSeparator />

                            <DropdownMenuGroup>
                                <DropdownMenuItem
                                    onClick={handleResetClick}
                                    className="cursor-pointer gap-2.5"
                                >
                                    <IconLockCode className="text-muted-foreground h-4 w-4" />
                                    Reset Password
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    asChild
                                    className="cursor-pointer gap-2.5"
                                >
                                    <NavLink to="/account/devices">
                                        <IconDevices className="text-muted-foreground h-4 w-4" />
                                        Signed-in devices
                                    </NavLink>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    asChild
                                    className="cursor-pointer gap-2.5"
                                >
                                    <NavLink to="/guide">
                                        <IconFileAnalytics className="text-muted-foreground h-4 w-4" />
                                        View System Guide
                                    </NavLink>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    asChild
                                    className="cursor-pointer gap-2.5"
                                >
                                    <a
                                        href="https://support.agencyhr.ph"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <IconHeadset className="text-muted-foreground h-4 w-4" />
                                        Submit Support Ticket
                                    </a>
                                </DropdownMenuItem>
                            </DropdownMenuGroup>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                                onClick={handleLogout}
                                className="cursor-pointer gap-2.5 text-red-400 focus:text-red-400"
                            >
                                <IconLogout className="h-4 w-4" />
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </SidebarMenuItem>
            </SidebarMenu>

            <ResetPasswordModal
                open={open}
                onClose={() => setOpen(false)}
                employeeId={selectedId}
            />
        </>
    );
}
