import React, { useState, useMemo } from "react";
import { format, getDaysInMonth, isBefore, startOfDay } from "date-fns";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@/components/ui/popover";
import { toast } from "sonner";
import CustomSelect from "@/components/custom-select";
import { cn } from "@/lib/utils";
import { ParentComponent } from "@/components/parent-container";
import { useMutation, useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { Spinner } from "@/components/ui/spinner";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/hooks/use-auth";

export default function ScheduleForm() {
    const navigate = useNavigate();
    const { setToken } = useAuthStore.getState();

    const [date, setDate] = useState<Date>();
    const [selectedSchedules, setSelectedSchedules] = useState<{
        [key: string]: string | undefined;
    }>({});
    const [globalBranch, setGlobalBranch] = useState<string | undefined>(
        undefined,
    );
    const [selectedBranches, setSelectedBranches] = useState<{
        [key: string]: string | undefined;
    }>({});

    const [selectedEmployee, setSeletedEmployee] = useState<string | undefined>(
        undefined,
    );
    const dateRows = useMemo(() => {
        if (!date) return [];

        const daysInMonth = getDaysInMonth(date);
        const selectedDay = date.getDate();
        const year = date.getFullYear();
        const month = date.getMonth();

        const startDay = selectedDay <= 15 ? 1 : 16;
        const endDay = selectedDay <= 15 ? 15 : daysInMonth;

        const rows = [];
        for (let day = startDay; day <= endDay; day++) {
            rows.push(new Date(year, month, day));
        }
        return rows;
    }, [date]);

    const handleScheduleChange = (day: string, value: string | undefined) => {
        setSelectedSchedules((prev) => ({ ...prev, [day]: value }));
    };
    const getBranchForDate = (day: string) => {
        return selectedBranches[day] || globalBranch;
    };

    const handleDateSelect = (selectedDate?: Date) => {
        if (!selectedDate) return;

        const today = startOfDay(new Date());
        const picked = startOfDay(selectedDate);

        if (isBefore(picked, today)) {
            toast.error("You cannot select a past date for scheduling.");
            return;
        }

        setDate(selectedDate);
    };

    const { data: me } = useQuery({
        queryKey: ["me"],
        queryFn: async () => {
            const res = await api.get("/api/v2/auth/me");
            return res.data.data;
        },
    });

    const employeeId = me?.hr_id;

    const saveScheduleMutation = useMutation({
        mutationFn: async (payload: any) => {
            const res = await api.post(
                `/api/v2/schedules/${employeeId}`,
                payload,
            );
            return res.data;
        },
        onSuccess: () => {
            toast.success("Schedules saved successfully!");
            setSelectedSchedules({});
            setSelectedBranches({});
            setGlobalBranch("");
            setDate(undefined);
            setSeletedEmployee("");
            navigate(`/schedules/${employeeId}`);
        },
        onError: (error: any) => {
            toast.error(
                error?.response?.data?.message ||
                    "Something went wrong while saving schedules.",
            );
        },
    });

    const handleSubmit = () => {
        if (!date) {
            toast.error("Please select a cut-off date first.");
            return;
        }

        if (!globalBranch && Object.keys(selectedBranches).length === 0) {
            toast.error("Please select at least one branch.");
            return;
        }

        if (Object.keys(selectedSchedules).length === 0) {
            toast.error("Please assign at least one schedule.");
            return;
        }

        const formattedSchedules = Object.entries(selectedSchedules).map(
            ([day, schedule]) => ({
                date: format(new Date(day), "yyyy-MM-dd"),
                schedule_id: schedule,
                branch_id: getBranchForDate(day),
            }),
        );

        const payload = {
            employee_id: selectedEmployee,
            cutoff_date: format(date, "yyyy-MM-dd"),
            schedules: formattedSchedules,
        };

        saveScheduleMutation.mutate(payload);
    };

    const hasPerScheduleBranch = Object.keys(selectedBranches).length > 0;
    const isGlobalBranchActive = !!globalBranch && !hasPerScheduleBranch;

    return (
        <ParentComponent>
            <Card className="w-full shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">
                        Request Schedule
                    </CardTitle>
                    <CardDescription>
                        File for schedule request per cut-off period
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    <div className="flex flex-col gap-4 sm:flex-row">
                        <div className="w-full sm:w-[280px]">
                            <span className="mb-1 text-sm font-medium">
                                Select Employee:
                            </span>
                            <CustomSelect
                                apiUrl="api/v2/get_employees"
                                value={selectedEmployee}
                                onChange={setSeletedEmployee}
                                placeholder="Select employee..."
                            />
                        </div>

                        <div className="w-full sm:w-[280px]">
                            <span className="mb-1 block text-sm font-medium">
                                Select cut-off date:
                            </span>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        data-empty={!date}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            "data-[empty=true]:text-muted-foreground",
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date
                                            ? format(date, "MMMM dd, yyyy")
                                            : "Pick cut-off date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={handleDateSelect}
                                        disabled={(day) =>
                                            isBefore(
                                                startOfDay(day),
                                                startOfDay(new Date()),
                                            )
                                        }
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="w-full sm:w-[280px]">
                            <span className="mb-1 text-sm font-medium">
                                Branch (Apply to all):
                            </span>
                            <CustomSelect
                                apiUrl="api/v2/get_branch"
                                value={globalBranch}
                                onChange={(value) => {
                                    setGlobalBranch(value);
                                    setSelectedBranches({});
                                }}
                                placeholder={
                                    hasPerScheduleBranch
                                        ? "Disabled (per-date branch selected)"
                                        : "Select branch..."
                                }
                                disabled={hasPerScheduleBranch}
                            />
                        </div>
                    </div>

                    {date && (
                        <div className="overflow-x-auto rounded-lg border">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr>
                                        <th className="border-b px-4 py-2 text-left">
                                            Date
                                        </th>
                                        <th className="border-b px-4 py-2 text-left">
                                            Schedule
                                        </th>
                                        <th className="border-b px-4 py-2 text-left">
                                            Branch
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dateRows.map((day) => {
                                        const key = day.toISOString();
                                        return (
                                            <tr key={key}>
                                                <td className="border-b px-4 py-2 font-medium">
                                                    {format(
                                                        day,
                                                        "MMM dd, yyyy",
                                                    )}
                                                </td>
                                                <td className="border-b px-4 py-2">
                                                    <CustomSelect
                                                        apiUrl="/api/v2/get_schedule"
                                                        value={
                                                            selectedSchedules[
                                                                key
                                                            ] || ""
                                                        }
                                                        onChange={(value) =>
                                                            handleScheduleChange(
                                                                key,
                                                                value,
                                                            )
                                                        }
                                                        placeholder="Select schedule..."
                                                    />
                                                </td>
                                                <td className="border-b px-4 py-2">
                                                    <CustomSelect
                                                        apiUrl="api/v2/get_branch"
                                                        value={
                                                            selectedBranches[
                                                                key
                                                            ] || ""
                                                        }
                                                        onChange={(value) => {
                                                            setSelectedBranches(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    [key]: value,
                                                                }),
                                                            );
                                                            setGlobalBranch("");
                                                        }}
                                                        placeholder={
                                                            isGlobalBranchActive
                                                                ? "Disabled (global branch selected)"
                                                                : "Select branch..."
                                                        }
                                                        disabled={
                                                            isGlobalBranchActive
                                                        }
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="flex justify-end space-x-3">
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() => navigate(-1)}
                    >
                        Back
                    </Button>

                    <Button
                        onClick={handleSubmit}
                        disabled={saveScheduleMutation.isPending}
                        className="flex items-center gap-2"
                    >
                        {saveScheduleMutation.isPending ? (
                            <>
                                <Spinner className="h-4 w-4" />
                                Saving...
                            </>
                        ) : (
                            "Submit"
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </ParentComponent>
    );
}
