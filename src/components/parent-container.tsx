import * as React from "react";

export function ParentComponent({ children }: { children: React.ReactNode }) {
    return <div className="w-full p-10 text-center">{children}</div>;
}
