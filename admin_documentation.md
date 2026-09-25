# Admin Panel Documentation

## Overview
The **Admin** section of the Rental Agency application provides a secure interface for managing site settings, handling user messages, and performing privileged actions. It is split between a **backend API** (authentication, admin routes) and a **frontend UI** built with React/Next.js and TypeScript.

---

## Backend Structure

### 1. Authentication Middleware (`backend/middleware/auth.js`)
- **`requireAuth`** – Verifies JWT tokens, attaches the authenticated user to `req.user` without exposing the password hash.
- **`requireAdmin`** – Ensures the authenticated user has the `Admin` role before allowing access to privileged routes.
- **Key Features**:
  - Token validation using `jsonwebtoken`.
  - Role‑based access control.
  - Centralised error handling with clear HTTP status codes.

### 2. Admin Routes (`backend/routes/admin.js`)
- **`POST /verify`** – Checks a plaintext admin passcode against a hashed value (`ADMIN_HASH`) using `bcrypt`.
- **Rate‑limiting** – `express-rate-limit` caps login attempts to **5 per 15 minutes** per IP, mitigating brute‑force attacks.
- **Responses**:
  - `200 OK` on successful verification.
  - `401 Unauthorized` for wrong passcode.
  - `500` for mis‑configuration (e.g., missing `ADMIN_HASH`).

### 3. Supporting Files
- **`backend/models/SiteSettings.js`** – Stores site‑wide configuration (e.g., contact email, UI toggles). Admin UI reads/writes this model via API endpoints (not shown in the snippet but part of the admin feature set).

---

## Frontend Structure (`frontend/src/app/admin/`)

### Main Layout
All admin pages share a **common layout** (usually a sidebar navigation and a content pane). The visual style follows a modern, dark‑mode‑compatible design using Tailwind CSS with subtle glass‑morphism effects.

### Key Components
| Component | Purpose | File |
|-----------|---------|------|
| **MessagesTab** | Inbox for contact requests; list, read/unread toggle, delete. | `MessagesTab.tsx` |
| **SettingsTab** | UI for editing site settings stored in `SiteSettings` model. | `SettingsTab.tsx` |
| **CategoriesTab** | Manage property categories used throughout the site. | `CategoriesTab.tsx` |
| **Clients Database** | Dynamic aggregation of client stats and Excel export function. | Composed in `page.tsx` |
| **AdminPage (page.tsx)** | Wrapper that composes the tabs and provides navigation. | `page.tsx` |

#### `MessagesTab.tsx` Highlights
- Fetches messages from `/api/messages` with bearer token authentication.
- Displays unread badge count.
- Allows marking messages **Read/Unread** via PATCH request.
- Supports **deletion** with confirmation dialogs.
- UI uses animated loading spinners, hover‑responsive cards, and status‑based colour cues (`bg‑blue‑50` for unread, `border‑blue‑300`).

#### `SettingsTab.tsx` (similar pattern)
- Loads settings via GET, presents a form, and saves changes via PUT/PATCH.
- Utilises Tailwind‑styled input components and **optimistic UI** updates.

---

## Design Layout & Aesthetic Choices
- **Responsive Grid** – Admin pages use `grid`/`flex` utilities to adapt to mobile, tablet, and desktop viewports.
- **Micro‑animations** – Loading spinners, hover shadows, and status‑badge pulses create a lively experience.
- **Color Palette** – Primary blue (`#2563EB`) and indigo (`#4F46E5`) for actions, slate neutrals for backgrounds, with subtle gradients for depth.
- **Typography** – Modern font weights and size scales, with custom font support.
- **Dynamic Layout** – Clean, modern Left-To-Right (LTR) responsive interface optimized for desktop and mobile.
- **Accessibility** – Semantic HTML, focus states, and ARIA‑compatible button labels.

---

## Functionalities Summary
1. **Secure Admin Login** – Rate‑limited, bcrypt‑hashed passcode verification.
2. **Role‑Based Access** – JWT‑driven authentication with admin‑only middleware.
3. **Message Management** – View, mark read/unread, delete contact messages.
4. **Site Settings Management** – Read/modify global configuration values.
5. **Category Management** – Add, edit, delete property categories.
6. **Reservation Editing** – Modify guest info, vehicle assignment, times, and duration types directly from the dashboard logs. Recalculates price dynamically on the server.
7. **Clients Database** – Lists clients dynamically aggregated by unique email from booking logs, tracking stats (spent, bookings, contact), and provides a UTF-8 BOM CSV download for Excel.
8. **Vehicles status and View Layouts** – Dynamic view toggling (Grid vs. Table view) and custom vehicle status editing (Available, Rented, Maintenance).
9. **French Primary Localization** – Native French interface with Algerian Dinar (`DA`) formatting throughout all management panels.

---

## Navigation Flow (High‑Level)
1. **Admin Login** → `/admin/verify` (backend) → receives JWT token.
2. Frontend stores token (often in memory/context) and passes it as `Authorization: Bearer <token>` header.
3. UI renders **Admin Dashboard** with navigation tabs.
4. Each tab makes authenticated API calls to corresponding backend routes (e.g., `/api/messages`, `/api/settings`).
5. Updates are reflected instantly thanks to React state management and Tailwind transition classes.

---

## Extending the Admin Panel
- **Add new tabs**: Create a new component in `frontend/src/app/admin/`, expose routes in `backend/routes/` and protect with `requireAdmin`.
- **Customize design**: Update Tailwind config in `tailwind.config.js` to modify colors, shadows, or spacing.
- **Internationalisation**: The existing components use `useLanguage` context; add additional locales by extending the language dictionary.

---

*Generated on 2026‑06‑10.*
