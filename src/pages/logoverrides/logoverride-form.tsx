import * as React from "react";
import { useForm } from "react-hook-form";
import { DateTimeField } from "@/components/date-time-picker";
import { z } from "zod";
import { TextField } from "@/components/text-field";
import { ImageUploader } from "@/components/image-dropzone";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
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
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/axios";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/hooks/use-auth";

const schema = z.object({
    clockType: z.enum(["Clock-In", "Clock-Out", "Break-In", "Break-Out"]),
    dateTime: z.string().min(1, "Enter date and time"),
    remarks: z.string().min(1, "Enter remarks"),
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

export default function LogoverrideForm() {
    const navigate = useNavigate();

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
            const response = await api.get("/api/v2/auth/me");
            return response.data.data;
        },
    });

    const employeeId = me?.id;
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

            const response = await api.post(
                `/api/v2/logoverrides/${employeeId}`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                },
            );

            return response.data;
        },
    });

    function onSubmit(data: FormValues) {
        mutate(data, {
            onSuccess: () => {
                toast.success("Success! Your Logoverride has been saved!");
                navigate(`/logoverrides/${me?.id}`);
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
                    <CardTitle className="text-2xl">Logoverride Form</CardTitle>
                    <CardDescription>
                        Enter your information to file your logoverride.
                    </CardDescription>
                </CardHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <CardContent>
                            <div className="flex flex-col gap-y-5">
                                <div className="flex flex-row gap-5">
                                    <div className="w-full">
                                        <FormField
                                            control={form.control}
                                            name="clockType"
                                            render={({ field }) => (
                                                <FormItem className="space-y-1">
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
                                    <div className="w-full">
                                        <DateTimeField
                                            name="dateTime"
                                            label="Date and Time"
                                            control={form.control}
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-row">
                                    <div className="w-full">
                                        <TextField
                                            name="remarks"
                                            label="Add remarks"
                                            control={form.control}
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-row">
                                    <div className="w-full">
                                        <ImageUploader
                                            name="imageReference"
                                            label="Upload Image"
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
