import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
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
import { ParentComponent } from "@/components/parent-container";

const schema = z.object({
    clockType: z.string().min(1, "Enter clock type"),
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
        defaultValues: { remarks: "" },
    });

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
            formData.append("clockType", formValues.clockType);
            formData.append("dateTime", formValues.dateTime);
            formData.append("remarks", formValues.remarks);
            if (formValues.imageReference)
                formData.append("image", formValues.imageReference);

            const res = await api.post(
                `/api/v2/logoverrides/${employeeId}`,
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" },
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
                            <Controller
                                name="remarks"
                                control={form.control}
                                render={({ field }) => (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">
                                            Remarks
                                        </label>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select reason" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="System Maintenance">
                                                    System Maintenance
                                                </SelectItem>
                                                <SelectItem value="No Internet Connection">
                                                    No Internet Connection
                                                </SelectItem>
                                                <SelectItem value="Employee is not yet added in the System">
                                                    Employee is not yet added in
                                                    the System
                                                </SelectItem>
                                                <SelectItem value="Work Remotely (For Corporate Office Only)">
                                                    Work Remotely (For Corporate
                                                    Office Only)
                                                </SelectItem>
                                                <SelectItem value="Forgot Clock-In or Clock-Out">
                                                    Forgot Clock-In or Clock-Out
                                                </SelectItem>
                                                <SelectItem value="Request for Change Clock Type (Clock-In, Clock-Out)">
                                                    Request for Change Clock
                                                    Type (Clock-In, Clock-Out)
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
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
                                                label="Upload an Image"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
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
                                className="flex w-full items-center justify-center gap-2 sm:w-auto"
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
