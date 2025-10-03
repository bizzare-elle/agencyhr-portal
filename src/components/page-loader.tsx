import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { HashLoader } from "react-spinners";

type FullPageLoaderProps = {
    message?: string;
    size?: number;
    color?: string;
    transparent?: boolean;
};

export default function FullPageLoader({
    size = 40,
    color = "#0ea5e9",
}: FullPageLoaderProps) {
    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center`}
            aria-live="polite"
            aria-label="Loading"
        >
            <HashLoader size={size} color={color} />
            {/* <p className="text-center text-sm font-medium text-slate-700 dark:text-slate-200">
                        Loading....
                    </p> */}
        </div>
    );
}

export const hydrateFallbackElement = (
    <h1 className="flex h-full w-full items-center justify-center text-lg font-medium">
        Loading...
    </h1>
);
