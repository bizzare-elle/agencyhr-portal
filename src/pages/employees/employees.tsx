import { useQuery } from "@tanstack/react-query";
import DataTable, { TableColumn } from "react-data-table-component";
import api from "@/lib/axios";
import { ApiResponse } from "@/index";
import { Badge } from "@/components/ui/badge";
import { formateToMonthDayYear } from "@/helpers/formatDates";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import FullPageLoader from "@/components/page-loader";

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
    created_at: string;
    created_by: string;
    date_updated: string;
};

const columns: TableColumn<Employee>[] = [
    {
        name: "ID",
        selector: (row) => row.id,
        maxWidth: "20px",
        sortable: true,
    },
    {
        name: "ID Number",
        selector: (row) => row.id_number,
        maxWidth: "150px",
    },
    {
        name: "Email",
        selector: (row) => row.personal_email_address,
        maxWidth: "200px",
    },
    {
        name: "Name",
        selector: (row) => row.name,
        maxWidth: "250px",
    },
    {
        name: "Branch",
        selector: (row) => row.branch_id,
        maxWidth: "200px",
    },
    {
        name: "Department",
        selector: (row) => row.department,
        maxWidth: "130px",
    },
    {
        name: "Status",
        selector: (row) => row.employment_status,
        maxWidth: "50px",
        cell: (row) => {
            if (row.employment_status === "Active") {
                return (
                    <Badge className="bg-green-700 text-white">
                        {row.employment_status}
                    </Badge>
                );
            }

            if (row.employment_status === "Resign") {
                return <Badge variant="destructive">Resigned</Badge>;
            }

            if (row.employment_status === "Terminate") {
                return (
                    <Badge className="bg-gray-600 text-white">Terminated</Badge>
                );
            }

            return <Badge>{row.employment_status}</Badge>;
        },
    },
    {
        name: "Created At",
        selector: (row) => row.created_at,
        format: (row) => formateToMonthDayYear(row.created_at),
        maxWidth: "160px",
        sortable: true,
    },
    {
        name: "Created By",
        selector: (row) => row.created_by,
    },
    {
        cell: (row) => (
            <Button size="sm" variant="outline" asChild>
                <Link to={`/employees/${row.id}`} className="w-full">
                    View
                </Link>
            </Button>
        ),
        ignoreRowClick: true,
        allowOverflow: true,
        button: true,
    },
];

export default function Employees() {
    const [page, setPage] = useState<number>(1);
    const [rowsPerPage, setRowsPerPage] = useState<number>(25);
    const [search, setSearch] = useState<string>("");

    const { data, isLoading, isError } = useQuery({
        queryKey: ["employees", page, rowsPerPage, search],
        queryFn: async () => {
            const response = await api.get<
                ApiResponse<{ total: number; records: Employee[] }>
            >(
                `/api/v2/employees?search=${search}&page=${page}&limit=${rowsPerPage}`,
            );
            return response.data;
        },
        placeholderData: (previousData) => previousData,
    });

    if (isLoading) {
        return <FullPageLoader />;
    }

    if (isError) {
        return (
            <div className="flex h-64 flex-col items-center justify-center text-red-500">
                <p>Failed to load employees.</p>
                <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    className="mt-3"
                >
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-[1600px] space-y-8 p-6">
            <div className="flex flex-col gap-8">
                <div>
                    <h3 className="text-lg font-semibold">Employees</h3>
                    <span className="text-sm text-white/50">
                        List of employees
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <Input
                        type="text"
                        placeholder="Search Employee... "
                        className="max-w-[250px] p-2"
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <Card>
                <CardContent>
                    <DataTable
                        columns={columns}
                        data={data?.data.records ?? []}
                        pagination
                        paginationServer
                        theme="dark"
                        responsive
                        progressPending={isLoading}
                        paginationPerPage={rowsPerPage}
                        sortServer
                        onChangePage={(page) => setPage(page)}
                        onChangeRowsPerPage={(value) => setRowsPerPage(value)}
                        paginationTotalRows={data?.data.total || 0}
                        customStyles={{
                            header: {
                                style: {
                                    fontSize: "16px",
                                    fontWeight: 600,
                                    color: "#fff",
                                },
                            },
                            headRow: {
                                style: {
                                    borderBottom: "1px solid #374151",
                                },
                            },
                            headCells: {
                                style: {
                                    padding: "10px",
                                },
                            },
                            rows: {
                                style: {
                                    minHeight: "55px",
                                    borderBottom: "1px solid #374151",
                                    borderRadius: "8px",
                                },
                            },
                            cells: {
                                style: {
                                    padding: "10px 8px",
                                    color: "#d1d5db",
                                },
                            },
                            pagination: {
                                style: {
                                    backgroundColor: "#363634ff",
                                    color: "#fff",
                                },
                            },
                        }}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
