import * as React from "react";
import { useForm, ControllerRenderProps } from "react-hook-form";
import { z } from "zod";
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
} from "@/components/ui/card";
import { format } from "date-fns";

const schema = z.object({
    firstName: z.string().min(1, "Enter first name"),
    middleName: z.string().optional(),
    lastName: z.string().min(1, "Enter last name"),
    gender: z.string().min(1, "Select gender"),
    birthDate: z.date({ message: "Pick a birth date" }),
    citizenship: z.string().min(1, "Required"),
    civilStatus: z.string().min(1, "Select status"),
    contactNumber: z.string().regex(/^[0-9+\-()\s]+$/, "Invalid phone"),
    personalEmail: z.string().email("Invalid email"),
    companyEmail: z.string().email("Invalid email"),
    address: z.string().min(1, "Enter address"),

    emergencyName: z.string().min(1, "Required"),
    emergencyRelation: z.string().min(1, "Required"),
    emergencyContact: z.string().regex(/^[0-9+\-()\s]+$/, "Invalid phone"),

    sssNumber: z.string().regex(/^\d{10}$/, "Must be 10 digits"),
    tinNumber: z.string().regex(/^\d{9}$/, "Must be 9 digits"),
    philHealth: z.string().min(1, "Required"),
    pagibig: z.string().min(1, "Required"),

    employeeId: z.string().min(1, "Required"),
    department: z.string().min(1, "Required"),
    position: z.string().min(1, "Required"),
    dateHired: z.date({ message: "Pick hire date" }),
});

type FormValues = z.infer<typeof schema>;

/* ---------- Helpers ---------- */
function TextField({
    name,
    label,
    control,
    type = "text",
}: {
    name: keyof FormValues;
    label: string;
    control: any;
    type?: string;
}) {
    return (
        <FormField
            control={control}
            name={name}
            render={({
                field,
            }: {
                field: ControllerRenderProps<FormValues>;
            }) => (
                <FormItem className="space-y-1">
                    <FormLabel>{label}</FormLabel>
                    <FormControl>
                        <Input type={type} placeholder={label} {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}

function SelectField({
    name,
    label,
    options,
    control,
}: {
    name: keyof FormValues;
    label: string;
    options: string[];
    control: any;
}) {
    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem className="space-y-1">
                    <FormLabel>{label}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder={`Select ${label}`} />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {options.map((o) => (
                                <SelectItem key={o} value={o}>
                                    {o}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}

function DateField({
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
                    <Popover>
                        <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                    variant="outline"
                                    className={`w-full justify-start text-left font-normal ${
                                        !field.value && "text-muted-foreground"
                                    }`}
                                >
                                    {field.value
                                        ? format(field.value, "PPP")
                                        : `Pick ${label}`}
                                </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                            />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}

/* ---------- Main Component ---------- */
export default function EmployeeForm() {
    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {},
    });

    const onSubmit = (data: FormValues) => {
        console.log(data);
    };

    const SectionCard = ({
        title,
        description,
        children,
    }: {
        title: string;
        description?: string;
        children: React.ReactNode;
    }) => (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {description && (
                    <CardDescription>{description}</CardDescription>
                )}
            </CardHeader>
            <CardContent className="space-y-6">{children}</CardContent>
        </Card>
    );

    return (
        <div className="mx-auto max-w-[1500px] space-y-8 p-6">
            <h1 className="mb-4 text-3xl font-bold tracking-tight">
                Create Employee
            </h1>

            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-8"
                >
                    <SectionCard
                        title="Employee Personal Data"
                        description="Add New Employee Record"
                    >
                        <div className="grid gap-6 md:grid-cols-3">
                            <TextField
                                name="firstName"
                                label="First Name"
                                control={form.control}
                            />
                            <TextField
                                name="middleName"
                                label="Middle Name"
                                control={form.control}
                            />
                            <TextField
                                name="lastName"
                                label="Last Name"
                                control={form.control}
                            />
                        </div>
                        <div className="grid gap-6 md:grid-cols-4">
                            <SelectField
                                name="gender"
                                label="Gender"
                                options={["Male", "Female", "Other"]}
                                control={form.control}
                            />
                            <DateField
                                name="birthDate"
                                label="Birth Date"
                                control={form.control}
                            />
                            <TextField
                                name="citizenship"
                                label="Citizenship"
                                control={form.control}
                            />
                            <SelectField
                                name="civilStatus"
                                label="Civil Status"
                                options={["Single", "Married", "Widowed"]}
                                control={form.control}
                            />
                        </div>
                        <div className="grid gap-6 md:grid-cols-3">
                            <TextField
                                name="contactNumber"
                                label="Contact Number"
                                control={form.control}
                            />
                            <TextField
                                name="personalEmail"
                                label="Personal Email"
                                type="email"
                                control={form.control}
                            />
                            <TextField
                                name="companyEmail"
                                label="Company Email"
                                type="email"
                                control={form.control}
                            />
                        </div>
                        <TextField
                            name="address"
                            label="Address"
                            control={form.control}
                        />
                    </SectionCard>

                    <SectionCard
                        title="Employee Emergency Contact Data"
                        description="Add New Employee Emergency Contact Record"
                    >
                        <div className="grid gap-6 md:grid-cols-3">
                            <TextField
                                name="emergencyName"
                                label="Contact Person"
                                control={form.control}
                            />
                            <TextField
                                name="emergencyRelation"
                                label="Relationship"
                                control={form.control}
                            />
                            <TextField
                                name="emergencyContact"
                                label="Contact Number"
                                control={form.control}
                            />
                        </div>
                    </SectionCard>

                    <SectionCard
                        title="Employee Government IDs Data"
                        description="Add New Employee Government IDs Record"
                    >
                        <div className="grid gap-6 md:grid-cols-4">
                            <TextField
                                name="sssNumber"
                                label="SSS Number"
                                control={form.control}
                            />
                            <TextField
                                name="tinNumber"
                                label="TIN Number"
                                control={form.control}
                            />
                            <TextField
                                name="philHealth"
                                label="PhilHealth"
                                control={form.control}
                            />
                            <TextField
                                name="pagibig"
                                label="Pag-IBIG"
                                control={form.control}
                            />
                        </div>
                    </SectionCard>

                    <SectionCard
                        title="Employee Company Data"
                        description="Add New Employee Company Record"
                    >
                        <div className="grid gap-6 md:grid-cols-4">
                            <TextField
                                name="employeeId"
                                label="Employee ID"
                                control={form.control}
                            />
                            <TextField
                                name="department"
                                label="Department"
                                control={form.control}
                            />
                            <TextField
                                name="position"
                                label="Position"
                                control={form.control}
                            />
                            <DateField
                                name="dateHired"
                                label="Date Hired"
                                control={form.control}
                            />
                        </div>
                    </SectionCard>

                    <div className="pt-4">
                        <Button type="submit" className="w-full md:w-auto">
                            Save Employee
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
