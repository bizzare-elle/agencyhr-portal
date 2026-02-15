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
}

interface AuthState {
    token: string | null;
    user: User | null;
    isHydrated: boolean;
    setToken: (token: string) => void;
    getToken: () => string | null;
    clear: () => void;
    logout: () => void;
    loadUser: (tokenOverride?: string) => Promise<User | null>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            token: null,
            user: null,
            isHydrated: false,

            setToken: (token: string) => {
                set({ token });
                api.defaults.headers.common["Authorization"] =
                    `Bearer ${token}`;
            },

            getToken: () => get().token,

            clear: () => {
                set({ token: null, user: null });
                delete api.defaults.headers.common["Authorization"];
            },

            logout: () => {
                get().clear();
                console.log("Logged out due to inactivity.");
                window.location.href = "/login";
            },

            loadUser: async (tokenOverride?: string) => {
                const token = tokenOverride || get().token;
                if (!token) return null;

                try {
                    api.defaults.headers.common["Authorization"] =
                        `Bearer ${token}`;

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
            onRehydrateStorage: () => (state) => {
                if (state?.token) {
                    api.defaults.headers.common["Authorization"] =
                        `Bearer ${state.token}`;
                }
                if (state) {
                    state.isHydrated = true;
                }
            },
        },
    ),
);
