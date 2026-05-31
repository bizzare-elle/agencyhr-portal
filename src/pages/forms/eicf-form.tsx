import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    GitBranch,
    UserCog,
    LogOut,
    ChevronLeft,
    User,
    TrendingUp,
    Building2,
    DollarSign,
    FileText,
    ArrowRight,
    Loader2,
} from "lucide-react";
import api from "@/lib/axios";
import { Employee, ApiResponse } from "@/index";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import CustomSelect from "@/components/custom-select";
import CustomSearch from "@/components/custom-search-field";

// ── Schemas (only "To" fields are form-validated; "From" comes from profile) ──

const promotionSchema = z.object({
    new_position: z.string().min(1, "New position is required"),
    new_pay_rate: z.string().optional(),
    effective_date: z.string().min(1, "Effective date is required"),
    justification: z.string().min(1, "Justification is required"),
    remarks: z.string().optional(),
});

const positionChangeSchema = z.object({
    new_position: z.string().min(1, "New position is required"),
    effective_date: z.string().min(1, "Effective date is required"),
    reason: z.string().min(1, "Reason is required"),
    remarks: z.string().optional(),
});

const deptTransferSchema = z.object({
    new_department: z.string().min(1, "New department is required"),
    effective_date: z.string().min(1, "Effective date is required"),
    reason: z.string().min(1, "Reason is required"),
    remarks: z.string().optional(),
});

const branchTransferSchema = z.object({
    new_branch: z.string().min(1, "New branch is required"),
    effective_date: z.string().min(1, "Effective date is required"),
    reason: z.string().min(1, "Reason is required"),
    remarks: z.string().optional(),
});

const payChangeSchema = z.object({
    new_pay_rate: z.string().min(1, "New pay rate is required"),
    effective_date: z.string().min(1, "Effective date is required"),
    justification: z.string().min(1, "Justification is required"),
    remarks: z.string().optional(),
});

const personalInfoSchema = z.object({
    field_to_change: z.string().min(1, "Specify what to change"),
    new_value: z.string().min(1, "New value is required"),
    effective_date: z.string().min(1, "Effective date is required"),
    remarks: z.string().optional(),
});

const resignationSchema = z.object({
    resignation_date: z.string().min(1, "Resignation date is required"),
    last_working_day: z.string().min(1, "Last working day is required"),
    reason_category: z.string().min(1, "Reason is required"),
    details: z.string().min(1, "Details are required"),
    remarks: z.string().optional(),
});

// ── Config ────────────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
    promotion: {
        label: "Promotion",
        icon: TrendingUp,
        color: "text-yellow-400",
        bg: "bg-yellow-500/10",
        border: "border-yellow-500/30",
        description: "Propose a promotion with updated position or pay.",
        submitLabel: "Submit Request",
        submitClass: "bg-yellow-500 hover:bg-yellow-600 text-white",
    },
    position_change: {
        label: "Change in Position Title / Lateral Transfer",
        icon: UserCog,
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        border: "border-blue-500/30",
        description: "Request a change in position title or a lateral transfer.",
        submitLabel: "Submit Request",
        submitClass: "bg-blue-500 hover:bg-blue-600 text-white",
    },
    department_transfer: {
        label: "Transfer to Other Department",
        icon: Building2,
        color: "text-purple-400",
        bg: "bg-purple-500/10",
        border: "border-purple-500/30",
        description: "Request a transfer to a different department or division.",
        submitLabel: "Submit Request",
        submitClass: "bg-purple-600 hover:bg-purple-700 text-white",
    },
    branch_transfer: {
        label: "Transfer to Other Brand / Branch",
        icon: GitBranch,
        color: "text-cyan-400",
        bg: "bg-cyan-500/10",
        border: "border-cyan-500/30",
        description: "Request a transfer to a different brand or branch location.",
        submitLabel: "Submit Request",
        submitClass: "bg-cyan-600 hover:bg-cyan-700 text-white",
    },
    pay_change: {
        label: "Pay Change",
        icon: DollarSign,
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/30",
        description: "Request a change in compensation or pay rate.",
        submitLabel: "Submit Request",
        submitClass: "bg-emerald-600 hover:bg-emerald-700 text-white",
    },
    personal_info: {
        label: "Change in Personal Information",
        icon: FileText,
        color: "text-orange-400",
        bg: "bg-orange-500/10",
        border: "border-orange-500/30",
        description: "Request a correction or update to personal information.",
        submitLabel: "Submit Request",
        submitClass: "bg-orange-500 hover:bg-orange-600 text-white",
    },
    resignation: {
        label: "Resignation",
        icon: LogOut,
        color: "text-red-400",
        bg: "bg-red-500/10",
        border: "border-red-500/30",
        description: "File a resignation notice on behalf of an employee.",
        submitLabel: "Submit Resignation",
        submitClass: "bg-red-500 hover:bg-red-600 text-white",
    },
} as const;

