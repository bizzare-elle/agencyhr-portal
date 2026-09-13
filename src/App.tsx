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
import { useIdleLogout } from "./hooks/use-idle";
import ScheduleUpload from "./pages/schedules/schedules-upload";
import LeaveDashboard from "./pages/leave-forms/leave-dashboard";
import LeaveForm from "./pages/leave-forms/leave-form";
import MyLeaveForms from "./pages/leave-forms/my-leave-forms";
import FormsHub from "./pages/forms/forms-hub";
import EicfForm from "./pages/forms/eicf-form";
import MrfForm from "./pages/forms/mrf-form";
import FormsSubmissions from "./pages/forms/forms-submissions";
import FormsValidation from "./pages/forms/forms-validation";
import PayslipCombined from "./pages/payslip/payslip-combined";
import Notifications from "./pages/notifications";
import Announcements from "./pages/announcements";
import TrainingPage from "./pages/training/training-page";
import TrainingHistoryPage from "./pages/training/training-history-page";
import Maintenance from "./pages/maintenance";
import HrApprovals from "./pages/approvals/hr-approvals";
import AdminPanel from "./pages/admin/admin-panel";
import RemoteWork from "./pages/remote/remote-work";
import DownlinePage from "./pages/downline/downline-page";
import SystemGuide from "./pages/system-guide";
import ResetPassword from "./pages/reset-password";

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
        path: "/maintenance",
        element: <Maintenance />,
    },
    {
        path: "/reset-password/:id",
        element: <ResetPassword />,
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
                    {
                        path: "edit/:overtimeId",
                        element: <OvertimeForm />,
                        handle: { title: "Edit Overtime" },
                    },
                ],
            },
            {
                path: "/forms",
                children: [
                    {
                        path: ":id",
                        element: <FormsHub />,
                        handle: { title: "Forms" },
                    },
                    {
                        path: "eicf/:id",
                        element: <EicfForm />,
                        handle: { title: "EICF" },
                    },
                    {
                        path: "mrf/:id",
                        element: <MrfForm />,
                        handle: { title: "MRF" },
                    },
                    {
                        path: "submissions/:id",
                        element: <FormsSubmissions />,
                        handle: { title: "EICF Submissions" },
                    },
                    {
                        path: "validation/:id",
                        element: <FormsValidation />,
                        handle: { title: "EICF Validation" },
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
                    {
                        path: "upload/:id",
                        element: <ScheduleUpload />,
                        handle: { title: "Schedule Upload" },
                    },
                ],
            },
            {
                path: "/leave-forms",
                children: [
                    {
                        index: true,
                        element: <LeaveDashboard />,
                        handle: { title: "Leave Forms" },
                    },
                    {
                        path: "form",
                        element: <LeaveForm />,
                        handle: { title: "File Leave Form" },
                    },
                ],
            },
            {
                path: "/my-leave-forms/:id",
                element: <MyLeaveForms />,
                handle: { title: "Leave Forms" },
            },
            {
                path: "/payslip",
                children: [
                    {
                        path: ":id",
                        element: <PayslipCombined />,
                        handle: { title: "Payslip" },
                    },
                ],
            },
            {
                path: "/notifications/:id",
                element: <Notifications />,
                handle: { title: "Notifications" },
            },
            {
                path: "/announcements/:id",
                element: <Announcements />,
                handle: { title: "Announcements" },
            },
            {
                path: "/training/:id",
                element: <TrainingPage />,
                handle: { title: "Training" },
            },
            {
                path: "/training-history/:id",
                element: <TrainingHistoryPage />,
                handle: { title: "Training History" },
            },
            {
                path: "/approvals/:id",
                element: <HrApprovals />,
                handle: { title: "HR Approvals" },
            },
            {
                path: "/admin/:id",
                element: <AdminPanel />,
                handle: { title: "Admin Panel" },
            },
            {
                path: "/remote/:id",
                element: <RemoteWork />,
                handle: { title: "Work Remotely" },
            },
            {
                path: "/downline/:id",
                element: <DownlinePage />,
                handle: { title: "T&M Hierarchy" },
            },
            {
                path: "/guide",
                element: <SystemGuide />,
                handle: { title: "System Guide" },
            },
        ],
    },
    {
        path: "*",
        element: <Maintenance />,
    },
]);

export default function App() {
    useIdleLogout();
    return <RouterProvider router={router} />;
}
