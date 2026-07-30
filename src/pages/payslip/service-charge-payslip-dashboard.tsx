import { ParentComponent } from "@/components/parent-container";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/axios";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { ApiResponse, Employee } from "@/index";
import { Button } from "@/components/ui/button";
import FullPageLoader from "@/components/page-loader";
import {
    Table,
    TableCell,
    TableBody,
    TableHeader,
    TableRow,
    TableHead,
} from "@/components/ui/table";
import { isAfter, isBefore, getDay, format, getDaysInMonth, addMonths, addDays } from "date-fns";
import { PrintSCPayslip } from "@/components/employees/print-service-charge-payslip";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { formatToPeso } from "@/helpers/formatToPeso";

interface ScRecord {
    id: string;
    date: string;
    primary_branch_id: string;
    employee_id: string;
    total_billed_hours: string;
    is_late: string;
    sc_amount_gross: string;
    sc_amount_net: string;
    computation: string | null;
    created_at: string;
    branch_name: string;
    amount_net: string;
}

interface ScPayslipResponse {
    sc_data: ScRecord[];
}

function parseComputation(comp: string | null): { pool: number | null; totalHrs: number | null } {
    if (!comp) return { pool: null, totalHrs: null };
    const match = comp.match(/[₱]([\d,]+\.?\d*)\s*÷\s*([\d,]+\.?\d*)\s*hrs/);
    if (!match) return { pool: null, totalHrs: null };
    return {
        pool: parseFloat(match[1].replace(/,/g, "")),
        totalHrs: parseFloat(match[2].replace(/,/g, "")),
    };
}

function isWeekend(dateStr: string) {
    const day = getDay(new Date(dateStr + "T00:00:00"));
    return day === 0 || day === 6;
}

