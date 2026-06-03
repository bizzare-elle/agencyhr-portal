import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft, Users, User } from "lucide-react";
import api from "@/lib/axios";
import { ParentComponent } from "@/components/parent-container";
import { Button } from "@/components/ui/button";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import CustomSelect from "@/components/custom-select";

// ── Schema ────────────────────────────────────────────────────────────────────
const mrfSchema = z
    .object({
        // Nature of Requisition (one of the four boxes)
        nature_of_requisition: z.enum(
            ["Replacement", "Additional Headcount", "New Position", "Pre-approved Position in Plantilla"],
            { required_error: "Please select a nature of requisition" }
        ),
        employee_being_replaced: z.string().optional(),

        // Employment Status
        employment_status: z.enum(["Probationary", "Agency", "OJT"], {
            required_error: "Please select employment status",
        }),
        employment_sub_type: z.enum(["Casual", "On-Call"]).optional(),

        // Request details
        department:          z.string().min(1, "Department is required"),
        position_title:      z.string().min(1, "Position title is required"),
        job_grade:           z.string().optional(),
        headcount:           z.string().min(1, "Headcount is required"),
        immediate_superior:  z.string().min(1, "Immediate superior is required"),
        manager:             z.string().optional(),
        branch_id:           z.string().min(1, "Branch is required"),
        target_start_date:   z.string().min(1, "Target start date is required"),

        // Free-text sections
        justification:       z.string().min(1, "Justification is required"),
        job_description:     z.string().optional(),

        // Optional qualifications (kept from previous version)
        education_requirement:  z.string().optional(),
        experience_requirement: z.string().optional(),
        skills_required:        z.string().optional(),
        salary_range:           z.string().optional(),
        remarks:                z.string().optional(),
    })
    .superRefine((data, ctx) => {
        if (data.nature_of_requisition === "Replacement" && !data.employee_being_replaced?.trim()) {
            ctx.addIssue({
                path: ["employee_being_replaced"],
                code: z.ZodIssueCode.custom,
                message: "Name of employee being replaced is required",
            });
        }
        if (data.employment_status === "Agency" && !data.employment_sub_type) {
            ctx.addIssue({
                path: ["employment_sub_type"],
                code: z.ZodIssueCode.custom,
                message: "Please select Casual or On-Call",
            });
        }
    });

type MrfValues = z.infer<typeof mrfSchema>;

