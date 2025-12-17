import {
    IconDotsVertical,
    IconLogout,
    IconLockCode,
    IconFileAnalytics,
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
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import ResetPasswordModal from "./reset-pass-modal";

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
    const { isMobile } = useSidebar();
    const logout = useAuthStore((state) => state.logout);
    const navigate = useNavigate();

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

    return (
        <>
            <SidebarMenu>
                <SidebarMenuItem>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <SidebarMenuButton
                                size="lg"
                                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                            >
                                <Avatar className="h-8 w-8 rounded-lg grayscale">
                                    <AvatarImage
                                        src={user.avatar}
                                        alt={user.name}
                                    />
                                    <AvatarFallback className="rounded-2xl">
                                        CN
                                    </AvatarFallback>
                                </Avatar>
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
                            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                            side={isMobile ? "bottom" : "right"}
                            align="end"
                            sideOffset={4}
                        >
                            <DropdownMenuLabel className="p-0 font-normal">
                                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                    <Avatar className="h-8 w-8 rounded-lg">
                                        <AvatarImage
                                            src={user.avatar}
                                            alt={user.name}
                                        />
                                        <AvatarFallback className="rounded-2xl">
                                            CN
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-medium">
                                            {user.name}
                                        </span>
                                    </div>
                                </div>
                            </DropdownMenuLabel>

                            <DropdownMenuSeparator />

                            <DropdownMenuGroup>
                                <DropdownMenuItem
                                    onClick={handleResetClick}
                                    className="cursor-pointer"
                                >
                                    <IconLockCode className="mr-2 h-4 w-4" />
                                    Reset Password
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    asChild
                                    className="cursor-pointer"
                                >
                                    <a
                                        href="https://docs.google.com/presentation/d/1ZJLVoaMvxBzwrYFoSkINOSpktURRJBSM/edit?slide=id.p1#slide=id.p1"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex w-full items-center gap-2"
                                    >
                                        <IconFileAnalytics className="mr-2 h-4 w-4" />
                                        View System Guide
                                    </a>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    asChild
                                    className="cursor-pointer"
                                >
                                    <a
                                        href="https://support.agencyhr.ph"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex w-full items-center gap-2"
                                    >
                                        <IconDotsVertical className="mr-2 h-4 w-4" />
                                        Submit Support Ticket
                                    </a>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={handleLogout}
                                    className="cursor-pointer"
                                >
                                    <IconLogout className="mr-2 h-4 w-4" />
                                    Log out
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
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
