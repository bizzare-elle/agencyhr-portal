import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronDownIcon } from "lucide-react";
import api from "@/lib/axios";
import { TextField } from "@/components/text-field";
import { ImageUploader } from "@/components/image-dropzone";
import { Label } from "@/components/ui/label";
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from "@/components/ui/card";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { useAuthStore } from "@/hooks/use-auth";
import { ParentComponent } from "@/components/parent-container";
import { Overtime } from "@/index";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const imageValidator = z
    .instanceof(File, { message: "Image is required" })
    .refine((file) => file.size <= 20 * 1024 * 1024, {
        message: "File must be less than 20MB",
    })
    .refine(
        (file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type),
        { message: "Only JPEG, PNG, or WebP files are allowed" },
    );

// Create: date restricted to last 2 days, image required
const createSchema = z.object({
    branch_id: z.string().min(1, { message: "Select a branch" }),
    date: z
        .date({
            error: () => ({ message: "Date is required" }),
        })
        .refine(
            (val) => {
                const selected = new Date(val);
                selected.setHours(0, 0, 0, 0);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const twoDaysAgo = new Date(today);
                twoDaysAgo.setDate(today.getDate() - 2);
                return selected >= twoDaysAgo && selected <= today;
            },
            { message: "You can only select a date within the last 2 days." },
        ),
    startTime: z
        .string()
        .regex(timeRegex, { message: "Start time is required (HH:mm)" }),
    endTime: z
        .string()
        .regex(timeRegex, { message: "End time is required (HH:mm)" }),
    totalOt: z.string().min(1, { message: "Overtime hours cannot be empty" }),
    remarks: z.string().min(1, { message: "Remarks are required" }),
    imageReference: imageValidator,
});

// Edit: date is pre-filled and read-only (no range restriction), image optional
const editSchema = z.object({
    branch_id: z.string().min(1, { message: "Select a branch" }),
    date: z.date({
        error: () => ({ message: "Date is required" }),
    }),
    startTime: z
        .string()
        .regex(timeRegex, { message: "Start time is required (HH:mm)" }),
    endTime: z
        .string()
        .regex(timeRegex, { message: "End time is required (HH:mm)" }),
    totalOt: z.string().min(1, { message: "Overtime hours cannot be empty" }),
    remarks: z.string().min(1, { message: "Remarks are required" }),
    imageReference: imageValidator.optional(),
});

type FormValues = {
    branch_id: string;
    date: Date;
    startTime: string;
    endTime: string;
    totalOt: string;
    remarks: string;
    imageReference?: File;
};

function calculateOtHours(start: string, end: string): string {
    if (!start || !end) return "";
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const startDate = new Date(0, 0, 0, sh, sm);
    const endDate = new Date(0, 0, 0, eh, em);
    let diff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    if (diff < 0) diff += 24;
    return diff.toFixed(2);
}

