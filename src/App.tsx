import {
    createBrowserRouter,
    redirect,
    RouterProvider,
} from "react-router-dom";
import AuthLayout from "./components/layouts/auth-layout";
import Dashboard from "./pages/dashboard";
import EmployeeForm from "./pages/employees/employee-form";
import EmployeeProfile from "./pages/employees/employee-profile";
import Employees from "./pages/employees/employees";
import LogoverrideDashboard from "./pages/logoverrides/logoverride-dashboard";
import LogoverrideForm from "./pages/logoverrides/logoverride-form";
import Login from "./pages/login";
import OvertimeDashboard from "./pages/overtimes/overtime-dashboard";
import OvertimeForm from "./pages/overtimes/overtime-form";
import api from "./lib/axios";
import FullPageLoader from "./components/page-loader";
import { useAuthStore } from "./hooks/use-auth";

export default function App() {
    const router = createBrowserRouter([
        {
            path: "/login",
            element: <Login />,
        },
        {
            element: <AuthLayout />,
            loader: async () => {
                const token = useAuthStore.getState().token;

                if (!token) return redirect(`/login`);

                try {
                    const res = await api.get("/api/v2/auth/me", {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    return res.data.data;
                } catch {
                    return redirect("/login");
                }
            },
            hydrateFallbackElement: <FullPageLoader />,
            children: [
                {
                    path: "/:id",
                    element: <Dashboard />,
                    handle: { title: "Dashboard" },
                },
                {
                    path: "/employees",
                    children: [
                        {
                            index: true,
                            element: <Employees />,
                            handle: { title: "Employees" },
                        },
                        {
                            path: "form",
                            element: <EmployeeForm />,
                            handle: { title: "Employee Form" },
                        },
                        {
                            path: ":id",
                            element: <EmployeeProfile />,
                            handle: { title: "Employee Profile" },
                        },
                    ],
                },
                {
                    path: "/logoverrides",
                    children: [
                        {
                            path: ":id",
                            element: <LogoverrideDashboard />,
                            handle: { title: "Log Override" },
                        },
                        {
                            path: "form/:id",
                            element: <LogoverrideForm />,
                            handle: { title: "Log Override Form" },
                        },
                    ],
                },
                {
                    path: "/overtime",
                    children: [
                        {
                            path: ":id",
                            element: <OvertimeDashboard />,
                            handle: { title: "Overtime" },
                        },
                        {
                            path: "form/:id",
                            element: <OvertimeForm />,
                            handle: { title: "Overtime Form" },
                        },
                    ],
                },
            ],
        },
    ]);

    return <RouterProvider router={router} />;
}
