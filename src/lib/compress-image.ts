const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.8;

// Phone photos are routinely 4-10 MB. Resizing to 1600px and re-encoding as
// JPEG keeps them legible as evidence and uploads far faster on mobile data.
// Any failure falls back to the original file, so a photo is never lost.
export async function compressImage(file: File): Promise<File> {
    if (!file.type.startsWith("image/") || file.type === "image/gif") {
        return file;
    }

    try {
        const bitmap = await createImageBitmap(file, {
            imageOrientation: "from-image",
        });
        const scale = Math.min(
            1,
            MAX_DIMENSION / Math.max(bitmap.width, bitmap.height),
        );
        const width = Math.round(bitmap.width * scale);
        const height = Math.round(bitmap.height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
            bitmap.close();
            return file;
        }
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(bitmap, 0, 0, width, height);
        bitmap.close();

        const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
        );
        if (!blob || blob.size >= file.size) {
            return file;
        }

        const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";
        return new File([blob], `${baseName}.jpg`, {
            type: "image/jpeg",
            lastModified: Date.now(),
        });
    } catch {
        return file;
    }
}

export function formatFileSize(bytes: number): string {
    if (bytes < 1024 * 1024)
        return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
