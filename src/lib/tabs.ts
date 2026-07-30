export interface TabDef {
    key: string;
    label: string;
    section: string;
}

// Single source of truth — matches keys used in agency_tab_permissions
export const ALL_TABS: TabDef[] = [
    { key: "time_records",    label: "Time Records",    section: "Attendance" },
    { key: "work_remotely",   label: "Work Remotely",   section: "Attendance" },
    { key: "logoverride",     label: "Logoverride",     section: "Attendance" },
    { key: "overtime",        label: "Overtime",        section: "Attendance" },
    { key: "profile",         label: "Profile",         section: "My Profile" },
    { key: "training_files",  label: "Training Files",  section: "Learning" },
    { key: "trainings",       label: "Trainings",       section: "Learning" },
    { key: "notifications",   label: "Notifications",   section: "Updates" },
    { key: "announcements",   label: "Announcements",   section: "Updates" },
    { key: "payslip",         label: "Payslip",         section: "Attendance" },
    { key: "tm_hierarchy",   label: "T&M Hierarchy",   section: "Learning" },
    { key: "schedule",        label: "Schedule",        section: "Management" },
    { key: "forms",           label: "Forms",           section: "Management" },
    { key: "hr_approvals",    label: "HR Approvals",    section: "Management" },
];

/**
 * Standard/default permission set.
 * Tabs set to 0 here are hidden unless an admin explicitly enables them.
 * Tabs set to 1 are visible to all employees by default.
 *
 * Rules encoded:
 *   hr_approvals  — off by default; only meaningful for designated approvers
 *   schedule      — off by default; only relevant for supervisory/managerial levels
 *   forms         — off by default; only for supervisory/managerial levels
 *   work_remotely — off by default; granted individually via the Remote Work toggle
 */
export const STANDARD_PERMISSIONS: Record<string, number> = {
    time_records:   1,
    payslip:        1,
    work_remotely:  0,
    logoverride:    1,
    overtime:       1,
    profile:        1,
    training_files: 1,
    trainings:      1,
    notifications:  1,
    announcements:  1,
    schedule:       0,
    forms:          0,
    hr_approvals:   0,
    tm_hierarchy:   1,
};

export function isTabEnabled(
    tabKey: string,
    tabPermissions: Record<string, number> | undefined,
): boolean {
    if (!tabPermissions || !(tabKey in tabPermissions)) {
        // Fall back to the standard permission if no explicit override is stored
        return (STANDARD_PERMISSIONS[tabKey] ?? 1) === 1;
    }
    return tabPermissions[tabKey] === 1;
}
