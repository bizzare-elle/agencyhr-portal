import { create } from "zustand";
import api from "@/lib/axios";
import { persist } from "zustand/middleware";

interface User {
    id: number;
    name?: string;
    email?: string;
    role: string;
    department_id?: number;
    status?: string;
    agency_id?: number;
    is_admin?: number; // 1 = admin
}

interface AuthState {
    token: string | null;
    refreshToken: string | null;
    user: User | null;
    setToken: (token: string, refreshToken?: string | null) => void;
    getToken: () => string;
    clear: () => void;
    logout: () => void;
    loadUser: (tokenOverride?: string) => Promise<User | null>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            token: null,
            refreshToken: null,
            user: null,

            setToken: (token: string, refreshToken?: string | null) => {
                set(refreshToken ? { token, refreshToken } : { token });
                api.defaults.headers.common["Authorization"] =
                    `Bearer ${token}`;
            },

            getToken: () => get().token as string,

            clear: () => {
                set({ token: null, refreshToken: null, user: null });
                delete api.defaults.headers.common["Authorization"];
            },

            logout: () => {
                const { token, refreshToken } = get();
                const done = () => {
                    get().clear();
                    window.location.href = "/login";
                };
                if (!token && !refreshToken) {
                    done();
                    return;
                }
                api.post(
                    "/api/v2/auth/logout",
                    { refresh_token: refreshToken },
                    { headers: { Authorization: `Bearer ${token}` } },
                )
                    .catch(() => undefined)
                    .finally(done);
            },

            loadUser: async (tokenOverride?: string) => {
                const token = tokenOverride || get().token;
                if (!token) return null;

                try {
                    const res = await api.get("/api/v2/auth/me");
                    if (res.data?.data) {
                        set({ user: res.data.data });
                        return res.data.data;
                    } else {
                        console.error(
                            "Unexpected response structure:",
                            res.data,
                        );
                        get().clear();
                        return null;
                    }
                } catch (err: any) {
                    console.error(
                        "Failed to load user:",
                        err.response?.data || err.message,
                    );
                    get().clear();
                    return null;
                }
            },
        }),
        {
            name: "auth",
        },
    ),
);
