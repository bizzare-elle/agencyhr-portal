import * as React from "react";
import { useForm, ControllerRenderProps } from "react-hook-form";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import { format } from "date-fns";

const schema = z.object({
    employeeId: z.int().min(1, "Employee Name is required."),
    clockType: z.enum(["clock-in", "clock-out", "break-in", "break-out"]),
    dateTime: z.string().min(1, "Enter date and time"),
    remarks: z.string().min(1, "Enter remarks"),
    imageReference: z
        .any()
        .refine(
            (file) => file.size <= 5 * 1024 * 1024,
            "File must be less than than 5MB",
        )
        .refine(
            (file) => ["image/jpeg", "image/png"].includes(file?.type),
            "Only JPEG and PNG files are allowed",
        ),
});

type FormValues = z.infer<typeof schema>;

function ClockType({
    name,
    label,
    control,
}: {
    name: keyof FormValues;
    label: string;
    control: any;
}) {
    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem className="space-y-1">
                    <FormLabel>{label}</FormLabel>
                    <Select>
                        <FormControl>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select Clock Type" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="clock-in">Clock-in</SelectItem>
                            <SelectItem value="clock-out">Clock-out</SelectItem>
                            <SelectItem value="break-in">Break-in</SelectItem>
                            <SelectItem value="break-out">Break-out</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )}
        ></FormField>
    );
}

export default function LogoverrideForm() {
    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {},
    });

    function onSubmit(data: FormValues) {
        toast("You submitted the following values", {
            description: (
                <pre className="mt-2 w-[320px] rounded-md bg-neutral-950 p-4">
                    <code className="text-white">
                        {JSON.stringify(data, null, 2)}
                    </code>
                </pre>
            ),
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
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <div className="flex flex-col gap-y-5">
                                <div className="flex flex-row gap-5">
                                    <div className="w-full">
                                        <ClockType
                                            name="clockType"
                                            label="Select Clock Type"
                                            control={form.control}
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
                        </form>
                    </Form>
                </CardContent>
                <CardFooter className="justify-end pt-4">
                    <Button type="submit">Submit</Button>
                </CardFooter>
            </Card>
        </div>
    );
}
