export function formatMinutesToHHMM(minutes: number | string | null): string {
    const total = Number(minutes);
    if (minutes === null || minutes === "" || isNaN(total)) return "No data";

    const hrs = Math.floor(total / 60);
    const mins = total % 60;

    return `${hrs}.${mins.toString().padStart(2, "0")}`;
}

export function formatMinutesVerbose(minutes: number | string | null): string {
    const total = Number(minutes);
    if (minutes === null || minutes === "" || isNaN(total)) return "No data";

    const hrs = Math.floor(total / 60);
    const mins = total % 60;

    return `${hrs} hr ${mins} min`;
}


