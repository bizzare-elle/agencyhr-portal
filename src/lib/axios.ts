import axios from "axios";
import { useAuthStore } from "@/hooks/use-auth";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api",
    headers: {
        "Content-Type": "application/json",
    },
});

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
export default api;
