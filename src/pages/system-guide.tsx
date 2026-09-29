import React, { useMemo, useState } from "react";
import { ParentComponent } from "@/components/parent-container";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { ApiResponse } from "@/index";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { GuidePdfDocument, type GuideLang } from "@/components/user-guide/guide-pdf";
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
    IconShieldCheck,
    IconBook2,
    IconChevronDown,
    IconChevronRight,
    IconSearch,
    IconLanguage,
    IconDownload,
    IconUsersGroup,
    IconCalendarOff,
    IconFaceId,
} from "@tabler/icons-react";
import { Timer, Wifi, Settings2 } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Localized {
    en: string;
    tl: string;
}

type Audience = "employee" | "coordinator" | "admin";

interface Section {
    id: string;
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
    label: Localized;
    description: Localized;
    steps: Localized[];
    tips?: Localized[];
    /** Who this section is written for — used to build the coordinator's
     * "send out" employee-only guide export. Not used to hide sections from
     * anyone viewing the guide in-app; everyone can read the full guide. */
    audience: Audience[];
}

const LABELS = {
    searchPlaceholder: {
        en: "Search features, steps, or topics…",
        tl: "Maghanap ng features, steps, o paksa…",
    },
    noResults: { en: "No results for", tl: "Walang resulta para sa" },
    pageTitle: { en: "System Guide", tl: "Gabay sa Sistema" },
    pageSubtitle: {
        en: "A complete reference for every feature in the Agency HR Portal.",
        tl: "Kumpletong sanggunian para sa bawat feature sa Agency HR Portal.",
    },
    howToUse: { en: "How to use", tl: "Paano Gamitin" },
    tips: { en: "Tips", tl: "Mga Paalala" },
    downloadGuide: { en: "Download Guide", tl: "I-download ang Gabay" },
    downloadEmployeeGuide: {
        en: "Download Employee Guide",
        tl: "I-download ang Gabay ng Empleyado",
    },
    preparing: { en: "Preparing PDF…", tl: "Inihahanda ang PDF…" },
    employeeGuideNote: {
        en: "Share this shorter, employee-facing guide with your team — it leaves out coordinator/admin-only sections.",
        tl: "Ibahagi ang mas maikling gabay na ito sa iyong team — hindi kasama dito ang mga coordinator/admin-only na seksyon.",
    },
} as const;

// ── Guide content ──────────────────────────────────────────────────────────────

