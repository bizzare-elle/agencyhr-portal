import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { ParentComponent } from "@/components/parent-container";
import {
    IconDashboard,
    IconFileTime,
    IconUsers,
    IconCalendarCheck,
    IconClipboardList,
    IconFilter2Check,
    IconBell,
    IconSpeakerphone,
    IconSchool,
    IconHistory,
    IconShieldLock,
    IconBook2,
    IconChevronDown,
    IconChevronRight,
    IconSearch,
} from "@tabler/icons-react";
import { Timer, Wifi, Settings2 } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Step {
    text: string;
}

interface Section {
    id: string;
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
    label: string;
    description: string;
    steps: Step[];
    tips?: string[];
}

// ── Guide content ──────────────────────────────────────────────────────────────

const SECTIONS: Section[] = [
    {
        id: "time-records",
        icon: IconDashboard,
        iconBg: "bg-blue-500/15",
        iconColor: "text-blue-400",
        label: "Time Records",
        description: "View your daily attendance, clock-in/out times, hours worked, late minutes, overtime, and undertime for any date range.",
        steps: [
            { text: "Open Time Records from the sidebar under Attendance." },
            { text: "Your current cutoff period is shown by default. Use the date picker to navigate to other periods." },
            { text: "Each row shows: schedule, time in/out, break in/out, hours worked, late, overtime, and undertime." },
            { text: "Tap any row to expand the full breakdown for that day." },
        ],
        tips: [
            "If a clock-in or clock-out is missing, file a Log Override to correct it.",
            "Overtime hours shown here reflect approved overtime only.",
        ],
    },
    {
        id: "logoverride",
        icon: IconFileTime,
        iconBg: "bg-amber-500/15",
        iconColor: "text-amber-400",
        label: "Log Override",
        description: "Request a correction for a missing or incorrect clock-in/out entry. Requires approval from your designated approver.",
        steps: [
            { text: "Go to Logoverride under Attendance." },
            { text: "Tap the + button to file a new request." },
            { text: "Select the date, clock type (In or Out), and enter the correct time." },
            { text: "Upload a supporting photo if required (e.g. screenshot of your physical logbook or CCTV grab)." },
            { text: "Add a remark explaining why the correction is needed, then submit." },
            { text: "Your request will appear as Pending until your approver acts on it." },
        ],
        tips: [
            "File overrides within the same cutoff period — late submissions may be declined.",
            "Approved overrides are automatically reflected in your time records.",
        ],
    },
    {
        id: "overtime",
        icon: Timer,
        iconBg: "bg-green-500/15",
        iconColor: "text-green-400",
        label: "Overtime",
        description: "File, track, and manage overtime requests. All submissions are routed to your branch approver.",
        steps: [
            { text: "Open Overtime under Attendance." },
            { text: "Tap + New Request to open the form." },
            { text: "Select the date, enter the start and end time of your overtime work, and state the reason." },
            { text: "Upload any required documentation (memo, task completion screenshot)." },
            { text: "Submit — status will show Pending until approved or declined." },
            { text: "Approved overtime is posted to your time record for payroll computation." },
        ],
        tips: [
            "Only request overtime for work that was actually performed outside your regular schedule.",
            "You can edit a pending request before it is acted on.",
        ],
    },
    {
        id: "work-remotely",
        icon: Wifi,
        iconBg: "bg-teal-500/15",
        iconColor: "text-teal-400",
        label: "Work Remotely",
        description: "Clock in and out remotely when you are working off-site. This tab is visible only to employees with remote work access granted by an admin.",
        steps: [
            { text: "Open Work Remotely under Attendance." },
            { text: "Tap Clock In when you start work. Your location is recorded." },
            { text: "Tap Clock Out when you finish. The system calculates your hours automatically." },
            { text: "Remote time records appear alongside regular records in the Time Records tab." },
        ],
        tips: [
            "Remote work access is granted by your admin — contact them if you need it enabled.",
            "Ensure location permissions are allowed in your browser for accurate recording.",
        ],
    },
    {
        id: "profile",
        icon: IconUsers,
        iconBg: "bg-violet-500/15",
        iconColor: "text-violet-400",
        label: "My Profile",
        description: "View your personal information, employment details, government numbers, and emergency contacts on file.",
        steps: [
            { text: "Open Profile from My Profile in the sidebar." },
            { text: "Review your personal details, branch, department, position, and employment status." },
            { text: "To update your profile photo, click the camera icon on your avatar at the top of the page, or click your avatar in the sidebar footer." },
            { text: "Government IDs and emergency contact details are read-only — contact HR to update them." },
        ],
        tips: [
            "Profile photo changes are reflected everywhere in the portal immediately.",
            "If any detail is incorrect, raise a support ticket so HR can update your record.",
        ],
    },
    {
        id: "training",
        icon: IconSchool,
        iconBg: "bg-pink-500/15",
        iconColor: "text-pink-400",
        label: "Training Files",
        description: "Access and download training materials, standard operating procedures, and onboarding documents uploaded by HR.",
        steps: [
            { text: "Open Training Files under Learning in the sidebar." },
            { text: "Browse or search for documents by category or filename." },
            { text: "Click any file to preview it or download a copy." },
        ],
        tips: [
            "New files uploaded by HR appear here automatically — check regularly for updates.",
        ],
    },
    {
        id: "trainings",
        icon: IconHistory,
        iconBg: "bg-indigo-500/15",
        iconColor: "text-indigo-400",
        label: "Training History",
        description: "View a log of all trainings you have attended, including dates, topics, and completion status.",
        steps: [
            { text: "Open Trainings under Learning." },
            { text: "Your training history is listed chronologically. Each entry shows the training name, date, and status." },
            { text: "Tap any row for details and any attached certificates." },
        ],
        tips: [
            "Training records are updated by HR after each session — allow 1–2 business days.",
        ],
    },
    {
        id: "notifications",
        icon: IconBell,
        iconBg: "bg-yellow-500/15",
        iconColor: "text-yellow-400",
        label: "Notifications",
        description: "Stay on top of approval outcomes, system alerts, and HR messages addressed to you.",
        steps: [
            { text: "Open Notifications under Updates." },
            { text: "Unread notifications are highlighted. Click any item to mark it as read and see details." },
            { text: "The sidebar badge shows your unread count and updates in real time." },
        ],
        tips: [
            "Approval results for log overrides and overtime are delivered here.",
        ],
    },
    {
        id: "announcements",
        icon: IconSpeakerphone,
        iconBg: "bg-orange-500/15",
        iconColor: "text-orange-400",
        label: "Announcements",
        description: "Read company-wide, branch-specific, or department-specific announcements posted by HR and management.",
        steps: [
            { text: "Open Announcements under Updates." },
            { text: "Announcements are listed newest first. Tap any card to read the full message." },
            { text: "You can react to or comment on announcements using the interaction bar below each post." },
        ],
        tips: [
            "Announcements may be targeted to specific branches, departments, or positions — you will only see those relevant to you.",
        ],
    },
    {
        id: "schedule",
        icon: IconCalendarCheck,
        iconBg: "bg-cyan-500/15",
        iconColor: "text-cyan-400",
        label: "Schedule",
        description: "View, assign, and manage work schedules. Available to supervisory and managerial staff.",
        steps: [
            { text: "Open Schedule under Management." },
            { text: "Use the calendar view to see scheduled shifts for your team or branch." },
            { text: "Tap a date to assign or modify a schedule for an employee." },
            { text: "Use the Upload tab to bulk-import schedules from a spreadsheet template." },
        ],
        tips: [
            "Employees must have an assigned schedule for their time records to compute correctly.",
            "Download the upload template first to ensure correct column formatting.",
        ],
    },
    {
        id: "forms",
        icon: IconClipboardList,
        iconBg: "bg-lime-500/15",
        iconColor: "text-lime-400",
        label: "Forms",
        description: "Submit and track HR forms — currently supports Employee Incident & Corrective Form (EICF) and Manpower Request Form (MRF).",
        steps: [
            { text: "Open Forms under Management." },
            { text: "Select the form type: EICF (for incident reporting) or MRF (for headcount requests)." },
            { text: "Fill in all required fields and attach any supporting documents." },
            { text: "Submit — the form is routed to the appropriate reviewer." },
            { text: "Track the status of your submissions from the Submissions list." },
        ],
        tips: [
            "EICF submissions are validated by HR before being finalized.",
            "MRF forms require branch and position details — have these ready before starting.",
        ],
    },
    {
        id: "hr-approvals",
        icon: IconFilter2Check,
        iconBg: "bg-emerald-500/15",
        iconColor: "text-emerald-400",
        label: "HR Approvals",
        description: "Review and act on pending log override and overtime requests from your team. Visible to designated approvers only.",
        steps: [
            { text: "Open HR Approvals under Management." },
            { text: "Pending requests are listed with employee name, date, and request type." },
            { text: "Click a row to review the details and any attached photo evidence." },
            { text: "Click Approve or Decline. Declined requests require a reason." },
            { text: "The employee is notified of your decision via Notifications." },
        ],
        tips: [
            "Act on pending requests within the same cutoff period to ensure correct payroll computation.",
            "You can filter by branch or request type using the toolbar filters.",
        ],
    },
    {
        id: "admin",
        icon: Settings2,
        iconBg: "bg-purple-500/15",
        iconColor: "text-purple-400",
        label: "Admin Panel",
        description: "Manage users, access controls, approver assignments, and tab-level visibility settings. Available to admin accounts only.",
        steps: [
            { text: "Open Admin Panel from the sidebar (admin accounts only)." },
            { text: "Overview — see a live summary of total employees, coordinators, admins, remote workers, and distribution by branch and position." },
            { text: "Users — promote/demote coordinators, grant/revoke admin access, enable remote work, and assign branches." },
            { text: "Access Lists — quick view of who has coordinator, admin, and remote work access." },
            { text: "Approvers — assign which coordinators can approve overtime and log overrides per branch." },
            { text: "Tab Access — control which sidebar tabs are visible per position or per employee. Use 'Reset to Standard' to apply the recommended defaults." },
        ],
        tips: [
            "Tab Access changes take effect the next time the affected employee refreshes their session.",
            "Admin access should be granted sparingly — admins can modify all user settings.",
        ],
    },
    {
        id: "password",
        icon: IconShieldLock,
        iconBg: "bg-red-500/15",
        iconColor: "text-red-400",
        label: "Reset Password",
        description: "Change your account password at any time from the sidebar user menu.",
        steps: [
            { text: "Click your name/avatar at the bottom of the sidebar to open the user menu." },
            { text: "Click Reset Password." },
            { text: "Enter and confirm your new password (minimum 6 characters)." },
            { text: "Click Save — you will remain logged in." },
        ],
        tips: [
            "Use a strong password that is not shared with other accounts.",
            "If you are locked out, contact your admin to reset your password from the Users tab.",
        ],
    },
];

