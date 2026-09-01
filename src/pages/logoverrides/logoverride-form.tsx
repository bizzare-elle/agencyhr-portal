import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { DateTimeField } from "@/components/date-time-picker";
import CustomSelect from "@/components/custom-select";
import { ImageUploader } from "@/components/image-dropzone";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
// import { Input } from "@/components/ui/input"; // offset date parked
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from "@/components/ui/card";
import api from "@/lib/axios";
import { useAuthStore } from "@/hooks/use-auth";
import { ParentComponent } from "@/components/parent-container";

// const getCutoffRange = () => {
//     const now = new Date();
//     const year = now.getFullYear();
//     const month = now.getMonth();

//     const lastDay = (y: number, m: number) => new Date(y, m + 1, 0).getDate();

//     const c1Start = new Date(year, month, 1);
//     const c1End = new Date(year, month, 15, 23, 59, 59);
//     const c1Allow = new Date(year, month, 16, 23, 59, 59);

//     const c2Start = new Date(year, month, 16);
//     const c2End = new Date(year, month, lastDay(year, month), 23, 59, 59);
//     const c2Allow = new Date(year, month + 1, 1, 23, 59, 59);

//     const pm = month - 1 < 0 ? 11 : month - 1;
//     const py = month - 1 < 0 ? year - 1 : year;

//     const p2Start = new Date(py, pm, 16);
//     const p2End = new Date(py, pm, lastDay(py, pm), 23, 59, 59);
//     const p2Allow = new Date(year, month, 1, 23, 59, 59);

//     if (now <= p2Allow) {
//         return {
//             startDate: p2Start,
//             endDate: c1End,
//         };
//     }

//     if (now <= c1Allow) {
//         return {
//             startDate: c1Start,
//             endDate: c1End,
//         };
//     }

//     if (now <= c2Allow) {
//         return {
//             startDate: c2Start,
//             endDate: c2End,
//         };
//     }

//     const next = new Date(year, month + 1, 1);
//     return {
//         startDate: new Date(next.getFullYear(), next.getMonth(), 1),
//         endDate: new Date(next.getFullYear(), next.getMonth(), 15, 23, 59, 59),
//     };
// };

function getPayrollDateRange(today = new Date()) {
    const year = today.getFullYear();
    const month = today.getMonth();
    const day = today.getDate();

    const eod = (y: number, m: number, d: number) =>
        new Date(y, m, d, 23, 59, 59, 999);

    const lastDayOfMonth = (y: number, m: number) =>
        new Date(y, m + 1, 0).getDate();

    const lastDay = lastDayOfMonth(year, month);

    const ranges: { minDate: Date; maxDate: Date }[] = [];

    // --- CASE 1: May 1–10 (grace for previous cutoff)
    if (day <= 10) {
        // Previous cutoff: Apr 16–30
        const prev = new Date(year, month - 1, 1);
        const py = prev.getFullYear();
        const pm = prev.getMonth();
        const prevLastDay = lastDayOfMonth(py, pm);

        ranges.push({
            minDate: new Date(py, pm, 16),
            maxDate: eod(py, pm, prevLastDay),
        });

        // Current first cutoff: May 1–15
        ranges.push({
            minDate: new Date(year, month, 1),
            maxDate: eod(year, month, 15),
        });

        return ranges;
    }

    // --- CASE 2: May 11–25
    if (day <= 25) {
        // First cutoff
        ranges.push({
            minDate: new Date(year, month, 1),
            maxDate: eod(year, month, 15),
        });

        // Second cutoff
        ranges.push({
            minDate: new Date(year, month, 16),
            maxDate: eod(year, month, lastDay),
        });

        return ranges;
    }

    // --- CASE 3: May 26–end
    ranges.push({
        minDate: new Date(year, month, 16),
        maxDate: eod(year, month, lastDay),
    });

    return ranges;
}

