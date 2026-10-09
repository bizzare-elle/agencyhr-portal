import * as React from "react";
import {
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from "@/components/ui/form";
import { ControllerRenderProps } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { ImageUp, RefreshCw, X } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { compressImage, formatFileSize } from "@/lib/compress-image";

interface ImageUploaderProps {
    field: ControllerRenderProps<any>;
    fieldState: any;
    label: string;
    existingImageUrl?: string;
}

export function ImageUploader({
    field,
    fieldState,
    label,
    existingImageUrl,
}: ImageUploaderProps) {
    // Seed preview from existing URL (edit mode) or null (create mode)
    const [preview, setPreview] = React.useState<string | null>(
        existingImageUrl ?? null,
    );
    const [processing, setProcessing] = React.useState(false);
    const [fileInfo, setFileInfo] = React.useState<string | null>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Clear preview if field value is cleared externally
    React.useEffect(() => {
        if (!field.value && !existingImageUrl) {
            setPreview(null);
            setFileInfo(null);
        }
    }, [field.value, existingImageUrl]);

    React.useEffect(() => {
        return () => {
            if (preview && preview.startsWith("blob:"))
                URL.revokeObjectURL(preview);
        };
    }, [preview]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const original = e.target.files?.[0] || null;
        e.target.value = "";

        if (!original) return;

        setProcessing(true);
        try {
            const file = await compressImage(original);
            setPreview(URL.createObjectURL(file));
            setFileInfo(
                file.size < original.size
                    ? `${file.name} · ${formatFileSize(original.size)} → ${formatFileSize(file.size)}`
                    : `${file.name} · ${formatFileSize(file.size)}`,
            );
            field.onChange(file);
        } finally {
            setProcessing(false);
        }
    };

    const handleRemove = () => {
        setPreview(null);
        setFileInfo(null);
        field.onChange(null);
    };

    return (
        <FormItem className="space-y-2">
            <FormLabel>{label}</FormLabel>
            <FormControl>
                <div className="flex flex-col gap-2">
                    {processing ? (
                        <div className="text-muted-foreground flex h-40 items-center justify-center gap-2 rounded-lg border border-dashed text-sm">
                            <Spinner className="h-4 w-4" />
                            Optimizing image...
                        </div>
                    ) : preview ? (
                        <div className="space-y-2">
                            <div className="bg-muted/40 relative flex max-h-72 min-h-40 w-full items-center justify-center overflow-hidden rounded-lg border">
                                <img
                                    src={preview}
                                    alt="Selected image preview"
                                    className="max-h-72 w-full object-contain"
                                />
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="destructive"
                                    aria-label="Remove image"
                                    className="absolute top-2 right-2 h-8 w-8 rounded-full p-0 shadow"
                                    onClick={handleRemove}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-muted-foreground min-w-0 truncate text-xs">
                                    {fileInfo ?? "Current image"}
                                </p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-9 shrink-0"
                                    onClick={() => inputRef.current?.click()}
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    Change
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            className="text-muted-foreground hover:bg-muted/40 flex h-32 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-sm transition"
                        >
                            <ImageUp className="h-6 w-6" />
                            <span>Tap to choose an image</span>
                            <span className="text-xs">JPEG, PNG or WebP</span>
                        </button>
                    )}

                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </div>
            </FormControl>
            <FormMessage>{fieldState?.error?.message}</FormMessage>
        </FormItem>
    );
}
