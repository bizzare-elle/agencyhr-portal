# CLAUDE.md — Agency HR Portal

This file is read at the start of every Claude Code session. Treat it as the source of truth for this project's conventions.

---

## Project context

**Agency HR Portal** is a React/TypeScript SPA for agency employees and coordinators of **Wildflour Hospitality Group**. It provides attendance tracking, logoverride/overtime filing, schedule management, announcements, HR approvals, training, forms, and an admin panel.

**Backend:** CodeIgniter 3 (PHP 7.2) at `C:\laragon\www\backoffice` — all API calls go to `VITE_API_BASE_URL`. See that project's `CLAUDE.md` for backend conventions.

---

## Stack

| Layer         | Library / Tool                               |
| ------------- | -------------------------------------------- |
| Framework     | React 18 + TypeScript                        |
| Build         | Vite + `@tailwindcss/vite`                   |
| Routing       | React Router v6 (data router)                |
| Data fetching | TanStack Query v5                            |
| Auth state    | Zustand (`persist` middleware, key `"auth"`) |
| UI components | shadcn/ui (Radix primitives)                 |
| Icons         | `@tabler/icons-react` + `lucide-react`       |
| HTTP          | axios (singleton at `src/lib/axios.ts`)      |
| Notifications | sonner (`toast`)                             |
| Drag-and-drop | @dnd-kit                                     |
| PDF           | @react-pdf/renderer                          |

---

## Theme & dark mode

- **Always dark.** `class="dark"` is on `<html>` permanently. Never write hardcoded light colors (`bg-white`, `bg-gray-*`, `bg-zinc-*`, hex values like `bg-[#36454F]`, etc.).
- **CSS variable classes only:** `bg-background`, `bg-card`, `bg-muted`, `bg-accent`, `text-foreground`, `text-muted-foreground`, `border-border`. These resolve to the dark theme automatically.
- **shadcn preset:** `b1a1crD4y` — blue-tinted dark palette.
    - Background: `oklch(0.148 0.004 228.8)`
    - Card: `oklch(0.218 0.008 223.9)`
    - Primary: muted blue `oklch(0.45 0.085 224.283)`
    - Border radius: `0.45rem`
- **Status badges:** opacity tints — `bg-green-500/10 text-green-400`, `bg-yellow-500/10 text-yellow-400`, `bg-red-500/10 text-red-400`, `bg-blue-500/10 text-blue-400`.
- **Primary action / CTA buttons:** Yellow — `bg-yellow-500 text-white hover:bg-yellow-600`. Use `bg-primary text-primary-foreground` for standard secondary actions.
- **Employee header cards:** `bg-card border` with yellow avatar bubble `bg-yellow-500/20 text-yellow-400`.

---

## Directory structure

```
src/
  App.tsx                   # Router definition — all routes live here
  main.tsx                  # React root mount
  index.d.ts                # Shared TypeScript interfaces (ApiResponse, Employee, etc.)
  index.css                 # Global styles / Tailwind base
  lib/
    axios.ts                # Axios singleton with JWT interceptor + FormData fix
    tabs.ts                 # ALL_TABS definition + isTabEnabled() helper
    utils.ts                # cn() and other utilities
  hooks/
    use-auth.ts             # Zustand auth store (token, user, setToken, logout, loadUser)
    use-notifications.ts    # Unread notification count polling
    use-announcements.ts    # Announcement list + pagination
    use-announcement-interactions.ts  # Reactions / comments
    use-idle.ts             # Auto-logout after inactivity
    use-mobile.ts           # Viewport size check
  components/
    layouts/
      auth-layout.tsx       # Authenticated shell with AppSidebar + SiteHeader
    ui/                     # shadcn/ui generated components — do not hand-edit
    app-sidebar.tsx         # Sidebar nav — uses buildSections() + tab permission filter
    nav-user.tsx            # User avatar chip with avatar upload
    page-loader.tsx         # Full-page spinner
    parent-container.tsx    # Max-width scroll wrapper for page content
    site-header.tsx         # Top bar
    [other shared components]
  pages/
    login.tsx
    dashboard.tsx           # Time records (hr_employee)
    agency_dashboard.tsx    # Agency coordinator dashboard
    announcements.tsx
    notifications.tsx
    maintenance.tsx
    admin/
      admin-panel.tsx       # Admin panel: Users, Access Lists, Approvers, Tab Access
    employees/
      employees.tsx         # Employee list (coordinator)
      employee-profile.tsx  # Profile page with avatar upload
      employee-form.tsx
    logoverrides/
    overtimes/
    schedules/
    forms/
    payslip/
    training/
    approvals/
    remote/
    downline/
```

