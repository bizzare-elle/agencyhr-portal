import { useEffect, useRef } from "react";
import { useAuthStore } from "./use-auth";

export const useIdleLogout = () => {
    const logout = useAuthStore((state) => state.logout);
    const token = useAuthStore((state) => state.token);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const resetTimer = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(
            () => {
                logout();
            },
            30 * 60 * 1000,
        );
    };

    useEffect(() => {
        if (!token) return;

        const events = [
            "mousemove",
            "mousedown",
            "keydown",
            "scroll",
            "touchstart",
        ];

        events.forEach((event) => window.addEventListener(event, resetTimer));

        resetTimer();

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            events.forEach((event) =>
                window.removeEventListener(event, resetTimer),
            );
        };
    }, [token, logout]);
};
