import { useRef } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface IdleWarningProps {
    secondsLeft: number | null;
    onStay: () => void;
}

function formatClock(totalSeconds: number) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function IdleWarning({ secondsLeft, onStay }: IdleWarningProps) {
    // Keep the last value so the clock does not flash 0:00 while the dialog fades out.
    const lastSeconds = useRef(0);
    if (secondsLeft !== null) lastSeconds.current = secondsLeft;

    return (
        <AlertDialog open={secondsLeft !== null}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Still there?</AlertDialogTitle>
                    <AlertDialogDescription>
                        For your security, you will be signed out in{" "}
                        <span className="font-semibold tabular-nums">
                            {formatClock(lastSeconds.current)}
                        </span>{" "}
                        because there has been no activity.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction
                        onClick={onStay}
                        className="bg-yellow-500 text-white hover:bg-yellow-600"
                    >
                        Stay signed in
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
