import AuthLayout from "./components/layouts/auth-layout";
import Dashboard from "./pages/dashboard";
import EmployeeForm from "./pages/employees/employee-form";
import EmployeeProfile from "./pages/employees/employee-profile";
import Employees from "./pages/employees/employees";
import Login from "./pages/login";
import { Routes, Route } from "react-router-dom";

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
            </Route>
        </Routes>
    );
}