---

## API conventions

### Axios instance (`src/lib/axios.ts`)

```typescript
// baseURL from VITE_API_BASE_URL env var
// Request interceptor:
//   - Attaches Bearer token from useAuthStore.getState().token
//   - Deletes Content-Type for FormData (lets browser set multipart boundary)
```

Always import the singleton: `import api from "@/lib/axios"`.

### Auth store (`src/hooks/use-auth.ts`)

- Persist key: `"auth"` (localStorage)
- `token`: raw JWT string
- `user`: minimal user object (id, name, email, role, is_admin, agency_id, etc.)
- `setToken(token)` — saves token and sets axios default header
- `logout()` — clears state and redirects to `/login`
- `loadUser()` — fetches `/api/v2/auth/me` and populates `user`

### `/api/v2/auth/me` response shape

```typescript
{
  id: string;           // hr_employees.id
  hr_id: string;        // same as id
  name: string;
  email: string;
  role: "hr_employee" | "agency_coordinator";
  agency_id: string;
  is_admin: number;     // 1 = admin
  can_work_remotely: number;
  job_level: string;
  profile_photo_url?: string;   // S3 presigned URL, 60-min expiry
  tab_permissions?: Record<string, number>;  // 1 = visible, 0 = hidden
}
```

### `ApiResponse<T>` (from `src/index.d.ts`)

```typescript
interface ApiResponse<T> {
    status: number;
    data: T;
    message: string;
}
```

All backend endpoints return this shape. Access data via `res.data.data`.

### CSRF

Backend returns `csrf_hash` in every JSON response. The frontend does **not** currently refresh CSRF manually — it relies on the backend session cookie. If a mutation endpoint starts returning 403, check whether you need to add a CSRF header.

### File uploads (multipart)

The axios interceptor deletes `Content-Type` when `config.data instanceof FormData`. Just pass a `FormData` object to `api.post()` — no manual header needed.

---

## TanStack Query conventions

- Query keys follow `["resource", ...params]` — e.g. `["me"]`, `["admin-users"]`, `["tab-permissions", targetType, selectedId]`.
- After mutations, invalidate the affected query key: `queryClient.invalidateQueries({ queryKey: [...] })`.
- `staleTime` defaults are generally omitted (use TQ defaults) unless the data changes rarely (use `5 * 60 * 1000`).
- Use `enabled: !!someId` to gate queries on required params.

---

## Routing

All routes are defined in `src/App.tsx`. The authenticated shell uses a data router `loader` that calls `/api/v2/auth/me` — unauthenticated requests redirect to `/login`.

**Route pattern:** `/<resource>/:id` where `:id` is the employee's `hr_employees.id`.

Adding a new page:

1. Create the component under `src/pages/<module>/`.
2. Import and add a `{ path, element, handle: { title } }` entry in `App.tsx` inside the authenticated children.
3. Add a sidebar entry in `src/components/app-sidebar.tsx` under `buildSections()`.
4. If the tab should respect tab permissions, add it to `src/lib/tabs.ts` (`ALL_TABS`) and wrap with `ok("tab_key")` in `buildSections()`.

---

## Sidebar & tab permissions (`src/lib/tabs.ts`)

`ALL_TABS` is the single source of truth for every sidebar tab. Each entry has `{ key, label, section }`.

```
key              section
───────────────  ──────────
time_records     Attendance
work_remotely    Attendance
logoverride      Attendance
overtime         Attendance
profile          My Profile
training_files   Learning
trainings        Learning
notifications    Updates
announcements    Updates
schedule         Management
forms            Management
hr_approvals     Management
```

`isTabEnabled(key, tabPermissions)` — returns `true` if the key is set to `1`, or if absent falls back to `STANDARD_PERMISSIONS[key]` (not blindly `true`).

`STANDARD_PERMISSIONS` defines the default on/off state for every tab. When no DB record exists for a tab, this is what the user sees:

| Tab              | Default | Reason                                      |
| ---------------- | ------- | ------------------------------------------- |
| `time_records`   | ON      | Core feature for all employees              |
| `logoverride`    | ON      | Core feature                                |
| `overtime`       | ON      | Core feature                                |
| `profile`        | ON      | Core feature                                |
| `training_files` | ON      | Core feature                                |
| `trainings`      | ON      | Core feature                                |
| `notifications`  | ON      | Core feature                                |
| `announcements`  | ON      | Core feature                                |
| `work_remotely`  | **OFF** | Granted individually via Remote Work toggle |
| `schedule`       | **OFF** | Supervisory/managerial levels only          |
| `forms`          | **OFF** | Supervisory/managerial levels only          |
| `hr_approvals`   | **OFF** | Designated approvers only                   |

`buildSections()` in `app-sidebar.tsx` calls `ok(key)` before adding each item. Items hidden by permission simply don't appear — no error state needed.

---

## Admin panel (`src/pages/admin/admin-panel.tsx`)

Four tabs:
| Tab value | Component | Description |
|-----------|-----------|-------------|
| `users` | `UsersTab` | Employee list with role/admin/remote toggles and branch assignment via drawer |
| `access` | `AccessListsTab` | Summary cards: coordinators, admins, remote workers |
| `approvers` | `ApproversTab` | Overtime & logoverride approver assignments per branch |
| `tab-access` | `TabAccessTab` | Per-position or per-employee tab visibility toggles with search |

Only users with `is_admin === 1` can access this page (redirects otherwise).

---

## Component patterns

### Page layout

```tsx
import { ParentComponent } from "@/components/parent-container";

export default function MyPage() {
    return (
        <ParentComponent>
            <div className="space-y-6 px-6 py-6">{/* content */}</div>
        </ParentComponent>
    );
}
```

### Standard card header

```tsx
<Card>
    <CardHeader className="bg-primary/5 border-b px-6 py-4">
        <CardTitle className="flex items-center gap-2 text-base">
            <SomeIcon className="h-4 w-4" />
            Title
        </CardTitle>
    </CardHeader>
    <CardContent className="p-0">{/* table or content */}</CardContent>
</Card>
```

### Toast notifications

```typescript
import { toast } from "sonner";
toast.success("Saved.");
toast.error(
    err?.response?.data?.message ?? err?.message ?? "Something went wrong.",
);
```

Always show the actual API error message — never a generic "Failed." unless no message is available.

### Mutations

```typescript
const mutation = useMutation({
    mutationFn: () => api.post("/api/v2/...", payload),
    onSuccess: () => {
        toast.success("Saved.");
        queryClient.invalidateQueries({ queryKey: ["affected-key"] });
    },
    onError: (err: any) => {
        toast.error(err?.response?.data?.message ?? err?.message ?? "Failed.");
    },
});
```

### Avatar / file upload

Avatar upload sends `FormData` with field `avatar` to `POST /api/v2/employees/:id/avatar`. The axios interceptor handles the Content-Type. Response includes `profile_photo_url` (presigned S3 URL, 60-min expiry) — invalidate `["me"]` after success.

---

## What NOT to do

- Never hardcode light-mode colors. Use CSS variable classes.
- Never use `$this` in place of `get_instance()` (PHP-side concern, but worth knowing when debugging CI3 endpoints).
- Never cache presigned S3 URLs — always fetch fresh from the API.
- Never add `Authorization` headers manually in components — the axios interceptor handles it.
- Never read `useAuthStore` inside a React render without `getState()` (use the hook outside of event handlers).
- Never add routes outside `App.tsx`.
- Never put new tabs in `app-sidebar.tsx` without a matching entry in `ALL_TABS` (if they should respect permissions).
- Never access `res.data` directly expecting the payload — always use `res.data.data` (the `ApiResponse<T>` wrapper).
- Never use `innerHTML` on nodes that have React event listeners.
- Never commit `.env` files.

---

## Environment

- `.env` sets `VITE_API_BASE_URL` — points to the local Laragon PHP backend (e.g. `http://localhost/backoffice`).
- Dev server: `npm run dev` (Vite, default port 5173).
- Build: `npm run build` (TypeScript check + Vite bundle).
- No test suite currently.

---

## Reference components (good examples to mirror)

- **`src/pages/admin/admin-panel.tsx`** — multi-tab admin page, mutation pattern, drawer, paginated cards, searchable target list.
- **`src/components/nav-user.tsx`** — avatar upload with camera overlay, FormData POST, query invalidation.
- **`src/pages/employees/employee-profile.tsx`** — own-profile avatar upload, `me.hr_id` ownership check.
- **`src/components/app-sidebar.tsx`** — `buildSections()` with tab permission filtering, `ok()` helper pattern.
- **`src/lib/tabs.ts`** — single-source tab registry pattern.