type EicfType = keyof typeof TYPE_CONFIG;

// ── Shared sub-form props ─────────────────────────────────────────────────────

interface SubFormProps {
    employee: Employee;
    filerName: string;
    filerHrId: string;
    onCancel: () => void;
    submitLabel: string;
    submitClass: string;
}

// ── UI helpers ────────────────────────────────────────────────────────────────

function ReadOnlyField({ label, value }: { label: string; value?: string | null }) {
    return (
        <div className="space-y-1.5">
            <p className="text-sm font-medium leading-none">{label}</p>
            <div className="flex min-h-9 items-center rounded-md border bg-muted/50 px-3 py-2 text-sm">
                {value?.trim() ? value : <span className="text-muted-foreground">—</span>}
            </div>
        </div>
    );
}

function FromToSection({
    fromContent,
    toContent,
}: {
    fromContent: React.ReactNode;
    toContent: React.ReactNode;
}) {
    return (
        <div className="rounded-lg border bg-muted/30 p-4">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-[1fr_28px_1fr]">
                <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        From (Current)
                    </p>
                    <div className="space-y-3">{fromContent}</div>
                </div>
                <div className="hidden items-start justify-center pt-5 sm:flex">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        To (New)
                    </p>
                    <div className="space-y-3">{toContent}</div>
                </div>
            </div>
        </div>
    );
}

// Maps a personal info field name to the corresponding Employee property
function getEmployeeFieldValue(employee: Employee, field: string): string {
    const map: Record<string, string | undefined | null> = {
        "Name": employee.name,
        "Date of Birth": employee.birth_date,
        "Civil Status": employee.civil_status_display,
        "Contact Number": employee.contact_number,
        "Address": employee.address,
        "Emergency Contact": employee.emergency_contact_name,
        "SSS Number": employee.government_sss_nos,
        "PhilHealth Number": employee.government_philhealth_nos,
        "Pag-IBIG Number": employee.government_pagibig_nos,
        "TIN": employee.government_tin_nos,
    };
    return map[field] || "";
}

// ── Sub-forms ─────────────────────────────────────────────────────────────────

