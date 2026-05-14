# NFS Frontend

A Next.js web application for the Notary File System — a digital case management platform for notary offices. Staff members register clients, create dossiers, upload documents, and manage the full lifecycle of notarial work through a role-based dashboard.

---

## Screenshots

> Add screenshots to a `docs/screenshots/` folder and reference them here.
>
> Suggested captures: Login page, Dashboard overview, Dossier creation wizard (3 steps), Client registration with webcam, Dossier detail view.

---

## Prerequisites

- Node.js 18 or later
- npm 9 or later
- A [Cloudinary](https://cloudinary.com) account (free tier is sufficient)
- The NFS backend running on port 3001 (see the backend repository)

---

## Getting Started

### 1. Clone and install

```bash
git clone <repository-url> fn_divin
cd fn_divin
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=<your_cloud_name>
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=<your_unsigned_preset>
CLOUDINARY_API_KEY=<your_api_key>
CLOUDINARY_API_SECRET=<your_api_secret>
```

See the [Environment Variables](#environment-variables) section for details on each variable.

### 3. Run the development server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### 4. Build for production

```bash
npm run build
npm start
```

---

## Project Structure

```text
fn_divin/
├── app/                        # Next.js App Router pages
│   ├── (auth)/                 # Auth pages: login, forgot/reset password
│   ├── (dashboard)/            # Protected dashboard layout and pages
│   │   ├── dashboard/          # Overview, clients, dossiers, users, etc.
│   │   └── layout.tsx          # Dashboard shell with sidebar
│   └── layout.tsx              # Root layout
├── components/
│   ├── dashboard/              # Sidebar, header, layout components
│   ├── ui/                     # Shared UI primitives (buttons, modals, inputs)
│   └── providers/              # React context providers (QueryClient, Sidebar)
├── lib/
│   ├── auth.ts                 # Auth helpers: token storage, getUser, clearAuth
│   ├── axios.ts                # Axios instance with JWT interceptor
│   ├── cn.ts                   # Tailwind class merge utility
│   └── users-api.ts            # API call functions (TanStack Query keys + fetchers)
└── public/                     # Static assets
```

---

## Pages

All pages under `/dashboard` are protected and require authentication. Navigation items are filtered by role at runtime.

| Route | Label | Roles | Description |
| --- | --- | --- | --- |
| `/dashboard` | Overview | All | Stats cards: dossiers by status |
| `/dashboard/clients` | Clients | Administrator, Notary Public | List, search, and register clients |
| `/dashboard/dossiers` | Dossiers | Administrator, Notary Public | List dossiers; open creation wizard |
| `/dashboard/dossiers/new` | New Dossier | Administrator, Notary Public | 3-step wizard to create a dossier |
| `/dashboard/dossiers/[id]` | Dossier Detail | Administrator, Notary Public | View dossier, upload documents, change status, print |
| `/dashboard/users` | Users | Administrator | Invite notaries, enable/disable accounts |
| `/dashboard/categories` | Categories | Administrator | Manage template categories |
| `/dashboard/templates` | Templates | Administrator, Notary Public | View and manage document templates |
| `/dashboard/services` | Services | Administrator | Define notarial service types and official fees |
| `/dashboard/profile` | My Profile | All | Update profile info, upload avatar, change password |
| `/login` | — | Public | Email + password login |
| `/forgot-password` | — | Public | Request a password reset email |
| `/reset-password` | — | Public | Set new password via reset link |

---

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Yes | Base URL of the NFS backend API. Example: `http://localhost:3001` |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Yes | Your Cloudinary cloud name, found in the Cloudinary dashboard |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Yes | An **unsigned** upload preset created in Cloudinary settings. Must be at least 6 characters |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key (used for server-side operations) |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret (never exposed to the browser) |

---

## Key Technology Decisions

### Next.js 16 App Router

The App Router enables nested layouts, server components, and route groups. The `(auth)` and `(dashboard)` route groups share layouts without affecting URL paths, keeping the auth shell and dashboard shell completely separate.

### TanStack Query v5

All server state (API data) is managed through TanStack Query. This provides automatic caching, background refetching, and loading/error state handling without manual `useEffect` calls. Each resource (users, dossiers, clients, etc.) has dedicated query keys and fetcher functions in `lib/`.

### Axios with JWT Interceptor

A single Axios instance (`lib/axios.ts`) attaches the JWT token from `localStorage` to every outgoing request via a request interceptor. On a 401 response, the interceptor clears the stored credentials and redirects to `/login`, ensuring the user is never silently stuck in an authenticated-but-expired state.

### Tailwind CSS v4

Tailwind is used for all styling. The v4 release uses a CSS-first configuration approach rather than `tailwind.config.js`. Custom design tokens (brand colors, surface colors) are defined in the global CSS file.

### Cloudinary via next-cloudinary

File uploads (client photos, document attachments, profile avatars) go directly from the browser to Cloudinary using unsigned upload presets. This avoids routing binary data through the backend. The backend stores only the returned Cloudinary URL.

### Tiptap Rich Text Editor

Document template content is authored using Tiptap, which provides a ProseMirror-based rich text editing experience with support for placeholder syntax (`{{field_name}}`).

---

## How Cloudinary Upload Works

1. The user selects a file or captures a webcam photo.
2. The frontend uploads the file directly to Cloudinary using the `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` (unsigned preset) and `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`.
3. Cloudinary returns a secure URL.
4. That URL is sent to the backend API and stored in the database.

The upload preset must be set to **unsigned** in the Cloudinary dashboard under Settings > Upload > Upload presets. Signed presets require a server-side signature and will not work with direct browser uploads.

---

## How Authentication Works

1. The user logs in at `/login`. On success, the backend returns a JWT token and a user object.
2. The token and user are stored in `localStorage` via helpers in `lib/auth.ts`.
3. Every API request made through `lib/axios.ts` automatically includes the token in the `Authorization: Bearer <token>` header.
4. The sidebar reads the user's role from `localStorage` to filter visible navigation items.
5. On logout (or a 401 response), `clearAuth()` removes the stored data and the user is redirected to `/login`.

New users do not self-register. An administrator invites a notary via email. The invitation email contains a one-time link that allows the recipient to set their password and activate their account.
