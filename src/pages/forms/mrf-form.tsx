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
    CalendarClock,
    Check,
} from "lucide-react";
import { addDays, format } from "date-fns";
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

    // Guarded as a positive whole number: a bare .min(1) only checks string
    // length, so "0" and "-3" both passed before.
    headcount: z
        .string()
        .min(1, "Headcount is required")
        .refine((v) => /^\d+$/.test(v), "Headcount must be a whole number")
        .refine((v) => parseInt(v, 10) >= 1, "Headcount must be at least 1"),

    immediate_superior: z.string().min(1, "Immediate superior is required"),
    branch_id: z.string().min(1, "Branch is required"),

    // Trimmed before length checks so a whitespace-only entry is rejected
    // rather than counting as filled in.
    justification: z.string().trim().min(1, "Justification is required"),
    job_description: z.string().trim().optional(),
    remarks: z.string().trim().optional(),
});

type MrfValues = z.infer<typeof mrfSchema>;

/**
 * Required-field marker. aria-hidden because the field's own validation message
 * is what actually conveys the requirement to assistive tech -- the asterisk is
 * a visual affordance so requesters can see what they must fill in up front.
 */
function Req() {
    return (
        <span aria-hidden="true" className="text-destructive ml-0.5">
            *
        </span>
    );
}

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

    // Mirrors the server: Forms.php sets target_start_date to +30 days at save.
    // Shown so the requester sees the actual date instead of being told a rule.
    const targetStartDate = format(addDays(new Date(), 30), "MMMM d, yyyy");

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

    // Radix Select reads value={undefined} as "uncontrolled" and keeps showing
    // the last picked label, so clearing pickerEmpId alone left the just-added
    // employee sitting in the picker as if the Add hadn't happened. Bumping this
    // key remounts the picker to genuinely reset it.
    const [pickerKey, setPickerKey] = useState(0);
    const resetPicker = () => {
        setPickerEmpId(undefined);
        setPickerKey((k) => k + 1);
    };

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
                                    headcount.
                                </CardDescription>
                            </div>
                        </div>

                        {/* Filed By + the date this request will target */}
                        {me && (
                            <div className="bg-muted/50 mt-4 grid gap-3 rounded-lg border px-4 py-3 sm:grid-cols-2 sm:gap-4">
                                <div>
                                    <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wider uppercase">
                                        Filed By
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <div className="bg-muted flex h-7 w-7 items-center justify-center rounded-full">
                                            <User className="text-muted-foreground h-3.5 w-3.5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium">
                                                {employeeName || "—"}
                                            </p>
                                            <p className="text-muted-foreground text-xs">
                                                ID: {employeeId || "—"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t pt-3 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-4">
                                    <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wider uppercase">
                                        Target Start Date
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <div className="bg-muted flex h-7 w-7 items-center justify-center rounded-full">
                                            <CalendarClock className="text-muted-foreground h-3.5 w-3.5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium">
                                                {targetStartDate}
                                            </p>
                                            <p className="text-muted-foreground text-xs">
                                                Set automatically, 30 days out
                                            </p>
                                        </div>
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
                                                <Req />
                                            </FormLabel>
                                            <FormControl>
                                                <div
                                                    role="radiogroup"
                                                    aria-label="Nature of Request"
                                                    className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                                                >
                                                    {(
                                                        [
                                                            "Replacement",
                                                            "Additional Headcount",
                                                        ] as const
                                                    ).map((opt) => (
                                                        <button
                                                            key={opt}
                                                            type="button"
                                                            role="radio"
                                                            aria-checked={
                                                                field.value ===
                                                                opt
                                                            }
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
                                                                "flex items-center justify-between gap-2 rounded-lg border px-4 py-3 text-left text-sm font-medium transition-all",
                                                                "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                                                                field.value ===
                                                                opt
                                                                    ? "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400"
                                                                    : "border-muted hover:border-muted-foreground/40 text-muted-foreground",
                                                            ].join(" ")}
                                                        >
                                                            <span>{opt}</span>
                                                            {/* Selection also carries a
                                                                non-colour cue */}
                                                            {field.value ===
                                                                opt && (
                                                                <Check className="h-4 w-4 shrink-0" />
                                                            )}
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
                                                    // Previously cleared the picker
                                                    // silently, which read as the Add
                                                    // button being broken.
                                                    toast.info(
                                                        "That employee is already on the list.",
                                                    );
                                                    resetPicker();
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
                                                resetPicker();
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
                                                        <Req />
                                                    </FormLabel>

                                                    {/* Step 1 — search and add.
                                                        Boxed and labelled so it
                                                        reads as an input area
                                                        rather than another row
                                                        of the list below. */}
                                                    <div className="bg-muted/30 rounded-lg border border-dashed p-3">
                                                        <p className="text-muted-foreground mb-2 text-xs">
                                                            Search an employee,
                                                            then press{" "}
                                                            <span className="text-foreground font-medium">
                                                                Add
                                                            </span>
                                                            . Repeat to include
                                                            more than one.
                                                        </p>
                                                        <div className="flex items-start gap-2">
                                                            <div className="min-w-0 flex-1">
                                                                <EmployeeSearchSelect
                                                                    key={
                                                                        pickerKey
                                                                    }
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
                                                    </div>

                                                    {/* Step 2 — what has been
                                                        added so far. Empty state
                                                        is explicit so a blank
                                                        area isn't mistaken for a
                                                        failed Add. */}
                                                    {list.length === 0 ? (
                                                        <p className="text-muted-foreground mt-3 text-xs italic">
                                                            No employees added
                                                            yet.
                                                        </p>
                                                    ) : (
                                                        <div className="mt-3 space-y-1.5">
                                                            <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                                                                Being replaced (
                                                                {list.length})
                                                            </p>
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
                                                                        aria-label={`Remove ${emp.name}`}
                                                                        title={`Remove ${emp.name}`}
                                                                        onClick={() =>
                                                                            removeEmployee(
                                                                                emp.id,
                                                                            )
                                                                        }
                                                                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 focus-visible:ring-ring ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
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
                                                            <Req />
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
                                                            <Req />
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
                                                            <Req />
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
                                                                <Req />
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
                                                <Req />
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