function PromotionForm({ employee, filerName, filerHrId, onCancel, submitLabel, submitClass }: SubFormProps) {
    const form = useForm<z.infer<typeof promotionSchema>>({
        resolver: zodResolver(promotionSchema),
        defaultValues: { new_position: "", new_pay_rate: "", effective_date: "", justification: "", remarks: "" },
    });

    const mutation = useMutation({
        mutationFn: async (data: z.infer<typeof promotionSchema>) => {
            const rate = data.new_pay_rate ? parseFloat(data.new_pay_rate) : undefined;
            await api.post(`/api/v2/employees/${employee.id}/promotion-log`, {
                position_id:    parseInt(data.new_position),
                salary_rate:    rate && !isNaN(rate) && rate > 0 ? rate : undefined,
                effective_date: data.effective_date,
                remarks:        [data.justification, data.remarks].filter(Boolean).join("\n"),
            });
        },
        onSuccess: () => {
            toast.success("Promotion request submitted successfully!");
            onCancel();
        },
        onError: () => toast.error("Failed to submit promotion request."),
    });

    const onSubmit = (data: z.infer<typeof promotionSchema>) => mutation.mutate(data);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-5">
                    <FromToSection
                        fromContent={
                            <>
                                <ReadOnlyField label="Position Title" value={employee.position_name} />
                                <ReadOnlyField label="Monthly Rate" value={employee.salary_rate ? `₱${Number(employee.salary_rate).toLocaleString()}` : undefined} />
                                <ReadOnlyField label="Daily Rate" value={employee.daily_rate ? `₱${Number(employee.daily_rate).toLocaleString()}` : undefined} />
                            </>
                        }
                        toContent={
                            <>
                                <FormField control={form.control} name="new_position" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Position Title</FormLabel>
                                        <FormControl>
                                            <CustomSelect
                                                apiUrl="api/v2/get_position"
                                                placeholder="Select new position..."
                                                value={field.value}
                                                onChange={(val) => field.onChange(val ?? "")}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="new_pay_rate" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Monthly Rate <span className="text-muted-foreground">(optional)</span></FormLabel>
                                        <FormControl><Input type="number" min="0" step="0.01" placeholder="e.g. 30000" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </>
                        }
                    />
                    <FormField control={form.control} name="effective_date" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Effective Date</FormLabel>
                            <FormControl><Input type="date" className="sm:max-w-xs" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="justification" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Justification</FormLabel>
                            <FormControl><Textarea placeholder="Provide justification for this promotion..." className="min-h-[90px]" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="remarks" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Remarks <span className="text-muted-foreground">(optional)</span></FormLabel>
                            <FormControl><Textarea className="min-h-[70px]" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </CardContent>
                <CardFooter className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={mutation.isPending}>Cancel</Button>
                    <Button type="submit" className={submitClass} disabled={mutation.isPending}>
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {submitLabel}
                    </Button>
                </CardFooter>
            </form>
        </Form>
    );
}

function PositionChangeForm({ employee, filerName, filerHrId, onCancel, submitLabel, submitClass }: SubFormProps) {
    const form = useForm<z.infer<typeof positionChangeSchema>>({
        resolver: zodResolver(positionChangeSchema),
        defaultValues: { new_position: "", effective_date: "", reason: "", remarks: "" },
    });

    const mutation = useMutation({
        mutationFn: async (data: z.infer<typeof positionChangeSchema>) => {
            await api.post(`/api/v2/employees/${employee.id}/position-log`, {
                position_id: parseInt(data.new_position),
                effective_date: data.effective_date,
                remarks: [data.reason, data.remarks].filter(Boolean).join("\n"),
            });
        },
        onSuccess: () => {
            toast.success("Position change request submitted successfully!");
            onCancel();
        },
        onError: () => toast.error("Failed to submit position change request."),
    });

    const onSubmit = (data: z.infer<typeof positionChangeSchema>) => mutation.mutate(data);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-5">
                    <FromToSection
                        fromContent={<ReadOnlyField label="Position Title" value={employee.position_name} />}
                        toContent={
                            <FormField control={form.control} name="new_position" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Position Title</FormLabel>
                                    <FormControl>
                                        <CustomSelect
                                            apiUrl="api/v2/get_position"
                                            placeholder="Select new position..."
                                            value={field.value}
                                            onChange={(val) => field.onChange(val ?? "")}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        }
                    />
                    <FormField control={form.control} name="effective_date" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Effective Date</FormLabel>
                            <FormControl><Input type="date" className="sm:max-w-xs" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="reason" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Reason</FormLabel>
                            <FormControl><Textarea placeholder="Reason for this position change or lateral transfer..." className="min-h-[90px]" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="remarks" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Remarks <span className="text-muted-foreground">(optional)</span></FormLabel>
                            <FormControl><Textarea className="min-h-[70px]" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </CardContent>
                <CardFooter className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={mutation.isPending}>Cancel</Button>
                    <Button type="submit" className={submitClass} disabled={mutation.isPending}>
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {submitLabel}
                    </Button>
                </CardFooter>
            </form>
        </Form>
    );
}

