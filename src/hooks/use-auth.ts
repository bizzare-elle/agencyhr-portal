import * as React from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthStore {
    token: string | null;
    setToken: (token: string) => void;
    getToken: () => string | null;
    clearToken: () => void;
}

export const useAuth = create<AuthStore>()(
    persist(
        (set, get) => ({
            token: null,
            setToken: (token) => set({ token }),
            clearToken: () => set({ token: null }),
            getToken: () => get().token,
        }),
        {
            name: "access-token",
        },
    ),
);

                    
// const setToken = useAuth((state) => state.setToken);
