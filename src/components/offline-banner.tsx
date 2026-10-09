import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
    const [online, setOnline] = useState(
        typeof navigator === "undefined" ? true : navigator.onLine,
    );

    useEffect(() => {
        const goOnline = () => setOnline(true);
        const goOffline = () => setOnline(false);
        window.addEventListener("online", goOnline);
        window.addEventListener("offline", goOffline);
        return () => {
            window.removeEventListener("online", goOnline);
            window.removeEventListener("offline", goOffline);
        };
    }, []);

    if (online) return null;

    return (
        <div
            role="status"
            aria-live="polite"
            className="fixed inset-x-0 top-0 z-[100] flex items-center justify-center gap-2 bg-red-600 px-3 py-2 text-sm font-medium text-white shadow"
        >
            <WifiOff className="h-4 w-4" />
            You are offline. Changes can't be saved until you reconnect.
        </div>
    );
}
