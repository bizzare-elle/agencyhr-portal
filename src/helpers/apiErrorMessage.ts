import { isAxiosError } from "axios";

export function apiErrorMessage(err: unknown, fallback: string): string {
    if (isAxiosError<{ message?: string }>(err)) {
        return err.response?.data?.message ?? err.message ?? fallback;
    }
    return err instanceof Error ? err.message : fallback;
}
