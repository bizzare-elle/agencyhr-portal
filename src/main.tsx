import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTheme } from "react-data-table-component";
import { Toaster } from "sonner";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

createTheme("dark", {
    background: {
        default: "transparent",
    },
});

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <Toaster position="top-right" richColors />
            <App />
            <ReactQueryDevtools />
        </QueryClientProvider>
    </StrictMode>,
);
