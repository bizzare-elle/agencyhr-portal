import { useForm } from "react-hook-form";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
    ChevronLeft,
    Users,
    User,
    Plus,
    X,
    Loader2,
    Briefcase,
    UserCheck,
} from "lucide-react";
import api from "@/lib/axios";
import { ParentComponent } from "@/components/parent-container";
import { Button } from "@/components/ui/button";
import EmployeeSearchSelect from "@/components/custom-search-field";
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import CustomSelect from "@/components/custom-select";

// ── Schema ────────────────────────────────────────────────────────────────────
const mrfSchema = z.object({
    request_type: z.enum(["Replacement", "Additional Headcount"], {
        message: "Please select a request type",
    }),

    // Only required when request_type === "Replacement" — enforced in onSubmit
    employees_being_replaced: z.array(
        z.object({
            id: z.string(),
            name: z.string(),
            position_id: z.string().optional(),
            position_name: z.string().optional(),
        }),
    ),

    department: z.string().min(1, "Department is required"),
    headcount: z.string().min(1, "Headcount is required"),
    immediate_superior: z.string().min(1, "Immediate superior is required"),
    branch_id: z.string().min(1, "Branch is required"),

    justification: z.string().min(1, "Justification is required"),
    job_description: z.string().optional(),
    remarks: z.string().optional(),
});

type MrfValues = z.infer<typeof mrfSchema>;

