import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    action?: ReactNode;
}

export function EmptyState({
    title,
    description,
    icon: Icon = Inbox,
    action,
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <div className="bg-muted text-muted-foreground flex h-12 w-12 items-center justify-center rounded-full">
                <Icon className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold">{title}</p>
            {description && (
                <p className="text-muted-foreground max-w-xs text-sm">
                    {description}
                </p>
            )}
            {action && <div className="mt-2">{action}</div>}
        </div>
    );
}
