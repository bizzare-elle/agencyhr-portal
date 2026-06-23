import { useParams } from "react-router-dom";
import EmployeeTraining from "@/components/employee-training";
import { ParentComponent } from "@/components/parent-container";

export default function TrainingPage() {
    const { id } = useParams<{ id: string }>();
    return (
        <ParentComponent>
            <EmployeeTraining employeeId={id ?? ""} />
        </ParentComponent>
    );
}
