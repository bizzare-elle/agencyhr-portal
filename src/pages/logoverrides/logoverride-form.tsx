import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { DateTimeField } from "@/components/date-time-picker";
import { TextField } from "@/components/text-field";
import { ImageUploader } from "@/components/image-dropzone";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
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

const schema = z.object({
    clockType: z.enum(["Clock-In", "Clock-Out", "Break-In", "Break-Out"], {
        required_error: "Please select a clock type",
    }),
    dateTime: z.string().min(1, "Enter date and time"),
    remarks: z.string().min(1, "Enter remarks"),
    imageReference: z
        .instanceof(File)
        .optional()
        .refine(
            (file) => !file || file.size <= 5 * 1024 * 1024,
            "File must be less than 5MB",
        )
        .refine(
            (file) =>
                !file ||
                ["image/jpeg", "image/png", "image/jpg"].includes(file.type),
            "Only JPEG and PNG files are allowed",
        ),
});

type FormValues = z.infer<typeof schema>;

export default function LogoverrideForm() {
    const navigate = useNavigate();
    const { setToken } = useAuthStore.getState();

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            remarks: "",
        },
    });

    const { data: me } = useQuery({
        queryKey: ["me"],
        queryFn: async () => {
            const res = await api.get("/api/v2/auth/me");
            return res.data.data;
        },
    });

    const employeeId = me?.id;

    const logoverrideMutation = useMutation({
        mutationFn: async (formValues: FormValues) => {
            const formData = new FormData();
            formData.append("clockType", formValues.clockType);
            formData.append("dateTime", formValues.dateTime);
            formData.append("remarks", formValues.remarks);

            if (formValues.imageReference) {
                formData.append("image", formValues.imageReference);
            }

            const res = await api.post(
                `/api/v2/logoverrides/${employeeId}`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                },
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

    const onSubmit = (data: FormValues) => {
        logoverrideMutation.mutate(data);
    };

    return (
        <div className="mx-auto flex w-full max-w-[800px] justify-center p-4 sm:p-6 md:p-10">
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
                        <CardContent>
                            <div className="flex flex-col gap-6">
                                {/* Clock Type & DateTime */}
                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
                                                                Clock-in
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
                                        />
                                    </div>
                                </div>

                                {/* Remarks */}
                                <TextField
                                    name="remarks"
                                    label="Add Remarks"
                                    control={form.control}
                                />

                                {/* Image Upload */}
                                <FormField
                                    control={form.control}
                                    name="imageReference"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <ImageUploader
                                                    name={field.name}
                                                    control={form.control}
                                                    onChange={(image: any) =>
                                                        field.onChange(image)
                                                    }
                                                    label="Upload an Image"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>

                        <CardFooter className="justify-end pt-6">
                            <Button
                                type="submit"
                                disabled={logoverrideMutation.isPending}
                                className="flex items-center gap-2"
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
