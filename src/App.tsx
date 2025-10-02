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

                if (!token) {
                    return redirect(`/login`);
                }
                try {
                    const res = await api.get("/api/v2/auth/me", {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });

                    return res.data.data;
                } catch (err) {
                    return redirect("login");
                }
            },
            hydrateFallbackElement: <FullPageLoader />,
            children: [
                {
                    path: "/",
                    element: <Dashboard />,
                },
                {
                    path: "/employees",
                    children: [
                        { index: true, element: <Employees /> },
                        { path: "form", element: <EmployeeForm /> },
                        { path: ":id", element: <EmployeeProfile /> },
                    ],
                },
                {
                    path: "/logoverrides",
                    children: [
                        { path: ":id", element: <LogoverrideDashboard /> },
                        { path: "form/:id", element: <LogoverrideForm /> },
                    ],
                },
                {
                    path: "/overtime",
                    children: [
                        { path: ":id", element: <OvertimeDashboard /> },
                        { path: "form/:id", element: <OvertimeForm /> },
                    ],
                },
            ],
        },
    ]);

    return <RouterProvider router={router} />;
}
