import { ListFilter } from "lucide-react";
import { Button } from "../ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

export default function EmployeesFilter() {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline">
                    Filter <ListFilter />
                </Button>
            </PopoverTrigger>
            <PopoverContent align="start"></PopoverContent>
        </Popover>
    );
}