// ── Shared cell styles ────────────────────────────────────────────────────────
const cellClass = "border border-gray-400 px-3 py-2";
const labelClass = "text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-0.5";

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
    const employeeId   = String(me?.hr_id ?? me?.id ?? "");

    const form = useForm<MrfValues>({
        resolver: zodResolver(mrfSchema),
        defaultValues: {
            nature_of_requisition:  undefined,
            employee_being_replaced: "",
            employment_status:       undefined,
            employment_sub_type:     undefined,
            department:              "",
            position_title:          "",
            job_grade:               "",
            headcount:               "1",
            immediate_superior:      "",
            manager:                 "",
            branch_id:               "",
            target_start_date:       "",
            justification:           "",
            job_description:         "",
            education_requirement:   "",
            experience_requirement:  "",
            skills_required:         "",
            salary_range:            "",
            remarks:                 "",
        },
    });

    const natureValue     = useWatch({ control: form.control, name: "nature_of_requisition" });
    const employmentValue = useWatch({ control: form.control, name: "employment_status" });

    const onSubmit = (data: MrfValues) => {
        // TODO: wire to API endpoint when ready
        console.log("MRF Submission:", { filed_by: employeeName, filer_id: employeeId, ...data });
        toast.success("Manpower request submitted successfully!");
        navigate(-1);
    };

    return (
        <ParentComponent>
            <div className="mx-auto w-full max-w-3xl">
                <button
                    onClick={() => navigate(-1)}
                    className="mb-5 flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Back to Forms
                </button>

                <Card className="w-full">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-green-500/30 bg-green-500/10">
                                <Users className="h-5 w-5 text-green-400" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-semibold">
                                    MRF — Manpower Request Form
                                </CardTitle>
                                <CardDescription>
                                    File a request for a replacement or new position hire.
                                </CardDescription>
                            </div>
                        </div>

                        {me && (
                            <div className="mt-4 rounded-lg border bg-muted/50 px-4 py-3">
                                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Filed By</p>
                                <div className="flex items-center gap-2">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">{employeeName || "—"}</p>
                                        <p className="text-xs text-muted-foreground">ID: {employeeId || "—"}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <CardContent className="space-y-0 p-0">

                                {/* ── REQUEST DETAILS header ───────────────── */}
                                <div className="border border-gray-400 bg-gray-50 px-4 py-2 text-center">
                                    <span className="text-sm font-bold uppercase tracking-wide">Request Details</span>
                                    <span className="ml-2 text-xs italic text-gray-500">
                                        (to be filled out by Requisitioning Department)
                                    </span>
                                </div>

                                {/* ── Two-column: Nature + Employment Status ── */}
                                <div className="grid grid-cols-2 border-x border-b border-gray-400">

                                    {/* Left: Nature of Requisition */}
                                    <div className="border-r border-gray-400">
                                        <div className="border-b border-gray-400 bg-gray-100 px-3 py-1.5 text-center text-xs font-bold uppercase">
                                            Nature of Requisition
                                        </div>
                                        <FormField
                                            control={form.control}
                                            name="nature_of_requisition"
                                            render={({ field }) => (
                                                <FormItem className="px-3 py-2 space-y-0">
                                                    {/* Replacement */}
                                                    <div className="flex items-start gap-2 py-1.5">
                                                        <Checkbox
                                                            id="nor-replacement"
                                                            checked={field.value === "Replacement"}
                                                            onCheckedChange={() =>
                                                                field.onChange(
                                                                    field.value === "Replacement" ? undefined : "Replacement"
                                                                )
                                                            }
                                                            className="mt-0.5"
                                                        />
                                                        <div className="flex-1">
                                                            <label htmlFor="nor-replacement" className="text-sm font-medium cursor-pointer">
                                                                Replacement
                                                            </label>
                                                            {/* Conditional: name of employee being replaced */}
                                                            {natureValue === "Replacement" && (
                                                                <FormField
                                                                    control={form.control}
                                                                    name="employee_being_replaced"
                                                                    render={({ field: ef }) => (
                                                                        <FormItem className="mt-1">
                                                                            <FormLabel className="text-[11px] text-blue-600 font-semibold">
                                                                                Name of employee being replaced:
                                                                            </FormLabel>
                                                                            <FormControl>
                                                                                <Input
                                                                                    placeholder="Employee name"
                                                                                    className="h-7 text-sm"
                                                                                    {...ef}
                                                                                />
                                                                            </FormControl>
                                                                            <FormMessage />
                                                                        </FormItem>
                                                                    )}
                                                                />
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Additional Headcount */}
                                                    <div className="flex items-center gap-2 py-1.5">
                                                        <Checkbox
                                                            id="nor-additional"
                                                            checked={field.value === "Additional Headcount"}
                                                            onCheckedChange={() =>
                                                                field.onChange(
                                                                    field.value === "Additional Headcount" ? undefined : "Additional Headcount"
                                                                )
                                                            }
                                                        />
                                                        <label htmlFor="nor-additional" className="text-sm font-medium cursor-pointer">
                                                            Additional Headcount
                                                        </label>
                                                    </div>

                                                    {/* New Position */}
                                                    <div className="flex items-center gap-2 py-1.5">
                                                        <Checkbox
                                                            id="nor-new"
                                                            checked={field.value === "New Position"}
                                                            onCheckedChange={() =>
                                                                field.onChange(
                                                                    field.value === "New Position" ? undefined : "New Position"
                                                                )
                                                            }
                                                        />
                                                        <label htmlFor="nor-new" className="text-sm font-medium cursor-pointer">
                                                            New Position
                                                        </label>
                                                    </div>

                                                    {/* Pre-approved in Plantilla */}
                                                    <div className="flex items-center gap-2 py-1.5">
                                                        <Checkbox
                                                            id="nor-preapproved"
                                                            checked={field.value === "Pre-approved Position in Plantilla"}
                                                            onCheckedChange={() =>
                                                                field.onChange(
                                                                    field.value === "Pre-approved Position in Plantilla"
                                                                        ? undefined
                                                                        : "Pre-approved Position in Plantilla"
                                                                )
                                                            }
                                                        />
                                                        <label htmlFor="nor-preapproved" className="text-sm font-medium cursor-pointer italic text-blue-600">
                                                            Pre-approved position in plantilla
                                                        </label>
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* Right: Employment Status */}
                                    <div>
                                        <div className="border-b border-gray-400 bg-gray-100 px-3 py-1.5 text-center text-xs font-bold uppercase">
                                            Employment Status
                                        </div>
                                        <FormField
                                            control={form.control}
                                            name="employment_status"
                                            render={({ field }) => (
                                                <FormItem className="px-3 py-2 space-y-0">
                                                    {/* Probationary */}
                                                    <div className="flex items-center gap-2 py-1.5">
                                                        <Checkbox
                                                            id="es-probationary"
                                                            checked={field.value === "Probationary"}
                                                            onCheckedChange={() =>
                                                                field.onChange(
                                                                    field.value === "Probationary" ? undefined : "Probationary"
                                                                )
                                                            }
                                                        />
                                                        <label htmlFor="es-probationary" className="text-sm font-medium cursor-pointer">
                                                            Probationary
                                                        </label>
                                                    </div>

                                                    {/* Agency + Casual / On-Call sub-options */}
                                                    <div className="py-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <Checkbox
                                                                id="es-agency"
                                                                checked={field.value === "Agency"}
                                                                onCheckedChange={() =>
                                                                    field.onChange(
                                                                        field.value === "Agency" ? undefined : "Agency"
                                                                    )
                                                                }
                                                            />
                                                            <label htmlFor="es-agency" className="text-sm font-medium cursor-pointer">
                                                                Agency
                                                            </label>
                                                        </div>
                                                        {/* Sub-type: Casual / On-Call */}
                                                        {employmentValue === "Agency" && (
                                                            <FormField
                                                                control={form.control}
                                                                name="employment_sub_type"
                                                                render={({ field: sf }) => (
                                                                    <FormItem className="mt-1 ml-6 space-y-0">
                                                                        <div className="flex gap-4">
                                                                            <div className="flex items-center gap-1.5">
                                                                                <Checkbox
                                                                                    id="sub-casual"
                                                                                    checked={sf.value === "Casual"}
                                                                                    onCheckedChange={() =>
                                                                                        sf.onChange(
                                                                                            sf.value === "Casual" ? undefined : "Casual"
                                                                                        )
                                                                                    }
                                                                                />
                                                                                <label htmlFor="sub-casual" className="text-sm cursor-pointer">
                                                                                    Casual
                                                                                </label>
                                                                            </div>
                                                                            <div className="flex items-center gap-1.5">
                                                                                <Checkbox
                                                                                    id="sub-oncall"
                                                                                    checked={sf.value === "On-Call"}
                                                                                    onCheckedChange={() =>
                                                                                        sf.onChange(
                                                                                            sf.value === "On-Call" ? undefined : "On-Call"
                                                                                        )
                                                                                    }
                                                                                />
                                                                                <label htmlFor="sub-oncall" className="text-sm cursor-pointer">
                                                                                    On-Call
                                                                                </label>
                                                                            </div>
                                                                        </div>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        )}
                                                    </div>

                                                    {/* OJT */}
                                                    <div className="flex items-center gap-2 py-1.5">
                                                        <Checkbox
                                                            id="es-ojt"
                                                            checked={field.value === "OJT"}
                                                            onCheckedChange={() =>
                                                                field.onChange(field.value === "OJT" ? undefined : "OJT")
                                                            }
                                                        />
                                                        <label htmlFor="es-ojt" className="text-sm font-medium cursor-pointer">
                                                            OJT
                                                        </label>
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* ── Info grid ───────────────────────────────── */}
                                {/* Row 1: Department | Position Title */}
                                <div className="grid grid-cols-2 border-x border-b border-gray-400">
                                    <div className={cellClass + " border-r border-gray-400"}>
                                        <FormField
                                            control={form.control}
                                            name="department"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className={labelClass}>Department</FormLabel>
                                                    <FormControl>
                                                        <Input className="h-7 border-0 border-b border-gray-300 rounded-none px-0 text-sm focus-visible:ring-0 shadow-none" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className={cellClass}>
                                        <FormField
                                            control={form.control}
                                            name="position_title"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className={labelClass}>Position Title</FormLabel>
                                                    <FormControl>
                                                        <Input className="h-7 border-0 border-b border-gray-300 rounded-none px-0 text-sm focus-visible:ring-0 shadow-none" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* Row 2: Job Grade | Headcount Required */}
                                <div className="grid grid-cols-2 border-x border-b border-gray-400">
                                    <div className={cellClass + " border-r border-gray-400"}>
                                        <FormField
                                            control={form.control}
                                            name="job_grade"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className={labelClass}>Job Grade</FormLabel>
                                                    <FormControl>
                                                        <Input className="h-7 border-0 border-b border-gray-300 rounded-none px-0 text-sm focus-visible:ring-0 shadow-none" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className={cellClass}>
                                        <FormField
                                            control={form.control}
                                            name="headcount"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className={labelClass}>Headcount Required</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" min="1" className="h-7 border-0 border-b border-gray-300 rounded-none px-0 text-sm focus-visible:ring-0 shadow-none" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* Row 3: Immediate Superior | Manager */}
                                <div className="grid grid-cols-2 border-x border-b border-gray-400">
                                    <div className={cellClass + " border-r border-gray-400"}>
                                        <FormField
                                            control={form.control}
                                            name="immediate_superior"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className={labelClass}>Immediate Superior</FormLabel>
                                                    <FormControl>
                                                        <Input className="h-7 border-0 border-b border-gray-300 rounded-none px-0 text-sm focus-visible:ring-0 shadow-none" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className={cellClass}>
                                        <FormField
                                            control={form.control}
                                            name="manager"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className={labelClass}>Manager</FormLabel>
                                                    <FormControl>
                                                        <Input className="h-7 border-0 border-b border-gray-300 rounded-none px-0 text-sm focus-visible:ring-0 shadow-none" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* Row 4: Branch + Target Start Date (full width, two-col) */}
                                <div className="grid grid-cols-2 border-x border-b border-gray-400">
                                    <div className={cellClass + " border-r border-gray-400"}>
                                        <FormField
                                            control={form.control}
                                            name="branch_id"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className={labelClass}>Branch</FormLabel>
                                                    <FormControl>
                                                        <CustomSelect
                                                            apiUrl="api/v2/get_branch"
                                                            placeholder="Select branch..."
                                                            value={field.value}
                                                            onChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className={cellClass}>
                                        <FormField
                                            control={form.control}
                                            name="target_start_date"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className={labelClass}>Target Start Date</FormLabel>
                                                    <FormControl>
                                                        <Input type="date" className="h-7 border-0 border-b border-gray-300 rounded-none px-0 text-sm focus-visible:ring-0 shadow-none" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* ── Justification ──────────────────────────── */}
                                <div className="border-x border-b border-gray-400">
                                    <div className="bg-gray-800 px-3 py-1.5 text-xs font-semibold text-white">
                                        Justification / Reason for hiring:
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="justification"
                                        render={({ field }) => (
                                            <FormItem className="p-3">
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Provide justification or reason for this manpower request..."
                                                        className="min-h-[80px] border-0 rounded-none focus-visible:ring-0 shadow-none resize-none px-0 text-sm"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* ── Job Description ────────────────────────── */}
                                <div className="border-x border-b border-gray-400">
                                    <div className="bg-gray-100 px-3 py-1.5 text-xs italic text-gray-600 border-b border-gray-300">
                                        Please provide a brief job description here if JD is not attached
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="job_description"
                                        render={({ field }) => (
                                            <FormItem className="p-3">
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Brief description of duties and responsibilities..."
                                                        className="min-h-[80px] border-0 rounded-none focus-visible:ring-0 shadow-none resize-none px-0 text-sm"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* ── Optional qualifications ────────────────── */}
                                <div className="border-x border-b border-gray-400 px-4 py-4 space-y-4">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Qualifications <span className="normal-case font-normal">(optional)</span>
                                    </p>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="education_requirement"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs">Educational Qualification</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g. College Graduate" className="h-8 text-sm" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="experience_requirement"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs">Work Experience Required</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g. At least 1 year in F&B" className="h-8 text-sm" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="salary_range"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs">Salary Range</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g. ₱18,000 – ₱22,000" className="h-8 text-sm" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="skills_required"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs">Skills / Competencies</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g. Customer service, POS" className="h-8 text-sm" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="remarks"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs">Remarks <span className="text-muted-foreground">(optional)</span></FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Any additional notes for HR..."
                                                        className="min-h-[60px] text-sm"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                            </CardContent>

                            <CardFooter className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
                                <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-green-600 hover:bg-green-700">
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
