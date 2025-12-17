import { useQuery } from "@tanstack/react-query";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import api from "@/lib/axios";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Option {
    id: string | number;
    name: string;
}

interface CustomSelectProps {
    label?: string;
    apiUrl: string;
    value: string | undefined;
    onChange: (value: string) => void;
    placeholder?: string;
}

export default function CustomSelect({
    label,
    apiUrl,
    value,
    onChange,
    placeholder = "Select an option...",
}: CustomSelectProps) {
    const [search, setSearch] = useState("");

    const { data, isLoading, isError, error } = useQuery<Option[]>({
        queryKey: ["custom-select", apiUrl],
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
        return options.filter((item) =>
            item.name.toLowerCase().includes(search.toLowerCase()),
        );
    }, [search, options]);

    return (
        <div className="flex flex-col space-y-2">
            {label && (
                <label className="text-muted-foreground text-sm font-medium">
                    {label}
                </label>
            )}

            <Select
                value={value}
                onValueChange={onChange}
                disabled={isLoading || isError}
            >
                <SelectTrigger
                    className={cn(
                        "border-input bg-background w-full rounded-md border",
                        "hover:border-primary/50 focus:ring-primary/20 transition-all focus:ring-2",
                    )}
                >
                    <SelectValue
                        placeholder={isLoading ? "Loading..." : placeholder}
                    />
                </SelectTrigger>

                <SelectContent className="border-border max-h-64 overflow-y-auto rounded-md border shadow-md">
                    <div className="bg-background border-border sticky top-0 z-10 border-b p-2">
                        <Input
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="border-input focus-visible:ring-primary/30 h-8 w-full rounded-md border text-sm"
                        />
                    </div>

                    {isLoading && (
                        <div className="text-muted-foreground flex items-center justify-center p-3 text-sm">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading options...
                        </div>
                    )}

                    {isError && (
                        <div className="p-3 text-sm text-red-500">
                            Error loading data: {(error as Error)?.message}
                        </div>
                    )}

                    {!isLoading && !isError && filteredOptions.length > 0
                        ? filteredOptions.map((item) => (
                              <SelectItem
                                  key={item.id}
                                  value={String(item.id)}
                                  className="hover:bg-accent hover:text-accent-foreground cursor-pointer py-2 text-sm transition-colors"
                              >
                                  {item.name}
                              </SelectItem>
                          ))
                        : !isLoading &&
                          !isError && (
                              <div className="text-muted-foreground p-3 text-center text-sm">
                                  No options found
                              </div>
                          )}
                </SelectContent>
            </Select>
        </div>
    );
}
