import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { format } from "date-fns";
import { SecurityRosterEntry, SecurityRosterOptions } from "@/index";

export const TEMPLATE_HEADERS = [
    "Branch",
    "Schedule",
    "Full Name",
    "License Number",
    "Mobile Number",
    "Gender",
    "Personal Email Address",
];

const STATUS_LABEL: Record<string, string> = {
    pending: "Pending",
    claimed: "Claimed",
    inactive: "Inactive",
};

function styleHeader(row: ExcelJS.Row) {
    row.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF353935" },
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
    });
}

async function download(workbook: ExcelJS.Workbook, name: string) {
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
        new Blob([buffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        `${name}_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`,
    );
}

export async function downloadRosterTemplate(options: SecurityRosterOptions) {
    const workbook = new ExcelJS.Workbook();

    const sheet = workbook.addWorksheet("Roster Template");
    sheet.columns = TEMPLATE_HEADERS.map(() => ({ width: 26 }));
    styleHeader(sheet.addRow(TEMPLATE_HEADERS));

    const branch = options.branches[0]?.name ?? "";
    const schedule = options.schedules[0]?.name ?? "";
    sheet.addRow([
        branch,
        schedule,
        "Juan Dela Cruz",
        "SG-2026-00001",
        "09171234567",
        "Male",
        "juan.delacruz@example.com",
    ]);
    sheet.addRow([
        branch,
        schedule,
        "Maria Santos",
        "SG-2026-00002",
        "09171234568",
        "Female",
        "maria.santos@example.com",
    ]);
    sheet.addRow([
        "The two rows above are samples — delete them before uploading.",
    ]);
    // Text format keeps leading zeros on mobile numbers.
    sheet.getColumn(5).numFmt = "@";

    const reference = workbook.addWorksheet("Field Reference");
    reference.columns = [{ width: 24 }, { width: 80 }];
    styleHeader(reference.addRow(["Column", "Must contain"]));
    reference.addRow([
        "Branch",
        "An exact branch name from the Branches list below.",
    ]);
    reference.addRow([
        "Schedule",
        `One of: ${options.schedules.map((s) => s.name).join(", ")}`,
    ]);
    reference.addRow([
        "License Number",
        "Must be unique for your agency — a duplicate is skipped, not overwritten.",
    ]);
    reference.addRow([
        "Gender",
        `Optional. One of: ${options.genders.map((g) => g.name).join(", ")}`,
    ]);
    reference.addRow([
        "Personal Email Address",
        "Optional. The guard's own email; it must not already belong to another employee or guard.",
    ]);
    reference.addRow([]);
    styleHeader(reference.addRow(["Branches", ""]));
    options.branches.forEach((b) => reference.addRow(["", b.name]));
    reference.getColumn(2).alignment = { wrapText: true };

    await download(workbook, "security_roster_import_template");
}

export async function exportRoster(rows: SecurityRosterEntry[]) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Security Roster");
    sheet.columns = [
        { width: 8 },
        { width: 30 },
        { width: 20 },
        { width: 16 },
        { width: 28 },
        { width: 34 },
        { width: 12 },
        { width: 20 },
        { width: 22 },
        { width: 32 },
    ];
    styleHeader(
        sheet.addRow([
            "ID",
            "Full Name",
            "License Number",
            "Mobile Number",
            "Branch",
            "Schedule",
            "Status",
            "Added",
            "Gender",
            "Personal Email Address",
        ]),
    );

    rows.forEach((r) =>
        sheet.addRow([
            r.id,
            r.full_name,
            r.license_number,
            r.mobile_number,
            r.branch_name ?? "",
            r.schedule_name ?? "",
            STATUS_LABEL[r.status] ?? r.status,
            r.created_at ?? "",
            r.gender_label ?? "",
            r.personal_email_address ?? "",
        ]),
    );
    sheet.getColumn(4).numFmt = "@";

    await download(workbook, "security_roster");
}
