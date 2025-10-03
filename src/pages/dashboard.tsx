import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import TimeRecords from "@/components/time-records";

export default function Dashboard() {
    return (
        <div>
            {/* <SectionCards /> */}
            <TimeRecords />
        </div>
    );
}
