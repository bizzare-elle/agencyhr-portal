"use client";

import * as React from "react";
import { Calendar1Icon } from "lucide-react";
import { format, isBefore, isAfter } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from "@/components/ui/form";
import { ControllerRenderProps } from "react-hook-form";

interface DateTimeFieldProps {
    name: string;
    label: string;
    control: any;
    minDate?: Date;
    maxDate?: Date;
    isDateAllowed?: (date: Date) => boolean;
}

export function DateTimeField({
    name,
    label,
    control,
    minDate,
    maxDate,
    isDateAllowed,
}: DateTimeFieldProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const hours = Array.from({ length: 12 }, (_, i) => i + 1);

    return (
        <FormField
            control={control}
            name={name}
            render={({ field }: { field: ControllerRenderProps }) => {
                const date = field.value ? new Date(field.value) : undefined;

                const handleDateSelect = (selectedDate: Date | undefined) => {
                    if (selectedDate) {
                        // ✅ Enforce cutoff restriction
                        if (
                            (minDate && isBefore(selectedDate, minDate)) ||
                            (maxDate && isAfter(selectedDate, maxDate))
                        ) {
                            alert(
                                "Selected date is outside the allowed cutoff period.",
                            );
                            return;
                        }

                        const formatted = format(
                            selectedDate,
                            "yyyy-MM-dd HH:mm:ss",
                        );
                        field.onChange(formatted);
                    }
                };

                const handleTimeChange = (
                    type: "hour" | "minute" | "ampm",
                    value: string,
                ) => {
                    if (date) {
                        const newDate = new Date(date);
                        if (type === "hour") {
                            newDate.setHours(
                                (parseInt(value) % 12) +
                                    (newDate.getHours() >= 12 ? 12 : 0),
                            );
                        } else if (type === "minute") {
                            newDate.setMinutes(parseInt(value));
                        } else if (type === "ampm") {
                            const currentHours = newDate.getHours();
                            newDate.setHours(
                                value === "PM" && currentHours < 12
                                    ? currentHours + 12
                                    : value === "AM" && currentHours >= 12
                                      ? currentHours - 12
                                      : currentHours,
                            );
                        }

                        // ✅ Re-validate if new time changes cutoff bounds
                        if (
                            (minDate && isBefore(newDate, minDate)) ||
                            (maxDate && isAfter(newDate, maxDate))
                        ) {
                            alert(
                                "Selected time falls outside the current cutoff period.",
                            );
                            return;
                        }

                        const formatted = format(
                            newDate,
                            "yyyy-MM-dd HH:mm:ss",
                        );
                        field.onChange(formatted);
                    }
                };

                return (
                    <FormItem className="space-y-1">
                        <FormLabel>{label}</FormLabel>
                        <FormControl>
                            <Popover open={isOpen} onOpenChange={setIsOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !date && "text-muted-foreground",
                                        )}
                                    >
                                        <Calendar1Icon className="mr-2 h-4 w-4" />
                                        {date ? (
                                            format(date, "yyyy-MM-dd HH:mm:ss")
                                        ) : (
                                            <span>Select Date and Time</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <div className="sm:flex">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={handleDateSelect}
                                            // disabled={(date) => {
                                            //     if (!date) return false;
                                            //     const beforeMin = minDate
                                            //         ? isBefore(date, minDate)
                                            //         : false;
                                            //     const afterMax = maxDate
                                            //         ? isAfter(date, maxDate)
                                            //         : false;
                                            //     return beforeMin || afterMax;
                                            // }}
                                            disabled={(date) => {
                                                if (!isDateAllowed)
                                                    return false;

                                                return !isDateAllowed(date);
                                            }}
                                        />
                                        <div className="flex flex-col divide-y sm:h-[300px] sm:flex-row sm:divide-x sm:divide-y-0">
                                            {/* Hours */}
                                            <ScrollArea className="w-64 sm:w-auto">
                                                <div className="flex sm:flex-col">
                                                    {hours
                                                        .reverse()
                                                        .map((hour) => (
                                                            <Button
                                                                key={hour}
                                                                size="icon"
                                                                variant={
                                                                    date &&
                                                                    date.getHours() %
                                                                        12 ===
                                                                        hour %
                                                                            12
                                                                        ? "default"
                                                                        : "ghost"
                                                                }
                                                                className="aspect-square shrink-0 sm:w-full"
                                                                onClick={() =>
                                                                    handleTimeChange(
                                                                        "hour",
                                                                        hour.toString(),
                                                                    )
                                                                }
                                                            >
                                                                {hour}
                                                            </Button>
                                                        ))}
                                                </div>
                                                <ScrollBar
                                                    orientation="horizontal"
                                                    className="sm:hidden"
                                                />
                                            </ScrollArea>

                                            {/* Minutes */}
                                            <ScrollArea className="w-64 sm:w-auto">
                                                <div className="flex p-2 sm:flex-col">
                                                    {Array.from(
                                                        { length: 60 },
                                                        (_, i) => i,
                                                    ).map((minute) => (
                                                        <Button
                                                            key={minute}
                                                            size="icon"
                                                            variant={
                                                                date &&
                                                                date.getMinutes() ===
                                                                    minute
                                                                    ? "default"
                                                                    : "ghost"
                                                            }
                                                            className="aspect-square shrink-0 sm:w-full"
                                                            onClick={() =>
                                                                handleTimeChange(
                                                                    "minute",
                                                                    minute.toString(),
                                                                )
                                                            }
                                                        >
                                                            {minute
                                                                .toString()
                                                                .padStart(
                                                                    2,
                                                                    "0",
                                                                )}
                                                        </Button>
                                                    ))}
                                                </div>
                                                <ScrollBar
                                                    orientation="horizontal"
                                                    className="sm:hidden"
                                                />
                                            </ScrollArea>

                                            {/* AM/PM */}
                                            <ScrollArea>
                                                <div className="flex p-2 sm:flex-col">
                                                    {["AM", "PM"].map(
                                                        (ampm) => (
                                                            <Button
                                                                key={ampm}
                                                                size="icon"
                                                                variant={
                                                                    date &&
                                                                    ((ampm ===
                                                                        "AM" &&
                                                                        date.getHours() <
                                                                            12) ||
                                                                        (ampm ===
                                                                            "PM" &&
                                                                            date.getHours() >=
                                                                                12))
                                                                        ? "default"
                                                                        : "ghost"
                                                                }
                                                                className="aspect-square shrink-0 sm:w-full"
                                                                onClick={() =>
                                                                    handleTimeChange(
                                                                        "ampm",
                                                                        ampm,
                                                                    )
                                                                }
                                                            >
                                                                {ampm}
                                                            </Button>
                                                        ),
                                                    )}
                                                </div>
                                            </ScrollArea>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                );
            }}
        />
    );
}
