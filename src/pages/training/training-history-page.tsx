import { useParams } from "react-router-dom";
import { TrainingHistory } from "@/components/employee-training";
import { ParentComponent } from "@/components/parent-container";

export default function TrainingHistoryPage() {
    const { id } = useParams<{ id: string }>();
    return (
        <ParentComponent>
            <TrainingHistory employeeId={id ?? ""} />
        </ParentComponent>
    );
}
