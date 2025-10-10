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
    setToken: (token: string) => void;
    getToken: () => string;
    clear: () => void;
    logout: () => void;
    loadUser: () => Promise<User | null>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            token: null,
            user: null,

            setToken: (token: string) => {
                set({ token });
                api.defaults.headers.common["Authorization"] =
                    `Bearer ${token}`;
            },

            getToken: () => get().token as string,

            clear: () => {
                set({ token: null, user: null });
                delete api.defaults.headers.common["Authorization"];
            },

            logout: () => {
                get().clear();
                console.log("Logged Out.");
            },

            loadUser: async () => {
                const token = get().token;
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