// ── Nav sidebar ────────────────────────────────────────────────────────────────

function GuideSidebar({
    active,
    onSelect,
}: {
    active: string;
    onSelect: (id: string) => void;
}) {
    return (
        <nav className="sticky top-6 flex flex-col gap-0.5">
            {SECTIONS.map((s) => (
                <button
                    key={s.id}
                    onClick={() => onSelect(s.id)}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        active === s.id
                            ? "bg-primary/15 text-primary font-semibold"
                            : "text-muted-foreground hover:bg-muted/20 hover:text-foreground"
                    }`}
                >
                    <s.icon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{s.label}</span>
                </button>
            ))}
        </nav>
    );
}

// ── Section card ───────────────────────────────────────────────────────────────

function SectionCard({ section }: { section: Section }) {
    const [open, setOpen] = useState(true);

    return (
        <div
            id={section.id}
            className="rounded-xl border border-border bg-card overflow-hidden"
        >
            {/* Header */}
            <button
                onClick={() => setOpen((v) => !v)}
                className="flex w-full items-center gap-4 px-6 py-5 text-left hover:bg-muted/10 transition-colors"
            >
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${section.iconBg}`}>
                    <section.icon className={`h-5 w-5 ${section.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold leading-tight">{section.label}</p>
                    <p className="text-muted-foreground mt-0.5 text-sm leading-snug">{section.description}</p>
                </div>
                {open
                    ? <IconChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    : <IconChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                }
            </button>

            {/* Body */}
            {open && (
                <div className="border-t border-border px-6 py-5 space-y-5">
                    {/* Steps */}
                    <div>
                        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                            How to use
                        </p>
                        <ol className="space-y-2.5">
                            {section.steps.map((step, i) => (
                                <li key={i} className="flex gap-3">
                                    <span className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${section.iconBg} ${section.iconColor}`}>
                                        {i + 1}
                                    </span>
                                    <span className="text-sm leading-relaxed">{step.text}</span>
                                </li>
                            ))}
                        </ol>
                    </div>

                    {/* Tips */}
                    {section.tips && section.tips.length > 0 && (
                        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 space-y-1.5">
                            <p className="text-[11px] font-semibold uppercase tracking-widest text-yellow-500/70">
                                Tips
                            </p>
                            <ul className="space-y-1.5">
                                {section.tips.map((tip, i) => (
                                    <li key={i} className="flex gap-2 text-sm text-yellow-300/80">
                                        <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-yellow-500/60" />
                                        {tip}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function SystemGuide() {
    const [search, setSearch] = useState("");
    const [active, setActive] = useState(SECTIONS[0].id);

    const filtered = search.trim()
        ? SECTIONS.filter(
              (s) =>
                  s.label.toLowerCase().includes(search.toLowerCase()) ||
                  s.description.toLowerCase().includes(search.toLowerCase()) ||
                  s.steps.some((st) => st.text.toLowerCase().includes(search.toLowerCase())),
          )
        : SECTIONS;

    const scrollTo = (id: string) => {
        setActive(id);
        setSearch("");
        setTimeout(() => {
            document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 50);
    };

    return (
        <ParentComponent>
            <div className="px-6 py-6">
                {/* Page header */}
                <div className="mb-6 flex items-start gap-4">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/15">
                        <IconBook2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">System Guide</h1>
                        <p className="text-muted-foreground text-sm mt-0.5">
                            A complete reference for every feature in the Agency HR Portal.
                        </p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative mb-6">
                    <IconSearch className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search features, steps, or topics…"
                        className="border-input bg-background w-full rounded-xl border py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                </div>

                {search.trim() ? (
                    /* Search results */
                    <div className="space-y-4">
                        {filtered.length === 0 ? (
                            <div className="rounded-xl border border-dashed py-16 text-center">
                                <p className="text-muted-foreground text-sm">No results for "{search}"</p>
                            </div>
                        ) : (
                            filtered.map((s) => <SectionCard key={s.id} section={s} />)
                        )}
                    </div>
                ) : (
                    /* Two-column layout */
                    <div className="grid gap-8 lg:grid-cols-[200px_1fr]">
                        {/* Sticky nav */}
                        <div className="hidden lg:block">
                            <GuideSidebar active={active} onSelect={scrollTo} />
                        </div>

                        {/* Content */}
                        <div className="space-y-4">
                            {SECTIONS.map((s) => (
                                <SectionCard key={s.id} section={s} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </ParentComponent>
    );
}
