import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronDownIcon } from "lucide-react";

import api from "@/lib/axios";
import { TextField } from "@/components/text-field";
import { ImageUploader } from "@/components/image-dropzone";
import { Label } from "@/components/ui/label";
import { Form } from "@/components/ui/form";
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
import { useAuthStore } from "@/hooks/use-auth";
import { ParentComponent } from "@/components/parent-container";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const schema = z.object({
    date: z.date({ error: () => ({ message: "Date is required" }) }),
    startTime: z.string().regex(timeRegex, {
        message: "Start time is required (HH:mm)",
    }),
    endTime: z.string().regex(timeRegex, {
        message: "End time is required (HH:mm)",
    }),
    totalOt: z.string().optional(),
    remarks: z.string().min(1, { message: "Remarks are required" }),
    imageReference: z
        .instanceof(File, { message: "Image is required" })
        .refine((file) => file.size <= 5 * 1024 * 1024, {
            message: "File must be less than 5MB",
        })
        .refine(
            (file) =>
                ["image/jpeg", "image/png", "image/webp"].includes(file.type),
            { message: "Only JPEG, PNG, or WebP files are allowed" },
        ),
});

type FormValues = z.infer<typeof schema>;

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
    const { setToken } = useAuthStore.getState();
    const [open, setOpen] = React.useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { remarks: "" },
    });

    const { data: me } = useQuery({
        queryKey: ["me"],
        queryFn: async () => {
            const res = await api.get(`/api/v2/auth/me`);
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
        mutationFn: async (formValues: FormValues) => {
            const formData = new FormData();

            formData.append(
                "date",
                formValues.date.toISOString().split("T")[0],
            );
            formData.append("startTime", formValues.startTime);
            formData.append("endTime", formValues.endTime);
            formData.append("totalOt", formValues.totalOt || "0");
            formData.append("remarks", formValues.remarks);

            if (formValues.imageReference instanceof File) {
                formData.append("imageReference", formValues.imageReference);
            }

            const response = await api.post(
                `/api/v2/overtime/${employeeId}`,
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                },
            );
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
                toast.success("Success! Your overtime has been filed!");
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
                    <CardTitle className="text-2xl">Overtime</CardTitle>
                    <CardDescription>
                        Enter your information to file your overtime.
                    </CardDescription>
                </CardHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <CardContent className="space-y-6">
                            {/* Date Picker */}
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="date">Date</Label>
                                <Popover open={open} onOpenChange={setOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
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
                                            <ChevronDownIcon />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="w-auto p-0"
                                        align="start"
                                    >
                                        <Calendar
                                            mode="single"
                                            selected={form.watch("date")}
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
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* From / To / Overtime Hours */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div className="flex flex-col gap-2">
                                    <Label>From</Label>
                                    <Input
                                        {...form.register("startTime")}
                                        type="time"
                                        step="60"
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Label>To</Label>
                                    <Input
                                        {...form.register("endTime")}
                                        type="time"
                                        step="60"
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Label>Overtime Hour/s</Label>
                                    <Input
                                        id="totalOt"
                                        value={totalOt}
                                        readOnly
                                        className="bg-muted cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            {/* Remarks */}
                            <TextField
                                name="remarks"
                                label="Add remarks"
                                control={form.control}
                            />

                            {/* Image Upload */}
                            <ImageUploader
                                name="imageReference"
                                label="Upload an image"
                                control={form.control}
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
                                className="flex w-full items-center justify-center gap-2 sm:w-auto"
                            >
                                {overtimeMutation.isPending ? (
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
