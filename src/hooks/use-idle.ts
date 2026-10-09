import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthStore } from "./use-auth";

const IDLE_LIMIT_MS = 30 * 60 * 1000;
const WARNING_MS = 2 * 60 * 1000;
const TICK_MS = 1000;
const ACTIVITY_EVENTS = [
    "mousemove",
    "mousedown",
    "keydown",
    "scroll",
    "touchstart",
];

export const useIdleLogout = () => {
    const logout = useAuthStore((state) => state.logout);
    const token = useAuthStore((state) => state.token);
    const lastActivity = useRef(Date.now());
    const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

    const stay = useCallback(() => {
        lastActivity.current = Date.now();
        setSecondsLeft(null);
    }, []);

    useEffect(() => {
        if (!token) {
            setSecondsLeft(null);
            return;
        }

        lastActivity.current = Date.now();

        // While the warning is up, only the "Stay signed in" button counts as
        // activity, so a stray touch cannot silently dismiss it.
        const onActivity = () => {
            if (
                Date.now() - lastActivity.current <
                IDLE_LIMIT_MS - WARNING_MS
            ) {
                lastActivity.current = Date.now();
            }
        };

        // Compare timestamps instead of using one long timeout: a phone that was
        // locked or a tab in the background throttles timers, but the clock
        // difference is still right when the page wakes up.
        const tick = window.setInterval(() => {
            const idle = Date.now() - lastActivity.current;
            if (idle >= IDLE_LIMIT_MS) {
                window.clearInterval(tick);
                setSecondsLeft(null);
                logout();
            } else if (idle >= IDLE_LIMIT_MS - WARNING_MS) {
                setSecondsLeft(Math.ceil((IDLE_LIMIT_MS - idle) / 1000));
            } else {
                setSecondsLeft(null);
            }
        }, TICK_MS);

        ACTIVITY_EVENTS.forEach((event) =>
            window.addEventListener(event, onActivity, { passive: true }),
        );

        return () => {
            window.clearInterval(tick);
            ACTIVITY_EVENTS.forEach((event) =>
                window.removeEventListener(event, onActivity),
            );
        };
    }, [token, logout]);

    return { secondsLeft, stay };
};
