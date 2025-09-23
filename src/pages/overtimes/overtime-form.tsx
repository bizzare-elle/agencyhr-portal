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
import { DatePickerField } from "@/components/date-picker";

const schema = z.object({
    employeeId: z
        .number()
        .int()
        .min(1, { message: "Employee Name is required." }),
    date: z.date({ message: "Date is required." }),
    startTime: z.string().min(1, { message: "Enter start time." }),
    endTime: z.string().min(1, { message: "End time is required." }),
    remarks: z.string().min(1, { message: "Enter remarks." }),
});

type FormValues = z.infer<typeof schema>;

export function DateTimeRangePicker() {
    const [open, setOpen] = React.useState(false);
    const [date, setDate] = React.useState<Date | undefined>(undefined);
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
                <Label htmlFor="date" className="px-1">
                    Date
                </Label>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            id="date"
                            className="w-full justify-between font-normal"
                        >
                            {date ? date.toLocaleDateString() : "Select date"}
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
            <div className="flex gap-4">
                <div className="flex w-full flex-col gap-3">
                    <Label htmlFor="time-from" className="px-1">
                        From
                    </Label>
                    <Input
                        type="time"
                        id="time-from"
                        step="1"
                        defaultValue="10:30:00"
                        className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                    />
                </div>
                <div className="flex w-full flex-col gap-3">
                    <Label htmlFor="time-to" className="px-1">
                        To
                    </Label>
                    <Input
                        type="time"
                        id="time-to"
                        step="1"
                        defaultValue="12:30:00"
                        className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                    />
                </div>
            </div>
        </div>
    );
}

export default function OvertimeForm() {
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
                    <CardTitle className="text-2xl">Overtime</CardTitle>
                    <CardDescription>
                        Enter your information to file your overtime.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <div className="flex flex-col gap-y-5">
                                <div className="flex flex-row gap-5">
                                    <div className="w-full">
                                        <DateTimeRangePicker />
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
                            </div>
                        </form>
                    </Form>
                </CardContent>
                <CardFooter className="justify-end pt-4">
                    <Button>Submit</Button>
                </CardFooter>
            </Card>
        </div>
    );
}
