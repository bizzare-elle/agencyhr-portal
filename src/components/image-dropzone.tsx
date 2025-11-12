import * as React from "react";
import {
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from "@/components/ui/form";
import { ControllerRenderProps } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { X, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ImageUploaderProps {
    field: ControllerRenderProps<any>;
    fieldState: any;
    label: string;
}

export function ImageUploader({
    field,
    fieldState,
    label,
}: ImageUploaderProps) {
    const [preview, setPreview] = React.useState<string | null>(null);

    // Clear preview if field value is cleared externally
    React.useEffect(() => {
        if (!field.value) setPreview(null);
    }, [field.value]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (file) {
            setPreview(URL.createObjectURL(file));
            field.onChange(file);
        } else {
            setPreview(null);
            field.onChange(null);
        }
    };

    const handleRemove = () => {
        setPreview(null);
        field.onChange(null);
    };

    return (
        <FormItem className="space-y-2">
            <FormLabel>{label}</FormLabel>
            <FormControl>
                <div className="flex flex-col gap-2">
                    {preview ? (
                        <div className="relative h-32 w-32">
                            <img
                                src={preview}
                                alt="Preview"
                                className="h-full w-full rounded-md border object-cover"
                            />
                            <Button
                                type="button"
                                size="icon"
                                variant="destructive"
                                className="absolute top-1 right-1 h-6 w-6 rounded-full p-0"
                                onClick={handleRemove}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <div className="relative w-full">
                            <Input
                                type="file"
                                accept="image/jpeg,image/png,image/jpg"
                                className="w-full cursor-pointer pr-10"
                                onChange={handleFileChange}
                            />
                            <Upload className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" />
                        </div>
                    )}
                </div>
            </FormControl>
            <FormMessage>{fieldState?.error?.message}</FormMessage>
        </FormItem>
    );
}
