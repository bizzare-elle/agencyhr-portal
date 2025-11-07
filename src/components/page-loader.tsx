import React from "react";
import { PropagateLoader } from "react-spinners";

type FullPageLoaderProps = {
    message?: string;
    size?: number;
    color?: string;
    transparent?: boolean;
};

export default function FullPageLoader({
    size = 20,
    color = "#ffffffff",
}: FullPageLoaderProps) {
    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center`}
            aria-live="polite"
            aria-label="Loading"
        >
            <PropagateLoader size={size} color={color} />
        </div>
    );
}

export const hydrateFallbackElement = (
    <h1 className="flex h-full w-full items-center justify-center text-lg font-medium">
        Loading...
    </h1>
);