const SECTIONS: Section[] = [
    {
        id: "time-records",
        icon: IconDashboard,
        iconBg: "bg-blue-500/15",
        iconColor: "text-blue-400",
        label: { en: "Time Records", tl: "Mga Time Record" },
        description: {
            en: "View your daily attendance, clock-in/out times, hours worked, late minutes, overtime, and undertime for any date range.",
            tl: "Tingnan ang iyong daily attendance, clock-in/out times, oras na na-work, late minutes, overtime, at undertime para sa anumang saklaw ng petsa.",
        },
        steps: [
            {
                en: "Open Time Records from the sidebar under Attendance.",
                tl: "Buksan ang Time Records mula sa sidebar, sa ilalim ng Attendance.",
            },
            {
                en: "Your current cutoff period is shown by default. Use the date picker to navigate to other periods.",
                tl: "Ang kasalukuyang cutoff period mo ang lalabas by default. Gamitin ang date picker para pumunta sa ibang cutoff.",
            },
            {
                en: "Each row shows: schedule, time in/out, break in/out, hours worked, late, overtime, and undertime.",
                tl: "Bawat row ay nagpapakita ng: schedule, time in/out, break in/out, oras na na-work, late, overtime, at undertime.",
            },
            {
                en: "Tap any row to expand the full breakdown for that day.",
                tl: "I-tap ang kahit anong row para makita ang buong detalye ng araw na iyon.",
            },
        ],
        tips: [
            {
                en: "If a clock-in or clock-out is missing, file a Log Override to correct it.",
                tl: "Kung may kulang na clock-in o clock-out, mag-file ng Log Override para maitama ito.",
            },
            {
                en: "Overtime hours shown here reflect approved overtime only.",
                tl: "Ang overtime na makikita dito ay yung mga naaprubahan na lamang.",
            },
        ],
        audience: ["employee"],
    },
    {
        id: "logoverride",
        icon: IconFileTime,
        iconBg: "bg-amber-500/15",
        iconColor: "text-amber-400",
        label: { en: "Log Override", tl: "Log Override" },
        description: {
            en: "Request a correction for a missing or incorrect clock-in/out entry. Requires approval from your designated approver.",
            tl: "Mag-request ng correction para sa kulang o maling clock-in/out entry. Kailangan ng approval mula sa itinalagang approver mo.",
        },
        steps: [
            {
                en: "Go to Logoverride under Attendance.",
                tl: "Pumunta sa Logoverride, sa ilalim ng Attendance.",
            },
            {
                en: "Tap the + button to file a new request.",
                tl: "I-tap ang + button para mag-file ng bagong request.",
            },
            {
                en: "Select the date, clock type (In or Out), and enter the correct time.",
                tl: "Piliin ang petsa, klase ng clock (In o Out), at ilagay ang tamang oras.",
            },
            {
                en: 'Choose a remark. If you select "Offset," a reason is required — for other remarks, a reason is optional but recommended.',
                tl: 'Pumili ng remark. Kung pipiliin mo ang "Offset," kailangan mong maglagay ng reason — sa ibang remarks, optional ang reason pero inirerekomenda.',
            },
            {
                en: "Uploading a supporting photo (e.g. screenshot of your physical logbook or CCTV grab) is optional, but it helps your approver decide faster.",
                tl: "Optional ang pag-upload ng supporting photo (hal. screenshot ng physical logbook o CCTV grab), pero nakakatulong ito para mas mabilis ang desisyon ng approver.",
            },
            {
                en: "Submit. Your request will appear as Pending until your approver acts on it.",
                tl: "I-submit. Magiging Pending ang request hanggang kumilos ang approver mo.",
            },
        ],
        tips: [
            {
                en: "A request is blocked if there is already a punch or another override within 10 hours of the time you're requesting — the system treats that as a duplicate.",
                tl: "Hindi papayagan ang request kung may existing punch o ibang override na sa loob ng 10 oras mula sa oras na hinihiling mo — itinuturing itong duplicate ng system.",
            },
            {
                en: "Approved overrides are automatically reflected in your time records.",
                tl: "Ang mga naaprubahang override ay awtomatikong makikita sa iyong time records.",
            },
            {
                en: "Your approver can only act on a request within the active approval window: filed 1st–15th → deadline is the 16th of the same month; filed 16th–end of month → deadline is the 1st of the next month. File and follow up early.",
                tl: "Ang approver mo ay makakakilos lamang habang nasa loob ng approval window: kung na-file sa ika-1 hanggang ika-15 ng buwan, ang deadline ay ika-16 ng parehong buwan; kung na-file sa ika-16 hanggang katapusan ng buwan, ang deadline ay ika-1 ng susunod na buwan. Mag-file at mag-follow up nang maaga.",
            },
        ],
        audience: ["employee"],
    },
    {
        id: "overtime",
        icon: Timer,
        iconBg: "bg-green-500/15",
        iconColor: "text-green-400",
        label: { en: "Overtime", tl: "Overtime" },
        description: {
            en: "File, track, and manage overtime requests. All submissions are routed to your branch approver.",
            tl: "Mag-file, mag-track, at mag-manage ng overtime requests. Lahat ng submission ay pupunta sa approver ng iyong branch.",
        },
        steps: [
            {
                en: "Open Overtime under Attendance.",
                tl: "Buksan ang Overtime, sa ilalim ng Attendance.",
            },
            {
                en: "Tap + New Request to open the form.",
                tl: "I-tap ang + New Request para buksan ang form.",
            },
            {
                en: "Select the date — you can only file for today or up to 2 days in the past. Enter the start and end time of your overtime work, and state the reason.",
                tl: "Piliin ang petsa — puwede lang mag-file para sa araw na ito o hanggang 2 araw na nakalipas. Ilagay ang start at end time ng overtime work mo, at ilagay ang reason.",
            },
            {
                en: "Remarks and a supporting photo (memo, task completion screenshot) are both optional, but adding them helps your approver decide faster.",
                tl: "Optional ang remarks at supporting photo (memo, screenshot ng nagawang task), pero nakakatulong ito para mas mabilis ang desisyon ng approver.",
            },
            {
                en: "Submit — status will show Pending until approved or declined.",
                tl: "I-submit — Pending ang status hanggang ma-approve o ma-decline.",
            },
            {
                en: "Approved overtime is posted to your time record for payroll computation.",
                tl: "Ang naaprubahang overtime ay awtomatikong makikita sa iyong time record para sa payroll computation.",
            },
        ],
        tips: [
            {
                en: "Only request overtime for work that was actually performed outside your regular schedule.",
                tl: "Mag-request lamang ng overtime para sa trabahong talagang nagawa labas sa regular schedule mo.",
            },
            {
                en: "You can edit a pending request before it is acted on.",
                tl: "Puwede mo pang i-edit ang pending request bago ito kilusan ng approver.",
            },
            {
                en: "Your approver can only act on a request within the approval window: filed 1st–15th → deadline is the 16th of the same month; filed 16th–end of month → deadline is the 1st of the next month.",
                tl: "Ang approver mo ay makakakilos lamang habang nasa loob ng approval window: kung na-file sa ika-1 hanggang ika-15, ang deadline ay ika-16 ng parehong buwan; kung na-file sa ika-16 hanggang katapusan ng buwan, ang deadline ay ika-1 ng susunod na buwan.",
            },
        ],
        audience: ["employee"],
    },
    {
        id: "work-remotely",
        icon: Wifi,
        iconBg: "bg-teal-500/15",
        iconColor: "text-teal-400",
        label: { en: "Work Remotely", tl: "Work Remotely" },
        description: {
            en: "Clock in and out remotely when you are working off-site. This tab is visible only to employees with remote work access granted by an admin.",
            tl: "Mag-clock in at out nang remote kapag nagtatrabaho ka sa labas ng branch. Makikita lang ang tab na ito kung binigyan ka ng admin ng remote work access.",
        },
        steps: [
            {
                en: "Open Work Remotely under Attendance.",
                tl: "Buksan ang Work Remotely, sa ilalim ng Attendance.",
            },
            {
                en: "Tap Clock In when you start work. Your location is recorded.",
                tl: "I-tap ang Clock In kapag nagsimula ka ng trabaho. Ire-record ang lokasyon mo.",
            },
            {
                en: "Tap Clock Out when you finish. The system calculates your hours automatically.",
                tl: "I-tap ang Clock Out kapag tapos ka na. Awtomatikong kukwentahin ng system ang oras mo.",
            },
            {
                en: "Remote time records appear alongside regular records in the Time Records tab.",
                tl: "Makikita ang remote time records kasama ng regular records sa Time Records tab.",
            },
        ],
        tips: [
            {
                en: "Remote work access is granted by your admin — contact them if you need it enabled.",
                tl: "Ang remote work access ay ibinibigay ng admin mo — kontakin sila kung kailangan mo itong ma-enable.",
            },
            {
                en: "Ensure location permissions are allowed in your browser for accurate recording.",
                tl: "Tiyaking naka-allow ang location permissions sa browser mo para tumpak ang pagre-record.",
            },
        ],
        audience: ["employee"],
    },
    {
        id: "leave-forms",
        icon: IconCalendarOff,
        iconBg: "bg-rose-500/15",
        iconColor: "text-rose-400",
        label: { en: "Leave Forms", tl: "Leave Forms" },
        description: {
            en: "Track leave that has already been approved outside the portal. Employees see a read-only view of leave filed for them; agency coordinators upload the approved leave form and it is automatically plotted onto the employee's schedule.",
            tl: "I-track ang leave na naaprubahan na sa labas ng portal. Makikita ng empleyado ang view-only na leave na na-file para sa kanila; ang agency coordinator naman ang nag-a-upload ng naaprubahang leave form at ito ay awtomatikong naipeplot sa schedule ng empleyado.",
        },
        steps: [
            {
                en: "If you are an employee: open My Leave Forms under Attendance to see leave already filed for you — this is view-only.",
                tl: "Kung empleyado ka: buksan ang My Leave Forms sa ilalim ng Attendance para makita ang leave na na-file na para sa iyo — view-only ito.",
            },
            {
                en: "If you are an agency coordinator: open Leave Forms under Management to see every leave form you have filed.",
                tl: "Kung agency coordinator ka: buksan ang Leave Forms sa ilalim ng Management para makita ang lahat ng leave form na na-file mo.",
            },
            {
                en: "Click File Leave Form. Select the employee, leave type (Sick Leave or Vacation Leave), leave start and end date, whether it is paid, and any remarks.",
                tl: "I-click ang File Leave Form. Piliin ang empleyado, klase ng leave (Sick Leave o Vacation Leave), simula at katapusan ng leave, kung bayad (paid) ito, at anumang remarks.",
            },
            {
                en: "Attach a copy of the already-approved leave form (PDF, JPG, PNG, or GIF) — this is required and serves as the proof of approval.",
                tl: "Mag-attach ng kopya ng naaprubahan nang leave form (PDF, JPG, PNG, o GIF) — required ito bilang patunay ng approval.",
            },
            {
                en: "Submit. The leave is plotted onto the employee's schedule immediately — there is no separate approval step inside the portal; the leave must already be approved before you upload it.",
                tl: "I-submit. Agad na maipeplot ang leave sa schedule ng empleyado — walang hiwalay na approval step sa loob ng portal; dapat naaprubahan na ang leave bago mo ito i-upload.",
            },
            {
                en: "To cancel a leave you filed by mistake, click Withdraw on that row. This removes it from the employee's schedule.",
                tl: "Para kanselahin ang maling na-file na leave, i-click ang Withdraw sa row na iyon. Aalisin nito ang leave sa schedule ng empleyado.",
            },
        ],
        tips: [
            {
                en: "Leave Forms does not have its own approval workflow — only upload leave that has already been approved through your normal process.",
                tl: "Walang sariling approval workflow ang Leave Forms — mag-upload lamang ng leave na naaprubahan na sa normal mong proseso.",
            },
            {
                en: "Only Sick Leave and Vacation Leave are supported; there is no leave-credit balance shown in the portal.",
                tl: "Sick Leave at Vacation Leave lang ang suportado; walang leave-credit balance na makikita sa portal.",
            },
            {
                en: "You can only withdraw a leave form you filed yourself.",
                tl: "Ang leave form lang na na-file mo mismo ang puwede mong i-withdraw.",
            },
        ],
        audience: ["employee", "coordinator"],
    },
    {
        id: "profile",
        icon: IconUsers,
        iconBg: "bg-violet-500/15",
        iconColor: "text-violet-400",
        label: { en: "My Profile", tl: "Aking Profile" },
        description: {
            en: "View your personal information, employment details, government numbers, and emergency contacts on file.",
            tl: "Tingnan ang personal information mo, employment details, government numbers, at emergency contacts na nakarehistro.",
        },
        steps: [
            {
                en: "Open Profile from My Profile in the sidebar.",
                tl: "Buksan ang Profile mula sa My Profile sa sidebar.",
            },
            {
                en: "Review your personal details, branch, department, position, and employment status.",
                tl: "Suriin ang personal details, branch, department, position, at employment status mo.",
            },
            {
                en: "To update your profile photo, click the camera icon on your avatar at the top of the page, or click your avatar in the sidebar footer.",
                tl: "Para i-update ang profile photo, i-click ang camera icon sa avatar mo sa taas ng page, o i-click ang avatar mo sa footer ng sidebar.",
            },
            {
                en: "Government IDs and emergency contact details are read-only — contact HR to update them.",
                tl: "Read-only ang government IDs at emergency contact details — kontakin ang HR para i-update ang mga ito.",
            },
        ],
        tips: [
            {
                en: "Profile photo changes are reflected everywhere in the portal immediately.",
                tl: "Agad na makikita kahit saan sa portal ang pagbabago sa profile photo.",
            },
            {
                en: "If any detail is incorrect, raise a support ticket so HR can update your record.",
                tl: "Kung may mali sa detalye, mag-file ng support ticket para ma-update ito ng HR.",
            },
        ],
        audience: ["employee"],
    },
    {
        id: "training",
        icon: IconSchool,
        iconBg: "bg-pink-500/15",
        iconColor: "text-pink-400",
        label: { en: "Training Files", tl: "Training Files" },
        description: {
            en: "Access and download training materials, standard operating procedures, and onboarding documents uploaded by HR.",
            tl: "I-access at i-download ang training materials, standard operating procedures, at onboarding documents na ni-upload ng HR.",
        },
        steps: [
            {
                en: "Open Training Files under Learning in the sidebar.",
                tl: "Buksan ang Training Files, sa ilalim ng Learning sa sidebar.",
            },
            {
                en: "Browse or search for documents by category or filename.",
                tl: "Mag-browse o mag-search ng documents ayon sa category o filename.",
            },
            {
                en: "Click any file to preview it or download a copy.",
                tl: "I-click ang kahit anong file para i-preview o i-download.",
            },
        ],
        tips: [
            {
                en: "New files uploaded by HR appear here automatically — check regularly for updates.",
                tl: "Awtomatikong lalabas dito ang bagong files na na-upload ng HR — regular na tignan para sa updates.",
            },
        ],
        audience: ["employee"],
    },
    {
        id: "trainings",
        icon: IconHistory,
        iconBg: "bg-indigo-500/15",
        iconColor: "text-indigo-400",
        label: { en: "Training History", tl: "Training History" },
        description: {
            en: "View a log of all trainings you have attended, including dates, topics, and completion status.",
            tl: "Tingnan ang log ng lahat ng trainings na dinaluhan mo, kasama ang petsa, paksa, at completion status.",
        },
        steps: [
            {
                en: "Open Trainings under Learning.",
                tl: "Buksan ang Trainings, sa ilalim ng Learning.",
            },
            {
                en: "Your training history is listed chronologically. Each entry shows the training name, date, and status.",
                tl: "Nakalista ang training history mo ayon sa petsa. Bawat entry ay may training name, petsa, at status.",
            },
            {
                en: "Tap any row for details and any attached certificates.",
                tl: "I-tap ang kahit anong row para sa detalye at attached certificates.",
            },
        ],
        tips: [
            {
                en: "Training records are updated by HR after each session — allow 1–2 business days.",
                tl: "Ina-update ng HR ang training records pagkatapos ng bawat session — maghintay ng 1–2 business days.",
            },
        ],
        audience: ["employee"],
    },
    {
        id: "notifications",
        icon: IconBell,
        iconBg: "bg-yellow-500/15",
        iconColor: "text-yellow-400",
        label: { en: "Notifications", tl: "Mga Notification" },
        description: {
            en: "Stay on top of approval outcomes, system alerts, and HR messages addressed to you.",
            tl: "Manatiling updated sa approval outcomes, system alerts, at mensahe ng HR na para sa iyo.",
        },
        steps: [
            {
                en: "Open Notifications under Updates.",
                tl: "Buksan ang Notifications, sa ilalim ng Updates.",
            },
            {
                en: "Unread notifications are highlighted. Click any item to mark it as read and see details.",
                tl: "Naka-highlight ang mga unread notification. I-click ang kahit anong item para markahan itong read at makita ang detalye.",
            },
            {
                en: "The sidebar badge shows your unread count and updates in real time.",
                tl: "Ipinapakita ng badge sa sidebar ang unread count mo at real-time itong nag-a-update.",
            },
        ],
        tips: [
            {
                en: "Approval results for log overrides and overtime are delivered here.",
                tl: "Dito ihahatid ang resulta ng approval para sa log overrides at overtime.",
            },
        ],
        audience: ["employee"],
    },
    {
        id: "announcements",
        icon: IconSpeakerphone,
        iconBg: "bg-orange-500/15",
        iconColor: "text-orange-400",
        label: { en: "Announcements", tl: "Mga Anunsyo" },
        description: {
            en: "Read company-wide, branch-specific, or department-specific announcements posted by HR and management.",
            tl: "Basahin ang company-wide, branch-specific, o department-specific na anunsyo mula sa HR at management.",
        },
        steps: [
            {
                en: "Open Announcements under Updates.",
                tl: "Buksan ang Announcements, sa ilalim ng Updates.",
            },
            {
                en: "Announcements are listed newest first. Tap any card to read the full message.",
                tl: "Nakalista ang mga anunsyo mula sa pinakabago. I-tap ang kahit anong card para basahin ang buong mensahe.",
            },
            {
                en: "You can react to or comment on announcements using the interaction bar below each post.",
                tl: "Puwede kang mag-react o mag-comment sa mga anunsyo gamit ang interaction bar sa ilalim ng bawat post.",
            },
        ],
        tips: [
            {
                en: "Announcements may be targeted to specific branches, departments, or positions — you will only see those relevant to you.",
                tl: "Puwedeng naka-target ang mga anunsyo sa specific branches, departments, o positions — makikita mo lang ang mga relevant sa iyo.",
            },
        ],
        audience: ["employee"],
    },
    {
        id: "schedule",
        icon: IconCalendarCheck,
        iconBg: "bg-cyan-500/15",
        iconColor: "text-cyan-400",
        label: { en: "Schedule", tl: "Schedule" },
        description: {
            en: "View, assign, and manage work schedules. Available to supervisory and managerial staff.",
            tl: "Tingnan, mag-assign, at mag-manage ng work schedules. Para sa supervisory at managerial staff.",
        },
        steps: [
            {
                en: "Open Schedule under Management.",
                tl: "Buksan ang Schedule, sa ilalim ng Management.",
            },
            {
                en: "Use the calendar view to see scheduled shifts for your team or branch.",
                tl: "Gamitin ang calendar view para makita ang naka-schedule na shifts ng team o branch mo.",
            },
            {
                en: "Tap a date to assign or modify a schedule for an employee.",
                tl: "I-tap ang isang petsa para mag-assign o magbago ng schedule ng empleyado.",
            },
            {
                en: "Use the Upload tab to bulk-import schedules from a spreadsheet template.",
                tl: "Gamitin ang Upload tab para mag-bulk import ng schedules mula sa spreadsheet template.",
            },
        ],
        tips: [
            {
                en: "Employees must have an assigned schedule for their time records to compute correctly.",
                tl: "Kailangang may naka-assign na schedule ang empleyado para tama ang computation ng time records.",
            },
            {
                en: "Download the upload template first to ensure correct column formatting.",
                tl: "I-download muna ang upload template para siguradong tama ang column formatting.",
            },
        ],
        audience: ["coordinator"],
    },
    {
        id: "forms",
        icon: IconClipboardList,
        iconBg: "bg-lime-500/15",
        iconColor: "text-lime-400",
        label: { en: "Forms", tl: "Mga Form" },
        description: {
            en: "Submit and track HR forms — currently supports Employee Incident & Corrective Form (EICF) and Manpower Request Form (MRF).",
            tl: "Mag-submit at mag-track ng HR forms — kasalukuyang sinusuportahan: Employee Incident & Corrective Form (EICF) at Manpower Request Form (MRF).",
        },
        steps: [
            {
                en: "Open Forms under Management.",
                tl: "Buksan ang Forms, sa ilalim ng Management.",
            },
            {
                en: "Select the form type: EICF (for incident reporting) or MRF (for headcount requests).",
                tl: "Piliin ang klase ng form: EICF (para sa incident reporting) o MRF (para sa headcount requests).",
            },
            {
                en: "Fill in all required fields and attach any supporting documents.",
                tl: "Punan ang lahat ng required fields at mag-attach ng supporting documents kung meron.",
            },
            {
                en: "Submit — the form is routed to the appropriate reviewer.",
                tl: "I-submit — ipapadala ang form sa tamang reviewer.",
            },
            {
                en: "Track the status of your submissions from the Submissions list.",
                tl: "I-track ang status ng mga submission mo mula sa Submissions list.",
            },
        ],
        tips: [
            {
                en: "EICF submissions are validated by HR before being finalized.",
                tl: "Vinavalidate ng HR ang EICF submissions bago i-finalize.",
            },
            {
                en: "MRF forms require branch and position details — have these ready before starting.",
                tl: "Kailangan ng branch at position details ang MRF forms — ihanda muna ito bago magsimula.",
            },
        ],
        audience: ["employee"],
    },
    {
        id: "security-roster",
        icon: IconShieldCheck,
        iconBg: "bg-yellow-500/15",
        iconColor: "text-yellow-400",
        label: { en: "Security Roster", tl: "Security Roster" },
        description: {
            en: "List the security guards your agency is posting to Wildflour branches, and set where and when each one works. Available to security agency coordinators only.",
            tl: "Ilista ang mga security guard na ipinapadala ng agency mo sa mga Wildflour branch, at i-set kung saan at kailan magtatrabaho ang bawat isa. Para lamang sa security agency coordinators.",
        },
        steps: [
            {
                en: "Open Security Roster under Management.",
                tl: "Buksan ang Security Roster, sa ilalim ng Management.",
            },
            {
                en: "The tiles at the top count your guards by status: Pending (on the roster, not yet registered), Claimed (registered on the branch tablet), and Inactive (posting cancelled).",
                tl: "Ang mga tile sa taas ay bumibilang ng guards ayon sa status: Pending (nasa roster, hindi pa naka-register), Claimed (naka-register na sa branch tablet), at Inactive (kinansela ang posting).",
            },
            {
                en: "Click Add Guard and enter the guard's full name, security license number, and mobile number. You can set the branch and schedule now or later.",
                tl: "I-click ang Add Guard at ilagay ang buong pangalan, security license number, at mobile number ng guard. Puwede mong i-set ang branch at schedule ngayon o mamaya.",
            },
            {
                en: "To set or change a posting, click the pencil icon on a Pending guard and choose the branch and schedule. Only branches with an attendance tablet are listed.",
                tl: "Para i-set o baguhin ang posting, i-click ang pencil icon sa isang Pending guard at piliin ang branch at schedule. Yung mga branch lang na may attendance tablet ang nakalista.",
            },
            {
                en: "Once a guard's branch and schedule are both set, they register on that branch's tablet using their license number. After that, their status changes to Claimed.",
                tl: "Kapag naka-set na ang branch at schedule ng guard, magre-register siya sa tablet ng branch na iyon gamit ang license number niya. Pagkatapos, magiging Claimed ang status niya.",
            },
            {
                en: "To add many guards at once, click Import, download the blank template, fill in one guard per row, and upload it. Rows with problems are skipped and listed so you can fix and re-upload them.",
                tl: "Para magdagdag ng maraming guards nang sabay-sabay, i-click ang Import, i-download ang blangkong template, punan ng isang guard bawat row, at i-upload. Ang mga row na may problema ay lalaktawan at ililista para maayos at ma-upload muli.",
            },
            {
                en: "Click Export to download your whole roster as an Excel file.",
                tl: "I-click ang Export para i-download ang buong roster mo bilang Excel file.",
            },
        ],
        tips: [
            {
                en: "Each license number can only appear once on your roster. A duplicate row in an import is skipped, never overwritten.",
                tl: "Isang beses lang puwedeng lumabas ang isang license number sa roster mo. Ang duplicate row sa import ay lalaktawan, hindi papalitan.",
            },
            {
                en: "Deactivate a Pending guard whose posting is cancelled. You can reactivate them later if they never registered.",
                tl: "I-deactivate ang Pending guard na na-cancel ang posting. Puwede mo pa siyang i-reactivate kung hindi pa siya nag-register.",
            },
            {
                en: "Only Pending postings can be edited, and only guards who have not registered yet can be deleted. Once a guard has registered, Atlas HR manages their record — contact HR for changes.",
                tl: "Yung Pending postings lang ang puwedeng i-edit, at yung mga guard na hindi pa nagre-register lang ang puwedeng i-delete. Kapag naka-register na ang guard, ang Atlas HR na ang mag-manage ng record niya — kontakin ang HR para sa pagbabago.",
            },
            {
                en: "Branch and Schedule in the import template must match the names on the template's Field Reference sheet exactly.",
                tl: "Ang Branch at Schedule sa import template ay dapat eksaktong tugma sa mga pangalan sa Field Reference sheet ng template.",
            },
        ],
        audience: ["coordinator"],
    },
    {
        id: "face-enrollment",
        icon: IconFaceId,
        iconBg: "bg-sky-500/15",
        iconColor: "text-sky-400",
        label: { en: "Face Enrollment", tl: "Face Enrollment" },
        description: {
            en: "Enroll your agency's employees' faces for facial-recognition attendance. Available to agency coordinators only.",
            tl: "I-enroll ang mukha ng mga empleyado ng agency mo para sa facial-recognition attendance. Para lamang sa agency coordinators.",
        },
        steps: [
            {
                en: "Open Face Enrollment under Management.",
                tl: "Buksan ang Face Enrollment, sa ilalim ng Management.",
            },
            {
                en: "Search or filter the employee list by enrollment status (All / Enrolled / Not Enrolled).",
                tl: "Mag-search o mag-filter ng listahan ng empleyado ayon sa enrollment status (All / Enrolled / Not Enrolled).",
            },
            {
                en: "Click Enroll (or Re-enroll) next to an employee to open the camera.",
                tl: "I-click ang Enroll (o Re-enroll) sa tabi ng empleyado para buksan ang camera.",
            },
            {
                en: "Center the employee's face in the preview. Use the Front Flash toggle if the lighting warning appears.",
                tl: "I-center ang mukha ng empleyado sa preview. Gamitin ang Front Flash toggle kung lumabas ang lighting warning.",
            },
            {
                en: "Click Capture Face once the preview looks clear, or Retake if it isn't.",
                tl: "I-click ang Capture Face kapag malinaw na ang preview, o Retake kung hindi.",
            },
            {
                en: "Check the consent box confirming the employee was informed and consents to biometric enrollment for attendance purposes, then Save.",
                tl: "I-check ang consent box na nagkukumpirma na naipaalam sa empleyado at pumayag siya sa biometric enrollment para sa attendance purposes, pagkatapos ay i-click ang Save.",
            },
            {
                en: "If the face closely matches someone else already enrolled, you'll get a warning naming that employee — confirm Enroll Anyway only if you're sure this is a different person.",
                tl: "Kung halos magkatulad ang mukha sa ibang naka-enroll na, makakakuha ka ng warning na nagsasabi kung sino ang natugma — i-confirm ang Enroll Anyway lamang kung sigurado kang ibang tao ito.",
            },
            {
                en: "From the list, use View to see the stored enrollment photo, History to see past enrollments/removals, or Remove to delete an enrollment.",
                tl: "Mula sa listahan, gamitin ang View para makita ang naka-save na enrollment photo, History para makita ang nakaraang enrollment/removal, o Remove para tanggalin ang isang enrollment.",
            },
        ],
        tips: [
            {
                en: "The on-screen warnings (too far, too close, off-center, dim lighting) are advisory only — you can still capture even if one appears, but a clearer shot enrolls better.",
                tl: "Ang mga warning sa screen (masyadong malayo, masyadong malapit, off-center, madilim) ay advisory lamang — puwede ka pa ring mag-capture kahit lumabas ito, pero mas maganda ang resulta kung mas malinaw ang kuha.",
            },
            {
                en: "Each employee can only have one active enrollment at a time — enrolling again replaces the previous one.",
                tl: "Isang active enrollment lang ang puwede sa bawat empleyado — ang muling pag-enroll ay papalitan ang dati.",
            },
            {
                en: "Consent is required every time a new face is captured and saved, not just the first time.",
                tl: "Kailangan ang consent tuwing may bagong mukha na kinukuha at sinasave, hindi lang sa unang beses.",
            },
        ],
        audience: ["coordinator"],
    },
    {
        id: "hr-approvals",
        icon: IconFilter2Check,
        iconBg: "bg-emerald-500/15",
        iconColor: "text-emerald-400",
        label: { en: "HR Approvals", tl: "HR Approvals" },
        description: {
            en: "Review and act on pending log override and overtime requests from your team. Visible to designated approvers only.",
            tl: "Suriin at kumilos sa mga pending log override at overtime request ng team mo. Para lamang sa mga itinalagang approver.",
        },
        steps: [
            {
                en: "Open HR Approvals under Management.",
                tl: "Buksan ang HR Approvals, sa ilalim ng Management.",
            },
            {
                en: "Pending requests are listed with employee name, date, and request type.",
                tl: "Nakalista ang mga pending request kasama ang pangalan ng empleyado, petsa, at klase ng request.",
            },
            {
                en: "Click a row to review the details and any attached photo evidence.",
                tl: "I-click ang isang row para suriin ang detalye at kahit anong naka-attach na photo evidence.",
            },
            {
                en: "Click Approve or Decline. Declined requests require a reason.",
                tl: "I-click ang Approve o Decline. Kailangan ng reason ang mga dini-decline.",
            },
            {
                en: "The employee is notified of your decision via Notifications.",
                tl: "Mano-notify ang empleyado tungkol sa desisyon mo sa pamamagitan ng Notifications.",
            },
        ],
        tips: [
            {
                en: "You can only act on a request while it is within the active approval window: filed 1st–15th → deadline is the 16th of the same month; filed 16th–end of month → deadline is the 1st of the next month.",
                tl: "Makakakilos ka lamang sa request habang nasa loob ito ng approval window: kung na-file sa ika-1 hanggang ika-15, ang deadline ay ika-16 ng parehong buwan; kung na-file sa ika-16 hanggang katapusan ng buwan, ang deadline ay ika-1 ng susunod na buwan.",
            },
            {
                en: "You can filter by branch or request type using the toolbar filters.",
                tl: "Puwede kang mag-filter ayon sa branch o klase ng request gamit ang toolbar filters.",
            },
        ],
        audience: ["coordinator"],
    },
    {
        id: "admin",
        icon: Settings2,
        iconBg: "bg-purple-500/15",
        iconColor: "text-purple-400",
        label: { en: "Admin Panel", tl: "Admin Panel" },
        description: {
            en: "Manage users, access controls, approver assignments, and tab-level visibility settings. Available to admin accounts only.",
            tl: "Mag-manage ng users, access controls, approver assignments, at tab-level visibility settings. Para lamang sa admin accounts.",
        },
        steps: [
            {
                en: "Open Admin Panel from the sidebar (admin accounts only).",
                tl: "Buksan ang Admin Panel mula sa sidebar (para sa admin accounts lamang).",
            },
            {
                en: "Overview — see a live summary of total employees, coordinators, admins, remote workers, and distribution by branch and position.",
                tl: "Overview — makita ang live summary ng total employees, coordinators, admins, remote workers, at distribution ayon sa branch at position.",
            },
            {
                en: "Users — promote/demote coordinators, grant/revoke admin access, enable remote work, and assign branches.",
                tl: "Users — i-promote/i-demote ang coordinators, bigyan/bawiin ang admin access, i-enable ang remote work, at mag-assign ng branch.",
            },
            {
                en: "Access Lists — quick view of who has coordinator, admin, and remote work access.",
                tl: "Access Lists — mabilisang tingin kung sino ang may coordinator, admin, at remote work access.",
            },
            {
                en: "Approvers — assign which coordinators can approve overtime and log overrides per branch.",
                tl: "Approvers — i-assign kung sinong coordinators ang puwedeng mag-approve ng overtime at log overrides bawat branch.",
            },
            {
                en: "Tab Access — control which sidebar tabs are visible per position or per employee. Use 'Reset to Standard' to apply the recommended defaults.",
                tl: "Tab Access — kontrolin kung anong sidebar tabs ang makikita bawat position o bawat empleyado. Gamitin ang 'Reset to Standard' para i-apply ang mga inirerekomendang default.",
            },
        ],
        tips: [
            {
                en: "Tab Access changes take effect the next time the affected employee refreshes their session.",
                tl: "Magkakabisa ang mga pagbabago sa Tab Access sa susunod na pag-refresh ng session ng apektadong empleyado.",
            },
            {
                en: "Admin access should be granted sparingly — admins can modify all user settings.",
                tl: "Dapat maingat na ibigay ang admin access — puwedeng baguhin ng admins ang lahat ng user settings.",
            },
        ],
        audience: ["admin"],
    },
    {
        id: "password",
        icon: IconShieldLock,
        iconBg: "bg-red-500/15",
        iconColor: "text-red-400",
        label: { en: "Reset Password", tl: "Reset Password" },
        description: {
            en: "Change your account password at any time from the sidebar user menu.",
            tl: "Baguhin ang password ng account mo anumang oras mula sa user menu sa sidebar.",
        },
        steps: [
            {
                en: "Click your name/avatar at the bottom of the sidebar to open the user menu.",
                tl: "I-click ang pangalan/avatar mo sa ilalim ng sidebar para buksan ang user menu.",
            },
            {
                en: "Click Reset Password.",
                tl: "I-click ang Reset Password.",
            },
            {
                en: "Enter your current password, then your new password twice to confirm.",
                tl: "Ilagay ang kasalukuyang password mo, pagkatapos ang bagong password mo nang dalawang beses para kumpirmahin.",
            },
            {
                en: "Your new password must be at least 12 characters and include an uppercase letter, a lowercase letter, a number, and a special character (e.g. @, #, !).",
                tl: "Ang bagong password mo ay dapat hindi bababa sa 12 characters at may kasamang uppercase letter, lowercase letter, number, at special character (hal. @, #, !).",
            },
            {
                en: "Click Update — you will remain logged in with your session automatically refreshed.",
                tl: "I-click ang Update — mananatili kang naka-login at awtomatikong mare-refresh ang session mo.",
            },
        ],
        tips: [
            {
                en: "You cannot reuse any of your last 5 passwords.",
                tl: "Hindi mo puwedeng gamitin muli ang alinman sa huling 5 password mo.",
            },
            {
                en: "If you are prompted to reset your password on login (forced reset), you won't need to enter your current password for that one-time reset.",
                tl: "Kung pina-prompt kang mag-reset ng password pag-login (forced reset), hindi mo na kailangang ilagay ang kasalukuyang password para sa one-time reset na iyon.",
            },
            {
                en: "If you are locked out, contact your admin to reset your password from the Users tab.",
                tl: "Kung na-lock out ka, kontakin ang admin mo para i-reset ang password mo mula sa Users tab.",
            },
        ],
        audience: ["employee"],
    },
];