export default function ServiceChargePayslipDashboard() {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [sortOption, setSortOption] = useState("oldest");
    const [selectedCutoff, setSelectedCutoff] = useState("all");

    const meQuery = useQuery({
        queryKey: ["me"],
        queryFn: async () => {
            const response = await api.get<ApiResponse<{
                hr_id: string;
                name: string;
                id_number?: string;
                primary_branch_name?: string;
                agency_name?: string;
            }>>(
                `/api/v2/auth/me`,
            );
            return response.data.data;
        },
    });

    const employeeId = meQuery.data?.hr_id;

    const employeeQuery = useQuery({
        queryKey: ["employee", employeeId],
        queryFn: async () => {
            const res = await api.get<ApiResponse<Employee>>(`/api/v2/employees/${employeeId}`);
            return res.data.data;
        },
        enabled: !!employeeId,
        staleTime: 1000 * 60 * 10,
    });

    const scQuery = useQuery({
        queryKey: ["scPayslip", employeeId],
        queryFn: async () => {
            const res = await api.get<ApiResponse<ScPayslipResponse>>(
                `/api/v2/sc-payslip-records/${employeeId}`,
            );
            return res.data.data ?? { sc_data: [] };
        },
        enabled: !!employeeId,
    });

    const employee = employeeQuery.data;
    const employeeName = employee?.name ?? meQuery.data?.name;
    const employeeIdNumber =  meQuery.data?.id_number ;
    const employeeBranch = meQuery.data?.primary_branch_name;
    const employeeAgency = meQuery.data?.agency_name;
    const SC_CUTOFF = "2026-07-01";
    const records: ScRecord[] = (scQuery.data?.sc_data ?? []).filter(
        (r) => r.date >= SC_CUTOFF,
    );

    // Build cutoff periods from the actual records (1–15 and 16–end per month)
    const cutoffPeriods = useMemo(() => {
        const months = new Set<string>();
        records.forEach((r) => {
            const d = new Date(r.date + "T00:00:00");
            months.add(format(d, "yyyy-MM"));
        });
        const periods: { value: string; label: string; from: string; to: string }[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        Array.from(months).sort().reverse().forEach((ym) => {
            const [y, m] = ym.split("-").map(Number);
            const daysInMonth = getDaysInMonth(new Date(y, m - 1));
            const pad = (n: number) => String(n).padStart(2, "0");
            const monthName = format(new Date(y, m - 1), "MMMM");

            // 1st cutoff: ends on the 15th, releases 2 months later, visible 1 day before release
            const end1 = new Date(y, m - 1, 15);
            const visibleFrom1 = addDays(addMonths(end1, 2), 1);
            if (!isAfter(visibleFrom1, today)) {
                periods.push({
                    value: `${ym}-1`,
                    label: `${monthName} 1-15, ${y}`,
                    from: `${ym}-01`,
                    to: `${ym}-15`,
                });
            }

            // 2nd cutoff: ends on last day, releases 2 months later, visible 1 day before release
            const end2 = new Date(y, m - 1, daysInMonth);
            const visibleFrom2 = addDays(addMonths(end2, 2), 1);
            if (!isAfter(visibleFrom2, today)) {
                periods.push({
                    value: `${ym}-2`,
                    label: `${monthName} 16-${daysInMonth}, ${y}`,
                    from: `${ym}-16`,
                    to: `${ym}-${pad(daysInMonth)}`,
                });
            }
        });
        return periods;
    }, [records]);

    const selectedPeriod = cutoffPeriods.find((p) => p.value === selectedCutoff);

    const filteredData = useMemo(() => {
        let data = [...records];

        if (selectedCutoff !== "all" && selectedPeriod) {
            const from = new Date(selectedPeriod.from + "T00:00:00");
            const to = new Date(selectedPeriod.to + "T00:00:00");
            data = data.filter((item) => {
                const date = new Date(item.date + "T00:00:00");
                return !isBefore(date, from) && !isAfter(date, to);
            });
        }

        if (sortOption === "newest") {
            data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        } else if (sortOption === "oldest") {
            data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        } else if (sortOption === "highest") {
            data.sort((a, b) => parseFloat(b.sc_amount_gross) - parseFloat(a.sc_amount_gross));
        } else if (sortOption === "lowest") {
            data.sort((a, b) => parseFloat(a.sc_amount_gross) - parseFloat(b.sc_amount_gross));
        }

        return data;
    }, [records, sortOption, selectedCutoff, selectedPeriod]);

    const totalNetSC = useMemo(
        () => filteredData.reduce((sum, r) => sum + parseFloat(r.sc_amount_net || "0"), 0),
        [filteredData],
    );

    const totalEmpHrs = useMemo(
        () => filteredData.reduce((sum, r) => sum + parseFloat(r.total_billed_hours || "0"), 0),
        [filteredData],
    );

    const totalPages = Math.ceil(filteredData.length / pageSize);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize,
    );

    const renderPageNumbers = () => {
        if (totalPages <= 1) return null;
        const pages: (number | string)[] = [];
        const maxVisible = 3;
        let start = Math.max(currentPage - 2, 1);
        let end = Math.min(start + maxVisible - 1, totalPages);
        if (end - start + 1 < maxVisible) start = Math.max(end - maxVisible + 1, 1);
        if (start > 1) { pages.push(1); if (start > 2) pages.push("..."); }
        for (let i = start; i <= end; i++) pages.push(i);
        if (end < totalPages) { if (end < totalPages - 1) pages.push("..."); pages.push(totalPages); }

        return pages.map((page, index) =>
            typeof page === "number" ? (
                <Button key={page} size="sm" variant={currentPage === page ? "default" : "outline"} onClick={() => setCurrentPage(page)}>
                    {page}
                </Button>
            ) : (
                <span key={"ellipsis-" + index} className="px-2">{page}</span>
            ),
        );
    };

    if (meQuery.isLoading || employeeQuery.isLoading || scQuery.isLoading)
        return <FullPageLoader />;

    if (meQuery.isError || scQuery.isError)
        return (
            <ParentComponent>
                <div className="text-center text-2xl font-bold">Error fetching data.</div>
            </ParentComponent>
        );

    return (
        <ParentComponent>
            {/* Employee Header — screen only */}
            <div className="no-print mb-5 w-full px-3 sm:px-0">
                <Card className="rounded-xl border p-4 shadow-sm sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-center sm:text-left">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-yellow-500/20 text-lg font-bold text-yellow-400 sm:h-16 sm:w-16 sm:text-2xl">
                                {employeeName?.charAt(0) ?? "?"}
                            </div>
                            <div>
                                <div className="flex flex-col items-center gap-1 sm:flex-row sm:gap-2">
                                    <h1 className="text-base font-bold tracking-wide sm:text-lg md:text-xl">
                                        {employeeName ?? "N/A"}
                                    </h1>
                                    {employeeAgency && (
                                        <Badge className="text-xs sm:text-sm">{employeeAgency}</Badge>
                                    )}
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                                    ID: {employeeIdNumber ?? "N/A"} •{" "} {employeeBranch ?? "N/A"}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col items-center sm:items-end">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Total Net SC</p>
                            <p className="text-2xl font-bold text-green-400 sm:text-3xl">
                                {formatToPeso(totalNetSC)}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="w-full px-3 sm:px-0">
                {/* Print-only header */}
                <div className="print-only mb-5 hidden">
                    <div className="flex items-start justify-between border-b border-gray-300 pb-3">
                        <div>
                            <h1 className="text-lg font-bold">{employeeName}</h1>
                            <p className="text-xs text-gray-600">
                                Emp No: {employeeIdNumber} | Home Branch: {employeeBranch}
                                {employeeAgency ? " | Agency: " + employeeAgency : ""}
                            </p>
                            {selectedPeriod && (
                                <p className="text-xs text-gray-600">
                                    Cut-off: {selectedPeriod.label}
                                </p>
                            )}
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] uppercase tracking-widest text-gray-500">Total Net SC</p>
                            <p className="text-xl font-bold">{formatToPeso(totalNetSC)}</p>
                        </div>
                    </div>
                </div>

                <Card className="p-3 sm:p-5">
                    <CardHeader className="pb-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <CardTitle className="text-base sm:text-lg">Service Charge Records</CardTitle>
                                <CardDescription className="text-sm sm:text-base">Daily service charge breakdown</CardDescription>
                            </div>

                            <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-end">
                                <div className="w-full sm:w-auto">
                                    <label className="mb-1 block text-sm font-medium">Service Charge Payout Period</label>
                                    <Select
                                        value={selectedCutoff}
                                        onValueChange={(v) => { setSelectedCutoff(v); setCurrentPage(1); }}
                                    >
                                        <SelectTrigger className="w-full sm:w-[240px]">
                                            <SelectValue placeholder="Select cut-off..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Records</SelectItem>
                                            {cutoffPeriods.map((p) => (
                                                <SelectItem key={p.value} value={p.value}>
                                                    {p.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="w-full sm:w-auto">
                                    <label className="mb-1 block text-sm font-medium">Sort By</label>
                                    <Select value={sortOption} onValueChange={(v) => { setSortOption(v); setCurrentPage(1); }}>
                                        <SelectTrigger className="w-full sm:w-[155px]">
                                            <SelectValue placeholder="Sort by..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectLabel>By Date</SelectLabel>
                                                <SelectItem value="newest">Newest First</SelectItem>
                                                <SelectItem value="oldest">Oldest First</SelectItem>
                                            </SelectGroup>
                                            <SelectGroup>
                                                <SelectLabel>By Amount</SelectLabel>
                                                <SelectItem value="highest">Highest Amount</SelectItem>
                                                <SelectItem value="lowest">Lowest Amount</SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="w-full sm:w-auto sm:self-end">
                                    <PrintSCPayslip
                                        tableId="sc-payslip-table"
                                        employeeName={employeeName ?? ""}
                                        isHrEmployee={true}
                                        idNumber={employeeIdNumber ?? null}
                                        agencyName={employeeAgency}
                                        branchName={employeeBranch}
                                        queryFrom={selectedPeriod?.from}
                                        queryTo={selectedPeriod?.to}
                                        records={filteredData}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="overflow-x-auto">
                        <div className="border-border w-full overflow-x-auto rounded-md border">
                            <Table id="sc-payslip-table" className="min-w-[920px] text-xs sm:text-sm">
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wider">Date</TableHead>
                                        <TableHead className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wider">Branch / Allocation</TableHead>
                                        <TableHead className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wider">Daily SC Pool</TableHead>
                                        <TableHead className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wider">Total Day Hrs</TableHead>
                                        <TableHead className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wider">Employee Hrs</TableHead>
                                        <TableHead className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wider">Computation</TableHead>
                                        <TableHead className="px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-wider">SC Payout</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedData.length > 0 ? (
                                        paginatedData.map((r) => {
                                            const { pool, totalHrs } = parseComputation(r.computation);
                                            const weekend = isWeekend(r.date);
                                            const dateObj = new Date(r.date + "T00:00:00");
                                            const dayLabel = format(dateObj, "EEE, MMM d");

                                            return (
                                                <TableRow
                                                    key={r.id}
                                                    className={cn(
                                                        "transition",
                                                        weekend
                                                            ? "bg-yellow-500/5 hover:bg-yellow-500/10"
                                                            : "hover:bg-muted/10",
                                                    )}
                                                >
                                                    <TableCell className="px-3 py-3 text-center">
                                                        <div className="font-medium">{dayLabel}</div>
                                                        {weekend && (
                                                            <div className="text-[10px] font-semibold text-yellow-500">weekend</div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-3 py-3 text-center font-semibold">
                                                        {r.branch_name && r.branch_name !== "N/A"
                                                            ? r.branch_name
                                                            : (employeeAgency ?? "---")}
                                                    </TableCell>
                                                    <TableCell className="px-3 py-3 text-center text-primary">
                                                        {pool !== null ? formatToPeso(pool) : "---"}
                                                    </TableCell>
                                                    <TableCell className="px-3 py-3 text-center">
                                                        {totalHrs !== null ? totalHrs.toFixed(2) : "---"}
                                                    </TableCell>
                                                    <TableCell className="px-3 py-3 text-center">
                                                        {parseFloat(r.total_billed_hours).toFixed(2)}
                                                    </TableCell>
                                                    <TableCell className="px-3 py-3 text-center text-muted-foreground">
                                                        {r.computation ?? "---"}
                                                    </TableCell>
                                                    <TableCell className="px-3 py-3 text-right font-semibold">
                                                        {formatToPeso(parseFloat(r.sc_amount_net))}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                                                No records found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                                {filteredData.length > 0 && (
                                    <tfoot>
                                        <TableRow className="border-t-2 bg-muted/30">
                                            <TableCell className="px-3 py-3 font-bold" colSpan={4}>
                                                Total ({filteredData.length} day{filteredData.length !== 1 ? "s" : ""})
                                            </TableCell>
                                            <TableCell className="px-3 py-3 text-center font-bold text-green-400">
                                                {totalEmpHrs.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="px-3 py-3" />
                                            <TableCell className="px-3 py-3 text-right font-bold text-green-400">
                                                {formatToPeso(totalNetSC)}
                                            </TableCell>
                                        </TableRow>
                                    </tfoot>
                                )}
                            </Table>
                        </div>

                        <div className="no-print mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center justify-center gap-2 sm:justify-start">
                                <Label htmlFor="pageSize" className="text-sm text-muted-foreground">Rows per page:</Label>
                                <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}>
                                    <SelectTrigger id="pageSize" className="w-[80px] border border-input bg-background text-foreground">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[10, 25, 50, 100].map((size) => (
                                            <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center justify-center gap-2 sm:justify-end">
                                <Button size="sm" variant="outline" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
                                    Previous
                                </Button>
                                {renderPageNumbers()}
                                <Button size="sm" variant="outline" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage((p) => p + 1)}>
                                    Next
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    .print-only { display: block !important; }
                    [data-sidebar="sidebar"], [data-sidebar="trigger"], [data-sidebar="rail"] { display: none !important; }
                    [data-slot="sidebar-inset"] { margin: 0 !important; padding: 0 !important; width: 100% !important; }
                    body, html { background: white !important; }
                    h1, h2, h3, p, span, div, td, th, label { color: black !important; }
                    .text-green-400 { color: #166534 !important; }
                    .text-yellow-500 { color: #92400e !important; }
                    .text-muted-foreground { color: #6b7280 !important; }
                    .text-primary { color: #1d4ed8 !important; }
                    .text-foreground { color: black !important; }
                    .bg-card, .bg-muted, .bg-accent, .bg-muted\\/50, .bg-muted\\/30 { background: white !important; }
                    .border, .border-border { border-color: #d1d5db !important; }
                    .shadow-sm, .shadow { box-shadow: none !important; }
                    table { font-size: 10px !important; width: 100% !important; }
                    th, td { padding: 5px 8px !important; }
                }
            `}</style>
        </ParentComponent>
    );
}
