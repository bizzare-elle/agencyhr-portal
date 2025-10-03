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

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;

const schema = z.object({
    date: z.date({ error: "Date is required" }),
    startTime: z.string().regex(timeRegex, {
        message: "Enter a valid time in 24-hour format (HH:mm).",
    }),
    endTime: z.string().regex(timeRegex, {
        message: "Enter a valid time in 24-hour format (HH:mm).",
    }),
    totalOt: z.string().optional(),
    remarks: z.string().min(1, { message: "Enter remarks." }),
    imageReference: z
        .any()
        .refine(
            (file) => !file || file.size <= 5 * 1024 * 1024,
            "File must be less than 5MB",
        )
        .refine(
            (file) => !file || ["image/jpeg", "image/png"].includes(file?.type),
            "Only JPEG and PNG files are allowed",
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
    const [open, setOpen] = React.useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            remarks: "",
        },
    });

    const { setToken } = useAuthStore.getState();
    const { data: me } = useQuery({
        queryKey: ["me"],
        queryFn: async () => {
            const response = await api.get(`/api/v2/auth/me`);
            return response.data.data;
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

    const employeeId = me?.id;

    const { isPending, mutate } = useMutation({
        mutationFn: async (formValues: FormValues) => {
            const formData = new FormData();

            Object.entries(formValues).forEach(([key, value]) => {
                if (value instanceof FileList) {
                    Array.from(value).forEach((file) => {
                        formData.append(key, file);
                    });
                } else if (value instanceof File) {
                    formData.append(key, value);
                } else if (value instanceof Date) {
                    formData.append(key, value.toISOString().split("T")[0]);
                } else if (value !== undefined && value !== null) {
                    formData.append(key, String(value));
                }
            });

            const response = await api.post(
                `/api/v2/overtime/${employeeId}`,
                formData,
                { headers: { "Content-Type": "multipart/form-data" } },
            );

            return response.data;
        },
    });

    function onSubmit(data: FormValues) {
        if (!me?.id) {
            toast.error("Employee not loaded yet.");
            return;
        }

        mutate(data, {
            onSuccess: () => {
                toast.success(
                    "Success! Your overtime has been successfully filed!",
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

    return (
        <div className="mx-auto flex w-full max-w-[800px] justify-center p-10">
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="text-2xl">Overtime</CardTitle>
                    <CardDescription>
                        Enter your information to file your overtime.
                    </CardDescription>
                </CardHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <CardContent>
                            <div className="flex flex-col space-y-5">
                                <div className="w-full">
                                    <div className="flex flex-col gap-3">
                                        <Label htmlFor="date" className="px-1">
                                            Date
                                        </Label>
                                        <Popover
                                            open={open}
                                            onOpenChange={setOpen}
                                        >
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    id="date"
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
                                                className="w-auto overflow-hidden p-0"
                                                align="start"
                                            >
                                                <Calendar
                                                    mode="single"
                                                    selected={form.watch(
                                                        "date",
                                                    )}
                                                    captionLayout="dropdown"
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
                                </div>

                                <div className="flex flex-row space-x-5">
                                    <div className="flex w-full flex-col gap-y-3">
                                        <Label
                                            htmlFor="startTime"
                                            className="px-1"
                                        >
                                            From
                                        </Label>
                                        <Input
                                            {...form.register("startTime")}
                                            type="time"
                                            step="60"
                                            defaultValue={"10:00"}
                                            className="bg-background"
                                        />
                                    </div>
                                    <div className="flex w-full flex-col gap-y-3">
                                        <Label
                                            htmlFor="endTime"
                                            className="px-1"
                                        >
                                            To
                                        </Label>
                                        <Input
                                            {...form.register("endTime")}
                                            type="time"
                                            step="60"
                                            defaultValue={"10:00"}
                                            className="bg-background"
                                        />
                                    </div>
                                    <div className="flex w-full flex-col gap-y-3">
                                        <Label
                                            htmlFor="totalOt"
                                            className="px-1"
                                        >
                                            Overtime Hour/s
                                        </Label>
                                        <Input
                                            id="totalOt"
                                            value={totalOt}
                                            readOnly
                                            className="bg-muted cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                <TextField
                                    name="remarks"
                                    label="Add remarks"
                                    control={form.control}
                                />

                                <ImageUploader
                                    name="imageReference"
                                    label="Upload an image"
                                    control={form.control}
                                />
                            </div>
                        </CardContent>

                        <CardFooter className="justify-end pt-8">
                            <Button type="submit" disabled={isPending}>
                                {isPending ? "Submitting..." : "Submit"}
                            </Button>
                        </CardFooter>
                    </form>
                </Form>
            </Card>
        </div>
    );
}
