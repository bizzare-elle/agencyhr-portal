import { Badge } from "@/components/ui/badge";

export interface DocumentRequest {
    id: number;
    employee_id: number;
    employee_name: string | null;
    employee_id_number: string | null;
    document_type: string;
    document_label: string;
    purpose: string;
    remarks: string | null;
    status: number;
    status_label: string;
    response_note: string | null;
    handled_at: string | null;
    created_at: string;
}

const STATUS_STYLES: Record<number, string> = {
    0: "bg-amber-600",
    1: "bg-blue-600",
    2: "bg-green-600",
    3: "bg-red-600",
    4: "bg-slate-600",
};

export function StatusBadge({ request }: { request: DocumentRequest }) {
    return (
        <Badge
            className={`${STATUS_STYLES[request.status] ?? "bg-slate-600"} text-white`}
        >
            {request.status_label}
        </Badge>
    );
}