const isDateAllowed = (date: Date) => {
    const ranges = getPayrollDateRange(new Date());

    return ranges.some(
        ({ minDate, maxDate }) =>
            date.getTime() >= minDate.getTime() &&
            date.getTime() <= maxDate.getTime(),
    );
};

/** Remark value that requires a free-text reason. Must match the SelectItem
 *  value below and the server-side check in api_v2/Logoverrides.php. */
const OFFSET_REMARK = "Offset";

// ── Offset date — parked ──────────────────────────────────────────────────
// The "Date Being Offset" field is disabled for now; only the free-text reason
// is collected for the Offset remark. Everything needed to switch it back on is
// commented out in place, here and at the marked spots below.
//
// /** Local-time YYYY-MM-DD. toISOString() would shift the date near midnight,
//  *  since PH is UTC+8 and that call converts to UTC first. */
// function toISODate(d: Date) {
//     const pad = (n: number) => String(n).padStart(2, "0");
//     return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
// }
//
// function todayISO() {
//     return toISODate(new Date());
// }
//
// /** Newest date an offset may reference. Today is excluded -- an offset can
//  *  only point at hours already fully rendered. */
// function maxOffsetISO() {
//     const d = new Date();
//     d.setDate(d.getDate() - 1);
//     return toISODate(d);
// }

const schema = z
    .object({
        branch_id: z.string().min(1, "Select a branch"),
        clockType: z.string().min(1, "Enter clock type"),
        dateTime: z
            .string()
            .min(1, "Enter date and time")
            .refine(
                (val) => {
                    if (!val) return false;

                    const selected = new Date(val);
                    if (isNaN(selected.getTime())) return false;

                    const ranges = getPayrollDateRange(new Date());

                    return ranges.some(
                        ({ minDate, maxDate }) =>
                            selected >= minDate && selected <= maxDate,
                    );
                },
                {
                    message:
                        "Selected time falls outside the allowed payroll date range.",
                },
            ),
        remarks: z.string().min(1, "Enter remarks"),
        // Only meaningful for the "Offset" remark; required in that case via the
        // superRefine below, ignored otherwise.
        reason: z.string().trim().optional(),
        // Offset date parked -- see the note by the date helpers above.
        // offset_date: z.string().trim().optional(),
        imageReference: z
            .any()
            .refine((file) => file instanceof File, {
                message: "Image is required",
            })
            .refine(
                (file) =>
                    file instanceof File &&
                    file.size <= 20 * 1024 * 1024 &&
                    ["image/jpeg", "image/png", "image/jpg"].includes(
                        file.type,
                    ),
                { message: "File must be JPEG/PNG and under 20MB" },
            ),
    })
    .superRefine((val, ctx) => {
        // "Offset" alone does not tell the approver what is being offset.
        if (val.remarks !== OFFSET_REMARK) return;

        if (!val.reason) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["reason"],
                message: "Enter what is being offset",
            });
        }

        // Offset date parked:
        // if (!val.offset_date) {
        //     ctx.addIssue({
        //         code: z.ZodIssueCode.custom,
        //         path: ["offset_date"],
        //         message: "Select the date being offset",
        //     });
        // } else if (val.offset_date >= todayISO()) {
        //     ctx.addIssue({
        //         code: z.ZodIssueCode.custom,
        //         path: ["offset_date"],
        //         message: "The offset date must be before today",
        //     });
        // }
    });

type FormValues = z.infer<typeof schema>;

