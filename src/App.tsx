import AuthLayout from "./components/layouts/auth-layout";
import Dashboard from "./pages/dashboard";
import EmployeeForm from "./pages/employees/employee-form";
import EmployeeProfile from "./pages/employees/employee-profile";
import Employees from "./pages/employees/employees";
import LogoverrideDashboard from "./pages/logoverrides/logoverride-dashboard";
import LogoverrideForm from "./pages/logoverrides/logoverride-form";
import Login from "./pages/login";
import { Routes, Route } from "react-router-dom";
import OvertimeDashboard from "./pages/overtimes/overtime-dashboard";
import OvertimeForm from "./pages/overtimes/overtime-form";

export default function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<AuthLayout />}>
                <Route path="/" element={<Dashboard />} />

                <Route path="/employees">
                    <Route index element={<Employees />} />
                    <Route path="form" element={<EmployeeForm />} />
                    <Route path=":id" element={<EmployeeProfile />} />
                </Route>

                <Route path="/logoverrides">
                    <Route
                        index
                        path=":id"
                        element={<LogoverrideDashboard />}
                    />
                    <Route path="form" element={<LogoverrideForm />} />
                </Route>

                <Route path="/overtime">
                    <Route index element={<OvertimeDashboard />} />
                    <Route path="form" element={<OvertimeForm />} />
                </Route>
            </Route>
        </Routes>
    );
}
