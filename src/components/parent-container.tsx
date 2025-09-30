import * as React from "react";

export function ParentComponent({ children }: { children: React.ReactNode }) {
    return (
        <div className="mx-auto w-full max-w-[1600px] space-y-8 p-6">
            {children}
        </div>
    );
}
