import {
    FormField,
    FormItem,
    FormControl,
    FormMessage,
} from "@/components/ui/form";
import { ControllerRenderProps } from "react-hook-form";
import { Input } from "@/components/ui/input";

interface TextFieldProps {
    name: string;
    label: string;
    control: any;
    type?: string;
    placeholder?: string;
    disabled?: boolean;
}

export function TextField({
    name,
    label,
    control,
    type = "text",
    placeholder,
    disabled = false,
}: TextFieldProps) {
    return (
        <FormField
            control={control}
            name={name}
            render={({ field }: { field: ControllerRenderProps }) => (
                <FormItem>
                    <FormControl>
                        <div className="relative w-full">
                            <Input
                                id={name as string}
                                type={type}
                                disabled={disabled}
                                placeholder=" "
                                className="peer h-[100px] pt-6"
                                {...field}
                            />
                            <label
                                htmlFor={name as string}
                                className="text-muted-foreground peer-focus:text-primary absolute top-2 left-3 text-sm transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-sm"
                            >
                                {placeholder ?? label}
                            </label>
                        </div>
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}