// ── Component ─────────────────────────────────────────────────────────────────
export default function MrfForm() {
    const navigate = useNavigate();

    const { data: me } = useQuery({
        queryKey: ["me"],
        queryFn: async () => {
            const res = await api.get("/api/v2/auth/me");
            return res.data.data;
        },
    });

    const employeeName = me?.name ?? "";
    const employeeId = String(me?.hr_id ?? me?.id ?? "");

    // Employee list — shared cache with EmployeeSearchSelect
    const { data: employeeList = [] } = useQuery<
        { id: number; name: string }[]
    >({
        queryKey: ["employee-select", "api/v2/get_employees"],
        queryFn: async () => {
            const res = await api.get("api/v2/get_employees");
            const payload = res.data?.data ?? res.data;
            return Array.isArray(payload) ? payload : [];
        },
        staleTime: 5 * 60 * 1000,
    });

    const form = useForm<MrfValues>({
        resolver: zodResolver(mrfSchema),
        defaultValues: {
            employees_being_replaced: [],
            department: "",
            headcount: "1",
            immediate_superior: "",
            branch_id: "",
            justification: "",
            job_description: "",
            remarks: "",
        },
    });

    // Watch request_type to conditionally render the employees section
    const watchedRequestType = form.watch("request_type");

    // Multi-employee picker state for "employees_being_replaced"
    const [pickerEmpId, setPickerEmpId] = useState<string | undefined>(
        undefined,
    );

    // Auto-fetch the picker employee's profile to resolve their current position
    const { data: pickerEmpProfile, isFetching: pickerProfileLoading } =
        useQuery({
            queryKey: ["emp-profile-picker", pickerEmpId],
            queryFn: async () => {
                const res = await api.get(`/api/v2/employees/${pickerEmpId}`);
                return res.data?.data?.info ?? res.data?.data ?? null;
            },
            enabled: !!pickerEmpId,
            staleTime: 2 * 60 * 1000,
        });

    const mutation = useMutation({
        mutationFn: async (data: MrfValues) => {
            await api.post("/api/v2/forms/save_mrf", data);
        },
        onSuccess: () => {
            toast.success("Manpower request submitted successfully!");
            navigate(-1);
        },
        onError: (err: any) => {
            const msg =
                err?.response?.data?.message ??
                "Failed to submit MRF. Please try again.";
            toast.error(msg);
        },
    });

    const onSubmit = (data: MrfValues) => {
        // Conditional validation: employees required only for Replacement
        if (
            data.request_type === "Replacement" &&
            (!data.employees_being_replaced ||
                data.employees_being_replaced.length === 0)
        ) {
            form.setError("employees_being_replaced", {
                type: "manual",
                message: "At least one employee being replaced is required",
            });
            return;
        }
        mutation.mutate(data);
    };

    return (
        <ParentComponent>
            <div className="mx-auto w-full max-w-2xl">
                <button
                    onClick={() => navigate(-1)}
                    className="text-muted-foreground hover:text-foreground mb-5 flex items-center gap-1.5 text-sm transition"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Back to Forms
                </button>

                <Card className="w-full">
                    <CardHeader>
                        {/* Title */}
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-green-500/30 bg-green-500/10">
                                <Users className="h-5 w-5 text-green-400" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-semibold">
                                    MRF — Manpower Request Form
                                </CardTitle>
                                <CardDescription>
                                    File a request for replacement or additional
                                    headcount. Target start date is
                                    automatically set 30 days from submission.
                                </CardDescription>
                            </div>
                        </div>

                        {/* Filed By */}
                        {me && (
                            <div className="bg-muted/50 mt-4 rounded-lg border px-4 py-3">
                                <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wider uppercase">
                                    Filed By
                                </p>
                                <div className="flex items-center gap-2">
                                    <div className="bg-muted flex h-7 w-7 items-center justify-center rounded-full">
                                        <User className="text-muted-foreground h-3.5 w-3.5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">
                                            {employeeName || "—"}
                                        </p>
                                        <p className="text-muted-foreground text-xs">
                                            ID: {employeeId || "—"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <CardContent className="space-y-5">
                                {/* ── Nature of Request ────────────────────── */}
                                <FormField
                                    control={form.control}
                                    name="request_type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Nature of Request
                                            </FormLabel>
                                            <FormControl>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {(
                                                        [
                                                            "Replacement",
                                                            "Additional Headcount",
                                                        ] as const
                                                    ).map((opt) => (
                                                        <button
                                                            key={opt}
                                                            type="button"
                                                            onClick={() => {
                                                                field.onChange(
                                                                    opt,
                                                                );
                                                                // Clear replaced employees when switching away from Replacement
                                                                if (
                                                                    opt !==
                                                                    "Replacement"
                                                                ) {
                                                                    form.setValue(
                                                                        "employees_being_replaced",
                                                                        [],
                                                                    );
                                                                    setPickerEmpId(
                                                                        undefined,
                                                                    );
                                                                }
                                                            }}
                                                            className={[
                                                                "rounded-lg border px-4 py-3 text-left text-sm font-medium transition-all",
                                                                field.value ===
                                                                opt
                                                                    ? "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400"
                                                                    : "border-muted hover:border-muted-foreground/40 text-muted-foreground",
                                                            ].join(" ")}
                                                        >
                                                            {opt}
                                                        </button>
                                                    ))}
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* ── Employee(s) Being Replaced — Replacement only ── */}
                                {watchedRequestType === "Replacement" && (
                                    <FormField
                                        control={form.control}
                                        name="employees_being_replaced"
                                        render={({ field: ef }) => {
                                            const list = ef.value ?? [];
                                            const addEmployee = () => {
                                                if (!pickerEmpId) return;
                                                if (
                                                    list.some(
                                                        (e) =>
                                                            e.id ===
                                                            pickerEmpId,
                                                    )
                                                ) {
                                                    setPickerEmpId(undefined);
                                                    return;
                                                }
                                                const found = employeeList.find(
                                                    (e) =>
                                                        String(e.id) ===
                                                        pickerEmpId,
                                                );
                                                const empName =
                                                    found?.name ??
                                                    pickerEmpProfile?.name ??
                                                    pickerEmpId;
                                                const positionName =
                                                    pickerEmpProfile?.position_name ??
                                                    "";
                                                const positionId = String(
                                                    pickerEmpProfile?.position_id ??
                                                        "",
                                                );
                                                ef.onChange([
                                                    ...list,
                                                    {
                                                        id: pickerEmpId,
                                                        name: empName,
                                                        position_id: positionId,
                                                        position_name:
                                                            positionName,
                                                    },
                                                ]);
                                                setPickerEmpId(undefined);
                                            };
                                            const removeEmployee = (
                                                id: string,
                                            ) => {
                                                ef.onChange(
                                                    list.filter(
                                                        (e) => e.id !== id,
                                                    ),
                                                );
                                            };
                                            return (
                                                <FormItem>
                                                    <FormLabel>
                                                        Employee(s) Being
                                                        Replaced
                                                    </FormLabel>

                                                    {/* Picker row */}
                                                    <div className="flex items-start gap-2">
                                                        <div className="min-w-0 flex-1">
                                                            <EmployeeSearchSelect
                                                                apiUrl="api/v2/get_employees"
                                                                placeholder="Search employee..."
                                                                value={
                                                                    pickerEmpId
                                                                }
                                                                onChange={(
                                                                    val,
                                                                ) =>
                                                                    setPickerEmpId(
                                                                        val,
                                                                    )
                                                                }
                                                                allowClear={
                                                                    false
                                                                }
                                                            />
                                                            {pickerEmpId && (
                                                                <div className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs">
                                                                    {pickerProfileLoading ? (
                                                                        <>
                                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                                            <span>
                                                                                Loading
                                                                                position…
                                                                            </span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Briefcase className="h-3 w-3" />
                                                                            <span>
                                                                                {pickerEmpProfile?.position_name
                                                                                    ? pickerEmpProfile.position_name
                                                                                    : "No position on record"}
                                                                            </span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            className="mt-0.5 shrink-0"
                                                            disabled={
                                                                !pickerEmpId ||
                                                                pickerProfileLoading
                                                            }
                                                            onClick={
                                                                addEmployee
                                                            }
                                                        >
                                                            <Plus className="mr-1 h-4 w-4" />
                                                            Add
                                                        </Button>
                                                    </div>

                                                    {/* Selected list */}
                                                    {list.length > 0 && (
                                                        <div className="mt-2 space-y-1.5">
                                                            {list.map((emp) => (
                                                                <div
                                                                    key={emp.id}
                                                                    className="bg-muted/40 flex items-center justify-between rounded-md border px-3 py-2"
                                                                >
                                                                    <div className="flex min-w-0 items-center gap-2 text-sm">
                                                                        <User className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                                                                        <div className="min-w-0">
                                                                            <div className="truncate font-medium">
                                                                                {
                                                                                    emp.name
                                                                                }
                                                                            </div>
                                                                            <div className="text-muted-foreground flex items-center gap-1 text-xs">
                                                                                <span>
                                                                                    ID:{" "}
                                                                                    {
                                                                                        emp.id
                                                                                    }
                                                                                </span>
                                                                                {emp.position_name && (
                                                                                    <>
                                                                                        <span>
                                                                                            &middot;
                                                                                        </span>
                                                                                        <Briefcase className="h-2.5 w-2.5" />
                                                                                        <span>
                                                                                            {
                                                                                                emp.position_name
                                                                                            }
                                                                                        </span>
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            removeEmployee(
                                                                                emp.id,
                                                                            )
                                                                        }
                                                                        className="text-muted-foreground hover:text-destructive ml-2 shrink-0 transition-colors"
                                                                    >
                                                                        <X className="h-3.5 w-3.5" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    <FormMessage />
                                                </FormItem>
                                            );
                                        }}
                                    />
                                )}

                                {/* ── Position Details ──────────────────────── */}
                                <div>
                                    <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
                                        Position Details
                                    </p>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <FormField
                                                control={form.control}
                                                name="department"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Department
                                                        </FormLabel>
                                                        <FormControl>
                                                            <CustomSelect
                                                                apiUrl="api/v2/get_department"
                                                                placeholder="Select department..."
                                                                value={
                                                                    field.value
                                                                }
                                                                onChange={(
                                                                    val,
                                                                ) =>
                                                                    field.onChange(
                                                                        val ??
                                                                            "",
                                                                    )
                                                                }
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="headcount"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Headcount Required
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <FormField
                                                control={form.control}
                                                name="branch_id"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Branch
                                                        </FormLabel>
                                                        <FormControl>
                                                            <CustomSelect
                                                                apiUrl="api/v2/get_branch"
                                                                placeholder="Select branch..."
                                                                value={
                                                                    field.value
                                                                }
                                                                onChange={
                                                                    field.onChange
                                                                }
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="immediate_superior"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            <span className="flex items-center gap-1.5">
                                                                <UserCheck className="h-3.5 w-3.5" />
                                                                Immediate
                                                                Superior
                                                            </span>
                                                        </FormLabel>
                                                        <FormControl>
                                                            <EmployeeSearchSelect
                                                                apiUrl="api/v2/get_head_approvers"
                                                                placeholder="Search supervisor..."
                                                                value={
                                                                    field.value ||
                                                                    undefined
                                                                }
                                                                onChange={(
                                                                    val,
                                                                ) =>
                                                                    field.onChange(
                                                                        val ??
                                                                            "",
                                                                    )
                                                                }
                                                                allowClear={
                                                                    true
                                                                }
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* ── Justification ────────────────────────── */}
                                <FormField
                                    control={form.control}
                                    name="justification"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Justification / Reason for
                                                Hiring
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Provide justification or reason for this manpower request..."
                                                    className="min-h-[90px]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* ── Job Description ───────────────────────── */}
                                <FormField
                                    control={form.control}
                                    name="job_description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Job Description{" "}
                                                <span className="text-muted-foreground">
                                                    (optional)
                                                </span>
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Brief description of duties and responsibilities..."
                                                    className="min-h-[90px]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* ── Remarks ──────────────────────────────── */}
                                <FormField
                                    control={form.control}
                                    name="remarks"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Remarks{" "}
                                                <span className="text-muted-foreground">
                                                    (optional)
                                                </span>
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Any additional notes for HR..."
                                                    className="min-h-[70px]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>

                            <CardFooter className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate(-1)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-green-600 hover:bg-green-700"
                                    disabled={mutation.isPending}
                                >
                                    {mutation.isPending && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    Submit MRF
                                </Button>
                            </CardFooter>
                        </form>
                    </Form>
                </Card>
            </div>
        </ParentComponent>
    );
}
