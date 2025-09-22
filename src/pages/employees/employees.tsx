import DataTableFetch from "@/components/data-table-fetch";

import { Column } from "@/components/data-table-fetch";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";

export type Employee = {
    id: number;
    name: string;
    position_id: string;
    firstname: string;
    middlename: string;
    lastname: string;
    agency_id: string;
    department: string;
    permission: string;
    id_number: string;
    branch_id: string;
    user_id: string | null;
    personal_email_address: string;
    employment_status: string;
    date_created: string;
    date_updated: string;
    Actions?: string;
};

export const employeeColumns: Column<Employee>[] = [
    { key: "id", label: "ID", sortable: true },
    { key: "name", label: "Name", sortable: true },
    { key: "agency_id", label: "Agency", sortable: true },
    { key: "branch_id", label: "Branch", sortable: true },
    { key: "department", label: "Department", sortable: true },
    { key: "permission", label: "Permission", sortable: true },
    { key: "id_number", label: "ID Number", sortable: true },
    { key: "personal_email_address", label: "Email", sortable: true },
    { key: "employment_status", label: "Status" },
    { key: "created_at", label: "Created" },
    { key: "updated_at", label: "Updated" },
    {
        key: "Actions",
        header: "Actions",
        render: (row) => (
            <Button
                variant="ghost"
                size="icon"
                onClick={() => alert(`Edit ${row.id}`)}
            >
                <MoreHorizontal className="h-4 w-4" />
            </Button>
        ),
    },
];

export default function Employees() {
    return (
        <div className="mx-auto w-full max-w-[1600px] space-y-8 p-6">
            <DataTableFetch
                columns={employeeColumns}
                apiUrl="/api/v2/employees"
            />
        </div>
    );
}
