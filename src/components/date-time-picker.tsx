"use client";

import * as React from "react";
import { Calendar1Icon } from "lucide-react";
import { format } from "date-fns";

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
import { ControllerRenderProps, FieldValues } from "react-hook-form";

interface DateTimeFieldProps<T extends FieldValues> {
    name: keyof T;
    label: string;
    control: any;
}

export function DateTimeField<T extends FieldValues>({
    name,
    label,
    control,
}: DateTimeFieldProps<T>) {
    const [isOpen, setIsOpen] = React.useState(false);

    const hours = Array.from({ length: 12 }, (_, i) => i + 1);

    return (
        <FormField
            control={control}
            name={name}
            render={({ field }: { field: ControllerRenderProps<T> }) => {
                const date = field.value as Date | undefined;

                const handleDateSelect = (selectedDate: Date | undefined) => {
                    if (selectedDate) {
                        field.onChange(selectedDate);
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
                        field.onChange(newDate);
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
                                            format(date, "MM/dd/yyyy hh:mm aa")
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
                                            initialFocus
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
                                                        { length: 12 },
                                                        (_, i) => i * 5,
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
                                                            {minute}
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