function DeptTransferForm({ employee, filerName, filerHrId, onCancel, submitLabel, submitClass }: SubFormProps) {
    const form = useForm<z.infer<typeof deptTransferSchema>>({
        resolver: zodResolver(deptTransferSchema),
        defaultValues: { new_department: "", effective_date: "", reason: "", remarks: "" },
    });

    const mutation = useMutation({
        mutationFn: async (data: z.infer<typeof deptTransferSchema>) => {
            await api.post(`/api/v2/employees/${employee.id}/dept-log`, {
                department_id:  parseInt(data.new_department),
                effective_date: data.effective_date,
                remarks:        [data.reason, data.remarks].filter(Boolean).join("\n"),
            });
        },
        onSuccess: () => {
            toast.success("Department transfer request submitted successfully!");
            onCancel();
        },
        onError: () => toast.error("Failed to submit department transfer request."),
    });

    const onSubmit = (data: z.infer<typeof deptTransferSchema>) => mutation.mutate(data);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-5">
                    <FromToSection
                        fromContent={<ReadOnlyField label="Department / Division" value={employee.department_name || employee.department} />}
                        toContent={
                            <FormField control={form.control} name="new_department" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Department / Division</FormLabel>
                                    <FormControl>
                                        <CustomSelect
                                            apiUrl="api/v2/get_department"
                                            placeholder="Select new department..."
                                            value={field.value}
                                            onChange={(val) => field.onChange(val ?? "")}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        }
                    />
                    <FormField control={form.control} name="effective_date" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Effective Date</FormLabel>
                            <FormControl><Input type="date" className="sm:max-w-xs" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="reason" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Reason</FormLabel>
                            <FormControl><Textarea placeholder="Reason for department transfer..." className="min-h-[90px]" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="remarks" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Remarks <span className="text-muted-foreground">(optional)</span></FormLabel>
                            <FormControl><Textarea className="min-h-[70px]" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </CardContent>
                <CardFooter className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={mutation.isPending}>Cancel</Button>
                    <Button type="submit" className={submitClass} disabled={mutation.isPending}>
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {submitLabel}
                    </Button>
                </CardFooter>
            </form>
        </Form>
    );
}

function BranchTransferForm({ employee, filerName, filerHrId, onCancel, submitLabel, submitClass }: SubFormProps) {
    const form = useForm<z.infer<typeof branchTransferSchema>>({
        resolver: zodResolver(branchTransferSchema),
        defaultValues: { new_branch: "", effective_date: "", reason: "", remarks: "" },
    });

    const mutation = useMutation({
        mutationFn: async (data: z.infer<typeof branchTransferSchema>) => {
            await api.post(`/api/v2/employees/${employee.id}/branch-log`, {
                branch_id: parseInt(data.new_branch),
                transfer_date: data.effective_date,
                remarks: [data.reason, data.remarks].filter(Boolean).join("\n"),
            });
        },
        onSuccess: () => {
            toast.success("Branch transfer request submitted successfully!");
            onCancel();
        },
        onError: () => toast.error("Failed to submit branch transfer request."),
    });

    const onSubmit = (data: z.infer<typeof branchTransferSchema>) => mutation.mutate(data);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-5">
                    <FromToSection
                        fromContent={
                            <>
                                <ReadOnlyField label="Brand" value={employee.agency_name} />
                                <ReadOnlyField label="Branch" value={employee.branch_name} />
                            </>
                        }
                        toContent={
                            <FormField control={form.control} name="new_branch" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Branch</FormLabel>
                                    <FormControl>
                                        <CustomSelect
                                            apiUrl="api/v2/get_branch"
                                            placeholder="Select new branch..."
                                            value={field.value}
                                            onChange={field.onChange}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        }
                    />
                    <FormField control={form.control} name="effective_date" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Effective Date</FormLabel>
                            <FormControl><Input type="date" className="sm:max-w-xs" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="reason" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Reason for Transfer</FormLabel>
                            <FormControl><Textarea placeholder="Reason for branch transfer..." className="min-h-[90px]" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="remarks" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Remarks <span className="text-muted-foreground">(optional)</span></FormLabel>
                            <FormControl><Textarea className="min-h-[70px]" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </CardContent>
                <CardFooter className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={mutation.isPending}>Cancel</Button>
                    <Button type="submit" className={submitClass} disabled={mutation.isPending}>
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {submitLabel}
                    </Button>
                </CardFooter>
            </form>
        </Form>
    );
}

