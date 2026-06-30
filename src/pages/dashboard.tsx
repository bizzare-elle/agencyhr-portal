import TimeRecords from "@/components/time-records";
import { ParentComponent } from "@/components/parent-container";

export default function Dashboard() {
    return (
        <ParentComponent>
            <TimeRecords />
        </ParentComponent>
    );
}
