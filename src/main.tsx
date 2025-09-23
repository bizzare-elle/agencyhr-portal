import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { BrowserRouter as Router } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTheme } from "react-data-table-component";
import { Toaster } from "sonner";

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
            <Router>
                <App />
            </Router>
        </QueryClientProvider>
    </StrictMode>,
);
