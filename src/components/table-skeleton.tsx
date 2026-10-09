import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";

interface TableSkeletonRowsProps {
    rows?: number;
    cols: number;
}

export function TableSkeletonRows({ rows = 6, cols }: TableSkeletonRowsProps) {
    return (
        <>
            {Array.from({ length: rows }).map((_, r) => (
                <TableRow key={r} aria-hidden>
                    {Array.from({ length: cols }).map((_, c) => (
                        <TableCell key={c} className="px-2 py-4">
                            <Skeleton
                                className={
                                    c === 0 ? "h-4 w-24" : "mx-auto h-4 w-12"
                                }
                            />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}

export function CardListSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-3" aria-busy="true" aria-label="Loading">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="space-y-3 rounded-xl border p-4">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
            ))}
        </div>
    );
}
