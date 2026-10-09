import TimeRecords from "@/components/time-records";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import { ParentComponent } from "@/components/parent-container";

export default function Dashboard() {
    return (
        <ParentComponent>
            <OnboardingChecklist />
            <TimeRecords />
        </ParentComponent>
    );
}
