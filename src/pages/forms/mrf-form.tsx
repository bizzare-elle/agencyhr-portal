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

const mrfSchema = z.object({
    position_title: z.string().min(1, "Position title is required"),
    branch_id: z.string().min(1, "Branch is required"),
    headcount: z.string().min(1, "Headcount is required"),
    request_type: z.string().min(1, "Request type is required"),
    previous_employee_name: z.string().optional(),
    reason_for_vacancy: z.string().optional(),
    target_start_date: z.string().min(1, "Target start date is required"),
    education_requirement: z.string().optional(),
    experience_requirement: z.string().optional(),
    skills_required: z.string().optional(),
    salary_range: z.string().optional(),
    remarks: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.request_type === "Replacement") {
        if (!data.previous_employee_name?.trim()) {
            ctx.addIssue({
                path: ["previous_employee_name"],
                code: z.ZodIssueCode.custom,
                message: "Previous employee name is required for replacements",
            });
        }
        if (!data.reason_for_vacancy?.trim()) {
            ctx.addIssue({
                path: ["reason_for_vacancy"],
                code: z.ZodIssueCode.custom,
                message: "Reason for vacancy is required for replacements",
            });
        }
    }
});

type MrfValues = z.infer<typeof mrfSchema>;

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

    const form = useForm<MrfValues>({
        resolver: zodResolver(mrfSchema),
        defaultValues: {
            position_title: "",
            branch_id: "",
            headcount: "1",
            request_type: "",
            previous_employee_name: "",
            reason_for_vacancy: "",
            target_start_date: "",
            education_requirement: "",
            experience_requirement: "",
            skills_required: "",
            salary_range: "",
            remarks: "",
        },
    });

    const requestType = useWatch({ control: form.control, name: "request_type" });

    const onSubmit = (data: MrfValues) => {
        // TODO: wire to API endpoint when ready
        console.log("MRF Submission:", { filed_by: employeeName, filer_id: employeeId, ...data });
        toast.success("Manpower request submitted successfully!");
        navigate(-1);
    };

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
                            <CardContent className="space-y-6">
                                {/* Position & Branch */}
                                <div>
                                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Position Details
                                    </p>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <FormField
                                                control={form.control}
                                                name="position_title"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Position Title</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="e.g. Team Leader" {...field} />
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
                                                        <FormLabel>No. of Heads Needed</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" min="1" {...field} />
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
                                                        <FormLabel>Branch</FormLabel>
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
                                            <FormField
                                                control={form.control}
                                                name="request_type"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Request Type</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select type..." />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="Replacement">Replacement (Existing Position)</SelectItem>
                                                                <SelectItem value="New Position">New Position</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Replacement fields — conditional */}
                                {requestType === "Replacement" && (
                                    <div className="rounded-lg border bg-muted/30 p-4">
                                        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                            Replacement Info
                                        </p>
                                        <div className="space-y-4">
                                            <FormField
                                                control={form.control}
                                                name="previous_employee_name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Previous Employee Name</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Name of the employee being replaced" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="reason_for_vacancy"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Reason for Vacancy</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select reason..." />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="Resigned">Resigned</SelectItem>
                                                                <SelectItem value="Terminated">Terminated</SelectItem>
                                                                <SelectItem value="Promoted">Promoted</SelectItem>
                                                                <SelectItem value="Transferred">Transferred</SelectItem>
                                                                <SelectItem value="Retired">Retired</SelectItem>
                                                                <SelectItem value="Others">Others</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Schedule */}
                                <div>
                                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Hiring Timeline
                                    </p>
                                    <FormField
                                        control={form.control}
                                        name="target_start_date"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Target Start Date</FormLabel>
                                                <FormControl>
                                                    <Input type="date" className="sm:max-w-xs" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Qualifications */}
                                <div>
                                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Qualifications <span className="normal-case font-normal text-muted-foreground">(optional)</span>
                                    </p>
                                    <div className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="education_requirement"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Educational Qualification</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select minimum education..." />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="High School Graduate">High School Graduate</SelectItem>
                                                            <SelectItem value="Vocational / TESDA">Vocational / TESDA</SelectItem>
                                                            <SelectItem value="College Level">College Level</SelectItem>
                                                            <SelectItem value="College Graduate">College Graduate</SelectItem>
                                                            <SelectItem value="Post Graduate">Post Graduate</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="experience_requirement"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Work Experience Required</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g. At least 1 year in F&B industry" {...field} />
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
                                                    <FormLabel>Skills / Competencies</FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="List required skills or competencies..."
                                                            className="min-h-[80px]"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="salary_range"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Salary Range</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g. ₱18,000 – ₱22,000" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                <FormField
                                    control={form.control}
                                    name="remarks"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Remarks <span className="text-muted-foreground">(optional)</span></FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Any additional notes for HR..."
                                                    className="min-h-[80px]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
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
