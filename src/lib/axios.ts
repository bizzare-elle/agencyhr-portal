import axios, { type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/hooks/use-auth";

const baseURL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

const api = axios.create({
    baseURL,
    headers: {
        "Content-Type": "application/json",
    },
});

// A 401 on these is a real answer (bad credentials, wrong current password),
// not an expired session, so it must never trigger a refresh.
const NO_REFRESH_PATHS = [
    "/api/v2/auth/login",
    "/api/v2/auth/refresh",
    "/api/v2/auth/logout",
    "/api/v2/auth/reset/",
    "/api/v2/auth/admin-reset/",
];

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

let refreshInFlight: Promise<string | null> | null = null;

function readPersistedTokens(): {
    token: string | null;
    refreshToken: string | null;
} {
    try {
        const raw = localStorage.getItem("auth");
        const state = raw ? JSON.parse(raw)?.state : null;
        return {
            token: state?.token ?? null,
            refreshToken: state?.refreshToken ?? null,
        };
    } catch {
        return { token: null, refreshToken: null };
    }
}

async function requestNewAccessToken(): Promise<string | null> {
    const { refreshToken } = useAuthStore.getState();
    if (!refreshToken) return null;

    try {
        const res = await axios.post(
            `${baseURL}/api/v2/auth/refresh`,
            { refresh_token: refreshToken },
            { headers: { "Content-Type": "application/json" } },
        );
        const data = res.data?.data;
        if (!data?.token) return null;

        useAuthStore.getState().setToken(data.token, data.refresh_token);
        return data.token;
    } catch {
        // Another tab may have rotated the refresh token a moment ago.
        const stored = readPersistedTokens();
        if (stored.token && stored.refreshToken !== refreshToken) {
            useAuthStore.setState(stored);
            return stored.token;
        }
        return null;
    }
}

function renewAccessToken(): Promise<string | null> {
    if (!refreshInFlight) {
        refreshInFlight = requestNewAccessToken().finally(() => {
            refreshInFlight = null;
        });
    }
    return refreshInFlight;
}

api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    } else {
        delete config.headers.Authorization;
    }
    // Let the browser set Content-Type (with boundary) for multipart uploads
    if (config.data instanceof FormData) {
        delete config.headers["Content-Type"];
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config as RetriableConfig | undefined;
        const url: string = original?.url ?? "";

        const isExpiredSession =
            error.response?.status === 401 &&
            original &&
            !original._retried &&
            !NO_REFRESH_PATHS.some((path) => url.includes(path));

        if (!isExpiredSession) {
            return Promise.reject(error);
        }

        original._retried = true;
        const newToken = await renewAccessToken();

        if (!newToken) {
            if (useAuthStore.getState().token) {
                useAuthStore.getState().clear();
                if (window.location.pathname !== "/login") {
                    window.location.href = "/login";
                }
            }
            return Promise.reject(error);
        }

        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
    },
);

export default api;
