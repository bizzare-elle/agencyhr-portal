export function formatToPeso(value: number | string): string {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) return "₱0.00";
    return num.toLocaleString("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}
