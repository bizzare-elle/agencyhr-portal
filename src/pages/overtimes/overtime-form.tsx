import * as React from "react";
import { useForm, ControllerRenderProps } from "react-hook-form";
import { DateTimeField } from "@/components/date-time-picker";
import { z } from "zod";
import { TextField } from "@/components/text-field";
import { ImageUploader } from "@/components/image-dropzone";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@/components/ui/label";
import { ChevronDownIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
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
import api from "@/lib/axios";

const schema = z.object({
    date: z.date({ message: "Date is required." }),
    startTime: z.string().min(1, { message: "Enter start time." }),
    endTime: z.string().min(1, { message: "End time is required." }),
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

export default function OvertimeForm() {
    const navigate = useNavigate();
    const [open, setOpen] = React.useState(false);
    const [date, setDate] = React.useState<Date | undefined>(undefined);

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            remarks: "",
        },
    });

    const { isPending, mutate } = useMutation({
        mutationFn: async function (formValues: FormValues) {
            const formData = new FormData();

            Object.entries(formValues).forEach(([key, value]) => {
                if (value instanceof FileList) {
                    Array.from(value).forEach((file) => {
                        formData.append(key, file);
                    });
                } else if (value instanceof File) {
                    formData.append(key, value);
                } else if (value !== undefined && value !== null) {
                    formData.append(key, String(value));
                }
            });

            const response = await api.post("/api/v2/overtime", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            return response.data;
        },
    });

    function onSubmit(data: FormValues) {
        mutate(data, {
            onSuccess: function () {
                toast.success(
                    "Success! Your overtime has been successfully filed!",
                );
                navigate("/overtime/123");
            },
            onError: function () {
                toast.error("Error! Please try again.");
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
                            <div className="flex flex-col gap-y-5">
                                <div className="flex flex-row gap-5">
                                    <div className="w-full">
                                        <div className="flex flex-col gap-3">
                                            <Label
                                                htmlFor="date"
                                                className="px-1"
                                            >
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
                                                        {date
                                                            ? date.toLocaleDateString()
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
                                                        selected={date}
                                                        captionLayout="dropdown"
                                                        onSelect={(date) => {
                                                            setDate(date);
                                                            setOpen(false);
                                                        }}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-row gap-5">
                                    <div className="flex w-full flex-col gap-3">
                                        <Label
                                            htmlFor="startTime"
                                            className="px-1"
                                        >
                                            From
                                        </Label>
                                        <Input
                                            name="startTime"
                                            type="time"
                                            id="startTime"
                                            step="1"
                                            defaultValue="10:30:00"
                                            className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                                        />
                                    </div>
                                    <div className="fle3x w-full flex-col gap-3">
                                        <Label
                                            htmlFor="endTime"
                                            className="px-1"
                                        >
                                            To
                                        </Label>
                                        <Input
                                            name="endTime"
                                            type="time"
                                            id="endTime"
                                            step="1"
                                            defaultValue="17:30:00"
                                            className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-y-5">
                                    <div className="w-full">
                                        <TextField
                                            name="remarks"
                                            label="Add remarks"
                                            control={form.control}
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-y-5">
                                    <div className="w-full">
                                        <ImageUploader
                                            name="imageReference"
                                            label="Upload an image"
                                            control={form.control}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-end pt-8">
                            <Button type="submit">Submit</Button>
                        </CardFooter>
                    </form>
                </Form>
            </Card>
        </div>
    );
}