function PayChangeForm({ employee, filerName, filerHrId, onCancel, submitLabel, submitClass }: SubFormProps) {
    const form = useForm<z.infer<typeof payChangeSchema>>({
        resolver: zodResolver(payChangeSchema),
        defaultValues: { new_pay_rate: "", effective_date: "", justification: "", remarks: "" },
    });

    const mutation = useMutation({
        mutationFn: async (data: z.infer<typeof payChangeSchema>) => {
            const rate = parseFloat(data.new_pay_rate);
            if (isNaN(rate) || rate <= 0) throw new Error("Invalid pay rate");
            await api.post(`/api/v2/employees/${employee.id}/salary-log`, {
                salary_rate: rate,
                effective_date: data.effective_date,
                remarks: [data.justification, data.remarks].filter(Boolean).join("\n"),
            });
        },
        onSuccess: () => {
            toast.success("Pay change request submitted successfully!");
            onCancel();
        },
        onError: (err: Error) => toast.error(err.message === "Invalid pay rate" ? err.message : "Failed to submit pay change request."),
    });

    const onSubmit = (data: z.infer<typeof payChangeSchema>) => mutation.mutate(data);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-5">
                    <FromToSection
                        fromContent={
                            <>
                                <ReadOnlyField
                                    label="Monthly Rate"
                                    value={employee.salary_rate ? `₱${Number(employee.salary_rate).toLocaleString()}` : undefined}
                                />
                                <ReadOnlyField
                                    label="Daily Rate"
                                    value={employee.daily_rate ? `₱${Number(employee.daily_rate).toLocaleString()}` : undefined}
                                />
                                <ReadOnlyField
                                    label="Hourly Rate"
                                    value={employee.hourly_rate ? `₱${Number(employee.hourly_rate).toLocaleString()}` : undefined}
                                />
                            </>
                        }
                        toContent={
                            <FormField control={form.control} name="new_pay_rate" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New Monthly Rate</FormLabel>
                                    <FormControl><Input type="number" min="0" step="0.01" placeholder="e.g. 30000" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        }
                    />
                    <FormField control={form.control} name="effective_date" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Effective Date</FormLabel>
                            <FormControl><Input type="date" className="sm:max-w-xs" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="justification" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Justification</FormLabel>
                            <FormControl><Textarea placeholder="Justification for this pay change..." className="min-h-[90px]" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="remarks" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Remarks <span className="text-muted-foreground">(optional)</span></FormLabel>
                            <FormControl><Textarea className="min-h-[70px]" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </CardContent>
                <CardFooter className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={mutation.isPending}>Cancel</Button>
                    <Button type="submit" className={submitClass} disabled={mutation.isPending}>
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {submitLabel}
                    </Button>
                </CardFooter>
            </form>
        </Form>
    );
}

