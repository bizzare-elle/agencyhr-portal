"use client";

import * as React from "react";
import { ChevronDownIcon } from "lucide-react";
import { Controller, FieldValues, Control } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerFieldProps<T extends FieldValues> {
    name: keyof T;
    label: string;
    control: any;
}

export function DatePickerField<T extends FieldValues>({
    name,
    label,
    control,
}: DatePickerFieldProps<T>) {
    const [open, setOpen] = React.useState(false);

    return (
        <Controller
            name={name as string}
            control={control}
            render={({ field }) => (
                <div className="flex flex-col gap-3">
                    <Label htmlFor={field.name as string} className="px-1">
                        {label}
                    </Label>
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                id={field.name}
                                className="w-48 justify-between font-normal"
                            >
                                {field.value
                                    ? new Date(field.value).toLocaleDateString()
                                    : "Select date"}
                                <ChevronDownIcon />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent
                            className="w-auto overflow-hidden p-0"
                            align="start"
                        >
                            <Calendar
                                mode="single"
                                selected={
                                    field.value
                                        ? new Date(field.value)
                                        : undefined
                                }
                                captionLayout="dropdown"
                                onSelect={(date) => {
                                    field.onChange(date);
                                    setOpen(false);
                                }}
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            )}
        />
    );
}
