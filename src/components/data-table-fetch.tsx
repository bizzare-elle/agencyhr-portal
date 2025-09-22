import React, { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    Loader2,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface Column<T> {
    key: keyof T | string;
    label?: string;
    header?: React.ReactNode;
    render?: (row: T) => React.ReactNode;
    sortable?: boolean;
}

interface ApiResponse<T> {
    data: T[];
    total: number;
}

interface DataTableProps<T> {
    apiUrl: string;
    columns: Column<T>[];
}

export default function DataTableFetch<T extends Record<string, any>>({
    apiUrl,
    columns,
}: DataTableProps<T>) {
    const [page, setPage] = useState(1);
    const [limit] = useState(25);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState<string | null>("id");
    const [order, setOrder] = useState<"asc" | "desc">("desc");

    const { data, isLoading, isError } = useQuery<ApiResponse<T>>({
        queryKey: ["data", apiUrl, page, limit, search, sortBy, order],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                search,
                ...(sortBy ? { sortBy, order } : {}),
            });
            const response = await api.get(`${apiUrl}?${params.toString()}`);

            return response.data;
        },
    });

    const totalPages = data?.total ? Math.ceil(data.total / limit) : 1;

    const handleSort = (colKey: string) => {
        if (sortBy === colKey) {
            setOrder(order === "asc" ? "desc" : "asc");
        } else {
            setSortBy(colKey);
            setOrder("asc");
        }
    };

    return (
        <div className="w-full space-y-6">
            {/* Search Bar */}
            <div className="flex max-w-sm items-center gap-2">
                <Search className="text-muted-foreground h-4 w-4" />
                <Input
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => {
                        setPage(1);
                        setSearch(e.target.value);
                    }}
                    className="rounded-2xl"
                />
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
                </div>
            ) : isError ? (
                <div className="py-10 text-center font-medium text-red-500">
                    Error loading data
                </div>
            ) : (
                <div className="overflow-hidden rounded-2xl border shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                {columns.map((col) => (
                                    <TableHead
                                        key={String(col.key)}
                                        className={
                                            col.sortable !== false
                                                ? "cursor-pointer font-semibold select-none"
                                                : "font-semibold"
                                        }
                                        onClick={() =>
                                            col.sortable !== false &&
                                            handleSort(String(col.key))
                                        }
                                    >
                                        {col.header ? (
                                            col.header
                                        ) : (
                                            <div className="flex items-center gap-1">
                                                {col.label}
                                                {col.sortable !== false && (
                                                    <ArrowUpDown
                                                        className={`h-3 w-3 ${
                                                            sortBy === col.key
                                                                ? "text-foreground"
                                                                : "text-muted-foreground"
                                                        }`}
                                                    />
                                                )}
                                            </div>
                                        )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data?.data?.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.length}
                                        className="text-muted-foreground py-6 text-center"
                                    >
                                        No results found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data?.data?.map((row, i) => (
                                    <TableRow
                                        key={i}
                                        className="hover:bg-muted/30 transition-colors"
                                    >
                                        {columns.map((col) => (
                                            <TableCell key={String(col.key)}>
                                                {col.render
                                                    ? col.render(row)
                                                    : row[col.key as keyof T]}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between pt-4">
                <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    className="rounded-full"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-muted-foreground text-sm">
                    Page {page} of {totalPages}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded-full"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