export default function OvertimeForm() {
    const navigate = useNavigate();
    const { overtimeId } = useParams<{ overtimeId?: string }>();
    const location = useLocation();

    // Edit mode when the route supplies an overtimeId param
    const isEdit = !!overtimeId;
    const existingOvertime: Overtime | undefined = location.state?.overtime;

    const [open, setOpen] = React.useState(false);

    // Parse existing date without timezone shift (YYYY-MM-DD strings)
    const existingDate = React.useMemo(() => {
        if (!existingOvertime?.date) return undefined;
        const parts = existingOvertime.date.split("-").map(Number);
        if (parts.length !== 3) return undefined;
        return new Date(parts[0], parts[1] - 1, parts[2]);
    }, [existingOvertime]);

    const form = useForm<FormValues>({
        resolver: zodResolver(isEdit ? editSchema : createSchema) as any,
        defaultValues: {
            remarks: existingOvertime?.remarks ?? "",
            branch_id: existingOvertime?.branch_id ?? "",
            date: existingDate,
            startTime: "",
            endTime: "",
            totalOt: "",
        },
    });

    const { data: me } = useQuery({
        queryKey: ["me"],
        queryFn: async () => {
            const res = await api.get(`/api/v2/auth/me`);
            return res.data.data;
        },
    });

    const { data: branches } = useQuery({
        queryKey: ["branches"],
        queryFn: async () => {
            const res = await api.get(`/api/v2/get_branch`);
            return res.data.data;
        },
    });

    const startTime = form.watch("startTime");
    const endTime = form.watch("endTime");
    const totalOt = React.useMemo(
        () => calculateOtHours(startTime, endTime),
        [startTime, endTime],
    );

    React.useEffect(() => {
        form.setValue("totalOt", totalOt);
    }, [totalOt, form]);

    const employeeId = me?.hr_id;

    const overtimeMutation = useMutation({
        mutationFn: async (values: FormValues) => {
            const formData = new FormData();

            const d = values.date;
            const formattedDate = `${d.getFullYear()}-${String(
                d.getMonth() + 1,
            ).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

            const fields: Record<string, string> = {
                branch_id: values.branch_id,
                date: formattedDate,
                startTime: values.startTime,
                endTime: values.endTime,
                totalOt: values.totalOt,
                remarks: values.remarks,
            };

            Object.entries(fields).forEach(([key, value]) => {
                formData.append(key, value);
            });

            if (values.imageReference instanceof File) {
                formData.append("imageReference", values.imageReference);
            }

            // Edit: POST to update endpoint; Create: POST to create endpoint
            const url = isEdit
                ? `/api/v2/overtime/update/${overtimeId}`
                : `/api/v2/overtime/${employeeId}`;

            const response = await api.post(url, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            return response.data;
        },
    });

    function onSubmit(data: FormValues) {
        if (!me?.id) {
            toast.error("Employee not loaded yet.");
            return;
        }

        overtimeMutation.mutate(data, {
            onSuccess: () => {
                toast.success(
                    isEdit
                        ? "Overtime updated successfully!"
                        : "Success! Your overtime has been filed!",
                );
                navigate(`/overtime/${me?.id}`);
            },
            onError: (err: any) => {
                toast.error(
                    err?.response?.data?.message || "Error! Please try again.",
                );
            },
        });
    }

    if (!employeeId) {
        return (
            <ParentComponent>
                <Card className="text-center font-bold text-red-500">
                    You don't have permission to access this page.
                </Card>
            </ParentComponent>
        );
    }

    return (
        <div className="mx-auto w-full max-w-[800px] px-4 py-6 sm:px-6 md:px-10">
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="text-2xl">
                        {isEdit ? "Edit Overtime" : "Overtime"}
                    </CardTitle>
                    <CardDescription>
                        {isEdit
                            ? "Update your overtime details below."
                            : "Enter your information to file your overtime."}
                    </CardDescription>
                </CardHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="branch_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Branch</FormLabel>
                                            <FormControl>
                                                <Select
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                    value={field.value}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select branch..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {branches?.map(
                                                            (b: any) => (
                                                                <SelectItem
                                                                    key={b.id}
                                                                    value={b.id}
                                                                >
                                                                    {b.name}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="date">Date</Label>

                                    {isEdit ? (
                                        // Read-only in edit mode — date of original filing cannot be changed
                                        <Input
                                            id="date"
                                            value={
                                                existingDate
                                                    ? existingDate.toLocaleDateString(
                                                          "en-CA",
                                                      )
                                                    : ""
                                            }
                                            readOnly
                                            className="bg-muted text-muted-foreground cursor-not-allowed"
                                        />
                                    ) : (
                                        <Popover
                                            open={open}
                                            onOpenChange={setOpen}
                                        >
                                            <PopoverTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="w-full justify-between font-normal"
                                                >
                                                    {form.watch("date")
                                                        ? form
                                                              .watch("date")
                                                              .toLocaleDateString(
                                                                  "en-CA",
                                                              )
                                                        : "Select date"}
                                                    <ChevronDownIcon className="h-4 w-4 opacity-70" />
                                                </Button>
                                            </PopoverTrigger>

                                            <PopoverContent
                                                className="w-auto p-0"
                                                align="start"
                                            >
                                                <Calendar
                                                    mode="single"
                                                    selected={form.watch(
                                                        "date",
                                                    )}
                                                    onSelect={(date) => {
                                                        if (date) {
                                                            form.setValue(
                                                                "date",
                                                                date,
                                                                {
                                                                    shouldValidate: true,
                                                                },
                                                            );
                                                        }
                                                        setOpen(false);
                                                    }}
                                                    disabled={(date) => {
                                                        const today =
                                                            new Date();
                                                        today.setHours(
                                                            0,
                                                            0,
                                                            0,
                                                            0,
                                                        );

                                                        const twoDaysAgo =
                                                            new Date(today);
                                                        twoDaysAgo.setDate(
                                                            today.getDate() - 2,
                                                        );

                                                        const checkDate =
                                                            new Date(date);
                                                        checkDate.setHours(
                                                            0,
                                                            0,
                                                            0,
                                                            0,
                                                        );

                                                        return (
                                                            checkDate <
                                                                twoDaysAgo ||
                                                            checkDate > today
                                                        );
                                                    }}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    )}
                                    {form.formState.errors.date && (
                                        <p className="text-sm text-red-500">
                                            {
                                                form.formState.errors.date
                                                    .message as string
                                            }
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                    {/* Start Time */}
                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="startTime">
                                            Start Time
                                        </Label>
                                        <Input
                                            id="startTime"
                                            type="time"
                                            step="60"
                                            {...form.register("startTime")}
                                        />
                                        <p className="text-muted-foreground text-xs">
                                            When did your overtime start?
                                        </p>
                                        {form.formState.errors.startTime && (
                                            <p className="text-sm text-red-500">
                                                {
                                                    form.formState.errors
                                                        .startTime.message
                                                }
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="endTime">
                                            End Time
                                        </Label>
                                        <Input
                                            id="endTime"
                                            type="time"
                                            step="60"
                                            {...form.register("endTime")}
                                        />
                                        <p className="text-muted-foreground text-xs">
                                            When did your overtime end?
                                        </p>
                                        {form.formState.errors.endTime && (
                                            <p className="text-sm text-red-500">
                                                {
                                                    form.formState.errors
                                                        .endTime.message
                                                }
                                            </p>
                                        )}
                                    </div>

                                    {/* Total OT */}
                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="totalOt">
                                            Total Overtime (hrs)
                                        </Label>
                                        <Input
                                            id="totalOt"
                                            value={totalOt}
                                            readOnly
                                            className="bg-muted text-muted-foreground cursor-not-allowed"
                                        />
                                        <p className="text-muted-foreground text-xs">
                                            Automatically calculated
                                        </p>
                                        {form.formState.errors.totalOt && (
                                            <p className="text-sm text-red-500">
                                                {
                                                    form.formState.errors
                                                        .totalOt.message
                                                }
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <TextField
                                name="remarks"
                                label="Add remarks"
                                control={form.control}
                            />

                            <Controller
                                name="imageReference"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <ImageUploader
                                        field={field}
                                        fieldState={fieldState}
                                        label={
                                            isEdit
                                                ? "Upload Image (optional — replaces existing)"
                                                : "Upload an Image"
                                        }
                                        existingImageUrl={
                                            isEdit
                                                ? existingOvertime?.image
                                                : undefined
                                        }
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
                                disabled={overtimeMutation.isPending}
                                className="flex w-full items-center justify-center gap-2 bg-yellow-500 text-white hover:bg-yellow-600 sm:w-auto"
                            >
                                {overtimeMutation.isPending ? (
                                    <>
                                        <Spinner className="h-4 w-4" />
                                        <span>
                                            {isEdit
                                                ? "Updating..."
                                                : "Submitting..."}
                                        </span>
                                    </>
                                ) : isEdit ? (
                                    "Update"
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
