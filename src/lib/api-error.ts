export function apiError(err: unknown, fallback: string): string {
    const e = err as {
        response?: { data?: { message?: string } };
        message?: string;
    };
    return e?.response?.data?.message ?? e?.message ?? fallback;
}
