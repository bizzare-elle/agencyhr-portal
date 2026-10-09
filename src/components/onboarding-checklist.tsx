import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Check, Circle, X } from "lucide-react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Step {
    key: string;
    title: string;
    description: string;
    done: boolean;
    path: string | null;
}

interface ChecklistData {
    steps: Step[];
    completed: number;
    total: number;
}

const dismissKey = (id: string) => `agencyhr.checklist.dismissed.${id}`;

function wasDismissed(id: string): boolean {
    try {
        return localStorage.getItem(dismissKey(id)) === "1";
    } catch {
        return false;
    }
}

export function OnboardingChecklist() {
    const meQuery = useQuery({
        queryKey: ["me"],
        queryFn: async () => {
            const res = await api.get("/api/v2/auth/me");
            return res.data.data as { hr_id: string; role: string };
        },
    });
    const employeeId = meQuery.data?.hr_id;
    const isEmployee = meQuery.data?.role === "hr_employee";

    const [dismissed, setDismissed] = useState(false);

    const { data } = useQuery<ChecklistData>({
        queryKey: ["checklist", employeeId],
        enabled: !!employeeId && isEmployee,
        queryFn: async () => {
            const res = await api.get(
                `/api/v2/employees/${employeeId}/checklist`,
            );
            return res.data.data;
        },
    });

    if (!employeeId || !isEmployee || !data) return null;
    if (data.completed >= data.total) return null;
    if (dismissed || wasDismissed(employeeId)) return null;

    const dismiss = () => {
        try {
            localStorage.setItem(dismissKey(employeeId), "1");
        } catch {
            // Private mode: it simply comes back next visit.
        }
        setDismissed(true);
    };

    const percent = Math.round((data.completed / data.total) * 100);

    return (
        <Card className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-sm font-semibold">Finish setting up</h2>
                    <p className="text-muted-foreground text-xs">
                        {data.completed} of {data.total} done
                    </p>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    aria-label="Hide checklist"
                    onClick={dismiss}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <div
                className="bg-muted h-1.5 w-full overflow-hidden rounded-full"
                role="progressbar"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
            >
                <div
                    className="h-full rounded-full bg-yellow-500 transition-all"
                    style={{ width: `${percent}%` }}
                />
            </div>

            <ul className="space-y-2">
                {data.steps.map((step) => (
                    <li key={step.key} className="flex items-start gap-3">
                        {step.done ? (
                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-600 text-white">
                                <Check className="h-3 w-3" />
                            </span>
                        ) : (
                            <Circle className="text-muted-foreground mt-0.5 h-5 w-5 shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                            <p
                                className={
                                    step.done
                                        ? "text-muted-foreground text-sm line-through"
                                        : "text-sm font-medium"
                                }
                            >
                                {step.title}
                            </p>
                            {!step.done && (
                                <p className="text-muted-foreground text-xs">
                                    {step.description}
                                </p>
                            )}
                        </div>
                        {!step.done && step.path && (
                            <Button
                                asChild
                                size="sm"
                                variant="outline"
                                className="h-9 shrink-0"
                            >
                                <Link to={step.path}>Open</Link>
                            </Button>
                        )}
                    </li>
                ))}
            </ul>
        </Card>
    );
}