const GUIDE_LANG_STORAGE_KEY = "wf_guide_lang";

function readStoredLang(): GuideLang {
    try {
        const stored = localStorage.getItem(GUIDE_LANG_STORAGE_KEY);
        return stored === "tl" ? "tl" : "en";
    } catch {
        return "en";
    }
}

// ── Nav sidebar ────────────────────────────────────────────────────────────────

function GuideSidebar({
    active,
    onSelect,
    lang,
}: {
    active: string;
    onSelect: (id: string) => void;
    lang: GuideLang;
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
                    <span className="truncate">{s.label[lang]}</span>
                </button>
            ))}
        </nav>
    );
}

// ── Section card ───────────────────────────────────────────────────────────────

function SectionCard({ section, lang }: { section: Section; lang: GuideLang }) {
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
                    <p className="text-base font-semibold leading-tight">{section.label[lang]}</p>
                    <p className="text-muted-foreground mt-0.5 text-sm leading-snug">{section.description[lang]}</p>
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
                            {LABELS.howToUse[lang]}
                        </p>
                        <ol className="space-y-2.5">
                            {section.steps.map((step, i) => (
                                <li key={i} className="flex gap-3">
                                    <span className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${section.iconBg} ${section.iconColor}`}>
                                        {i + 1}
                                    </span>
                                    <span className="text-sm leading-relaxed">{step[lang]}</span>
                                </li>
                            ))}
                        </ol>
                    </div>

                    {/* Tips */}
                    {section.tips && section.tips.length > 0 && (
                        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 space-y-1.5">
                            <p className="text-[11px] font-semibold uppercase tracking-widest text-yellow-500/70">
                                {LABELS.tips[lang]}
                            </p>
                            <ul className="space-y-1.5">
                                {section.tips.map((tip, i) => (
                                    <li key={i} className="flex gap-2 text-sm text-yellow-300/80">
                                        <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-yellow-500/60" />
                                        {tip[lang]}
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
    const [lang, setLang] = useState<GuideLang>(readStoredLang());

    const { data: me } = useQuery({
        queryKey: ["me"],
        queryFn: async () => {
            const response = await api.get<ApiResponse<{ role: string }>>(
                "/api/v2/auth/me",
            );
            return response.data.data;
        },
    });
    const isCoordinator = me?.role === "agency_coordinator";

    const setLangPersist = (next: GuideLang) => {
        setLang(next);
        try {
            localStorage.setItem(GUIDE_LANG_STORAGE_KEY, next);
        } catch {
            // localStorage unavailable — language just won't persist across visits
        }
    };

    const filtered = search.trim()
        ? SECTIONS.filter(
              (s) =>
                  s.label[lang].toLowerCase().includes(search.toLowerCase()) ||
                  s.description[lang].toLowerCase().includes(search.toLowerCase()) ||
                  s.steps.some((st) => st[lang].toLowerCase().includes(search.toLowerCase())),
          )
        : SECTIONS;

    const scrollTo = (id: string) => {
        setActive(id);
        setSearch("");
        setTimeout(() => {
            document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 50);
    };

    const generatedAt = useMemo(
        () =>
            new Date().toLocaleDateString(lang === "en" ? "en-US" : "fil-PH", {
                year: "numeric",
                month: "long",
                day: "numeric",
            }),
        [lang],
    );

    const employeeSections = useMemo(
        () => SECTIONS.filter((s) => s.audience.includes("employee")),
        [],
    );

    return (
        <ParentComponent>
            <div className="px-6 py-6">
                {/* Page header */}
                <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/15">
                            <IconBook2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">{LABELS.pageTitle[lang]}</h1>
                            <p className="text-muted-foreground text-sm mt-0.5">
                                {LABELS.pageSubtitle[lang]}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Language toggle */}
                        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
                            <IconLanguage className="ml-1.5 h-4 w-4 text-muted-foreground" />
                            <button
                                onClick={() => setLangPersist("en")}
                                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                                    lang === "en"
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                English
                            </button>
                            <button
                                onClick={() => setLangPersist("tl")}
                                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                                    lang === "tl"
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                Tagalog
                            </button>
                        </div>

                        {/* Full guide download */}
                        <PDFDownloadLink
                            key={`full-${lang}`}
                            document={
                                <GuidePdfDocument
                                    sections={SECTIONS}
                                    lang={lang}
                                    title={LABELS.pageTitle[lang]}
                                    subtitle={LABELS.pageSubtitle[lang]}
                                    generatedAt={generatedAt}
                                />
                            }
                            fileName={`Agency-HR-Portal-Guide-${lang.toUpperCase()}.pdf`}
                        >
                            {({ loading }) => (
                                <button
                                    disabled={loading}
                                    className="border-input bg-background hover:bg-muted/20 flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60"
                                >
                                    <IconDownload className="h-3.5 w-3.5" />
                                    {loading ? LABELS.preparing[lang] : LABELS.downloadGuide[lang]}
                                </button>
                            )}
                        </PDFDownloadLink>

                        {/* Coordinator-only: send-out employee guide */}
                        {isCoordinator && (
                            <PDFDownloadLink
                                key={`employee-${lang}`}
                                document={
                                    <GuidePdfDocument
                                        sections={employeeSections}
                                        lang={lang}
                                        title={LABELS.downloadEmployeeGuide[lang]}
                                        subtitle={LABELS.pageSubtitle[lang]}
                                        generatedAt={generatedAt}
                                    />
                                }
                                fileName={`Employee-Guide-${lang.toUpperCase()}.pdf`}
                            >
                                {({ loading }) => (
                                    <button
                                        disabled={loading}
                                        title={LABELS.employeeGuideNote[lang]}
                                        className="bg-primary text-primary-foreground flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
                                    >
                                        <IconUsersGroup className="h-3.5 w-3.5" />
                                        {loading ? LABELS.preparing[lang] : LABELS.downloadEmployeeGuide[lang]}
                                    </button>
                                )}
                            </PDFDownloadLink>
                        )}
                    </div>
                </div>

                {isCoordinator && (
                    <p className="text-muted-foreground mb-4 text-xs">
                        {LABELS.employeeGuideNote[lang]}
                    </p>
                )}

                {/* Search */}
                <div className="relative mb-6">
                    <IconSearch className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={LABELS.searchPlaceholder[lang]}
                        className="border-input bg-background w-full rounded-xl border py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                </div>

                {search.trim() ? (
                    /* Search results */
                    <div className="space-y-4">
                        {filtered.length === 0 ? (
                            <div className="rounded-xl border border-dashed py-16 text-center">
                                <p className="text-muted-foreground text-sm">{LABELS.noResults[lang]} "{search}"</p>
                            </div>
                        ) : (
                            filtered.map((s) => <SectionCard key={s.id} section={s} lang={lang} />)
                        )}
                    </div>
                ) : (
                    /* Two-column layout */
                    <div className="grid gap-8 lg:grid-cols-[200px_1fr]">
                        {/* Sticky nav */}
                        <div className="hidden lg:block">
                            <GuideSidebar active={active} onSelect={scrollTo} lang={lang} />
                        </div>

                        {/* Content */}
                        <div className="space-y-4">
                            {SECTIONS.map((s) => (
                                <SectionCard key={s.id} section={s} lang={lang} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </ParentComponent>
    );
}