function PersonalInfoForm({ employee, filerName, filerHrId, onCancel, submitLabel, submitClass }: SubFormProps) {
    const form = useForm<z.infer<typeof personalInfoSchema>>({
        resolver: zodResolver(personalInfoSchema),
        defaultValues: { field_to_change: "", new_value: "", effective_date: "", remarks: "" },
    });

    const selectedField = useWatch({ control: form.control, name: "field_to_change" });
    const currentValue = selectedField ? getEmployeeFieldValue(employee, selectedField) : "";

    const onSubmit = (data: z.infer<typeof personalInfoSchema>) => {
        console.log("EICF Personal Info:", {
            filed_by: filerName, filer_hr_id: filerHrId,
            employee_name: employee.name, employee_id: employee.id,
            current_value: currentValue,
            ...data,
        });
        toast.success("Personal information change request submitted successfully!");
        onCancel();
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-5">
                    <FormField control={form.control} name="field_to_change" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Field to Change</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger><SelectValue placeholder="Specify what to update..." /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Name">Name</SelectItem>
                                    <SelectItem value="Date of Birth">Date of Birth</SelectItem>
                                    <SelectItem value="Civil Status">Civil Status</SelectItem>
                                    <SelectItem value="Contact Number">Contact Number</SelectItem>
                                    <SelectItem value="Address">Address</SelectItem>
                                    <SelectItem value="Emergency Contact">Emergency Contact</SelectItem>
                                    <SelectItem value="SSS Number">SSS Number</SelectItem>
                                    <SelectItem value="PhilHealth Number">PhilHealth Number</SelectItem>
                                    <SelectItem value="Pag-IBIG Number">Pag-IBIG Number</SelectItem>
                                    <SelectItem value="TIN">TIN</SelectItem>
                                    <SelectItem value="Others">Others</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />

                    {selectedField && (
                        <FromToSection
                            fromContent={
                                <ReadOnlyField
                                    label={selectedField}
                                    value={currentValue || undefined}
                                />
                            }
                            toContent={
                                <FormField control={form.control} name="new_value" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{selectedField}</FormLabel>
                                        <FormControl><Input placeholder="Corrected / updated value..." {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            }
                        />
                    )}

                    <FormField control={form.control} name="effective_date" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Effective Date</FormLabel>
                            <FormControl><Input type="date" className="sm:max-w-xs" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="remarks" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Remarks <span className="text-muted-foreground">(optional)</span></FormLabel>
                            <FormControl><Textarea className="min-h-[70px]" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </CardContent>
                <CardFooter className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
                    <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button type="submit" className={submitClass}>{submitLabel}</Button>
                </CardFooter>
            </form>
        </Form>
    );
}

function ResignationForm({ employee, filerName, filerHrId, onCancel, submitLabel, submitClass }: SubFormProps) {
    const form = useForm<z.infer<typeof resignationSchema>>({
        resolver: zodResolver(resignationSchema),
        defaultValues: { resignation_date: "", last_working_day: "", reason_category: "", details: "", remarks: "" },
    });

    const mutation = useMutation({
        mutationFn: async (data: z.infer<typeof resignationSchema>) => {
            await api.post(`/api/v2/employees/${employee.id}/resignation-log`, {
                resignation_date: data.resignation_date,
                last_working_day: data.last_working_day,
                reason_category:  data.reason_category,
                details:          data.details,
                remarks:          data.remarks,
            });
        },
        onSuccess: () => {
            toast.success("Resignation notice submitted successfully!");
            onCancel();
        },
        onError: () => toast.error("Failed to submit resignation notice."),
    });

    const onSubmit = (data: z.infer<typeof resignationSchema>) => mutation.mutate(data);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-5">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField control={form.control} name="resignation_date" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Date of Resignation Notice</FormLabel>
                                <FormControl><Input type="date" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="last_working_day" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Last Working Day</FormLabel>
                                <FormControl><Input type="date" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                    <FormField control={form.control} name="reason_category" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Reason for Resignation</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger><SelectValue placeholder="Select reason..." /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Personal Reasons">Personal Reasons</SelectItem>
                                    <SelectItem value="Career Growth">Career Growth</SelectItem>
                                    <SelectItem value="Health Reasons">Health Reasons</SelectItem>
                                    <SelectItem value="Relocation">Relocation</SelectItem>
                                    <SelectItem value="Better Opportunity">Better Opportunity</SelectItem>
                                    <SelectItem value="Family Concerns">Family Concerns</SelectItem>
                                    <SelectItem value="Others">Others</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="details" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Details</FormLabel>
                            <FormControl><Textarea placeholder="Provide additional details about the resignation..." className="min-h-[100px]" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="remarks" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Remarks <span className="text-muted-foreground">(optional)</span></FormLabel>
                            <FormControl><Textarea className="min-h-[70px]" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </CardContent>
                <CardFooter className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={mutation.isPending}>Cancel</Button>
                    <Button type="submit" className={submitClass} disabled={mutation.isPending}>
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {submitLabel}
                    </Button>
                </CardFooter>
            </form>
        </Form>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

interface EmployeeProfileResponse {
    info: Employee;
    schedules: unknown[];
    logoverrides: unknown[];
    overtimes: unknown[];
}

export default function EicfForm() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const type = (searchParams.get("type") ?? "promotion") as EicfType;
    const config = TYPE_CONFIG[type] ?? TYPE_CONFIG.promotion;
    const Icon = config.icon;

    const { data: me } = useQuery({
        queryKey: ["me"],
        queryFn: async () => {
            const res = await api.get("/api/v2/auth/me");
            return res.data.data;
        },
    });

    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | undefined>();

    const { data: employeeProfile, isLoading: profileLoading } = useQuery<Employee | null>({
        queryKey: ["eicf-employee-profile", selectedEmployeeId],
        queryFn: async () => {
            const res = await api.get<ApiResponse<EmployeeProfileResponse>>(
                `/api/v2/employees/${selectedEmployeeId}`,
            );
            return res.data.data?.info ?? null;
        },
        enabled: !!selectedEmployeeId,
        staleTime: 5 * 60 * 1000,
    });

    const filerName = me?.name ?? "";
    const filerHrId = String(me?.hr_id ?? me?.id ?? "");

    const subFormProps: SubFormProps = {
        employee: employeeProfile ?? ({} as Employee),
        filerName,
        filerHrId,
        onCancel: () => navigate(-1),
        submitLabel: config.submitLabel,
        submitClass: config.submitClass,
    };

    const infoRows = employeeProfile
        ? [
              { label: "Employee No.", value: employeeProfile.id_number },
              { label: "Brand", value: employeeProfile.agency_name },
              { label: "Branch", value: employeeProfile.branch_name },
              { label: "Position", value: employeeProfile.position_name },
              { label: "Division / Dept.", value: employeeProfile.department_name || employeeProfile.department },
              { label: "Employment Status", value: employeeProfile.employment_status },
              { label: "Monthly Rate", value: employeeProfile.salary_rate ? `₱${Number(employeeProfile.salary_rate).toLocaleString()}` : undefined },
              { label: "Daily Rate", value: employeeProfile.daily_rate ? `₱${Number(employeeProfile.daily_rate).toLocaleString()}` : undefined },
          ].filter((r) => r.value)
        : [];

    return (
        <ParentComponent>
            <div className="mx-auto w-full max-w-2xl">
                <button
                    onClick={() => navigate(-1)}
                    className="mb-5 flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Back to Forms
                </button>

                <Card className="w-full">
                    <CardHeader>
                        {/* Title */}
                        <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${config.border} ${config.bg}`}>
                                <Icon className={`h-5 w-5 ${config.color}`} />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-semibold">
                                    EICF — {config.label}
                                </CardTitle>
                                <CardDescription>{config.description}</CardDescription>
                            </div>
                        </div>

                        {/* Filed By */}
                        {me && (
                            <div className="mt-4 rounded-lg border bg-muted/50 px-4 py-3">
                                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Filed By
                                </p>
                                <div className="flex items-center gap-2">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">{filerName}</p>
                                        <p className="text-xs text-muted-foreground">ID: {filerHrId}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Filing For */}
                        <div className="mt-3 rounded-lg border bg-muted/50 px-4 py-4">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Filing For
                            </p>
                            <CustomSearch
                                apiUrl="api/v2/get_employees"
                                placeholder="Search employee name or ID..."
                                value={selectedEmployeeId}
                                onChange={(id) => {
                                    setSelectedEmployeeId(id);
                                }}
                            />

                            {profileLoading && (
                                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Loading employee details...
                                </div>
                            )}

                            {employeeProfile && !profileLoading && (
                                <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs sm:grid-cols-3">
                                    {infoRows.map((row) => (
                                        <div key={row.label}>
                                            <span className="text-muted-foreground">{row.label}:</span>{" "}
                                            <span className="font-medium">{row.value}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!selectedEmployeeId && (
                                <p className="mt-2 text-xs text-muted-foreground">
                                    Select the employee this form is being filed for.
                                </p>
                            )}
                        </div>
                    </CardHeader>

                    {/* Block until employee loaded */}
                    {!selectedEmployeeId ? (
                        <CardContent>
                            <div className="flex items-center justify-center rounded-lg border border-dashed py-10 text-sm text-muted-foreground">
                                Select an employee above to continue.
                            </div>
                        </CardContent>
                    ) : profileLoading ? (
                        <CardContent>
                            <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed py-10 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading employee profile...
                            </div>
                        </CardContent>
                    ) : (
                        <>
                            {type === "promotion" && <PromotionForm {...subFormProps} />}
                            {type === "position_change" && <PositionChangeForm {...subFormProps} />}
                            {type === "department_transfer" && <DeptTransferForm {...subFormProps} />}
                            {type === "branch_transfer" && <BranchTransferForm {...subFormProps} />}
                            {type === "pay_change" && <PayChangeForm {...subFormProps} />}
                            {type === "personal_info" && <PersonalInfoForm {...subFormProps} />}
                            {type === "resignation" && <ResignationForm {...subFormProps} />}
                        </>
                    )}
                </Card>
            </div>
        </ParentComponent>
    );
}
