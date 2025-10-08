import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import {
    Table,
    TableHeader,
    TableHead,
    TableRow,
    TableBody,
    TableCell,
} from "./ui/table";
import { DateRangePicker } from "./ui/date-range-picker";
import moment from "moment";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { ApiResponse } from "..";
import { record } from "zod";
import { cn } from "@/lib/utils";

interface TimeRecord {
    id: string;
    employee_id: string;
    tr_date: string;
    total_hrs: string;
    total_hrs_late: string;
    total_overtime: string | null;
    schedule_name: string;
    schedule_time_in: string;
    schedule_time_out: string;
}

export default function TimeRecords() {
    const [datesToRender, setDatesToRender] = useState<Date[]>([]);

    const queryFrom = moment(datesToRender[0]).format("YYYY-MM-DD");
    const queryTo = moment(datesToRender[datesToRender.length - 1]).format(
        "YYYY-MM-DD",
    );

    const { data, isLoading } = useQuery({
        queryKey: ["time-records", queryFrom, queryTo],
        queryFn: async () => {
            const response = await api.get<
                ApiResponse<{ time_records: TimeRecord[] }>
            >(`/api/v2/time-records?from=${queryFrom}&to=${queryTo}`);

            return response.data.data;
        },
    });

    function getDatesInRange(from: Date, to: Date) {
        const dates: Date[] = [];

        let day = moment(from);
        const end = moment(to);

        while (day.isSameOrBefore(end)) {
            dates.push(new Date(day.format("YYYY-MM-DD")));
            day.add(1, "day");
        }

        return dates;
    }

    useEffect(() => {
        const startOfMonth = moment().startOf("month");
        const endOfMonth = moment().endOf("month");

        const initialDates = getDatesInRange(
            startOfMonth.toDate(),
            endOfMonth.toDate(),
        );

        setDatesToRender(initialDates);
    }, []);

    if (isLoading) {
        return "Loadingg";
    }

    return (
        <div>
            <div className="flex flex-col items-end justify-between gap-3 sm:flex-row">
                <CardTitle className="text-base font-semibold tracking-wide">
                    CUT-OFF COVERAGE : {moment(datesToRender[0]).format("LL")}{" "}
                    TO{" "}
                    {moment(datesToRender[datesToRender.length - 1]).format(
                        "LL",
                    )}
                </CardTitle>
                <DateRangePicker
                    initialDateFrom={datesToRender[0]}
                    initialDateTo={datesToRender[datesToRender.length - 1]}
                    onUpdate={(value) => {
                        setDatesToRender(
                            getDatesInRange(
                                value.range.from,
                                value.range.to || value.range.from,
                            ),
                        );
                    }}
                />
            </div>

            <div className="mt-2 overflow-x-auto rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="uppercase">Date</TableHead>
                            <TableHead className="uppercase">Day</TableHead>
                            <TableHead className="uppercase">Shift</TableHead>
                            <TableHead className="uppercase">In</TableHead>
                            <TableHead className="uppercase">Out</TableHead>
                            <TableHead className="uppercase">
                                Total Hours
                            </TableHead>
                            <TableHead className="uppercase">Remarks</TableHead>
                            <TableHead className="uppercase">Basic</TableHead>
                            <TableHead className="uppercase">
                                Undertime
                            </TableHead>
                            <TableHead className="uppercase">
                                Overtime
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {datesToRender.map((day, i) => {
                            const rowYearMonthDay =
                                moment(day).format("YYYY-MM-DD");

                            const record = data?.time_records.find(
                                (r) =>
                                    moment(r.tr_date).format("YYYY-MM-DD") ===
                                    rowYearMonthDay,
                            );

                            const scheduleName =
                                record && record.schedule_name
                                    ? record.schedule_name
                                    : "--";

                            return (
                                <TableRow key={i.toString()}>
                                    <TableCell>
                                        {moment(day).format("LL")}
                                    </TableCell>
                                    <TableCell>
                                        {moment(day).format("dddd")}
                                    </TableCell>
                                    <TableCell className={cn("font-bold")}>
                                        {scheduleName}
                                    </TableCell>
                                    <TableCell></TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
