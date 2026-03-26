import { useQuery } from "@tanstack/react-query";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, XCircle, User, Copy, Check } from "lucide-react";
import api from "@/lib/axios";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmployeeOption {
    id: number;
    name: string;
}

interface EmployeeSelectProps {
    label?: string;
    apiUrl: string;
    value?: string;
    onChange: (value: string | undefined) => void;
    placeholder?: string;
    disabled?: boolean;
    allowClear?: boolean;
}

export default function EmployeeSearchSelect({
    label,
    apiUrl,
    value,
    onChange,
    placeholder = "Search employee name or ID...",
    disabled = false,
    allowClear = true,
}: EmployeeSelectProps) {
    const [search, setSearch] = useState("");
    const [copied, setCopied] = useState(false);

    const { data, isLoading, isError, error } = useQuery<EmployeeOption[]>({
        queryKey: ["employee-select", apiUrl],
        queryFn: async () => {
            const res = await api.get(apiUrl);
            const payload = res.data?.data ?? res.data;
            return Array.isArray(payload) ? payload : [];
        },
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });

    const options = data ?? [];

    const filteredOptions = useMemo(() => {
        if (!search) return options;

        const term = search.toLowerCase();

        return options.filter((emp) => {
            const name = emp.name?.toLowerCase() ?? "";
            const id = String(emp.id);
            return name.includes(term) || id.includes(term);
        });
    }, [search, options]);

    const selectedEmployee = options.find((emp) => String(emp.id) === value);

    const copyEmployee = async () => {
        if (!selectedEmployee) return;

        const text = `${selectedEmployee.name} - ID: ${selectedEmployee.id}`;
        await navigator.clipboard.writeText(text);

        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex w-full max-w-md flex-col space-y-3">
            {label && (
                <label className="text-muted-foreground text-sm font-medium">
                    {label}
                </label>
            )}

            <Select
                value={value}
                disabled={disabled}
                onValueChange={(val) =>
                    val === "__clear__" ? onChange(undefined) : onChange(val)
                }
            >
                <SelectTrigger
                    className={cn(
                        "border-input bg-background w-full rounded-md border",
                        "hover:border-primary/50 focus:ring-primary/20 transition-all focus:ring-2",
                    )}
                >
                    <SelectValue
                        placeholder={
                            isLoading ? "Loading employees..." : placeholder
                        }
                    />
                </SelectTrigger>

                <SelectContent className="max-h-72 overflow-y-auto rounded-md border shadow-md">
                    {/* Search */}
                    <div className="bg-background sticky top-0 z-20 border-b p-2 shadow-sm">
                        <Input
                            placeholder="Search by name or ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-8 text-sm"
                        />
                    </div>

                    {/* Clear */}
                    {allowClear && value && (
                        <>
                            <SelectItem
                                value="__clear__"
                                className="text-destructive flex items-center gap-2 py-2"
                            >
                                <XCircle className="h-4 w-4" />
                                Clear selection
                            </SelectItem>
                            <div className="my-1 border-t" />
                        </>
                    )}

                    {/* Loading */}
                    {isLoading && (
                        <div className="text-muted-foreground flex items-center justify-center p-4 text-sm">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading employees...
                        </div>
                    )}

                    {/* Error */}
                    {isError && (
                        <div className="p-3 text-sm text-red-500">
                            Error: {(error as Error)?.message}
                        </div>
                    )}

                    {/* List */}
                    {!isLoading &&
                        !isError &&
                        filteredOptions.length > 0 &&
                        filteredOptions.map((emp) => (
                            <SelectItem
                                key={emp.id}
                                value={String(emp.id)}
                                className="flex items-center gap-2 py-2 text-sm"
                            >
                                <User className="text-muted-foreground h-4 w-4" />
                                <span>{emp.name}</span>
                                <span className="text-muted-foreground ml-auto text-xs">
                                    ID: {emp.id}
                                </span>
                            </SelectItem>
                        ))}

                    {!isLoading && !isError && filteredOptions.length === 0 && (
                        <div className="text-muted-foreground p-4 text-center text-sm">
                            No employees found
                        </div>
                    )}
                </SelectContent>
            </Select>

            {/* Selected Employee Display */}
            {selectedEmployee && (
                <div className="bg-muted/40 flex items-center justify-between rounded-md border p-3">
                    <div className="text-sm">
                        <p className="font-medium">{selectedEmployee.name}</p>
                        <p className="text-muted-foreground text-xs">
                            Employee ID: {selectedEmployee.id}
                        </p>
                    </div>

                    <Button
                        size="sm"
                        variant="outline"
                        onClick={copyEmployee}
                        className="flex items-center gap-1"
                    >
                        {copied ? (
                            <>
                                <Check className="h-4 w-4 text-green-500" />
                                Copied
                            </>
                        ) : (
                            <>
                                <Copy className="h-4 w-4" />
                                Copy
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}
