import React from "react";
import { PropagateLoader } from "react-spinners";

type FullPageLoaderProps = {
    message?: string;
    size?: number;
    color?: string;
    transparent?: boolean;
};

export default function FullPageLoader({
    message,
    size = 20,
    color = "#ffffffff",
}: FullPageLoaderProps) {
    return (
        <div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3"
            aria-live="polite"
            aria-label="Loading"
        >
            <PropagateLoader size={size} color={color} />
            {message && (
                <p className="text-sm font-medium text-white">{message}</p>
            )}
        </div>
    );
}

export const hydrateFallbackElement = (
    <h1 className="flex h-full w-full items-center justify-center text-lg font-medium">
        Loading...
    </h1>
);
