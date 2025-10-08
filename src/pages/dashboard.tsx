import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import TimeRecords from "@/components/time-records";
import { ParentComponent } from "@/components/parent-container";

export default function Dashboard() {
    return (
        <ParentComponent>
            {/* <SectionCards /> */}
            <TimeRecords />
        </ParentComponent>
    );
}
