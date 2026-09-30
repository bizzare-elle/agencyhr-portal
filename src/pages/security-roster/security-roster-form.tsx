import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/axios";
import { ParentComponent } from "@/components/parent-container";
import FullPageLoader from "@/components/page-loader";
import CustomSelect from "@/components/custom-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { apiErrorMessage } from "@/helpers/apiErrorMessage";
import {
    ApiResponse,
    SecurityRosterEntry,
    SecurityRosterOptions,
} from "@/index";

export default function SecurityRosterForm() {
    const { rosterId } = useParams();
    const isEdit = !!rosterId;
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [fullName, setFullName] = useState("");
    const [licenseNumber, setLicenseNumber] = useState("");
    const [mobileNumber, setMobileNumber] = useState("");
    const [gender, setGender] = useState<string | undefined>();
    const [personalEmail, setPersonalEmail] = useState("");
    const [branchId, setBranchId] = useState<string | undefined>();
    const [scheduleId, setScheduleId] = useState<string | undefined>();

    const entryQuery = useQuery({
        queryKey: ["security-roster", rosterId],
        queryFn: async () => {
            const res = await api.get<ApiResponse<SecurityRosterEntry>>(
                `/api/v2/security-roster/${rosterId}`,
            );
            return res.data.data;
        },
        enabled: isEdit,
    });

    const optionsQuery = useQuery({
        queryKey: ["security-roster-options"],
        queryFn: async () => {
            const res = await api.get<ApiResponse<SecurityRosterOptions>>(
                "/api/v2/security-roster/options",
            );
            return res.data.data;
        },
        staleTime: 5 * 60 * 1000,
    });

    const entry = entryQuery.data;
    const locked = isEdit && !!entry && !entry.can_edit;

    useEffect(() => {
        if (!entry) return;
        setFullName(entry.full_name);
        setLicenseNumber(entry.license_number);
        setMobileNumber(entry.mobile_number);
        setGender(entry.gender ? String(entry.gender) : undefined);
        setPersonalEmail(entry.personal_email_address ?? "");
        setBranchId(entry.branch_id ? String(entry.branch_id) : undefined);
        setScheduleId(
            entry.schedule_type_id ? String(entry.schedule_type_id) : undefined,
        );
    }, [entry]);

    const saveMutation = useMutation({
        mutationFn: () =>
            api.post<ApiResponse<{ id?: number } | null>>(
                isEdit
                    ? `/api/v2/security-roster/${rosterId}`
                    : "/api/v2/security-roster",
                {
                    full_name: fullName,
                    license_number: licenseNumber,
                    mobile_number: mobileNumber,
                    gender: gender ?? "",
                    personal_email_address: personalEmail,
                    branch_id: branchId ?? "",
                    schedule_type_id: scheduleId ?? "",
                },
            ),
        onSuccess: (res) => {
            toast.success(res.data?.message ?? "Saved.");
            queryClient.invalidateQueries({ queryKey: ["security-roster"] });
            navigate("/security-roster");
        },
        onError: (err) =>
            toast.error(
                apiErrorMessage(err, "Could not save this roster entry."),
            ),
    });

    const handleSubmit = () => {
        if (!fullName.trim() || !licenseNumber.trim() || !mobileNumber.trim()) {
            toast.error(
                "Full name, license number, and mobile number are required.",
            );
            return;
        }
        if (isEdit && (!branchId || !scheduleId)) {
            toast.error("Choose the guard's branch and schedule.");
            return;
        }
        saveMutation.mutate();
    };

    if (isEdit && entryQuery.isLoading) return <FullPageLoader />;

    if (isEdit && entryQuery.isError) {
        return (
            <ParentComponent>
                <div className="text-center text-lg font-semibold text-red-400">
                    {apiErrorMessage(
                        entryQuery.error,
                        "Roster entry not found.",
                    )}
                </div>
            </ParentComponent>
        );
    }

    const schedules = optionsQuery.data?.schedules ?? [];

    return (
        <ParentComponent>
            <Card className="w-full shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">
                        {isEdit ? "Edit Roster Entry" : "Add Guard to Roster"}
                    </CardTitle>
                    <CardDescription>
                        {isEdit
                            ? "Set the branch and shift this guard is posted to. They can register on that branch's tablet once both are set."
                            : "Branch and schedule are optional now. You can set them later, but the guard can't register on the tablet until both are set."}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {optionsQuery.isError && (
                        <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-400">
                            {apiErrorMessage(
                                optionsQuery.error,
                                "Couldn't load the branch and schedule lists.",
                            )}{" "}
                            Refresh the page to try again.
                        </div>
                    )}

                    {locked && entry && (
                        <div className="rounded-md bg-yellow-500/10 p-3 text-sm text-yellow-400">
                            This posting is already{" "}
                            <strong>{entry.status}</strong> and can no longer be
                            edited here.
                            {entry.status === "claimed" &&
                                " The guard is now an employee record — contact Atlas HR for changes."}
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <Label className="mb-1 block text-sm font-medium">
                                Full Name *
                            </Label>
                            <Input
                                value={fullName}
                                maxLength={255}
                                disabled={locked}
                                onChange={(e) => setFullName(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label className="mb-1 block text-sm font-medium">
                                Security License No. *
                            </Label>
                            <Input
                                value={licenseNumber}
                                maxLength={50}
                                disabled={locked}
                                onChange={(e) =>
                                    setLicenseNumber(e.target.value)
                                }
                            />
                        </div>
                        <div>
                            <Label className="mb-1 block text-sm font-medium">
                                Mobile / Contact No. *
                            </Label>
                            <Input
                                value={mobileNumber}
                                maxLength={20}
                                inputMode="tel"
                                disabled={locked}
                                onChange={(e) =>
                                    setMobileNumber(e.target.value)
                                }
                            />
                        </div>
                        <div>
                            <Label className="mb-1 block text-sm font-medium">
                                Gender
                            </Label>
                            <Select
                                value={gender}
                                onValueChange={setGender}
                                disabled={locked || optionsQuery.isPending}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select gender..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {(optionsQuery.data?.genders ?? []).map(
                                        (g) => (
                                            <SelectItem key={g.id} value={g.id}>
                                                {g.name}
                                            </SelectItem>
                                        ),
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="mb-1 block text-sm font-medium">
                                Personal Email Address
                            </Label>
                            <Input
                                type="email"
                                value={personalEmail}
                                maxLength={150}
                                disabled={locked}
                                onChange={(e) =>
                                    setPersonalEmail(e.target.value)
                                }
                            />
                        </div>
                        <div>
                            <Label className="mb-1 block text-sm font-medium">
                                Branch (Posting){isEdit ? " *" : ""}
                            </Label>
                            <CustomSelect
                                options={optionsQuery.data?.branches ?? []}
                                value={branchId}
                                onChange={setBranchId}
                                disabled={locked || optionsQuery.isPending}
                                placeholder={
                                    optionsQuery.isPending
                                        ? "Loading..."
                                        : "Select branch..."
                                }
                            />
                            <p className="text-muted-foreground mt-1 text-xs">
                                Only branches with an attendance tablet are
                                listed.
                            </p>
                        </div>
                        <div>
                            <Label className="mb-1 block text-sm font-medium">
                                Schedule{isEdit ? " *" : ""}
                            </Label>
                            <Select
                                value={scheduleId}
                                onValueChange={setScheduleId}
                                disabled={locked || optionsQuery.isPending}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select schedule..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {schedules.map((s) => (
                                        <SelectItem
                                            key={s.id}
                                            value={String(s.id)}
                                        >
                                            {s.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {optionsQuery.isSuccess &&
                                schedules.length === 0 && (
                                    <p className="mt-1 text-xs text-red-400">
                                        No security schedules are set up yet.
                                        Ask Atlas HR to add one.
                                    </p>
                                )}
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="flex justify-end space-x-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate("/security-roster")}
                    >
                        Back
                    </Button>
                    {!locked && (
                        <Button
                            onClick={handleSubmit}
                            disabled={saveMutation.isPending}
                            className="flex items-center gap-2 bg-yellow-500 text-white hover:bg-yellow-600"
                        >
                            {saveMutation.isPending ? (
                                <>
                                    <Spinner className="h-4 w-4" />
                                    Saving...
                                </>
                            ) : (
                                "Save"
                            )}
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </ParentComponent>
    );
}
