import { useState } from "react";
import { format } from "date-fns";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar as CalendarIcon, Paperclip } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import CustomSelect from "@/components/custom-select";
import { cn } from "@/lib/utils";
import { ParentComponent } from "@/components/parent-container";
import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { Spinner } from "@/components/ui/spinner";
import { useNavigate } from "react-router-dom";

const LEAVE_TYPES = [
    { value: "SL", label: "Sick Leave (SL)" },
    { value: "VL", label: "Vacation Leave (VL)" },
];

export default function LeaveForm() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [employeeId, setEmployeeId] = useState<string | undefined>();
    const [leaveType, setLeaveType] = useState<string | undefined>();
    const [isPaid, setIsPaid] = useState(true);
    const [dateStart, setDateStart] = useState<Date>();
    const [dateEnd, setDateEnd] = useState<Date>();
    const [remarks, setRemarks] = useState("");
    const [file, setFile] = useState<File | null>(null);

    const resetForm = () => {
        setEmployeeId(undefined);
        setLeaveType(undefined);
        setIsPaid(true);
        setDateStart(undefined);
        setDateEnd(undefined);
        setRemarks("");
        setFile(null);
    };

    const fileMutation = useMutation({
        mutationFn: async () => {
            const formData = new FormData();
            formData.append("leave_type", leaveType || "");
            formData.append("is_paid", isPaid ? "1" : "0");
            formData.append("date_start", format(dateStart!, "yyyy-MM-dd"));
            formData.append("date_end", format(dateEnd!, "yyyy-MM-dd"));
            if (remarks) formData.append("remarks", remarks);
            formData.append("leave_form", file!);

            const res = await api.post(
                `/api/v2/leave-forms/${employeeId}`,
                formData,
            );
            return res.data;
        },
        onSuccess: (data) => {
            toast.success(
                data.message || "Leave form uploaded and plotted successfully!",
            );
            queryClient.invalidateQueries({ queryKey: ["leaveForms"] });
            resetForm();
            navigate("/leave-forms");
        },
        onError: (error: any) => {
            toast.error(
                error?.response?.data?.message ||
                    "Something went wrong while uploading the leave form.",
            );
        },
    });

    const handleSubmit = () => {
        if (!employeeId) {
            toast.error("Please select an employee.");
            return;
        }
        if (!leaveType) {
            toast.error("Please select a leave type (SL or VL).");
            return;
        }
        if (!dateStart || !dateEnd) {
            toast.error("Please select the leave date range.");
            return;
        }
        if (dateEnd < dateStart) {
            toast.error("End date cannot be before the start date.");
            return;
        }
        if (!file) {
            toast.error("Please attach the approved leave form.");
            return;
        }

        fileMutation.mutate();
    };

    return (
        <ParentComponent>
            <Card className="w-full shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">
                        File Leave Form
                    </CardTitle>
                    <CardDescription>
                        Upload an already-approved leave form and assign it to
                        an employee. It will automatically plot onto their
                        schedule for the selected date range.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <Label className="mb-1 block text-sm font-medium">
                                Employee
                            </Label>
                            <CustomSelect
                                apiUrl="api/v2/get_employees"
                                value={employeeId}
                                onChange={setEmployeeId}
                                placeholder="Select employee..."
                            />
                        </div>

                        <div>
                            <Label className="mb-1 block text-sm font-medium">
                                Leave Type
                            </Label>
                            <Select value={leaveType} onValueChange={setLeaveType}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select leave type..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {LEAVE_TYPES.map((lt) => (
                                        <SelectItem key={lt.value} value={lt.value}>
                                            {lt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label className="mb-1 block text-sm font-medium">
                                Leave Start Date
                            </Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        data-empty={!dateStart}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            "data-[empty=true]:text-muted-foreground",
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateStart
                                            ? format(dateStart, "MMM dd, yyyy")
                                            : "Pick start date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={dateStart}
                                        onSelect={setDateStart}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div>
                            <Label className="mb-1 block text-sm font-medium">
                                Leave End Date
                            </Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        data-empty={!dateEnd}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            "data-[empty=true]:text-muted-foreground",
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateEnd
                                            ? format(dateEnd, "MMM dd, yyyy")
                                            : "Pick end date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={dateEnd}
                                        onSelect={setDateEnd}
                                        disabled={
                                            dateStart
                                                ? { before: dateStart }
                                                : undefined
                                        }
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div className="bg-muted/30 flex items-center justify-between rounded-lg border p-4">
                        <div>
                            <Label className="text-sm font-medium">Paid Leave</Label>
                            <p className="text-muted-foreground text-xs">
                                When enabled, each plotted leave day is marked
                                as paid. Its cost is computed automatically
                                during timesheet consolidation, using the
                                employee's rate at that time (hours are not
                                counted).
                            </p>
                        </div>
                        <Switch checked={isPaid} onCheckedChange={setIsPaid} />
                    </div>

                    <div>
                        <Label className="mb-1 block text-sm font-medium">
                            Remarks (optional)
                        </Label>
                        <Textarea
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder="Any additional notes..."
                            rows={3}
                        />
                    </div>

                    <div>
                        <Label className="mb-1 block text-sm font-medium">
                            Approved Leave Form (PDF, JPG, or PNG)
                        </Label>
                        <label className="border-input hover:border-primary/50 flex cursor-pointer items-center gap-2 rounded-md border border-dashed px-4 py-3 text-sm transition-colors">
                            <Paperclip className="h-4 w-4 shrink-0" />
                            <span className="text-muted-foreground truncate">
                                {file ? file.name : "Click to attach the approved form..."}
                            </span>
                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.gif"
                                className="hidden"
                                onChange={(e) =>
                                    setFile(e.target.files?.[0] ?? null)
                                }
                            />
                        </label>
                    </div>
                </CardContent>

                <CardFooter className="flex justify-end space-x-3">
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() => navigate(-1)}
                    >
                        Back
                    </Button>

                    <Button
                        onClick={handleSubmit}
                        disabled={fileMutation.isPending}
                        className="flex items-center gap-2 bg-yellow-500 text-white hover:bg-yellow-600"
                    >
                        {fileMutation.isPending ? (
                            <>
                                <Spinner className="h-4 w-4" />
                                Uploading...
                            </>
                        ) : (
                            "Submit"
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </ParentComponent>
    );
}
