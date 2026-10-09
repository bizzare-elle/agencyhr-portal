import { ParentComponent } from "@/components/parent-container";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/axios";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { ApiResponse } from "@/index";
import FullPageLoader from "@/components/page-loader";
import {
    Table,
    TableCell,
    TableBody,
    TableHeader,
    TableRow,
    TableHead,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { formatToPeso } from "@/helpers/formatToPeso";
import { format } from "date-fns";
import { IconReceipt } from "@tabler/icons-react";

interface PayslipRecord {
    id: string;
    period_from: string;
    period_to: string;
    basic_pay: string;
    overtime_pay: string;
    allowance: string;
    gross_pay: string;
    sss: string;
    philhealth: string;
    pagibig: string;
    tax: string;
    other_deductions: string;
    total_deductions: string;
    net_pay: string;
    status: string;
}

interface PayslipResponse {
    payslips: PayslipRecord[];
}

function fmt(val: string | number) {
    return formatToPeso(parseFloat(String(val)) || 0);
}

function periodLabel(from: string, to: string) {
    return `${format(new Date(from + "T00:00:00"), "MMM d")} – ${format(new Date(to + "T00:00:00"), "MMM d, yyyy")}`;
}

export default function PayslipDashboard() {
    const [selectedId, setSelectedId] = useState<string>("all");

    const meQuery = useQuery({
        queryKey: ["me"],
        queryFn: async () => {
            const res = await api.get<
                ApiResponse<{
                    hr_id: string;
                    name: string;
                    id_number?: string;
                    primary_branch_name?: string;
                    agency_name?: string;
                }>
            >("/api/v2/auth/me");
            return res.data.data;
        },
    });

    const employeeId = meQuery.data?.hr_id;

    const payslipQuery = useQuery({
        queryKey: ["payslips", employeeId],
        queryFn: async () => {
            const res = await api.get<ApiResponse<PayslipResponse>>(
                `/api/v2/payslips/${employeeId}`,
            );
            return res.data.data ?? { payslips: [] };
        },
        enabled: !!employeeId,
    });

    const CUTOFF = "2026-07-01";
    const records: PayslipRecord[] = (payslipQuery.data?.payslips ?? []).filter(
        (r) => r.period_from >= CUTOFF,
    );

    const selected = useMemo(
        () =>
            selectedId === "all"
                ? null
                : (records.find((r) => r.id === selectedId) ?? null),
        [selectedId, records],
    );

    const displayed = selected ? [selected] : records;

    const totalNet = useMemo(
        () => displayed.reduce((s, r) => s + parseFloat(r.net_pay || "0"), 0),
        [displayed],
    );

    const me = meQuery.data;

    if (meQuery.isLoading || payslipQuery.isLoading) return <FullPageLoader />;

    return (
        <ParentComponent>
            {/* Header card */}
            <div className="mb-5 w-full px-3 sm:px-0">
                <Card className="rounded-xl border p-4 shadow-sm sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-center sm:text-left">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-yellow-500/20 text-lg font-bold text-yellow-400 sm:h-16 sm:w-16 sm:text-2xl">
                                {me?.name?.charAt(0) ?? "?"}
                            </div>
                            <div>
                                <div className="flex flex-col items-center gap-1 sm:flex-row sm:gap-2">
                                    <h1 className="text-base font-bold tracking-wide sm:text-lg md:text-xl">
                                        {me?.name ?? "N/A"}
                                    </h1>
                                    {me?.agency_name && (
                                        <Badge className="text-xs sm:text-sm">
                                            {me.agency_name}
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
                                    ID: {me?.id_number ?? "N/A"} &bull;{" "}
                                    {me?.primary_branch_name ?? "N/A"}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col items-center sm:items-end">
                            <p className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
                                {selected ? "Net Pay" : "Total Net Pay"}
                            </p>
                            <p className="text-2xl font-bold text-green-400 sm:text-3xl">
                                {fmt(totalNet)}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="w-full px-3 sm:px-0">
                <Card className="p-3 sm:p-5">
                    <CardHeader className="pb-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                    <IconReceipt className="text-primary size-5" />
                                    Salary Payslips
                                </CardTitle>
                                <CardDescription className="mt-0.5 text-sm">
                                    Semi-monthly payroll records
                                </CardDescription>
                            </div>

                            {records.length > 0 && (
                                <div className="w-full sm:w-auto">
                                    <label className="mb-1 block text-sm font-medium">
                                        Select Period
                                    </label>
                                    <Select
                                        value={selectedId}
                                        onValueChange={setSelectedId}
                                    >
                                        <SelectTrigger className="w-full sm:w-[260px]">
                                            <SelectValue placeholder="Select period..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All Periods
                                            </SelectItem>
                                            {records.map((r) => (
                                                <SelectItem
                                                    key={r.id}
                                                    value={r.id}
                                                >
                                                    {periodLabel(
                                                        r.period_from,
                                                        r.period_to,
                                                    )}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    </CardHeader>

                    <CardContent className="overflow-x-auto">
                        <div className="border-border w-full overflow-x-auto rounded-md border">
                            <Table className="min-w-[820px] text-xs sm:text-sm">
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="px-3 py-3 text-[11px] font-semibold tracking-wider uppercase">
                                            Period
                                        </TableHead>
                                        <TableHead className="px-3 py-3 text-right text-[11px] font-semibold tracking-wider uppercase">
                                            Basic Pay
                                        </TableHead>
                                        <TableHead className="px-3 py-3 text-right text-[11px] font-semibold tracking-wider uppercase">
                                            OT Pay
                                        </TableHead>
                                        <TableHead className="px-3 py-3 text-right text-[11px] font-semibold tracking-wider uppercase">
                                            Allowance
                                        </TableHead>
                                        <TableHead className="px-3 py-3 text-right text-[11px] font-semibold tracking-wider uppercase">
                                            Gross Pay
                                        </TableHead>
                                        <TableHead className="px-3 py-3 text-right text-[11px] font-semibold tracking-wider uppercase">
                                            Deductions
                                        </TableHead>
                                        <TableHead className="px-3 py-3 text-right text-[11px] font-semibold tracking-wider uppercase">
                                            Net Pay
                                        </TableHead>
                                        <TableHead className="px-3 py-3 text-center text-[11px] font-semibold tracking-wider uppercase">
                                            Status
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {displayed.length > 0 ? (
                                        displayed.map((r) => (
                                            <TableRow
                                                key={r.id}
                                                className="hover:bg-muted/10"
                                            >
                                                <TableCell className="px-3 py-3 font-medium">
                                                    {periodLabel(
                                                        r.period_from,
                                                        r.period_to,
                                                    )}
                                                </TableCell>
                                                <TableCell className="px-3 py-3 text-right">
                                                    {fmt(r.basic_pay)}
                                                </TableCell>
                                                <TableCell className="px-3 py-3 text-right">
                                                    {fmt(r.overtime_pay)}
                                                </TableCell>
                                                <TableCell className="px-3 py-3 text-right">
                                                    {fmt(r.allowance)}
                                                </TableCell>
                                                <TableCell className="text-primary px-3 py-3 text-right font-semibold">
                                                    {fmt(r.gross_pay)}
                                                </TableCell>
                                                <TableCell className="px-3 py-3 text-right text-red-400">
                                                    ({fmt(r.total_deductions)})
                                                </TableCell>
                                                <TableCell className="px-3 py-3 text-right font-bold text-green-400">
                                                    {fmt(r.net_pay)}
                                                </TableCell>
                                                <TableCell className="px-3 py-3 text-center">
                                                    <span
                                                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                                            r.status ===
                                                            "released"
                                                                ? "bg-green-500/10 text-green-400"
                                                                : r.status ===
                                                                    "pending"
                                                                  ? "bg-yellow-500/10 text-yellow-400"
                                                                  : "bg-muted text-muted-foreground"
                                                        }`}
                                                    >
                                                        {r.status ?? "—"}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={8}
                                                className="text-muted-foreground py-12 text-center"
                                            >
                                                No payslip records found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                                {displayed.length > 1 && (
                                    <tfoot>
                                        <TableRow className="bg-muted/30 border-t-2">
                                            <TableCell
                                                className="px-3 py-3 font-bold"
                                                colSpan={6}
                                            >
                                                Total ({displayed.length}{" "}
                                                periods)
                                            </TableCell>
                                            <TableCell className="px-3 py-3 text-right font-bold text-green-400">
                                                {fmt(totalNet)}
                                            </TableCell>
                                            <TableCell />
                                        </TableRow>
                                    </tfoot>
                                )}
                            </Table>
                        </div>

                        {/* Deduction breakdown — shown when a single period is selected */}
                        {selected && (
                            <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                <Card className="bg-card border">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-primary text-sm font-semibold">
                                            Earnings
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 text-sm">
                                        <Row
                                            label="Basic Pay"
                                            value={fmt(selected.basic_pay)}
                                        />
                                        <Row
                                            label="Overtime Pay"
                                            value={fmt(selected.overtime_pay)}
                                        />
                                        <Row
                                            label="Allowance"
                                            value={fmt(selected.allowance)}
                                        />
                                        <div className="border-border border-t pt-2">
                                            <Row
                                                label="Gross Pay"
                                                value={fmt(selected.gross_pay)}
                                                bold
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-card border">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-semibold text-red-400">
                                            Deductions
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 text-sm">
                                        <Row
                                            label="SSS"
                                            value={fmt(selected.sss)}
                                        />
                                        <Row
                                            label="PhilHealth"
                                            value={fmt(selected.philhealth)}
                                        />
                                        <Row
                                            label="Pag-IBIG"
                                            value={fmt(selected.pagibig)}
                                        />
                                        <Row
                                            label="Tax"
                                            value={fmt(selected.tax)}
                                        />
                                        {parseFloat(selected.other_deductions) >
                                            0 && (
                                            <Row
                                                label="Other"
                                                value={fmt(
                                                    selected.other_deductions,
                                                )}
                                            />
                                        )}
                                        <div className="border-border border-t pt-2">
                                            <Row
                                                label="Total Deductions"
                                                value={fmt(
                                                    selected.total_deductions,
                                                )}
                                                bold
                                                red
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="sm:col-span-2">
                                    <Card className="border border-green-500/20 bg-green-500/5">
                                        <CardContent className="flex items-center justify-between px-5 py-4">
                                            <span className="text-foreground font-semibold">
                                                Net Pay
                                            </span>
                                            <span className="text-2xl font-bold text-green-400">
                                                {fmt(selected.net_pay)}
                                            </span>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </ParentComponent>
    );
}

function Row({
    label,
    value,
    bold,
    red,
}: {
    label: string;
    value: string;
    bold?: boolean;
    red?: boolean;
}) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{label}</span>
            <span
                className={`${bold ? "font-bold" : "font-medium"} ${red ? "text-red-400" : "text-foreground"}`}
            >
                {value}
            </span>
        </div>
    );
}