export default function LogoverrideForm() {
    const navigate = useNavigate();
    const { setToken } = useAuthStore.getState();

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            remarks: "",
            branch_id: "",
            reason: "",
            // offset_date: "",
        },
    });

    // Drives the conditional Reason field below.
    const watchedRemarks = form.watch("remarks");

    const { data: me } = useQuery({
        queryKey: ["me"],
        queryFn: async () => {
            const res = await api.get("/api/v2/auth/me");
            return res.data.data;
        },
    });

    const employeeId = me?.hr_id;

    const logoverrideMutation = useMutation({
        mutationFn: async (formValues: FormValues) => {
            const formData = new FormData();
            formData.append("branch_id", formValues.branch_id);
            formData.append("clockType", formValues.clockType);
            formData.append("dateTime", formValues.dateTime);
            formData.append("remarks", formValues.remarks);
            // Sent only for Offset so a stale value cannot ride along after
            // the user switches remark types.
            if (formValues.remarks === OFFSET_REMARK) {
                formData.append("reason", formValues.reason ?? "");
                // formData.append("offset_date", formValues.offset_date ?? "");
            }
            if (formValues.imageReference)
                formData.append("image", formValues.imageReference);

            const res = await api.post(
                `/api/v2/logoverrides/${employeeId}`,
                formData,
                { headers: { "Content-Type": "multipart/form-data" } },
            );

            return res.data;
        },
        onSuccess: () => {
            toast.success("Logoverride submitted successfully!");
            navigate(`/logoverrides/${employeeId}`);
        },
        onError: (error: any) => {
            toast.error(
                error?.response?.data?.message ||
                    "Something went wrong. Please try again.",
            );
        },
    });

    if (!employeeId) {
        return (
            <ParentComponent>
                <Card className="text-center font-bold text-red-500">
                    You don't have permission to access this page.
                </Card>
            </ParentComponent>
        );
    }

    const onSubmit = (data: FormValues) => logoverrideMutation.mutate(data);

    return (
        <div className="mx-auto w-full max-w-[800px] px-4 py-6 sm:px-6 md:px-10">
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">
                        Logoverride Form
                    </CardTitle>
                    <CardDescription>
                        Enter your details to file a logoverride request.
                    </CardDescription>
                </CardHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <CardContent className="space-y-6">
                            {/* Clock Type & DateTime */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <FormField
                                        control={form.control}
                                        name="clockType"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Select Clock Type
                                                </FormLabel>
                                                <Select
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                    value={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Select Clock Type" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Clock-In">
                                                            * Clock-in
                                                        </SelectItem>
                                                        <SelectItem value="Clock-Out">
                                                            Clock-out
                                                        </SelectItem>
                                                        <SelectItem value="Break-In">
                                                            Break-in
                                                        </SelectItem>
                                                        <SelectItem value="Break-Out">
                                                            Break-out
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div>
                                    <DateTimeField
                                        name="dateTime"
                                        label="Date and Time"
                                        control={form.control}
                                        isDateAllowed={(date: any) => {
                                            if (!date) return false;

                                            const d =
                                                date instanceof Date
                                                    ? date
                                                    : typeof date.toDate ===
                                                        "function"
                                                      ? date.toDate()
                                                      : new Date(date);

                                            if (isNaN(d.getTime()))
                                                return false;

                                            const ranges = getPayrollDateRange(
                                                new Date(),
                                            );

                                            return ranges.some(
                                                ({ minDate, maxDate }) =>
                                                    d.getTime() >=
                                                        minDate.getTime() &&
                                                    d.getTime() <=
                                                        maxDate.getTime(),
                                            );
                                        }}
                                    />
                                </div>
                            </div>

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
                            <div>
                                <Controller
                                    name="remarks"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <FormItem className="space-y-2">
                                            <FormLabel>Remarks</FormLabel>
                                            <FormControl>
                                                <Select
                                                    onValueChange={(val) => {
                                                        field.onChange(val);
                                                        // Drop any reason typed
                                                        // for a previous Offset
                                                        // selection.
                                                        if (
                                                            val !==
                                                            OFFSET_REMARK
                                                        ) {
                                                            form.setValue(
                                                                "reason",
                                                                "",
                                                            );
                                                            form.clearErrors(
                                                                "reason",
                                                            );
                                                        }
                                                    }}
                                                    value={field.value}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select remark" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="System Maintenance">
                                                            System Maintenance
                                                        </SelectItem>
                                                        <SelectItem value="Offset">
                                                            Offset
                                                        </SelectItem>
                                                        <SelectItem value="No Internet Connection">
                                                            No Internet
                                                            Connection
                                                        </SelectItem>
                                                        <SelectItem value="Employee is not yet added in the System">
                                                            Employee is not yet
                                                            added in the System
                                                        </SelectItem>
                                                        <SelectItem value="Work Remotely (For Corporate Office Only)">
                                                            Work Remotely (For
                                                            Corporate Office
                                                            Only)
                                                        </SelectItem>
                                                        <SelectItem value="Forgot Clock-In or Clock-Out">
                                                            Forgot Clock-In or
                                                            Clock-Out
                                                        </SelectItem>
                                                        <SelectItem value="In Training">
                                                            In Training
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                            <FormMessage>
                                                {fieldState?.error?.message}
                                            </FormMessage>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Reason — Offset only. The dropdown says an
                                offset was filed; this says what it offsets,
                                which is what the approver actually needs. */}
                            {/* Offset date — parked. Restore together with the
                                commented schema/helper blocks above.

                            {watchedRemarks === OFFSET_REMARK && (
                                <FormField
                                    control={form.control}
                                    name="offset_date"
                                    render={({ field, fieldState }) => (
                                        <FormItem className="space-y-2">
                                            <FormLabel>
                                                Date Being Offset
                                                <span
                                                    aria-hidden="true"
                                                    className="text-destructive ml-0.5"
                                                >
                                                    *
                                                </span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="date"
                                                    max={maxOffsetISO()}
                                                    {...field}
                                                    value={field.value ?? ""}
                                                />
                                            </FormControl>
                                            <p className="text-muted-foreground text-xs">
                                                The date the hours were
                                                originally rendered. Must be
                                                before today.
                                            </p>
                                            <FormMessage>
                                                {fieldState?.error?.message}
                                            </FormMessage>
                                        </FormItem>
                                    )}
                                />
                            )}

                            */}

                            {watchedRemarks === OFFSET_REMARK && (
                                <FormField
                                    control={form.control}
                                    name="reason"
                                    render={({ field, fieldState }) => (
                                        <FormItem className="space-y-2">
                                            <FormLabel>
                                                Reason for Offset
                                                <span
                                                    aria-hidden="true"
                                                    className="text-destructive ml-0.5"
                                                >
                                                    *
                                                </span>
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="e.g. Offsetting overtime rendered on Jan 12 (rest day coverage)"
                                                    className="min-h-[80px]"
                                                    {...field}
                                                    value={field.value ?? ""}
                                                />
                                            </FormControl>
                                            <p className="text-muted-foreground text-xs">
                                                State which date or hours this
                                                offsets so the approver can
                                                verify it.
                                            </p>
                                            <FormMessage>
                                                {fieldState?.error?.message}
                                            </FormMessage>
                                        </FormItem>
                                    )}
                                />
                            )}

                            <FormField
                                control={form.control}
                                name="imageReference"
                                render={({ field, fieldState }) => (
                                    <ImageUploader
                                        field={field}
                                        fieldState={fieldState}
                                        label="Upload an Image"
                                    />
                                )}
                            />
                        </CardContent>

                        <CardFooter className="flex flex-col-reverse gap-3 pt-6 sm:flex-row sm:justify-end sm:gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full sm:w-auto"
                                onClick={() => navigate(-1)}
                            >
                                Back
                            </Button>

                            <Button
                                type="submit"
                                disabled={logoverrideMutation.isPending}
                                className="flex w-full items-center justify-center gap-2 bg-yellow-500 text-white hover:bg-yellow-600 sm:w-auto"
                            >
                                {logoverrideMutation.isPending ? (
                                    <>
                                        <Spinner className="h-4 w-4" />
                                        <span>Submitting...</span>
                                    </>
                                ) : (
                                    "Submit"
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                </Form>
            </Card>
        </div>
    );
}
