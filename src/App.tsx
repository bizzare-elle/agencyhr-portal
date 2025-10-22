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
import AgencyDashboard from "./pages/agency_dashboard";
import ScheduleForm from "./pages/schedules/schedule-form";
import ScheduleDashboard from "./pages/schedules/schedule-dashboard";
import { ParentComponent } from "./components/parent-container";

export default function App() {
    const router = createBrowserRouter([
        {
            path: "/",
            loader: async () => redirect("/login"),
        },
        {
            path: "/login",
            element: <Login />,
        },
        {
            element: <AuthLayout />,
            loader: async () => {
                const token = useAuthStore.getState().token;
                if (!token) return redirect("/login");

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
                    handle: { title: "Employee List" },
                },
                {
                    path: "/dashboard/:agency_id",
                    element: <AgencyDashboard />,
                    handle: { title: "Agency Dashboard" },
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
                {
                    path: "/schedules",
                    children: [
                        {
                            path: ":id",
                            element: <ScheduleDashboard />,
                            handle: { title: "Schedule Dashboard" },
                        },
                        {
                            path: "form/:id",
                            element: <ScheduleForm />,
                            handle: { title: "Schedule Form" },
                        },
                    ],
                },
            ],
        },
        {
            path: "*",
            element: (
                <ParentComponent>
                    <div className="flex h-full w-full flex-col text-center">
                        <span className="text-[100px] font-bold text-red-400">
                            404
                        </span>
                        <span className="text-white-400 text-[20px] font-medium">
                            Oh no! This page doesn't exist :(
                        </span>
                    </div>
                </ParentComponent>
            ),
        },
    ]);

    return <RouterProvider router={router} />;
}
